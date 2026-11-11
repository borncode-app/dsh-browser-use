<div align="center">
  <img src="icon.svg" alt="" width="72" height="72">
  <h1>dsh-browser-use</h1>
  <p><b>Native browser control for DeepSeek Harness, through <a href="https://github.com/browser-use/browser-use">browser-use</a>.</b></p>
  <p>
    <a href="https://github.com/borncode-app/dsh-browser-use/releases"><img alt="release" src="https://img.shields.io/github/v/release/borncode-app/dsh-browser-use?style=flat-square&color=6C4BF6"></a>
    <a href="LICENSE"><img alt="license" src="https://img.shields.io/badge/license-MIT-3DA639?style=flat-square"></a>
    <img alt="plugin" src="https://img.shields.io/badge/DeepSeek%20Harness-plugin-6C4BF6?style=flat-square">
    <img alt="package" src="https://img.shields.io/pypi/v/browser-use?style=flat-square&color=3775A9">
  </p>
</div>

---

## What it does

This plugin owns the Python `browser-use` package the same way `dsh-agent-desktop` owns its binary: it creates a
managed virtual environment under `~/.dsh/browser-use/`, installs the package into it, keeps it current from PyPI
on every launch, and exposes the browser actions as first-class tools.

Two browsers come out of it:

- **the Harness browser tab** — the tab the user watches in the sidebar, so every click is visible;
- **browser-use's own Chromium** — a full DevTools-protocol page you can read and drive from code, for the heavy work.

## Features

- **Managed environment** — its own venv and its own Python from the Harness runtime; nothing leaks into your system.
- **Auto-update from PyPI** — `autoUpdate: true` keeps `browser-use` current; pin it by turning that off.
- **First-class tools** — `browser_open`, `browser_tab_read`, `browser_tab_click`, `browser_tab_type`,
  `browser_tabs`, `browser_screenshot`, `browser_exec`, `browser_login`, plus the sidebar-attach helper.
- **Read-then-act discipline** — the tools return elements with indexes and refs, so the model re-reads after each
  action instead of reusing stale positions.
- **Cloud or local** — drives the local Chrome by default; `browser_login` connects a Browser Use Cloud browser
  when a key is configured.
- **Bounded calls** — `toolTimeoutMs` (120 s default) stops a page that never settles.

## Requirements

| | |
|---|---|
| DeepSeek Harness | 0.2.x (Web GUI) |
| Runtime | Python 3.12 + Node 24, both supplied by the Harness runtime |
| Disk | ~170 MB for the venv after first install |
| Browser | A local Chrome/Chromium; optional Browser Use Cloud key for remote browsers |

## Install

```bash
git clone https://github.com/borncode-app/dsh-browser-use.git dsh-browser-use
```

Then in DSH: **Plugins** → install the bundle from that directory, or:

```
plugin_manager install_bundle target=C:\path\to\dsh-browser-use
```

Restart once. The package installs itself into the managed venv on the first browser tool call.

## Configuration

| field | default | meaning |
|---|---|---|
| `endpoint` | `/plugins/browser-use` | Path the Web GUI reads and writes plugin data at |
| `autoUpdate` | `true` | Check PyPI for a newer release on every Harness launch |
| `package` | `browser-use` | Package the plugin installs and keeps current |
| `registerTools` | `true` | Register the `browser_*` tools the model calls |
| `guideInPrompt` | `true` | Add the operating guide to the model's system prompt |
| `toolTimeoutMs` | `120000` | Longest one browser command may run, in milliseconds |

## How it works

```
tool call ──▶ plugin host row ──▶ managed venv (python) ──▶ browser-use ──▶ CDP
                    │                                          │
                    └── install / update from PyPI ◀────────────┘
```

The venv can be thrown away at any time: the next call reinstalls it and nothing of yours is lost.

## Files

| file | role |
|---|---|
| `index.js` | host row: venv management, install/update, tool registration |
| `cdp.js` | DevTools-protocol bridge for the owned Chrome |
| `mcp.js` | JSON-RPC surface the tools speak |
| `client.js` | the Settings page |
| `cordis.patch.yml` | the bundle patch that inserts the row |
| `locale/{en,th,zh}.json` | UI strings |
| `icon.svg` | plugin icon |

## ภาษาไทย

Plugin นี้ให้ agent **ควบคุมเบราว์เซอร์ได้จริง** ผ่านแพ็กเกจ Python [`browser-use`](https://github.com/browser-use/browser-use):

- ติดตั้งลง virtualenv ที่ plugin จัดการเอง (`~/.dsh/browser-use/venv`) และอัปเดตจาก PyPI ทุกครั้งที่เปิด DSH
- เพิ่ม tool `browser_*` ให้โมเดลเรียก (`browser_open`, `browser_tab_read`, `browser_tab_click`, `browser_exec`, …)
- ขับ **แท็บที่คุณเห็นใน sidebar** ได้ (ทุกคลิกมองเห็น) หรือจะใช้ Chromium ของ browser-use เองก็ได้
- ต่อ Browser Use Cloud ได้ผ่าน `browser_login` ถ้ามี key
- ลบ venv ทิ้งได้ตลอด เรียกครั้งถัดไปมันจะติดตั้งใหม่เอง

## License

[MIT](LICENSE) © 2026 BornCode
