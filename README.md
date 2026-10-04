# TabOS

A local-first, terminal-style new tab page for Chrome. Everything (notes, tasks, shortcuts, bookmark sync, config) lives in `localStorage` — no accounts, no network tracking, no telemetry. Type a command, get an instant result.

## Features & Highlights

- **Local & Private:** Zero external tracking, zero analytics, local-first storage.
- **Terminal & Neo Themes:** Classic hacker green/cyan prompt (`user@Amon:~$`) or minimal movable dashboard (`neo`).
- **Instant Boot / Animation Control (`/anim`):** Disable boot animation and transition delays for instant 0-second loading when in a hurry.
- **Quick Search Routing:** Instant search queries for Google (`/s`), Bing (`/b`), DuckDuckGo (`/d`), YouTube (`/yt`), GitHub (`/gh`), Stack Overflow (`/so`), NPM (`/npm`), MDN (`/mdn`), Wikipedia (`/w`), Maps (`/maps`), and Amazon (`/amz`).
- **Developer Toolbox:** Built-in utilities for IP lookup (`/ip`), UUID v4 generation (`/uuid`), Base64 encoding/decoding (`/b64`), SHA-256 hashing (`/hash`), JSON validation & formatting (`/json`), URL encoding (`/url`), color conversion (`/color`), math evaluation (`/calc`), Unix timestamps (`/ts`), and Lorem Ipsum generation (`/lorem`).
- **Visual Shortcuts & Chrome Bookmark Sync:** Full GUI manager (`/shortcut`), quick bookmark folder syncing, and command line protection ensuring your active bookmark folder is never accidentally changed from the terminal.
- **Productivity Suite:** Sticky notes with Markdown, recurrence-enabled todo list, 25-minute Pomodoro focus timer, typewriter facts, and procedural Web Audio rain ambience.
- **Offline Arcade Games:** Chicken Defender, Snake, Pacman, and Tetris (lazy-loaded on demand).

## Install

1. Download or clone this repository (or use `/download` to get the Chrome extension `.zip`)
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the project directory
5. Open a new tab (`Ctrl + T` / `Cmd + T`)

## Themes & Layout

| Command | Description |
| :--- | :--- |
| `/config theme terminal` | Dark terminal layout with fixed positions (default) |
| `/config theme neo` | Pastel minimal dashboard layout with draggable, resizable widgets |

### Neo Layout Customization
```bash
/layout edit on      # Unlock widget dragging and resizing (neo theme only)
/layout edit off     # Lock widgets in place
/layout reset        # Reset widget positions to defaults for active theme
```

## Commands & Quick Reference

Commands work with or without the leading `/`. Detailed manual available anytime via `/h` or `/help`.

### 🌐 Quick Search & Web Routing
| Command | Action |
| :--- | :--- |
| `/s <query>` | Google search (or jump to Google if no query) |
| `/b <query>` | Bing search (or jump to Bing if no query) |
| `/d <query>` | DuckDuckGo search (or jump to DuckDuckGo if no query) |
| `/yt <query>` | Search YouTube |
| `/gh <query>` | Search GitHub |
| `/so <query>` | Search Stack Overflow |
| `/npm <query>` | Search NPM packages |
| `/mdn <query>` | Search MDN Web Docs |
| `/w <query>` | Search Wikipedia |
| `/maps <query>` | Search Google Maps |
| `/amz <query>` | Search Amazon |
| `/gpt <prompt>` | Open ChatGPT with prompt |
| `/claude <prompt>` | Open Claude AI with prompt |
| `/rd <sub\|query>` | Open subreddit (`/rd r/webdev`) or search Reddit |

### 🛠️ Developer Tools & Utilities
| Command | Action |
| :--- | :--- |
| `/ip` | Fetch and display public IP address (auto-copied) |
| `/uuid` | Generate cryptographic RFC4122 UUID v4 (auto-copied) |
| `/b64 enc <text>` | Encode string to Base64 (auto-copied) |
| `/b64 dec <string>` | Decode Base64 string to plaintext (auto-copied) |
| `/hash <text>` | Generate SHA-256 cryptographic hash (auto-copied) |
| `/json <string>` | Prettify, format, and validate JSON syntax |
| `/url enc <text>` | URL encode string (auto-copied) |
| `/url dec <text>` | URL decode string (auto-copied) |
| `/color <#hex\|rgb>` | Convert colors between HEX, RGB, HSL with visual preview swatch |
| `/calc <expr>` | Advanced math evaluator (`sqrt(144) + 10^2`, `sin(pi/2)`, `2^8 - 50`) |
| `/ts [timestamp]` | Current Unix timestamp in seconds/ms, or convert given epoch to Local/UTC/ISO |
| `/lorem [count]` | Generate developer placeholder dummy text (auto-copied) |

### ⚡ System & Terminal
| Command | Action |
| :--- | :--- |
| `/h [topic]` / `/help` | Comprehensive manual (`/h dev`, `/h search`, `/h sys`, `/h todo`) |
| `/st [reload]` | Reset to clean startup page (or reload via `/st reload`) |
| `/anim on\|off` | Toggle boot & command animation (instant mode when `off`) |
| `/config` | View configuration summary |
| `/config theme <name>` | Switch theme (`terminal`, `neo`) |
| `/config accent <color>` | Change accent color (preset name or `#hex`) |
| `/config user <name>` | Change prompt username (default: `user`) |
| `/config host <name>` | Change prompt hostname (default: `Amon`) |
| `/config anim on\|off` | Toggle command & startup animation |
| `/clear` | Clear terminal output buffer |
| `/time` | Current system time |
| `/history` | View recent command history |
| `/blur [all\|off]` | Privacy screen blur (hold `Alt` to peek through blur) |
| `/export` | Export all data (notes, tasks, shortcuts, settings) to clipboard |
| `/download` | Download TabOS as a packaged Chrome Extension `.zip` |
| `/reset` | Factory reset all stored data (requires Y/N confirmation) |

### 📁 Shortcuts & Bookmarks
| Command | Action |
| :--- | :--- |
| `/shortcut` | Open the visual Shortcuts & Bookmarks Manager modal |
| `/shortcut list` | List all active links and shortcuts in terminal |
| `/shortcut add <key> <url> [desc]` | Add a custom shortcut |
| `/shortcut delete <key>` | Delete a custom shortcut or disable a built-in |
| `/shortcut restore <key>` | Restore a disabled built-in shortcut |
| `/shortcut sync` | Re-sync bookmarks from active folder |
| `/folder` | View active bookmark folder info (read-only; protected against accidental terminal switches) |

### 📋 Tasks (Todo) & Productivity
```bash
/todo add finish deployment ! due:28-10-2026 recur:weekly 40%
```
- `!` : High priority flag
- `due:DD-MM-YYYY` : Due date (also accepts `due:today`, `due:tomorrow`); shows clickable markers on the calendar widget
- `recur:daily|weekly|monthly` : Automatically recreates task upon completion
- `NN%` : Initial progress percentage
- Subcommands: `/todo list`, `/todo done <id>`, `/todo delete <id>`, `/todo move <from> <to>`, `/todo clear-done`
- `/pomodoro start [minutes]`, `/pomodoro pause`, `/pomodoro stop`, `/pomodoro status`

### 📝 Sticky Notes
- Open note editor with `/cat` or click `+` on the notes panel
- Type `/cat your note content` to create a note directly from the terminal
- Full Markdown support: `**bold**`, `*italic*`, `` `code` ``, checklists (`- [ ]`), blockquotes, tables, links, code blocks
- Keyboard shortcuts: `Ctrl+B` bold, `Ctrl+I` italic, `Ctrl+K` link, `` Ctrl+` `` inline code

### 🌧️ Rain Ambience
- `/rain on|off|toggle` — Toggle rain canvas
- `/rain preset mist|calm|storm` — Ambient presets
- `/rain intensity <0-100>` — Drop density
- `/rain sound on|off` — Procedural Web Audio synthesizer (no external audio files required)
- `/rain thunder on|off` — Procedural lightning flashes and thunder claps

### 🎮 Arcade Games
Type `/game <name> [difficulty]` to launch in the terminal (lazy-loaded on demand):
- `chicken` — Chicken Defender (space shooter with 3 waves + boss)
- `snake` — Classic Snake game
- `pacman` — Retro Pacman with ghosts and pellets
- `tetris` — Full Tetris with line clears and scoring
- Press `ESC` at any time to return to the terminal. High scores are saved locally.

## Architecture & Codebase

TabOS is built with vanilla modern TypeScript/JavaScript without heavyweight frameworks, ensuring lightning-fast load times.

| File | Purpose |
| :--- | :--- |
| `manifest.json` | Chrome MV3 extension manifest, newtab override, CSP |
| `index.html` | Semantic DOM structure and widget layouts |
| `storage.js` | LocalStorage schema, migration, validation, and defaults |
| `core.js` | Output rendering, calendar, clock, uptime, safe arithmetic, URL routing |
| `config.js` | User identity (`user@Amon`), accent colors, themes, animation states |
| `commands.js` | Command router, developer utilities, search routes, rich `/h` manual, autocomplete |
| `shortcuts.js` | Visual Shortcuts & Chrome Bookmarks integration modal, folder syncing |
| `layout.js` | Drag-and-drop & resize engine for `neo` theme widgets |
| `todo.js` | Task management, recurrence engine, Pomodoro timer |
| `notes.js` | Sticky notes manager, live Markdown renderer, sanitizer |
| `rain.js` | Canvas rain/lightning particle system & Web Audio sound generator |
| `facts.js` | Adaptable typewriter facts bar |
| `game.js` | Lazy-loaded arcade game engine |
| `script.js` | Application bootstrapper, instant mode loader, input & autocomplete UI |
| `style.css` | Complete stylesheet, themes, animations, and instant-mode overrides |

## Security & Privacy

- All user-generated strings, note Markdown, and terminal outputs are strictly sanitized and escaped before DOM insertion.
- URL schemes are restricted strictly to `http://` and `https://` to prevent `javascript:` injection.
- Chrome extension manifest defines a strict `Content-Security-Policy` (`script-src 'self'`).
- Zero remote servers, zero external cookies, zero analytics.
