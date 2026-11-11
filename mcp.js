import { spawn } from 'node:child_process'

/**
 * A small Model Context Protocol client over stdio.
 *
 * browser-use serves every browser action as an MCP tool over stdio
 * (`browser-use --mcp`). The plugin speaks that protocol itself instead of
 * mounting the harness MCP bridge, so the browser actions reach the model as
 * ordinary harness tools with ordinary names.
 */

/** The MCP revision the client announces. */
const PROTOCOL_VERSION = '2024-11-05'

/**
 * One live MCP server.
 *
 * The server is started on demand and kept warm, so the browser it owns stays
 * open between the model's calls.
 */
export class McpStdioClient {
  /**
   * @param {object} options - the client options.
   * @param {string} options.command - the program to run.
   * @param {string[]} [options.args] - its arguments.
   * @param {Record<string, string>} [options.env] - extra environment entries.
   * @param {string} [options.cwd] - its working directory.
   * @param {(message: string) => void} [options.log] - the progress logger.
   */
  constructor(options) {
    this.command = options.command
    this.args = options.args ?? []
    this.env = options.env ?? {}
    this.cwd = options.cwd
    this.log = options.log ?? (() => {})
    /** The running server process. */
    this.child = null
    /** The tools the server published. */
    this.tools = []
    /** The pending requests, keyed by their id. */
    this.pending = new Map()
    /** The next request id. */
    this.nextId = 1
    /** The buffer of a partially received line. */
    this.buffer = ''
    /** The promise that settles when the server is ready. */
    this.ready = null
    /** The error that stopped the server, when it stopped. */
    this.failure = null
  }

  /**
   * Start the server and complete the handshake.
   *
   * @returns {Promise<{ tools: object[], serverInfo: object | null }>} what the server published.
   */
  async start() {
    if (this.ready !== null) return this.ready
    this.ready = this.#launch()
    try {
      return await this.ready
    } catch (error) {
      this.ready = null
      throw error
    }
  }

  /**
   * Run the handshake.
   *
   * @returns {Promise<{ tools: object[], serverInfo: object | null }>} what the server published.
   */
  async #launch() {
    const child = spawn(this.command, this.args, {
      cwd: this.cwd,
      env: { ...process.env, ...this.env },
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    this.child = child
    let stderr = ''
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString('utf8')
      if (stderr.length > 8000) stderr = stderr.slice(-8000)
    })
    child.stdout.on('data', (chunk) => {
      this.buffer += chunk.toString('utf8')
      let index = this.buffer.indexOf('\n')
      while (index >= 0) {
        const line = this.buffer.slice(0, index).trim()
        this.buffer = this.buffer.slice(index + 1)
        if (line.length > 0) this.#receive(line)
        index = this.buffer.indexOf('\n')
      }
    })
    const exited = new Promise((resolve, reject) => {
      child.on('error', (error) => {
        this.failure = error instanceof Error ? error.message : String(error)
        reject(new Error(this.failure))
      })
      child.on('close', (code) => {
        this.failure = `the MCP server exited with code ${code}${stderr.trim().length > 0 ? `: ${stderr.trim()}` : ''}`
        for (const [, entry] of this.pending) {
          entry.reject(new Error(this.failure))
        }
        this.pending.clear()
        reject(new Error(this.failure))
      })
    })
    exited.catch(() => {})

    const initialized = await this.#request('initialize', {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: 'dsh-browser-use', version: '1.0.0' },
    })
    this.#notify('notifications/initialized')
    const listed = await this.#request('tools/list', {})
    const tools = Array.isArray(listed?.tools) ? listed.tools : []
    this.tools = tools
    this.log(`the browser-use MCP server published ${tools.length} tools`)
    return { tools, serverInfo: initialized?.serverInfo ?? null }
  }

  /**
   * Handle one line the server sent.
   *
   * @param {string} line - the line, without its newline.
   * @returns {void}
   */
  #receive(line) {
    let message
    try {
      message = JSON.parse(line)
    } catch {
      return
    }
    if (message === null || typeof message !== 'object') return
    const id = message.id
    if (id === undefined || id === null) return
    const entry = this.pending.get(id)
    if (entry === undefined) return
    this.pending.delete(id)
    if (message.error !== undefined && message.error !== null) {
      entry.reject(new Error(String(message.error.message ?? message.error)))
      return
    }
    entry.resolve(message.result)
  }

  /**
   * Send one request and wait for its answer.
   *
   * @param {string} method - the JSON-RPC method.
   * @param {object} params - the request parameters.
   * @returns {Promise<any>} the result.
   */
  #request(method, params) {
    const id = this.nextId
    this.nextId += 1
    const payload = `${JSON.stringify({ jsonrpc: '2.0', id, method, params })}\n`
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      const child = this.child
      if (child === null || child.stdin.destroyed) {
        this.pending.delete(id)
        reject(new Error('the MCP server is not running'))
        return
      }
      child.stdin.write(payload, 'utf8', (error) => {
        if (error) {
          this.pending.delete(id)
          reject(error)
        }
      })
    })
  }

  /**
   * Send one notification.
   *
   * @param {string} method - the JSON-RPC method.
   * @returns {void}
   */
  #notify(method) {
    const child = this.child
    if (child === null || child.stdin.destroyed) return
    child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method })}\n`, 'utf8')
  }

  /**
   * Call one tool of the server.
   *
   * @param {string} name - the tool name.
   * @param {object} args - the tool arguments.
   * @returns {Promise<object>} the tool result.
   */
  async call(name, args) {
    await this.start()
    return this.#request('tools/call', { name, arguments: args ?? {} })
  }

  /**
   * Stop the server.
   *
   * @returns {void}
   */
  stop() {
    const child = this.child
    this.child = null
    this.ready = null
    this.tools = []
    if (child === null) return
    try {
      child.stdin.end()
    } catch {
      /* the pipe is already gone */
    }
    try {
      child.kill()
    } catch {
      /* the process already left */
    }
  }
}

/**
 * Render one MCP tool result as the text a model reads.
 *
 * @param {object} result - the tool result.
 * @returns {string} the rendered text.
 */
export function renderToolResult(result) {
  if (result === null || typeof result !== 'object') return String(result)
  const content = Array.isArray(result.content) ? result.content : []
  const parts = []
  for (const block of content) {
    if (typeof block?.text === 'string') {
      parts.push(block.text)
      continue
    }
    if (block?.type === 'image') parts.push('[image]')
    if (block?.type === 'resource' && typeof block?.resource?.text === 'string') parts.push(block.resource.text)
  }
  if (parts.length === 0) {
    if (result.structuredContent !== undefined) return JSON.stringify(result.structuredContent, null, 2)
    return JSON.stringify(result, null, 2)
  }
  return parts.join('\n')
}
