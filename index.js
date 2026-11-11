import z from '@deepseek-ai/schemastery'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { McpStdioClient, renderToolResult } from './mcp.js'
import { browserTabs, findCdpEndpoint, listTargets, waitForTab } from './cdp.js'

/**
 * Host half of the browser-use plugin.
 *
 * The plugin owns one Python environment with the browser-use package in it.
 * It creates the environment, installs the package, keeps it current by
 * comparing the installed version with the newest release on PyPI on every
 * launch, and serves the browser actions the package publishes over MCP as
 * first-class tools of this Harness.
 */

/** The package this plugin installs and keeps current. */
const DEFAULT_PACKAGE = 'browser-use'
/** Which generation of this file a running Host loaded. */
const REVISION = '2026-11-12.1'
/** How long one release lookup may take, in milliseconds. */
const LOOKUP_TIMEOUT_MS = 12_000
/** How long one package installation may take, in milliseconds. */
const INSTALL_TIMEOUT_MS = 900_000
/** The PyPI JSON API that names the newest release. */
const PYPI_API = 'https://pypi.org/pypi'

export const Config = z.object({
  /** Path the Web GUI reads and writes the plugin's data at. */
  endpoint: z.string().default('/plugins/browser-use'),
  /** Directory the environment is created in. Empty means the default location. */
  installDir: z.string().default(''),
  /** Check PyPI for a newer release every time the Harness starts. */
  autoUpdate: z.boolean().default(true),
  /** Package the plugin installs and keeps current. */
  package: z.string().default(DEFAULT_PACKAGE),
  /** Register the browser tools the model calls. */
  registerTools: z.boolean().default(true),
  /** Add the operating guide to the model's system prompt. */
  guideInPrompt: z.boolean().default(true),
  /** Longest one browser command may run, in milliseconds. */
  toolTimeoutMs: z.number().default(120_000),
})

/** Hard services: the HTTP carrier for the page, the tool registry, the prompt. */
export const inject = ['webServer', 'tools', 'systemPrompt']

/**
 * Read one setting, tolerating both a plain value and a live config getter.
 *
 * @param {object | undefined} config - the row's resolved configuration.
 * @param {string} field - the setting to read.
 * @param {unknown} fallback - the value to use when the setting is absent.
 * @returns {unknown} the resolved setting.
 */
function setting(config, field, fallback) {
  const value = config?.[field]
  if (value === undefined) return fallback
  const resolved = typeof value?.get === 'function' ? value.get() : value
  return resolved === undefined ? fallback : resolved
}

/**
 * Compare two dotted version strings.
 *
 * @param {string} left - the first version.
 * @param {string} right - the second version.
 * @returns {number} a negative number when left is older, 0 when they match.
 */
function compareVersions(left, right) {
  const parts = (value) => String(value ?? '').split('.').map((part) => {
    const match = /^(\d+)/u.exec(part)
    return match ? Number.parseInt(match[1], 10) : 0
  })
  const a = parts(left)
  const b = parts(right)
  const length = Math.max(a.length, b.length)
  for (let index = 0; index < length; index += 1) {
    const difference = (a[index] ?? 0) - (b[index] ?? 0)
    if (difference !== 0) return difference
  }
  return 0
}

/**
 * Run one program and collect what it wrote.
 *
 * @param {string} file - the program to run.
 * @param {string[]} args - its arguments.
 * @param {object} options - the run options.
 * @param {number} options.timeoutMs - how long the run may take.
 * @param {AbortSignal} [options.signal] - the caller's cancellation.
 * @param {Record<string, string>} [options.env] - extra environment entries.
 * @param {string} [options.cwd] - the working directory.
 * @returns {Promise<{ code: number | null, stdout: string, stderr: string, error: string | null }>} what the run produced.
 */
function runProgram(file, args, options) {
  return new Promise((resolve) => {
    let child
    try {
      child = spawn(file, args, {
        cwd: options.cwd,
        env: options.env ? { ...process.env, ...options.env } : process.env,
        windowsHide: true,
      })
    } catch (error) {
      resolve({ code: null, stdout: '', stderr: '', error: error instanceof Error ? error.message : String(error) })
      return
    }
    let stdout = ''
    let stderr = ''
    let settled = false
    const finish = (result) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      resolve(result)
    }
    const timer = setTimeout(() => {
      try {
        child.kill()
      } catch {
        /* the child already left */
      }
      finish({ code: null, stdout, stderr, error: `the command ran longer than ${options.timeoutMs} ms` })
    }, options.timeoutMs)
    child.stdout?.on('data', (chunk) => { stdout += chunk.toString('utf8') })
    child.stderr?.on('data', (chunk) => { stderr += chunk.toString('utf8') })
    child.on('error', (error) => {
      finish({ code: null, stdout, stderr, error: error instanceof Error ? error.message : String(error) })
    })
    child.on('close', (code) => {
      finish({ code, stdout, stderr, error: null })
    })
    const onAbort = () => {
      try {
        child.kill()
      } catch {
        /* the child already left */
      }
    }
    options.signal?.addEventListener('abort', onAbort, { once: true })
  })
}

/**
 * The compact guide the model reads before its first browser command.
 */
const COMPACT_GUIDE = [
  '## Browser control (browser-use)',
  '',
  'There are two browsers you can drive, and the choice matters.',
  '',
  '**The Harness browser** (the tab in the right sidebar, the one the user watches):',
  '- `browser_open(url)` opens an address there.',
  '- `browser_tab_read()` reads that page: title, address, text, and the elements on it with their indexes.',
  '- `browser_tab_click(text)` clicks an element by its text; `browser_tab_click(index)` clicks the element `browser_tab_read` reported.',
  '- `browser_tab_type(text)` types into the focused field; `browser_tab_scroll(amount)` scrolls.',
  '- Use this when the work belongs in the browser the user is looking at, or when the page needs the user\'s own session.',
  '',
  '**browser-use\'s own browser** (a Chromium it owns):',
  '- `browser_exec(code)` runs Python against it over the DevTools protocol: the whole page is yours to read and drive.',
  '- `browser_screenshot()` captures it; `browser_login()` signs in to Browser Use Cloud when a key is configured.',
  '- Use this for the heavy work, and when a page is too complex for the sidebar tab.',
  '',
  'The loop, in both cases: look, act, look again.',
  '1. Open the page and read it.',
  '2. Act on what you read.',
  '3. Read the page again and check the effect. Never assume an action worked.',
  '',
  'Rules that keep the loop reliable:',
  '- Wait for the page to settle before you read it, and read it again after every action.',
  '- An index belongs to the page you last read. After the page changes, read it again instead of reusing an index.',
  '- A tool that fails says why. Read the message before trying again.',
].join('\n')

/**
 * Keep the plugin's own state beside the environment it manages.
 *
 * @param {string} root - the install directory.
 * @returns {Promise<{ version: string | null, installedAt: number | null }>} the stored state.
 */
async function readState(root) {
  try {
    const raw = JSON.parse(await readFile(path.join(root, 'state.json'), 'utf8'))
    return {
      version: typeof raw?.version === 'string' ? raw.version : null,
      installedAt: typeof raw?.installedAt === 'number' ? raw.installedAt : null,
    }
  } catch {
    return { version: null, installedAt: null }
  }
}

/**
 * Write the plugin's own state.
 *
 * @param {string} root - the install directory.
 * @param {object} state - the state to store.
 * @returns {Promise<void>} once the state is on disk.
 */
async function writeState(root, state) {
  await mkdir(root, { recursive: true })
  const target = path.join(root, 'state.json')
  const temporary = `${target}.tmp`
  await writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
  await rename(temporary, target)
}

/**
 * Look at the Electron runtime the Harness may expose to the Host.
 *
 * On the Desktop app the Harness runs inside Electron, so the Host can reach
 * the very browser tabs the user sees in the right sidebar. The probe answers
 * whether that door is open, and what it can see.
 *
 * @returns {object} what the probe found.
 */
function probeElectron() {
  try {
    const electron = createRequire(import.meta.url)('electron')
    const answer = {
      available: true,
      version: typeof electron?.version === 'string' ? electron.version : null,
      hasBrowserWindow: typeof electron?.BrowserWindow?.getAllWebContents === 'function',
      webContents: [],
    }
    if (answer.hasBrowserWindow) {
      for (const contents of electron.BrowserWindow.getAllWebContents()) {
        answer.webContents.push({
          id: contents.id,
          type: contents.type,
          url: typeof contents.getURL === 'function' ? contents.getURL() : null,
          title: typeof contents.getTitle === 'function' ? contents.getTitle() : null,
          debuggerAttached: typeof contents.debugger?.isAttached === 'function' ? contents.debugger.isAttached() : null,
        })
      }
    }
    return answer
  } catch (error) {
    return { available: false, error: error instanceof Error ? error.message : String(error) }
  }
}

/**
 * Keep the plugin's browser-use package installed and current.
 *
 * The update check runs whenever the Harness starts, so a new upstream release
 * reaches the model on the next launch. The work is asynchronous: the Harness
 * never waits for the network, and the tools wait for the install instead.
 *
 * @param {object} options - the runtime options.
 * @param {object} options.ctx - the plugin context.
 * @param {string} options.root - the install directory.
 * @param {string} options.packageName - the package to install.
 * @param {boolean} options.autoUpdate - whether the check runs on its own.
 * @param {object} options.report - the shared status report.
 * @returns {Promise<object>} the report after the work is done.
 */
async function ensureInstalled(options) {
  const { ctx, root, packageName, autoUpdate, report } = options
  const logger = ctx.logger
  const windows = process.platform === 'win32'
  const venv = path.join(root, 'venv')
  const python = windows ? path.join(venv, 'Scripts', 'python.exe') : path.join(venv, 'bin', 'python')
  const cli = windows ? path.join(venv, 'Scripts', `${packageName}.exe`) : path.join(venv, 'bin', packageName)
  report.installPath = root
  report.venv = venv

  const state = await readState(root)
  report.installedVersion = state.version
  report.installedAt = state.installedAt

  let latest = null
  try {
    const response = await fetch(`${PYPI_API}/${packageName}/json`, {
      headers: { accept: 'application/json', 'user-agent': 'dsh-browser-use' },
      signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
    })
    if (!response.ok) throw new Error(`PyPI answered ${response.status}`)
    const payload = await response.json()
    latest = typeof payload?.info?.version === 'string' ? payload.info.version : null
    report.latestVersion = latest
  } catch (error) {
    report.lastError = `the release check failed: ${error instanceof Error ? error.message : String(error)}`
    logger.warn(`browser-use: ${report.lastError}`)
  }

  const usable = existsSync(python) && existsSync(cli)
  if (usable && latest !== null && state.version !== null && compareVersions(state.version, latest) >= 0) {
    report.phase = 'ready'
    report.updateAvailable = false
    return report
  }
  if (!usable && !autoUpdate && latest === null) {
    report.phase = 'error'
    report.lastError = 'browser-use is not installed and the automatic update is off'
    return report
  }

  report.phase = 'installing'
  try {
    if (!existsSync(python)) {
      const base = options.basePython
      logger.info(`browser-use: creating the environment in ${venv}`)
      const created = await runProgram(base, ['-m', 'venv', venv], { timeoutMs: 300_000 })
      if (created.error !== null || created.code !== 0) {
        throw new Error(`the environment could not be created: ${created.error ?? created.stderr.trim()}`)
      }
    }
    const version = latest ?? state.version
    const target = version === null ? packageName : `${packageName}==${version}`
    logger.info(`browser-use: installing ${target}`)
    const installed = await runProgram(python, ['-m', 'pip', 'install', '--disable-pip-version-check', '--no-input', target], {
      timeoutMs: INSTALL_TIMEOUT_MS,
    })
    if (installed.error !== null || installed.code !== 0) {
      throw new Error(`the installation failed: ${installed.error ?? installed.stderr.trim().slice(-600)}`)
    }
    const reported = await runProgram(python, ['-c', 'import importlib.metadata as m; print(m.version("browser-use"))'], { timeoutMs: 60_000 })
    const installedVersion = reported.stdout.trim().split(/\r?\n/u).pop() ?? ''
    await writeState(root, { version: installedVersion, installedAt: Date.now(), package: packageName })
    report.installedVersion = installedVersion
    report.installedAt = Date.now()
    report.phase = 'ready'
    report.updateAvailable = false
    report.lastError = null
    logger.info(`browser-use ${installedVersion} is installed`)
  } catch (error) {
    report.phase = 'error'
    report.lastError = error instanceof Error ? error.message : String(error)
    logger.warn(`browser-use: ${report.lastError}`)
  }
  return report
}

/**
 * Keep the plugin's browser-use package installed and current.
 *
 * The plugin context owns every registration, so unloading the plugin removes
 * its tools, its prompt section, its route and the browser it owns.
 *
 * @param {object} ctx - the plugin context.
 * @param {object} config - the row's resolved configuration.
 * @returns {Promise<void>} once the plugin is mounted.
 */
export async function apply(ctx, config) {
  const logger = ctx.logger
  const endpoint = String(setting(config, 'endpoint', '/plugins/browser-use'))
  const packageName = String(setting(config, 'package', DEFAULT_PACKAGE))
  const autoUpdate = setting(config, 'autoUpdate', true) !== false
  const registerTools = setting(config, 'registerTools', true) !== false
  const guideInPrompt = setting(config, 'guideInPrompt', true) !== false
  const toolTimeoutMs = Math.max(1000, Number(setting(config, 'toolTimeoutMs', 120_000)) || 120_000)
  const configured = String(setting(config, 'installDir', ''))
  const home = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
  const root = configured.length > 0 ? path.resolve(configured) : path.join(home, 'browser-use')
  const windows = process.platform === 'win32'
  const venv = path.join(root, 'venv')
  const python = windows ? path.join(venv, 'Scripts', 'python.exe') : path.join(venv, 'bin', 'python')
  const cli = windows ? path.join(venv, 'Scripts', `${packageName}.exe`) : path.join(venv, 'bin', packageName)

  /**
   * The interpreter that creates the environment.
   *
   * The Harness ships one, so the plugin never depends on a Python that
   * happens to be on PATH.
   *
   * @returns {string} the interpreter to run.
   */
  const basePython = () => {
    const bundled = path.join(home, 'dsh-runtimes', 'dsh-primary-runtime', 'dependencies', 'python', 'python.exe')
    if (existsSync(bundled)) return bundled
    if (process.env.PYTHON !== undefined && process.env.PYTHON.length > 0) return process.env.PYTHON
    return windows ? 'python' : 'python3'
  }

  /** The status the Web GUI reads and the tools report. */
  const report = {
    revision: REVISION,
    phase: 'idle',
    installedVersion: null,
    latestVersion: null,
    updateAvailable: false,
    autoUpdate,
    installPath: root,
    venv,
    installedAt: null,
    lastCheckAt: null,
    lastError: null,
    package: packageName,
    platform: process.platform,
    tools: [],
    serverRunning: false,
    serverError: null,
    apiKeyConfigured: false,
    cdpPort: null,
    cdpTabs: [],
    attachedTab: null,
  }

  /** The MCP server that owns the browser. */
  let client = null
  /** The promise of the running install, so every caller waits for one install. */
  let ready = null
  /** The commands the browser half has to carry out. */
  const pendingCommands = []
  /** The tools this plugin adds itself, beside the ones browser-use publishes. */
  const comboTools = []
  /** The answers the browser half gave to those commands. */
  const commandResults = new Map()
  /** The next command id. */
  let nextCommandId = 1

  /**
   * The API key the browser-use stack reads, when one is configured.
   *
   * @returns {string | null} the key, when there is one.
   */
  const apiKey = () => {
    const fromEnv = process.env.BROWSER_USE_API_KEY
    if (typeof fromEnv === 'string' && fromEnv.trim().length > 0) return fromEnv.trim()
    return null
  }

  /**
   * Start the MCP server and register the tools it publishes.
   *
   * @param {object} [options] - the start options.
   * @param {string} [options.cdpWs] - the DevTools target browser-use must drive.
   * @returns {Promise<object[]>} the tools that were registered.
   */
  const startServer = async (options = {}) => {
    if (!existsSync(cli)) {
      report.serverError = 'browser-use is not installed yet'
      return []
    }
    const key = apiKey()
    const cdpWs = options.cdpWs ?? null
    report.apiKeyConfigured = key !== null
    const previous = client
    client = new McpStdioClient({
      command: cli,
      args: ['--mcp'],
      env: {
        ...(key === null ? {} : { BROWSER_USE_API_KEY: key }),
        ...(cdpWs === null ? {} : { BU_CDP_WS: cdpWs }),
      },
      log: (message) => logger.info(`browser-use: ${message}`),
    })
    try {
      const published = await client.start()
      previous?.stop()
      report.serverRunning = true
      report.serverError = null
      const registered = []
      for (const tool of published.tools) {
        const name = toolName(tool.name)
        const schema = tool.inputSchema && typeof tool.inputSchema === 'object'
          ? tool.inputSchema
          : { type: 'object', properties: {} }
        const dispose = ctx.tools.register({
          name,
          description: typeof tool.description === 'string' ? tool.description : `The browser-use ${tool.name} action.`,
          parameters: schema,
          output: {
            schema: { type: 'string' },
            render: (_args, value) => [{ type: 'text', text: String(value) }],
          },
          timeoutMs: toolTimeoutMs,
          async execute(args) {
            const active = client
            if (active === null) throw new Error('the browser-use MCP server is not running')
            const result = await active.call(tool.name, args ?? {})
            return renderToolResult(result)
          },
          presentCall(args) {
            return { card: 'generic', title: titleOf(tool.name, args), kind: 'other' }
          },
        })
        ctx.effect(() => dispose, `browser-use: tool ${name}`)
        registered.push(name)
      }
      report.tools = [...comboTools, ...registered]
      logger.info(`browser-use: ${registered.length} browser tools are available`)
      return registered    } catch (error) {
      report.serverRunning = false
      report.serverError = error instanceof Error ? error.message : String(error)
      logger.warn(`browser-use: the MCP server did not start: ${report.serverError}`)
      client = null
      return []
    }
  }

  /**
   * The harness tool name of one upstream tool.
   *
   * @param {string} upstream - the upstream tool name.
   * @returns {string} the name the model calls.
   */
  const toolName = (upstream) => {
    const name = String(upstream ?? '').replace(/[^a-zA-Z0-9_-]/gu, '_')
    return name.startsWith('browser_') ? name : `browser_${name}`
  }

  /**
   * The card title of one call.
   *
   * @param {string} upstream - the upstream tool name.
   * @param {object} args - the call arguments.
   * @returns {string} the title.
   */
  const titleOf = (upstream, args) => {
    const action = String(upstream ?? '').replace(/^browser_/u, '').replace(/[_-]/gu, ' ')
    const target = typeof args?.url === 'string'
      ? args.url
      : typeof args?.text === 'string'
        ? args.text
        : typeof args?.query === 'string' ? args.query : ''
    return target.length > 0 ? `${action}: ${target}` : action
  }

  /**
   * Look for the Harness app's own browser tabs.
   *
   * The Desktop app listens for a DevTools endpoint of its own, and every
   * Browser tab in the right sidebar is a webview target of that endpoint.
   *
   * @returns {Promise<object[]>} the tabs the user has open.
   */
  const readHarnessTabs = async () => {
    if (report.cdpPort === null) {
      const endpoint = await findCdpEndpoint()
      if (endpoint === null) {
        report.cdpTabs = []
        return []
      }
      report.cdpPort = endpoint.port
      logger.info(`browser-use: the Harness DevTools endpoint answers on port ${endpoint.port}`)
    }
    const tabs = browserTabs(await listTargets(report.cdpPort))
    report.cdpTabs = tabs.map((tab) => ({ id: tab.id, type: tab.type, title: tab.title, url: tab.url }))
    return tabs
  }

  /**
   * Point browser-use at one browser tab of the Harness app.
   *
   * browser-use drives whatever Chromium it is given, so handing it the
   * DevTools target of a sidebar Browser tab makes the agent act in the very
   * browser the user watches.
   *
   * @param {object} tab - the tab to drive.
   * @returns {Promise<boolean>} whether browser-use took the tab.
   */
  const attachToTab = async (tab) => {
    if (tab?.webSocketDebuggerUrl === null || tab?.webSocketDebuggerUrl === undefined) return false
    try {
      await startServer({ cdpWs: tab.webSocketDebuggerUrl })
      report.attachedTab = { id: tab.id, title: tab.title, url: tab.url }
      logger.info(`browser-use: driving the Harness browser tab ${String(tab.url)}`)
      return true
    } catch (error) {
      report.attachedTab = null
      logger.warn(`browser-use: the Harness browser tab could not be driven: ${error instanceof Error ? error.message : String(error)}`)
      return false
    }
  }

  /**
   * Open one address in the Harness browser and let browser-use drive it.
   *
   * @param {string} url - the address to open.
   * @param {object} agent - the agent that asked for it.
   * @param {AbortSignal} [signal] - the caller's cancellation.
   * @returns {Promise<object>} what happened.
   */
  const openInHarnessBrowser = async (url, agent, signal) => {
    const before = await readHarnessTabs()
    let opened = false
    let failure = null
    let detail = null
    const id = String(nextCommandId)
    nextCommandId += 1
    const answer = new Promise((resolve) => {
      commandResults.set(id, { resolve })
      setTimeout(() => {
        const entry = commandResults.get(id)
        if (entry === undefined) return
        commandResults.delete(id)
        entry.resolve({ ok: false, detail: 'the Harness browser did not answer' })
      }, 8000)
    })
    pendingCommands.push({ id, type: 'open', url })
    const result = await answer
    opened = result.ok
    detail = result.detail
    if (!opened) failure = detail ?? 'the Harness browser did not open the address'
    const tab = report.cdpPort === null ? null : await waitForTab(report.cdpPort, url, 8000)
    const attached = tab === null ? false : await attachToTab(tab)
    await readHarnessTabs()
    return {
      url,
      opened,
      failure,
      tab: tab === null ? null : { id: tab.id, title: tab.title, url: tab.url },
      attached,
      previousTabs: before.length,
      note: attached
        ? 'browser-use now drives the Harness browser tab; the user sees every action'
        : 'the page is open in the Harness browser, while browser-use keeps its own browser',
    }
  }

  /**
   * Ask the browser half to do one thing in the Harness browser tab.
   *
   * @param {string} type - the command to run.
   * @param {object} [params] - the command arguments.
   * @param {number} [timeoutMs] - how long to wait for the answer.
   * @returns {Promise<object>} what the browser half answered.
   */
  const runInHarnessBrowser = async (type, params = {}, timeoutMs = 12_000) => {
    const id = String(nextCommandId)
    nextCommandId += 1
    const answer = new Promise((resolve) => {
      commandResults.set(id, { resolve })
      setTimeout(() => {
        const entry = commandResults.get(id)
        if (entry === undefined) return
        commandResults.delete(id)
        entry.resolve({ ok: false, detail: 'the Harness browser did not answer', data: null })
      }, timeoutMs)
    })
    pendingCommands.push({ id, type, ...params })
    const result = await answer
    return {
      ok: result.ok === true,
      detail: result.detail ?? null,
      data: result.data ?? null,
    }
  }

  /**
   * The promise every tool waits for before it runs.
   *
   * @returns {Promise<object>} the report after the install and the server start.
   */
  const ensureReady = () => {
    if (ready === null) {
      ready = ensureInstalled({ ctx, root, packageName, autoUpdate, report, basePython: basePython() })
        .then(async () => {
          report.lastCheckAt = Date.now()
          if (registerTools && report.phase === 'ready') {
            await readHarnessTabs()
            await startServer()
          }
          return report
        })
        .catch((error) => {
          logger.warn(`browser-use: the install failed: ${error instanceof Error ? error.message : String(error)}`)
          report.phase = 'error'
          report.lastError = error instanceof Error ? error.message : String(error)
          return report
        })
    }
    return ready
  }

  // The check runs on its own so the Harness never waits for the network.
  void ensureReady()

  ctx.effect(() => () => {
    client?.stop()
    client = null
  }, 'browser-use: MCP server')

  if (registerTools) {
    /**
     * Open one address in the Harness browser and hand it to browser-use.
     *
     * @param {object} args - the tool arguments.
     * @param {object} exec - the tool run context.
     * @returns {Promise<object>} what happened.
     */
    const openTool = {
      name: 'browser_open',
      description: 'Open an address in the Harness browser tab in the right sidebar, and let browser-use drive that very tab so the user watches every action. Use it when the work should happen in the browser the user is looking at.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'The address to open, for example https://example.com.' },
        },
        required: ['url'],
      },
      execute: async (args, exec) => {
        await ensureReady()
        return openInHarnessBrowser(String(args?.url ?? ''), exec?.agent, exec?.signal)
      },
    }
    const tabsTool = {
      name: 'browser_tabs',
      description: 'List the browser tabs the Harness shows in its right sidebar, with their address and title. Use it to see which page the user has open.',
      parameters: { type: 'object', properties: {} },
      execute: async () => {
        await ensureReady()
        const tabs = await readHarnessTabs()
        return {
          tabs: tabs.map((tab) => ({ id: tab.id, type: tab.type, title: tab.title, url: tab.url })),
          attached: report.attachedTab,
          devToolsPort: report.cdpPort,
        }
      },
    }
    const attachTool = {
      name: 'browser_attach',
      description: 'Let browser-use drive a browser tab the Harness already shows. Without an address the first tab is taken; with one the tab showing that address is taken.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'The address of the tab to take.' },
        },
      },
      execute: async (args) => {
        await ensureReady()
        const tabs = await readHarnessTabs()
        const wanted = typeof args?.url === 'string' ? args.url : null
        const tab = wanted === null
          ? tabs[0]
          : tabs.find((entry) => entry.url === wanted)
            ?? tabs.find((entry) => typeof entry.url === 'string' && entry.url.includes(wanted))
        if (tab === undefined) {
          return { attached: false, reason: 'no Harness browser tab matches', tabs: tabs.length }
        }
        const attached = await attachToTab(tab)
        return { attached, tab: { id: tab.id, title: tab.title, url: tab.url } }
      },
    }
    const tabReadTool = {
      name: 'browser_tab_read',
      description: 'Read the page the Harness browser tab shows: its title, its address, its text and the elements on it with their indexes. Use it when the work happens in the browser the user watches.',
      parameters: { type: 'object', properties: {} },
      execute: async () => {
        await ensureReady()
        return runInHarnessBrowser('read')
      },
    }
    const tabClickTool = {
      name: 'browser_tab_click',
      description: 'Click an element in the page the Harness browser tab shows. Give the text of the element, or its index as browser_tab_read reported it.',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'The text of the element to click.' },
          index: { type: 'number', description: 'The index of the element, as browser_tab_read reported it.' },
        },
      },
      execute: async (args) => {
        await ensureReady()
        return runInHarnessBrowser('click', { text: args?.text, index: args?.index })
      },
    }
    const tabTypeTool = {
      name: 'browser_tab_type',
      description: 'Type text into the focused field of the page the Harness browser tab shows.',
      parameters: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'The text to type.' },
        },
        required: ['text'],
      },
      execute: async (args) => {
        await ensureReady()
        return runInHarnessBrowser('type', { text: String(args?.text ?? '') })
      },
    }
    const tabScrollTool = {
      name: 'browser_tab_scroll',
      description: 'Scroll the page the Harness browser tab shows.',
      parameters: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: 'How far to scroll, in pixels. Negative scrolls up.' },
        },
      },
      execute: async (args) => {
        await ensureReady()
        return runInHarnessBrowser('scroll', { amount: args?.amount })
      },
    }
    for (const spec of [openTool, tabsTool, attachTool, tabReadTool, tabClickTool, tabTypeTool, tabScrollTool]) {
      const dispose = ctx.tools.register({
        name: spec.name,
        description: spec.description,
        parameters: spec.parameters,
        output: {
          schema: { type: 'object' },
          render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
        },
        timeoutMs: toolTimeoutMs,
        execute: (args, exec) => spec.execute(args, exec),
        presentCall(args) {
          return { card: 'generic', title: `${spec.name.replace(/^browser_/u, '')}: ${String(args?.url ?? args?.text ?? '')}`.trim(), kind: 'other' }
        },
      })
      ctx.effect(() => dispose, `browser-use: tool ${spec.name}`)
      comboTools.push(spec.name)
      report.tools = [...comboTools, ...report.tools.filter((name) => !comboTools.includes(name))]
    }
  }

  if (guideInPrompt) {
    const prompt = ctx.get('systemPrompt')
    if (prompt !== undefined) {
      const dispose = prompt.section({
        name: 'browser-use',
        order: prompt.getSectionOrder('DEPLOYMENT_PERSONA_PREFIX') + 3,
        text: () => COMPACT_GUIDE,
        interpolate: false,
      })
      ctx.effect(() => dispose, 'browser-use: prompt section')
    }
  }

  /**
   * Read one JSON request body, bounded.
   *
   * @param {object} req - the incoming request.
   * @returns {Promise<object>} the parsed body.
   */
  const readBody = (req) => new Promise((resolve) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > 256_000) {
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        resolve({})
      }
    })
    req.on('error', () => resolve({}))
  })

  ctx.effect(() => ctx.webServer.register({
    kind: 'exact',
    path: endpoint,
    handler: (req, res) => {
      const reply = (status, body) => {
        res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
        res.end(JSON.stringify(body))
      }
      if (req.method === 'GET' || req.method === 'HEAD') {
        void (async () => {
          try {
            reply(200, { ...report, endpoint })
          } catch (error) {
            logger.warn(`browser-use: could not read the status: ${error instanceof Error ? error.message : String(error)}`)
            reply(500, { error: 'failed' })
          }
        })()
        return
      }
      if (req.method !== 'POST') {
        reply(405, { error: 'method-not-allowed' })
        return
      }
      void (async () => {
        const request = await readBody(req)
        const action = request?.action
        if (action === 'check' || action === 'update-now') {
          report.phase = 'checking'
          const latest = await fetch(`${PYPI_API}/${packageName}/json`, {
            headers: { accept: 'application/json', 'user-agent': 'dsh-browser-use' },
            signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS),
          }).then((response) => (response.ok ? response.json() : null)).catch(() => null)
          const version = typeof latest?.info?.version === 'string' ? latest.info.version : report.latestVersion
          report.latestVersion = version
          report.lastCheckAt = Date.now()
          if (version !== null && (report.installedVersion === null || compareVersions(report.installedVersion, version) < 0)) {
            report.phase = 'installing'
            await ensureInstalled({ ctx, root, packageName, autoUpdate: true, report, basePython: basePython() })
          } else {
            report.phase = report.phase === 'installing' ? 'ready' : report.phase
            report.updateAvailable = false
          }
          if (registerTools && report.phase === 'ready') await startServer()
          reply(200, { ...report, endpoint })
          return
        }
        if (action === 'restart-server') {
          client?.stop()
          client = null
          await startServer()
          reply(200, { ...report, endpoint })
          return
        }
        if (action === 'doctor') {
          const result = existsSync(cli)
            ? await runProgram(cli, ['--doctor'], { timeoutMs: 180_000 })
            : { code: null, stdout: '', stderr: '', error: 'browser-use is not installed yet' }
          reply(200, { ...report, endpoint, doctor: { code: result.code, stdout: result.stdout, stderr: result.stderr, error: result.error } })
          return
        }
        if (action === 'skill-install') {
          const result = existsSync(cli)
            ? await runProgram(cli, ['skill', 'install'], { timeoutMs: 120_000 })
            : { code: null, stdout: '', stderr: '', error: 'browser-use is not installed yet' }
          reply(200, { ...report, endpoint, skill: { code: result.code, stdout: result.stdout, stderr: result.stderr, error: result.error } })
          return
        }
        if (action === 'set-auto-update') {
          const enabled = request?.enabled === true
          const editor = ctx.get('configEditor')
          const entry = ctx.fiber?.entry
          if (editor === undefined || entry === undefined) {
            reply(501, { ...report, endpoint, error: 'no-config-editor' })
            return
          }
          try {
            await editor.edit(entry, (current) => ({ ...current, autoUpdate: enabled }))
          } catch (error) {
            logger.warn(`browser-use: could not change the automatic update: ${error instanceof Error ? error.message : String(error)}`)
            reply(500, { ...report, endpoint, error: 'not-saved' })
            return
          }
          report.autoUpdate = enabled
          reply(200, { ...report, endpoint })
          return
        }
        if (action === 'probe-electron') {
          reply(200, { ...report, endpoint, electron: probeElectron() })
          return
        }
        if (action === 'client-poll') {
          report.client = request?.report ?? null
          const commands = pendingCommands.splice(0, pendingCommands.length)
          reply(200, { ...report, endpoint, commands })
          return
        }
        if (action === 'client-result') {
          const id = String(request?.id ?? '')
          const entry = commandResults.get(id)
          if (entry !== undefined) {
            commandResults.delete(id)
            entry.resolve({ ok: request?.ok === true, detail: request?.detail ?? null, data: request?.data ?? null })
          }
          reply(200, { ...report, endpoint })
          return
        }
        reply(400, { error: 'unknown-action' })
      })().catch((error) => {
        logger.warn(`browser-use: the control route failed: ${error instanceof Error ? error.message : String(error)}`)
        try {
          reply(500, { error: 'failed' })
        } catch {
          /* the reply already began */
        }
      })
    },
  }), 'browser-use: control route')
}
