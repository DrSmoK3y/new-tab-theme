import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import JSZip from 'jszip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Pristine original extension index.html
const ORIGINAL_EXTENSION_INDEX_HTML = `<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Tab</title>
  <link rel="icon" type="image/x-icon" href="icons/ter.png">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&family=Press+Start+2P&display=swap"
    rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>

<body class="theme-terminal">
  <div class="scanlines"></div>
  <canvas id="rainCanvas" class="rain-bg"></canvas>

  <div class="top-bar">
    <div class="top-left">
      <span class="distro-icon">▸</span>
      <span id="uptime" class="uptime"></span>
      <button id="shortcutsBtn" class="shortcuts-btn" type="button" title="Manage shortcuts & Chrome bookmark folder">
        <span class="dl-symbol">⚡</span> Shortcuts & Bookmarks
      </button>
    </div>
    <div class="top-right">
      <div id="clock" class="clock"></div>
    </div>
  </div>

  <div class="analog-clock" id="analogClock" aria-label="Analog clock">
    <div class="analog-face">
      <span class="analog-mark mark-12">12</span>
      <span class="analog-mark mark-3">3</span>
      <span class="analog-mark mark-6">6</span>
      <span class="analog-mark mark-9">9</span>
      <span class="analog-hand hour" id="analogHour"></span>
      <span class="analog-hand minute" id="analogMinute"></span>
      <span class="analog-hand second" id="analogSecond"></span>
      <span class="analog-pin"></span>
    </div>
  </div>

  <div class="terminal-container">
    <div class="terminal-window">
      <div class="terminal-titlebar">
        <div class="terminal-dots">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
        </div>
        <span class="terminal-title" id="terminalTitle"></span>
        <div class="terminal-titlebar-spacer"></div>
      </div>
      <div class="terminal-body" id="terminalBody">
        <div id="output" class="output"></div>
        <div class="input-line">
          <span class="prompt"><span class="user" id="promptUser">user</span><span class="at">@</span><span class="host"
              id="promptHost">Amon</span><span class="colon">:</span><span class="path">~</span><span
              class="dollar">$</span></span>
          <input type="text" id="cmdInput" class="cmd-input" autofocus autocomplete="off" spellcheck="false">
        </div>
      </div>
    </div>
  </div>

  <div id="autocomplete" class="autocomplete-popup"></div>

  <div class="calendar-panel" id="calendarPanel">
    <div class="cal-header">
      <span class="cal-title" id="calTitle"></span>
    </div>
    <div class="cal-grid">
      <div class="cal-day-header">Mo</div>
      <div class="cal-day-header">Tu</div>
      <div class="cal-day-header">We</div>
      <div class="cal-day-header">Th</div>
      <div class="cal-day-header">Fr</div>
      <div class="cal-day-header">Sa</div>
      <div class="cal-day-header">Su</div>
    </div>
    <div class="cal-grid" id="calDays"></div>
  </div>

  <div class="todo-panel" id="todoPanel">
    <div class="todo-header">
      <span class="todo-title">[ tasks ]</span>
      <button class="todo-add-btn" id="addTodoBtn" title="Add task" type="button">+</button>
    </div>
    <div class="todo-filters">
      <button class="todo-filter active" data-filter="all" type="button">all</button>
      <button class="todo-filter" data-filter="high" type="button">high</button>
      <button class="todo-filter" data-filter="low" type="button">low</button>
    </div>
    <div class="todo-input-row" id="todoInputRow" style="display:none;">
      <input type="text" id="todoInput" class="todo-input"
        placeholder="task... ! high due:DD-MM-YYYY recur:weekly 50%" autocomplete="off" spellcheck="false">
    </div>
    <div id="todoList" class="todo-list"></div>
    <div class="todo-completed-toggle" id="completedToggle" style="display:none;">
      <span id="completedToggleBtn">> completed (<span id="completedCount">0</span>)</span>
    </div>
    <div id="completedList" class="todo-list completed-list" style="display:none;"></div>
  </div>

  <div class="pomodoro-standalone" id="pomodoroPanel">
    <span id="pomodoroLabel">focus 25:00</span>
    <div class="pomodoro-actions">
      <button id="pomodoroStartBtn" type="button">start</button>
      <button id="pomodoroStopBtn" type="button">stop</button>
    </div>
  </div>

  <div class="sticky-panel" id="stickyPanel">
    <div class="sticky-header">
      <span class="sticky-title" id="stickyTitle">[ notes.md ]  [ 0 ]</span>
      <div class="sticky-actions">
        <button class="sticky-btn" id="addNoteBtn" title="Add note" type="button">+</button>
      </div>
    </div>
    <div id="notesContainer" class="notes-container"></div>
  </div>

  <div class="modal-overlay" id="noteModal">
    <div class="modal">
      <div class="modal-header">
        <span>Edit Note</span>
        <div class="modal-header-actions">
          <button class="modal-toggle-preview" id="togglePreview" type="button" title="Toggle preview">preview</button>
          <button class="modal-close" id="modalClose" type="button">x</button>
        </div>
      </div>
      <div class="modal-body">
        <textarea id="noteEditor" class="note-editor"></textarea>
        <div id="notePreview" class="note-preview" style="display:none;"></div>
      </div>
      <div class="modal-footer">
        <button class="modal-btn delete" id="deleteNoteBtn" type="button">Delete</button>
        <button class="modal-btn save" id="saveNoteBtn" type="button">Save</button>
      </div>
    </div>
  </div>

  <div class="modal-overlay" id="shortcutsModal">
    <div class="modal shortcuts-modal">
      <div class="modal-header">
        <span class="modal-title">[ ⚡ Shortcuts & Bookmarks Manager ]</span>
        <button class="modal-close" id="shortcutsModalClose" type="button">x</button>
      </div>
      <div class="modal-body shortcuts-modal-body">
        
        <!-- SECTION 1: ADD MANUAL SHORTCUT -->
        <div class="sm-section">
          <div class="sm-section-title">▸ Add Custom Shortcut Manually</div>
          <div class="sm-form-grid">
            <div class="sm-field">
              <label for="scNameInput">Keyword / Command</label>
              <input type="text" id="scNameInput" class="sm-input" placeholder="e.g. docs, fb, work" autocomplete="off" spellcheck="false">
            </div>
            <div class="sm-field">
              <label for="scUrlInput">Target Website URL</label>
              <input type="text" id="scUrlInput" class="sm-input" placeholder="https://example.com" autocomplete="off" spellcheck="false">
            </div>
            <div class="sm-field sm-field-full">
              <label for="scDescInput">Title / Description</label>
              <div class="sm-input-action-row">
                <input type="text" id="scDescInput" class="sm-input" placeholder="e.g. Work Dashboard" autocomplete="off" spellcheck="false">
                <button type="button" class="modal-btn save" id="addShortcutBtn">+ Save Shortcut</button>
              </div>
            </div>
          </div>
        </div>

        <!-- SECTION 2: CHROME BOOKMARKS FOLDER SYNC -->
        <div class="sm-section">
          <div class="sm-section-title">▸ Sync Specific Bookmark Folder</div>
          <p class="sm-hint">Pick any folder from your browser bookmarks to sync its links into TabOS shortcuts & quick-links:</p>
          <div class="sm-bookmark-row">
            <select id="scBookmarkFolderSelect" class="sm-select">
              <option value="">-- Choose Bookmark Folder --</option>
            </select>
            <button type="button" class="modal-btn" id="syncBookmarksBtn">🔄 Sync Folder</button>
          </div>
          <div id="scBookmarkStatus" class="sm-status-text"></div>
        </div>

        <!-- SECTION 3: ACTIVE SHORTCUTS LIST -->
        <div class="sm-section sm-list-section">
          <div class="sm-section-header">
            <span class="sm-section-title">▸ Active Shortcuts (<span id="scCount">0</span>)</span>
            <input type="text" id="scSearchInput" class="sm-search-input" placeholder="filter shortcuts..." autocomplete="off">
          </div>
          <div id="scListContainer" class="sm-list-container"></div>
        </div>

      </div>
      <div class="modal-footer">
        <span class="sm-footer-hint">Tip: Type <code>/&lt;keyword&gt;</code> in terminal to open any shortcut instantly</span>
        <button class="modal-btn" id="shortcutsModalDone" type="button">Close</button>
      </div>
    </div>
  </div>

  <div id="quickLinksBar" class="quick-links-bar"></div>

  <div class="fact-bar" id="factBar">
    <span class="fact-icon">></span>
    <span id="factText" class="fact-text">loading...</span>
  </div>

  <div id="gameOverlay" class="game-overlay" style="display:none;">
    <canvas id="gameCanvas"></canvas>
    <div id="gameHud" class="game-hud">
      <span id="gameScore">SCORE: 0</span>
      <span id="gameLevel">WAVE: 1</span>
      <span class="game-esc">ESC to quit</span>
    </div>
    <div class="game-health-bar" id="healthBar">
      <span>CHICKEN HP</span>
      <div class="game-health-bar-inner">
        <div class="game-health-bar-fill" id="healthFill"></div>
      </div>
    </div>
    <div class="game-boss-bar" id="bossBar">
      <span>BOSS HP</span>
      <div class="game-boss-bar-inner">
        <div class="game-boss-bar-fill" id="bossFill"></div>
      </div>
    </div>
    <div id="gameStartScreen" class="game-start-screen">
      <pre class="game-title">
   ____ _   _ ___ ____ _  _______ _   _
  / ___| | | |_ _/ ___| |/ / ____| \ | |
 | |   | |_| || | |   | ' /|  _| |  \| |
 | |___|  _  || | |___| . \| |___| |\  |
  \____|_| |_|___\____|_|\_\_____|_| \_|
      </pre>
      <div class="game-subtitle" id="gameSubtitle">DEFENDER</div>
      <div class="game-controls" id="gameControlsLine1">WASD / arrows move, SPACE / right-click shoot</div>
      <div class="game-controls" id="gameControlsLine2">3 waves plus boss</div>
      <div class="game-press">press SPACE to start</div>
    </div>
    <div id="gameOverScreen" class="game-over-screen" style="display:none;">
      <div class="game-over-title">GAME OVER</div>
      <div class="game-over-score" id="finalScore">SCORE: 0</div>
      <div id="gameLeaderboard" class="game-leaderboard"></div>
      <div class="game-press">press SPACE to restart, ESC to quit</div>
    </div>
    <div id="gameWinScreen" class="game-win-screen" style="display:none;">
      <div class="game-win-title">YOU WIN</div>
      <div class="game-over-score" id="winScore">SCORE: 0</div>
      <div id="winLeaderboard" class="game-leaderboard"></div>
      <div class="game-press">press SPACE to play again, ESC to quit</div>
    </div>
  </div>

  <script src="storage.js"></script>
  <script src="core.js"></script>
  <script src="config.js"></script>
  <script src="layout.js"></script>
  <script src="facts.js"></script>
  <script src="rain.js"></script>
  <script src="notes.js"></script>
  <script src="todo.js"></script>
  <script src="commands.js"></script>
  <script src="shortcuts.js"></script>
  <script src="script.js"></script>
</body>

</html>
`;

async function createExtensionZip() {
  const zip = new JSZip();

  // 1. manifest.json
  const manifestPath = join(__dirname, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    zip.file('manifest.json', fs.readFileSync(manifestPath));
  }

  // 2. index.html (exact original version)
  zip.file('index.html', ORIGINAL_EXTENSION_INDEX_HTML);

  // 3. icons folder
  const iconsPath = join(__dirname, 'icons');
  if (fs.existsSync(iconsPath)) {
    const files = fs.readdirSync(iconsPath);
    for (const f of files) {
      const filePath = join(iconsPath, f);
      if (fs.statSync(filePath).isFile()) {
        zip.file(`icons/${f}`, fs.readFileSync(filePath));
      }
    }
  }

  // 4. All extension source files
  const rootFiles = [
    'style.css',
    'storage.js',
    'core.js',
    'config.js',
    'layout.js',
    'facts.js',
    'rain.js',
    'notes.js',
    'todo.js',
    'commands.js',
    'shortcuts.js',
    'script.js',
    'game.js',
    'README.md',
  ];

  for (const f of rootFiles) {
    const filePath = join(__dirname, f);
    if (fs.existsSync(filePath)) {
      zip.file(f, fs.readFileSync(filePath));
    }
  }

  // 5. Documentation folder
  const docsPath = join(__dirname, 'docs');
  if (fs.existsSync(docsPath)) {
    const files = fs.readdirSync(docsPath);
    for (const f of files) {
      const filePath = join(docsPath, f);
      if (fs.statSync(filePath).isFile()) {
        zip.file(`docs/${f}`, fs.readFileSync(filePath));
      }
    }
  }

  return await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
    platform: 'UNIX',
  });
}

// Endpoint to download the original Chrome Extension as a ZIP file
app.get('/api/download-extension', async (req, res) => {
  try {
    const zipBuffer = await createExtensionZip();
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="tabos-chrome-extension.zip"');
    res.setHeader('Content-Length', zipBuffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.end(zipBuffer);
  } catch (error) {
    console.error('Failed to create extension zip:', error);
    res.status(500).send('Failed to package extension');
  }
});

// Serve static assets from the root directory
app.use(express.static(__dirname));

// Fallback to index.html for any unhandled GET routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`TabOS server running at http://${HOST}:${PORT}`);
});
