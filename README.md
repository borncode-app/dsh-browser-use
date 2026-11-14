> **This repository has moved into one monorepo.**
>
> The BornCode plugins — agent customization, desktop control, auto-continue,
> auto-shutdown, browser use, session instructions, session sync, and the side
> chat — now live in
> **[`borncode-app/dsh-borncode`](https://github.com/borncode-app/dsh-borncode)**,
> one repository with one Plugins entry.
>
> | this repo | new home |
> |---|---|
> | `dsh-agent-customizer` | `packages/dsh-agent-customizer` |
> | `dsh-agent-desktop` | `packages/dsh-agent-desktop` |
> | `dsh-auto-continue` | `packages/dsh-auto-continue` |
> | `dsh-auto-shutdown` | `packages/dsh-auto-shutdown` |
> | `dsh-browser-use` | `packages/dsh-browser-use` |
> | `dsh-session-instructions` | `packages/dsh-session-instructions` |
> | `dsh-session-sync` | `packages/dsh-session-sync` |
> | `dsh-side-chat` | `packages/dsh-side-chat` |
>
> The code and its history are unchanged; only the repository is shared. Install
> `dsh-borncode` instead of the individual bundles. This repository stays open
> so the old links keep working.
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

- **the Harness browser tab** â€” the tab the user watches in the sidebar, so every click is visible;
- **browser-use's own Chromium** â€” a full DevTools-protocol page you can read and drive from code, for the heavy work.

## Features

- **Managed environment** â€” its own venv and its own Python from the Harness runtime; nothing leaks into your system.
- **Auto-update from PyPI** â€” `autoUpdate: true` keeps `browser-use` current; pin it by turning that off.
- **First-class tools** â€” `browser_open`, `browser_tab_read`, `browser_tab_click`, `browser_tab_type`,
  `browser_tabs`, `browser_screenshot`, `browser_exec`, `browser_login`, plus the sidebar-attach helper.
- **Read-then-act discipline** â€” the tools return elements with indexes and refs, so the model re-reads after each
  action instead of reusing stale positions.
- **Cloud or local** â€” drives the local Chrome by default; `browser_login` connects a Browser Use Cloud browser
  when a key is configured.
- **Bounded calls** â€” `toolTimeoutMs` (120 s default) stops a page that never settles.

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

Then in DSH: **Plugins** â†’ install the bundle from that directory, or:

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
tool call â”€â”€â–¶ plugin host row â”€â”€â–¶ managed venv (python) â”€â”€â–¶ browser-use â”€â”€â–¶ CDP
                    â”‚                                          â”‚
                    â””â”€â”€ install / update from PyPI â—€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
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

## à¸ à¸²à¸©à¸²à¹„à¸—à¸¢

Plugin à¸™à¸µà¹‰à¹ƒà¸«à¹‰ agent **à¸„à¸§à¸šà¸„à¸¸à¸¡à¹€à¸šà¸£à¸²à¸§à¹Œà¹€à¸‹à¸­à¸£à¹Œà¹„à¸”à¹‰à¸ˆà¸£à¸´à¸‡** à¸œà¹ˆà¸²à¸™à¹à¸žà¹‡à¸à¹€à¸à¸ˆ Python [`browser-use`](https://github.com/browser-use/browser-use):

- à¸•à¸´à¸”à¸•à¸±à¹‰à¸‡à¸¥à¸‡ virtualenv à¸—à¸µà¹ˆ plugin à¸ˆà¸±à¸”à¸à¸²à¸£à¹€à¸­à¸‡ (`~/.dsh/browser-use/venv`) à¹à¸¥à¸°à¸­à¸±à¸›à¹€à¸”à¸•à¸ˆà¸²à¸ PyPI à¸—à¸¸à¸à¸„à¸£à¸±à¹‰à¸‡à¸—à¸µà¹ˆà¹€à¸›à¸´à¸” DSH
- à¹€à¸žà¸´à¹ˆà¸¡ tool `browser_*` à¹ƒà¸«à¹‰à¹‚à¸¡à¹€à¸”à¸¥à¹€à¸£à¸µà¸¢à¸ (`browser_open`, `browser_tab_read`, `browser_tab_click`, `browser_exec`, â€¦)
- à¸‚à¸±à¸š **à¹à¸—à¹‡à¸šà¸—à¸µà¹ˆà¸„à¸¸à¸“à¹€à¸«à¹‡à¸™à¹ƒà¸™ sidebar** à¹„à¸”à¹‰ (à¸—à¸¸à¸à¸„à¸¥à¸´à¸à¸¡à¸­à¸‡à¹€à¸«à¹‡à¸™) à¸«à¸£à¸·à¸­à¸ˆà¸°à¹ƒà¸Šà¹‰ Chromium à¸‚à¸­à¸‡ browser-use à¹€à¸­à¸‡à¸à¹‡à¹„à¸”à¹‰
- à¸•à¹ˆà¸­ Browser Use Cloud à¹„à¸”à¹‰à¸œà¹ˆà¸²à¸™ `browser_login` à¸–à¹‰à¸²à¸¡à¸µ key
- à¸¥à¸š venv à¸—à¸´à¹‰à¸‡à¹„à¸”à¹‰à¸•à¸¥à¸­à¸” à¹€à¸£à¸µà¸¢à¸à¸„à¸£à¸±à¹‰à¸‡à¸–à¸±à¸”à¹„à¸›à¸¡à¸±à¸™à¸ˆà¸°à¸•à¸´à¸”à¸•à¸±à¹‰à¸‡à¹ƒà¸«à¸¡à¹ˆà¹€à¸­à¸‡

## License

[MIT](LICENSE) Â© 2026 BornCode
