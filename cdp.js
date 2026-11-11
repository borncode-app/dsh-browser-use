/**
 * The Harness app's own Chromium, over the DevTools protocol.
 *
 * The Desktop app listens for a DevTools endpoint of its own. Every Browser
 * tab the user opens in the right sidebar is an Electron webview, and every
 * webview shows up as a target of that endpoint. browser-use can drive any
 * Chromium it is pointed at, so pointing it at a webview target makes the
 * agent act in the very browser the user watches.
 */

/** Ports the Harness is known to use for its DevTools endpoint. */
const CANDIDATE_PORTS = [9222, 9223, 9224, 9225, 9226, 9227, 9228, 9229, 9230, 9231, 9232, 9333, 4444]

/**
 * Read one JSON document with a short timeout.
 *
 * @param {string} url - the address to read.
 * @param {number} timeoutMs - how long the read may take.
 * @returns {Promise<any | null>} the parsed body, or null when it failed.
 */
async function readJson(url, timeoutMs) {
  try {
    const response = await fetch(url, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

/**
 * Find the DevTools endpoint of the Harness app.
 *
 * @returns {Promise<{ port: number, version: object } | null>} the endpoint, when one answered.
 */
export async function findCdpEndpoint() {
  for (const port of CANDIDATE_PORTS) {
    const version = await readJson(`http://127.0.0.1:${port}/json/version`, 700)
    if (version !== null && typeof version === 'object' && version.webSocketDebuggerUrl !== undefined) {
      return { port, version }
    }
  }
  return null
}

/**
 * List the targets of one DevTools endpoint.
 *
 * @param {number} port - the port the endpoint listens on.
 * @returns {Promise<object[]>} the targets.
 */
export async function listTargets(port) {
  const targets = await readJson(`http://127.0.0.1:${port}/json`, 1500)
  if (!Array.isArray(targets)) return []
  return targets.map((target) => ({
    id: typeof target?.id === 'string' ? target.id : null,
    type: typeof target?.type === 'string' ? target.type : null,
    title: typeof target?.title === 'string' ? target.title : null,
    url: typeof target?.url === 'string' ? target.url : null,
    webSocketDebuggerUrl: typeof target?.webSocketDebuggerUrl === 'string' ? target.webSocketDebuggerUrl : null,
  }))
}

/**
 * The browser tabs the Harness shows in its right sidebar.
 *
 * A sidebar Browser tab is an Electron webview, so it is a target of its own
 * type. The application window itself is reported as a page and is skipped.
 *
 * @param {object[]} targets - every target of the endpoint.
 * @returns {object[]} the browser tabs.
 */
export function browserTabs(targets) {
  return targets.filter((target) => {
    if (target.type === 'webview') return true
    if (target.type !== 'page') return false
    if (typeof target.url !== 'string') return false
    if (!/^https?:/iu.test(target.url)) return false
    return !target.url.includes('127.0.0.1:53577')
  })
}

/**
 * Wait for a browser tab to show one address.
 *
 * @param {number} port - the DevTools port.
 * @param {string} url - the address to wait for.
 * @param {number} timeoutMs - how long to wait.
 * @returns {Promise<object | null>} the tab, when one appeared.
 */
export async function waitForTab(port, url, timeoutMs) {
  const wanted = hostOf(url)
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    const tabs = browserTabs(await listTargets(port))
    const found = tabs.find((tab) => typeof tab.url === 'string' && hostOf(tab.url) === wanted)
      ?? tabs.find((tab) => typeof tab.url === 'string' && tab.url === url)
    if (found !== undefined) return found
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  return null
}

/**
 * The host part of one address.
 *
 * @param {string} url - the address.
 * @returns {string} the host, lower-cased.
 */
function hostOf(url) {
  try {
    return new URL(url).host.toLowerCase()
  } catch {
    return String(url ?? '').toLowerCase()
  }
}
