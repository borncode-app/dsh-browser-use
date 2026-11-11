window.__ModuleLoader__.load({
  id: '@local/dsh-browser-use',
  factory: (require) => {
    const React = require('react')

    /** Dictionary namespace owned by this plugin. */
    const NS = 'settings.browser-use'
    /** Must match the Host row's `endpoint`. */
    const ENDPOINT = '/plugins/browser-use'

    /** English copy. */
    const en = {
      'nav': 'Browser use',
      'title': 'Browser use',
      'intro': 'Lets the agent drive a real browser through the browser-use package. The package installs itself into a managed environment, checks PyPI for a newer release every time the Harness starts, and serves its browser actions as first-class tools.',
      'installed': 'Installed version',
      'latest': 'Latest release',
      'package': 'Package',
      'path': 'Install path',
      'tools': 'Tools the model calls',
      'toolsHint': 'The model calls these directly; it never has to run a shell command.',
      'server': 'Browser',
      'serverRunning': 'running',
      'serverStopped': 'not running',
      'harnessBrowser': 'Harness browser',
      'browserConnected': 'connected',
      'browserDisconnected': 'not connected',
      'openTabs': 'Open tabs',
      'apiKey': 'API key',
      'apiKeySet': 'configured',
      'apiKeyMissing': 'not configured',
      'apiKeyHint': 'browser-use uses the Browser Use cloud by default. Without a key it drives its own Chromium, which needs no account.',
      'autoUpdate': 'Update on every launch',
      'autoUpdateHint': 'Check PyPI for a newer browser-use release every time the Harness starts, and install it when one appears.',
      'update': 'Update now',
      'check': 'Check for updates',
      'restart': 'Restart the browser',
      'doctor': 'Run doctor',
      'skill': 'Install the agent skill',
      'busy': 'Working…',
      'ready': 'Ready',
      'installing': 'Installing the package…',
      'error': 'Not ready',
      'never': 'Never',
      'none': 'None',
      'unknown': 'Unknown',
      'updated': 'The release is current.',
      'updatedNew': 'The newer release is installed.',
      'healthOk': 'The browser answered.',
      'healthFailed': 'The browser did not answer.',
      'doctorTitle': 'What browser-use reports',
      'skillTitle': 'What the skill install reported',
      'loading': 'Loading…',
      'unavailable': 'The browser-use service is not available.',
      'failed': 'The action failed.',
      'section': 'Browser use',
    }

    /** Thai copy. */
    const th = {
      'nav': 'ควบคุมเบราว์เซอร์',
      'title': 'ควบคุมเบราว์เซอร์',
      'intro': 'ให้เอเจนต์ควบคุมเบราว์เซอร์จริงผ่านแพ็กเกจ browser-use แพ็กเกจติดตั้งตัวเองในสภาพแวดล้อมที่จัดการ ตรวจ PyPI หาเวอร์ชันใหม่ทุกครั้งที่เปิด Harness และให้บริการการกระทำของเบราว์เซอร์เป็นเครื่องมือที่เรียกใช้ได้โดยตรง',
      'installed': 'เวอร์ชันที่ติดตั้ง',
      'latest': 'รุ่นล่าสุด',
      'package': 'แพ็กเกจ',
      'path': 'ตำแหน่งติดตั้ง',
      'tools': 'เครื่องมือที่โมเดลเรียกใช้',
      'toolsHint': 'โมเดลเรียกเครื่องมือเหล่านี้โดยตรง ไม่ต้องรันคำสั่งในเทอร์มินัล',
      'server': 'เบราว์เซอร์',
      'serverRunning': 'กำลังทำงาน',
      'serverStopped': 'ไม่ได้ทำงาน',
      'harnessBrowser': 'เบราว์เซอร์ของ DSH',
      'browserConnected': 'เชื่อมต่อแล้ว',
      'browserDisconnected': 'ยังไม่ได้เชื่อมต่อ',
      'openTabs': 'แท็บที่เปิดอยู่',
      'apiKey': 'คีย์ API',
      'apiKeySet': 'ตั้งค่าแล้ว',
      'apiKeyMissing': 'ยังไม่ได้ตั้งค่า',
      'apiKeyHint': 'โดยปกติ browser-use ใช้ Browser Use Cloud หากไม่มีคีย์ มันจะควบคุม Chromium ของตัวเองซึ่งไม่ต้องมีบัญชี',
      'autoUpdate': 'อัปเดตทุกครั้งที่เปิดแอป',
      'autoUpdateHint': 'ตรวจ PyPI หา browser-use รุ่นใหม่ทุกครั้งที่เปิด Harness และติดตั้งให้อัตโนมัติเมื่อมี',
      'update': 'อัปเดตตอนนี้',
      'check': 'ตรวจหาเวอร์ชันใหม่',
      'restart': 'เปิดเบราว์เซอร์ใหม่',
      'doctor': 'ทดสอบการทำงาน',
      'skill': 'ติดตั้ง skill สำหรับเอเจนต์',
      'busy': 'กำลังทำงาน…',
      'ready': 'พร้อมใช้งาน',
      'installing': 'กำลังติดตั้งแพ็กเกจ…',
      'error': 'ยังไม่พร้อมใช้งาน',
      'never': 'ไม่เคย',
      'none': 'ไม่มี',
      'unknown': 'ไม่ทราบ',
      'updated': 'เวอร์ชันที่ติดตั้งเป็นรุ่นล่าสุดแล้ว',
      'updatedNew': 'ติดตั้งเวอร์ชันใหม่เรียบร้อยแล้ว',
      'healthOk': 'เบราว์เซอร์ตอบกลับสำเร็จ',
      'healthFailed': 'เบราว์เซอร์ไม่ตอบกลับ',
      'doctorTitle': 'สิ่งที่ browser-use รายงาน',
      'skillTitle': 'สิ่งที่การติดตั้ง skill รายงาน',
      'loading': 'กำลังโหลด…',
      'unavailable': 'ไม่พบบริการ browser-use',
      'failed': 'ดำเนินการไม่สำเร็จ',
      'section': 'ควบคุมเบราว์เซอร์',
    }

    /** Simplified Chinese copy. */
    const zh = {
      'nav': '浏览器控制',
      'title': '浏览器控制',
      'intro': '让智能体通过 browser-use 驱动真实浏览器。该包会安装到受管环境中，每次启动 Harness 时检查 PyPI 上的新版本，并把它的浏览器动作作为原生工具提供。',
      'installed': '已安装版本',
      'latest': '最新版本',
      'package': '软件包',
      'path': '安装路径',
      'tools': '模型调用的工具',
      'toolsHint': '模型直接调用这些工具，无需运行终端命令。',
      'server': '浏览器',
      'serverRunning': '运行中',
      'serverStopped': '未运行',
      'harnessBrowser': 'Harness 浏览器',
      'browserConnected': '已连接',
      'browserDisconnected': '未连接',
      'openTabs': '打开的标签页',
      'apiKey': 'API 密钥',
      'apiKeySet': '已配置',
      'apiKeyMissing': '未配置',
      'apiKeyHint': 'browser-use 默认使用 Browser Use 云端。没有密钥时它会驱动自己的 Chromium，无需账号。',
      'autoUpdate': '每次启动时更新',
      'autoUpdateHint': '每次启动 Harness 时检查 PyPI 上的新 browser-use 版本，并在有新版本时自动安装。',
      'update': '立即更新',
      'check': '检查更新',
      'restart': '重启浏览器',
      'doctor': '运行诊断',
      'skill': '安装智能体技能',
      'busy': '处理中…',
      'ready': '就绪',
      'installing': '正在安装软件包…',
      'error': '尚未就绪',
      'never': '从未',
      'none': '无',
      'unknown': '未知',
      'updated': '已安装的版本就是最新版本。',
      'updatedNew': '新版本已安装。',
      'healthOk': '浏览器正常响应。',
      'healthFailed': '浏览器没有响应。',
      'doctorTitle': 'browser-use 的报告',
      'skillTitle': '技能安装的报告',
      'loading': '加载中…',
      'unavailable': 'browser-use 服务不可用。',
      'failed': '操作失败。',
      'section': '浏览器控制',
    }

    /** The row's own styles; the class names are unique to this plugin. */
    const css = [
      '.dshbu_section{display:flex;flex-direction:column;gap:16px;max-width:760px}',
      '.dshbu_title{font-size:14px;line-height:20px;color:var(--dsw-alias-label-primary);margin:0}',
      '.dshbu_description{margin:4px 0 0;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}',
      '.dshbu_badge{display:inline-flex;align-items:center;gap:6px;align-self:flex-start;height:24px;padding:0 10px;border-radius:var(--dsw-radius-md);font-size:12px;line-height:18px;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-secondary)}',
      '.dshbu_badgeOk{color:var(--dsw-alias-state-success-primary)}',
      '.dshbu_badgeBusy{color:var(--dsw-alias-label-primary)}',
      '.dshbu_badgeError{color:var(--dsw-alias-state-error-primary)}',
      '.dshbu_rows{display:flex;flex-direction:column;gap:1px;background:var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md);overflow:hidden}',
      '.dshbu_row{display:flex;align-items:baseline;gap:16px;padding:10px 12px;background:var(--dsw-alias-bg-module-platform)}',
      '.dshbu_rowLabel{flex:0 0 190px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}',
      '.dshbu_rowValue{flex:1 1 auto;min-width:0;font-size:13px;line-height:20px;color:var(--dsw-alias-label-primary);overflow-wrap:anywhere}',
      '.dshbu_rowValueMono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px}',
      '.dshbu_actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
      '.dshbu_button{height:32px;padding:0 14px;border:1px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;line-height:20px;cursor:pointer}',
      '@media (hover:hover){.dshbu_button:hover{background:var(--dsw-alias-interactive-bg-hover)}}',
      '.dshbu_button:disabled{opacity:.5;cursor:default}',
      '.dshbu_buttonPrimary{background:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-on-primary);border-color:transparent}',
      '.dshbu_status{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}',
      '.dshbu_statusError{color:var(--dsw-alias-state-error-primary)}',
      '.dshbu_statusOk{color:var(--dsw-alias-state-success-primary)}',
      '.dshbu_separator{height:.5px;border:none;margin:0;background:var(--dsw-alias-border-l2)}',
      '.dshbu_switchRow{display:flex;align-items:flex-start;gap:12px}',
      '.dshbu_switch{position:relative;flex:0 0 auto;width:36px;height:20px;margin-top:2px;padding:0;border:none;border-radius:999px;background:var(--dsw-alias-border-l2);cursor:pointer}',
      '.dshbu_switch[aria-checked="true"]{background:var(--dsw-alias-brand-primary)}',
      '.dshbu_switch:disabled{opacity:.5;cursor:default}',
      '.dshbu_switchKnob{position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:var(--dsw-alias-bg-module-platform);transition:transform .12s ease-out}',
      '.dshbu_switch[aria-checked="true"] .dshbu_switchKnob{transform:translateX(16px)}',
      '.dshbu_label{font-size:13px;line-height:20px;color:var(--dsw-alias-label-primary)}',
      '.dshbu_hint{margin-top:2px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}',
      '.dshbu_tools{display:flex;flex-wrap:wrap;gap:6px}',
      '.dshbu_tool{padding:2px 8px;border-radius:var(--dsw-radius-sm);background:var(--dsw-alias-bg-module-platform);border:1px solid var(--dsw-alias-border-l2);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;line-height:18px;color:var(--dsw-alias-label-secondary)}',
      '.dshbu_pre{max-height:320px;overflow:auto;margin:0;padding:12px;border-radius:var(--dsw-radius-md);background:var(--dsw-alias-bg-module-platform);border:1px solid var(--dsw-alias-border-l2);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;line-height:17px;white-space:pre-wrap;overflow-wrap:anywhere;color:var(--dsw-alias-label-primary)}',
    ].join('')

    /**
     * The script one browser command runs inside the Harness browser tab.
     *
     * The tab is an Electron webview, so the page it shows runs these scripts
     * in its own world. Every argument is JSON encoded, never interpolated.
     *
     * @param {object} command - the command to run.
     * @returns {string} the script to run.
     */
    function buildScript(command) {
      const elements = "document.querySelectorAll('a,button,input,textarea,select,[role=button],[role=link],[role=tab],[onclick]')"
      if (command.type === 'read') {
        return `JSON.stringify({
          title: document.title,
          url: location.href,
          text: ((document.body && document.body.innerText) || '').slice(0, 4000),
          elements: Array.from(${elements}).slice(0, 200).map((element, index) => ({
            index,
            tag: element.tagName.toLowerCase(),
            text: (element.innerText || element.value || element.getAttribute('aria-label') || element.getAttribute('placeholder') || '').trim().slice(0, 100),
            name: element.getAttribute('name') || null,
            href: element.getAttribute('href') || null,
            type: element.getAttribute('type') || null
          }))
        })`
      }
      if (command.type === 'click') {
        const wanted = JSON.stringify(command.text ?? '')
        const index = JSON.stringify(command.index ?? null)
        return `(() => {
          const list = Array.from(${elements})
          let element = null
          if (${index} !== null) element = list[${index}] ?? null
          if (element === null) {
            const wanted = ${wanted}.toLowerCase()
            element = list.find((entry) => {
              const text = (entry.innerText || entry.value || entry.getAttribute('aria-label') || '').trim().toLowerCase()
              return wanted.length > 0 && text.includes(wanted)
            }) ?? null
          }
          if (element === null) return JSON.stringify({ ok: false, error: 'no element matches' })
          element.scrollIntoView({ block: 'center' })
          element.click()
          return JSON.stringify({ ok: true, tag: element.tagName.toLowerCase(), text: (element.innerText || '').trim().slice(0, 100) })
        })()`
      }
      if (command.type === 'type') {
        const text = JSON.stringify(command.text ?? '')
        return `(() => {
          const active = document.activeElement
          const field = active && active !== document.body
            ? active
            : document.querySelector('input,textarea,[contenteditable=true]')
          if (!field) return JSON.stringify({ ok: false, error: 'no text field is focused' })
          field.focus()
          const proto = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
          const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
          const text = ${text}
          if (setter) setter.call(field, text)
          else field.value = text
          field.dispatchEvent(new Event('input', { bubbles: true }))
          field.dispatchEvent(new Event('change', { bubbles: true }))
          return JSON.stringify({ ok: true, value: field.value })
        })()`
      }
      if (command.type === 'scroll') {
        const amount = JSON.stringify(Number(command.amount ?? 600))
        return `(() => {
          const delta = ${amount}
          window.scrollBy(0, delta)
          return JSON.stringify({ ok: true, x: window.scrollX, y: window.scrollY })
        })()`
      }
      if (command.type === 'reload') {
        return '(() => { location.reload(); return JSON.stringify({ ok: true }) })()'
      }
      return 'JSON.stringify({ ok: false, error: "unknown command" })'
    }

    /**
     * Run one command in the Harness browser tab.
     *
     * @param {object} command - the command to run.
     * @returns {Promise<object>} what the tab answered.
     */
    async function runWebviewCommand(command) {
      const elements = (() => {
        try {
          return Array.from(document.querySelectorAll('webview'))
        } catch {
          return []
        }
      })()
      if (elements.length === 0) return { ok: false, error: 'no Harness browser tab is open' }
      const element = elements[elements.length - 1]
      if (typeof element.executeJavaScript !== 'function') return { ok: false, error: 'the tab cannot run scripts' }
      try {
        const value = await element.executeJavaScript(buildScript(command))
        if (typeof value !== 'string') return { ok: true, data: value }
        try {
          return JSON.parse(value)
        } catch {
          return { ok: true, data: value }
        }
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : String(error) }
      }
    }

    /**
     * The plugin's own reader of its dictionaries.
     *
     * @param {string} key - the dictionary key.
     * @returns {string} the translated text.
     */
    let translate = (key) => key

    /**
     * Read the visible Harness browser tab from inside its own page.
     *
     * The Browser tab is an Electron webview. The webview element lives in
     * this renderer, so the page it shows can be read and driven with the
     * same script the guest page would run.
     *
     * @returns {Promise<object | null>} what the tab holds, or null when there is no tab.
     */
    async function runWebviewProbe() {
      const elements = (() => {
        try {
          return Array.from(document.querySelectorAll('webview'))
        } catch {
          return []
        }
      })()
      if (elements.length === 0) return null
      const element = elements[elements.length - 1]
      if (typeof element.executeJavaScript !== 'function') return { error: 'the tab cannot run scripts' }
      try {
        const value = await element.executeJavaScript('JSON.stringify({ title: document.title, url: location.href, text: (document.body && document.body.innerText || "").slice(0, 200) })')
        return { raw: typeof value === 'string' ? value : String(value) }
      } catch (error) {
        return { error: error instanceof Error ? error.message : String(error) }
      }
    }

    /**
     * The navigation icon of the settings section.
     *
     * @param {object} props - the row's own props.
     * @returns {object} the icon element.
     */
    function SectionIcon(props) {
      const size = typeof props?.size === 'number' ? props.size : 16
      const active = props?.active === true
      return React.createElement(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 16 16',
          fill: 'none',
          'aria-hidden': 'true',
          style: { display: 'block', flex: '0 0 auto' },
        },
        React.createElement('rect', {
          x: 1.25,
          y: 2.25,
          width: 13.5,
          height: 11.5,
          rx: 2,
          stroke: 'currentColor',
          strokeWidth: 1.3,
          opacity: active ? 1 : 0.75,
        }),
        React.createElement('path', {
          d: 'M1.5 5.5h13',
          stroke: 'currentColor',
          strokeWidth: 1.3,
          opacity: active ? 1 : 0.75,
        }),
        React.createElement('path', {
          d: 'M11.5 9.5a3 3 0 1 0 0 4',
          stroke: 'currentColor',
          strokeWidth: 1.2,
          strokeLinecap: 'round',
          opacity: active ? 1 : 0.75,
        }),
      )
    }

    /**
     * The Browser use settings section.
     *
     * @param {object} props - the row's own props.
     * @returns {object} the section element.
     */
    function BrowserUseSection(props) {
      const t = (key) => (typeof props?.t === 'function' ? props.t(key) : translate(key))
      const [report, setReport] = React.useState(null)
      const [error, setError] = React.useState(null)
      const [busy, setBusy] = React.useState(false)
      const [status, setStatus] = React.useState('')
      const [doctor, setDoctor] = React.useState(null)
      const [skill, setSkill] = React.useState(null)

      /**
       * Read the plugin's own state from the Host.
       *
       * @returns {Promise<object | null>} the report, or null when it failed.
       */
      const load = React.useCallback(async () => {
        try {
          const response = await fetch(ENDPOINT, { headers: { accept: 'application/json' } })
          if (!response.ok) throw new Error(`status ${response.status}`)
          const body = await response.json()
          setReport(body)
          setError(null)
          return body
        } catch (failure) {
          setError(failure instanceof Error ? failure.message : String(failure))
          return null
        }
      }, [])

      React.useEffect(() => {
        void load()
      }, [load])

      /**
       * Send one action to the Host and adopt its answer.
       *
       * @param {object} body - the action to send.
       * @returns {Promise<object | null>} the answer, or null when it failed.
       */
      const send = async (body) => {
        const response = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { accept: 'application/json', 'content-type': 'application/json' },
          body: JSON.stringify(body),
        })
        const answer = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(answer?.error ?? `status ${response.status}`)
        setReport(answer)
        return answer
      }

      /**
       * Run one action with the busy state around it.
       *
       * @param {object} body - the action to send.
       * @returns {Promise<void>} once the action settled.
       */
      const act = async (body) => {
        if (busy) return
        setBusy(true)
        try {
          await send(body)
          setStatus(t('updated'))
        } catch (failure) {
          setError(failure instanceof Error ? failure.message : String(failure))
          setStatus('')
        } finally {
          setBusy(false)
        }
      }

      const phase = String(report?.phase ?? 'idle')
      const busyPhase = phase === 'checking' || phase === 'installing'
      let badge
      let badgeClass = 'dshbu_badge'
      if (report === null) {
        badge = t('loading')
      } else if (phase === 'error') {
        badge = t('error')
        badgeClass = 'dshbu_badge dshbu_badgeError'
      } else if (busyPhase) {
        badge = t('installing')
        badgeClass = 'dshbu_badge dshbu_badgeBusy'
      } else {
        badge = t('ready')
        badgeClass = 'dshbu_badge dshbu_badgeOk'
      }

      const tools = Array.isArray(report?.tools) ? report.tools : []
      const webviews = Array.isArray(report?.client?.webviews) ? report.client.webviews : []
      const serverText = report?.serverRunning === true ? t('serverRunning') : t('serverStopped')
      const keyText = report?.apiKeyConfigured === true ? t('apiKeySet') : t('apiKeyMissing')

      return React.createElement(
        'section',
        { className: 'dshbu_section' },
        React.createElement('style', null, css),
        React.createElement(
          'div',
          null,
          React.createElement('h2', { className: 'dshbu_title' }, t('title')),
          React.createElement('p', { className: 'dshbu_description' }, t('intro')),
        ),
        React.createElement('span', { className: badgeClass, role: 'status' }, badge),
        error ? React.createElement('p', { className: 'dshbu_status dshbu_statusError', role: 'alert' }, `${t('failed')} ${error}`) : null,
        report?.lastError ? React.createElement('p', { className: 'dshbu_status' }, report.lastError) : null,
        report?.serverError ? React.createElement('p', { className: 'dshbu_status dshbu_statusError' }, report.serverError) : null,
        React.createElement(
          'div',
          { className: 'dshbu_rows' },
          React.createElement(
            'div',
            { className: 'dshbu_row' },
            React.createElement('div', { className: 'dshbu_rowLabel' }, t('installed')),
            React.createElement('div', { className: 'dshbu_rowValue' }, report?.installedVersion ?? t('unknown')),
          ),
          React.createElement(
            'div',
            { className: 'dshbu_row' },
            React.createElement('div', { className: 'dshbu_rowLabel' }, t('latest')),
            React.createElement('div', { className: 'dshbu_rowValue' }, report?.latestVersion ?? t('unknown')),
          ),
          React.createElement(
            'div',
            { className: 'dshbu_row' },
            React.createElement('div', { className: 'dshbu_rowLabel' }, t('package')),
            React.createElement('div', { className: 'dshbu_rowValue' }, report?.package ?? t('unknown')),
          ),
          React.createElement(
            'div',
            { className: 'dshbu_row' },
            React.createElement('div', { className: 'dshbu_rowLabel' }, t('server')),
            React.createElement('div', { className: 'dshbu_rowValue' }, serverText),
          ),
          React.createElement(
            'div',
            { className: 'dshbu_row' },
            React.createElement('div', { className: 'dshbu_rowLabel' }, t('harnessBrowser')),
            React.createElement(
              'div',
              { className: 'dshbu_rowValue' },
              report?.client === null || report?.client === undefined ? t('browserDisconnected') : t('browserConnected'),
            ),
          ),
          React.createElement(
            'div',
            { className: 'dshbu_row' },
            React.createElement('div', { className: 'dshbu_rowLabel' }, t('openTabs')),
            React.createElement(
              'div',
              { className: 'dshbu_rowValue' },
              webviews.length === 0
                ? t('none')
                : webviews.map((tab) => `${tab.title ?? ''} — ${tab.url ?? tab.src ?? ''}`).join('\n'),
            ),
          ),
          React.createElement(
            'div',
            { className: 'dshbu_row' },
            React.createElement('div', { className: 'dshbu_rowLabel' }, t('apiKey')),
            React.createElement('div', { className: 'dshbu_rowValue' }, keyText),
          ),
          React.createElement(
            'div',
            { className: 'dshbu_row' },
            React.createElement('div', { className: 'dshbu_rowLabel' }, t('path')),
            React.createElement('div', { className: 'dshbu_rowValue dshbu_rowValueMono' }, report?.installPath ?? t('unknown')),
          ),
        ),
        React.createElement('div', { className: 'dshbu_hint' }, t('apiKeyHint')),
        React.createElement(
          'div',
          { className: 'dshbu_actions' },
          React.createElement(
            'button',
            {
              type: 'button',
              className: 'dshbu_button dshbu_buttonPrimary',
              disabled: busy,
              onClick: () => void act({ action: 'update-now' }),
            },
            t('update'),
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              className: 'dshbu_button',
              disabled: busy,
              onClick: () => void act({ action: 'check' }),
            },
            t('check'),
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              className: 'dshbu_button',
              disabled: busy,
              onClick: () => void act({ action: 'restart-server' }),
            },
            t('restart'),
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              className: 'dshbu_button',
              disabled: busy,
              onClick: async () => {
                if (busy) return
                setBusy(true)
                setDoctor(null)
                try {
                  const answer = await send({ action: 'doctor' })
                  setDoctor(answer?.doctor ?? null)
                  setStatus(answer?.doctor?.code === 0 ? t('healthOk') : t('healthFailed'))
                } catch (failure) {
                  setError(failure instanceof Error ? failure.message : String(failure))
                } finally {
                  setBusy(false)
                }
              },
            },
            t('doctor'),
          ),
          React.createElement(
            'button',
            {
              type: 'button',
              className: 'dshbu_button',
              disabled: busy,
              onClick: async () => {
                if (busy) return
                setBusy(true)
                setSkill(null)
                try {
                  const answer = await send({ action: 'skill-install' })
                  setSkill(answer?.skill ?? null)
                } catch (failure) {
                  setError(failure instanceof Error ? failure.message : String(failure))
                } finally {
                  setBusy(false)
                }
              },
            },
            t('skill'),
          ),
          busy ? React.createElement('span', { className: 'dshbu_status', role: 'status' }, t('busy')) : null,
          status.length > 0 ? React.createElement('span', { className: 'dshbu_status dshbu_statusOk' }, status) : null,
        ),
        React.createElement('hr', { className: 'dshbu_separator' }),
        React.createElement(
          'div',
          { className: 'dshbu_switchRow' },
          React.createElement(
            'button',
            {
              type: 'button',
              role: 'switch',
              className: 'dshbu_switch',
              'aria-checked': report?.autoUpdate === true ? 'true' : 'false',
              'aria-label': t('autoUpdate'),
              disabled: busy || report === null,
              onClick: () => {
                const next = report?.autoUpdate !== true
                setReport((current) => (current === null ? current : { ...current, autoUpdate: next }))
                void act({ action: 'set-auto-update', enabled: next })
              },
            },
            React.createElement('span', { className: 'dshbu_switchKnob' }),
          ),
          React.createElement(
            'div',
            null,
            React.createElement('div', { className: 'dshbu_label' }, t('autoUpdate')),
            React.createElement('div', { className: 'dshbu_hint' }, t('autoUpdateHint')),
          ),
        ),
        React.createElement('hr', { className: 'dshbu_separator' }),
        React.createElement(
          'div',
          null,
          React.createElement('div', { className: 'dshbu_label' }, t('tools')),
          React.createElement('div', { className: 'dshbu_hint' }, t('toolsHint')),
          React.createElement(
            'div',
            { className: 'dshbu_tools', style: { marginTop: '8px' } },
            tools.length === 0
              ? React.createElement('span', { className: 'dshbu_hint' }, t('none'))
              : tools.map((name) => React.createElement('span', { key: name, className: 'dshbu_tool' }, name)),
          ),
        ),
        doctor
          ? React.createElement(
            'div',
            null,
            React.createElement('div', { className: 'dshbu_label' }, t('doctorTitle')),
            React.createElement(
              'pre',
              { className: 'dshbu_pre', style: { marginTop: '8px' } },
              [doctor.stdout, doctor.stderr, doctor.error].filter((part) => typeof part === 'string' && part.length > 0).join('\n') || '(no output)',
            ),
          )
          : null,
        skill
          ? React.createElement(
            'div',
            null,
            React.createElement('div', { className: 'dshbu_label' }, t('skillTitle')),
            React.createElement(
              'pre',
              { className: 'dshbu_pre', style: { marginTop: '8px' } },
              [skill.stdout, skill.stderr, skill.error].filter((part) => typeof part === 'string' && part.length > 0).join('\n') || '(no output)',
            ),
          )
          : null,
      )
    }

    const apply = (ctx) => {
      const t = ctx.locale.bind(NS)
      translate = (key, values) => t(key, values)
      ctx.effect(() => ctx.locale.register(NS, { en, th, zh }), 'ui-browser-use: dictionaries')
      ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: 'browser-use',
        order: 23,
        label: () => t('nav'),
        locale: NS,
      }, BrowserUseSection))
      ctx.slots.inject('settings.section.icon', () => ctx.slots.register({
        name: 'settings.section.icon',
        id: 'browser-use',
        order: 0,
        locale: NS,
      }, SectionIcon))

      // The browser half and the Host half talk over one small channel: the
      // browser half reports what it can see and picks up the commands the
      // Host wants the Harness browser to carry out.
      ctx.effect(() => {
        let stopped = false
        /**
         * Report what the browser half can see and run what the Host asked for.
         *
         * @returns {Promise<void>} once the round is done.
         */
        const round = async () => {
          if (stopped) return
          const service = ctx.get('sidebarRight')
          const report = {
            sidebarRight: typeof service,
            sidebarRightKeys: service === undefined || service === null ? [] : Object.keys(service),
            sidebarRightMembers: service === undefined || service === null ? {} : Object.fromEntries(
              Object.keys(service).map((key) => [key, typeof service[key]]),
            ),
            sidebarRightOpenTab: service === undefined || service === null ? null : typeof service.openTab,
            sidebarRightOpenTabs: service === undefined || service === null ? null : typeof service.openTabs,
            sidebarRightTabs: service === undefined || service === null ? null : typeof service.tabs,
            webviews: (() => {
              try {
                return Array.from(document.querySelectorAll('webview')).map((element) => ({
                  src: element.getAttribute('src'),
                  url: typeof element.getURL === 'function' ? element.getURL() : null,
                  title: typeof element.getTitle === 'function' ? element.getTitle() : null,
                  hasExecuteJavaScript: typeof element.executeJavaScript === 'function',
                }))
              } catch {
                return []
              }
            })(),
          }
          let answer = {}
          const probe = await runWebviewProbe()
          if (probe !== null) report.webviewProbe = probe
          try {
            const response = await fetch(ENDPOINT, {
              method: 'POST',
              headers: { accept: 'application/json', 'content-type': 'application/json' },
              body: JSON.stringify({ action: 'client-poll', report }),
            })
            answer = await response.json().catch(() => {})
          } catch {
            return
          }
          const commands = Array.isArray(answer?.commands) ? answer.commands : []
          for (const command of commands) {
            let ok = false
            let detail = null
            let data = null
            try {
              if (command?.type === 'open') {
                if (service !== undefined && service !== null && typeof service.openTab === 'function') {
                  service.openTab('browser', { params: { url: String(command.url ?? '') } })
                  ok = true
                  detail = `the Harness browser opened ${String(command.url ?? '')}`
                } else {
                  detail = 'the Harness browser cannot be opened from here'
                }
              } else {
                const result = await runWebviewCommand(command)
                ok = result?.ok !== false
                detail = result?.error ?? null
                data = result
              }
            } catch (error) {
              detail = error instanceof Error ? error.message : String(error)
            }
            void fetch(ENDPOINT, {
              method: 'POST',
              headers: { accept: 'application/json', 'content-type': 'application/json' },
              body: JSON.stringify({ action: 'client-result', id: command?.id, ok, detail, data }),
            }).catch(() => {})
          }
        }
        void round()
        const timer = setInterval(() => { void round() }, 2000)
        return () => {
          stopped = true
          clearInterval(timer)
        }
      }, 'ui-browser-use: channel')
    }

    return { inject: ['slots', 'locale'], apply }
  },
})
