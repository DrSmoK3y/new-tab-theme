(function () {
  const root = window.TabOS;
  const { dom, state } = root.core;

  function positionAutocomplete() {
    const popup = dom.autocomplete;
    if (!popup || !dom.cmdInput) return;

    if (popup.parentElement !== document.body) {
      document.body.appendChild(popup);
    }

    const inputLine = document.querySelector('.input-line');
    const anchor = inputLine || dom.cmdInput;
    const rect = anchor.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;

    popup.style.position = 'fixed';
    popup.style.zIndex = '99999';

    const width = Math.max(340, Math.min(rect.width, window.innerWidth - 32));
    let left = rect.left;
    if (left + width > window.innerWidth - 16) {
      left = window.innerWidth - width - 16;
    }
    if (left < 16) left = 16;

    popup.style.left = `${Math.round(left)}px`;
    popup.style.width = `${Math.round(width)}px`;

    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;

    // Prefer opening directly under the terminal input line
    if (spaceBelow >= 180 || spaceBelow >= spaceAbove) {
      popup.style.top = `${Math.round(rect.bottom + 6)}px`;
      popup.style.bottom = 'auto';
      popup.style.maxHeight = `${Math.min(260, Math.max(120, spaceBelow - 20))}px`;
    } else {
      popup.style.bottom = `${Math.round(window.innerHeight - rect.top + 6)}px`;
      popup.style.top = 'auto';
      popup.style.maxHeight = `${Math.min(260, Math.max(120, spaceAbove - 20))}px`;
    }
  }

  function selectItem(item) {
    const key = item.dataset.key;
    hideAutocomplete();

    const insert = key.replace(/\s*(<[^>]+>|\[[^\]]+\]).*$/, '');
    const withSlash = insert.startsWith('/') ? insert : `/${insert}`;
    dom.cmdInput.value = `${withSlash}${withSlash.endsWith(' ') ? '' : ' '}`;
    dom.cmdInput.focus();
  }

  function showAutocomplete(items) {
    state.activeCompletion = 0;
    dom.autocomplete.innerHTML = items.map(([key, value], i) => {
      const badgeClass = value.type === 'folder' ? 'ac-folder' :
        value.type === 'bookmark' ? 'ac-bm' :
        value.type === 'custom' ? 'ac-custom' : 'ac-cmd';
      const badgeText = value.type === 'folder' ? '📁 Folder' :
        value.type === 'bookmark' ? '★ Link' :
        value.type === 'custom' ? '⚡ Custom' : '⌘ Cmd';
      const displayKey = key.startsWith('/') ? key : `/${key}`;

      return `<div class="ac-item ${i === 0 ? 'active' : ''}" data-key="${root.utils.escapeHtml(key)}" data-type="${value.type || ''}" data-folder-id="${root.utils.escapeHtml(value.folderId || '')}" data-folder-title="${root.utils.escapeHtml(value.folderTitle || '')}">
        <div class="ac-item-left">
          <span class="ac-badge ${badgeClass}">${badgeText}</span>
          <span class="ac-key">${root.utils.escapeHtml(displayKey)}</span>
        </div>
        <span class="ac-desc" title="${root.utils.escapeHtml(value.url || value.desc)}">${root.utils.escapeHtml(value.desc)}</span>
      </div>`;
    }).join('');

    positionAutocomplete();
    dom.autocomplete.classList.add('show');

    dom.autocomplete.querySelectorAll('.ac-item').forEach(item => {
      item.addEventListener('click', () => {
        selectItem(item);
      });
    });
  }

  function hideAutocomplete() {
    dom.autocomplete.classList.remove('show');
    state.activeCompletion = -1;
  }

  function moveAutocomplete(dir) {
    const items = dom.autocomplete.querySelectorAll('.ac-item');
    if (!items.length) return;
    items[Math.max(state.activeCompletion, 0)].classList.remove('active');
    state.activeCompletion = (state.activeCompletion + dir + items.length) % items.length;
    const next = items[state.activeCompletion];
    next.classList.add('active');
    if (typeof next.scrollIntoView === 'function') {
      next.scrollIntoView({ block: 'nearest' });
    }
  }

  function acceptAutocomplete() {
    const items = dom.autocomplete.querySelectorAll('.ac-item');
    if (!items.length) return;
    const activeItem = items[Math.max(state.activeCompletion, 0)];
    selectItem(activeItem);
  }

  function bindInput() {
    dom.cmdInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        hideAutocomplete();
        root.commands.handle(dom.cmdInput.value);
        dom.cmdInput.value = '';
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (dom.autocomplete.classList.contains('show')) return moveAutocomplete(-1);
        if (state.historyIndex < state.history.length - 1) {
          state.historyIndex++;
          dom.cmdInput.value = state.history[state.historyIndex];
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (dom.autocomplete.classList.contains('show')) return moveAutocomplete(1);
        if (state.historyIndex > 0) {
          state.historyIndex--;
          dom.cmdInput.value = state.history[state.historyIndex];
        } else {
          state.historyIndex = -1;
          dom.cmdInput.value = '';
        }
      } else if (e.key === 'Tab') {
        e.preventDefault();
        acceptAutocomplete();
      } else if (e.key === 'Escape') {
        hideAutocomplete();
      }
    });

    dom.cmdInput.addEventListener('input', () => {
      const value = dom.cmdInput.value;
      if (value.startsWith('/')) {
        const matches = root.commands.completions(value.slice(1));
        if (matches.length) showAutocomplete(matches);
        else hideAutocomplete();
      } else if (value.trim().length > 0) {
        const matches = root.commands.completions(value.trim());
        if (matches.length) showAutocomplete(matches);
        else hideAutocomplete();
      } else {
        hideAutocomplete();
      }
    });

    window.addEventListener('resize', () => {
      if (dom.autocomplete.classList.contains('show')) positionAutocomplete();
    });
    const termBody = document.getElementById('terminalBody');
    if (termBody) {
      termBody.addEventListener('scroll', () => {
        if (dom.autocomplete.classList.contains('show')) positionAutocomplete();
      });
    }

    document.addEventListener('keydown', e => {
      const noteEditor = document.getElementById('noteEditor');
      const todoInput = document.getElementById('todoInput');
      if (e.target === noteEditor || e.target === todoInput) return;
      if (!e.ctrlKey && !e.altKey && !e.metaKey && e.key.length === 1) dom.cmdInput.focus();
    });

    // Tap-outside-to-close autocomplete (mobile + desktop)
    document.addEventListener('pointerdown', e => {
      if (!dom.autocomplete.contains(e.target) && e.target !== dom.cmdInput) {
        hideAutocomplete();
      }
    });
  }

  function boot() {
    root.core.init();
    root.config.init();
    root.layout.init();
    root.facts.init();
    root.rain.init();
    root.notes.init();
    root.todo.init();
    root.commands.init();
    bindInput();

    const config = root.config.get();
    if (config.startupAnim !== false) {
      runStartupAnimation();
    } else {
      document.body.classList.add('no-anim');
      const promptEl = document.querySelector('.prompt');
      if (promptEl) {
        promptEl.style.visibility = 'visible';
        promptEl.classList.remove('prompt-typing');
      }
      root.core.appendOutput(`welcome back, ${root.utils.escapeHtml(config.user)}. type /h or ? for commands.`, 'success');
      if (root.core.dom.cmdInput) root.core.dom.cmdInput.focus();
    }
  }

  function runStartupAnimation() {
    const termWindow = document.querySelector('.terminal-window');
    const output = root.core.dom.output;
    const promptEl = document.querySelector('.prompt');
    if (termWindow) termWindow.classList.add('startup-flicker');

    // Hide prompt during boot, show with typing effect after
    if (promptEl) promptEl.style.visibility = 'hidden';

    let skipped = false;
    const timers = [];

    function finishBoot() {
      if (skipped) return;
      skipped = true;
      timers.forEach(t => clearTimeout(t));
      output.innerHTML = '';
      if (termWindow) termWindow.classList.remove('startup-flicker');
      root.core.appendOutput(`welcome back, ${root.utils.escapeHtml(root.config.get().user)}. type /help or ? for commands.`, 'success');
      // Typing effect for prompt
      if (promptEl) {
        promptEl.style.visibility = 'visible';
        promptEl.classList.add('prompt-typing');
        setTimeout(() => promptEl.classList.remove('prompt-typing'), 800);
      }
    }

    // Skip on first keypress
    document.addEventListener('keydown', finishBoot, { once: true });

    const bootLines = [
      { text: 'BIOS v3.7.1 ................... OK', delay: 80 },
      { text: 'Memory check .................. 640K OK', delay: 180 },
      { text: 'Loading kernel modules ........ done', delay: 300 },
      { text: 'Mounting /dev/brain ........... OK', delay: 420 },
      { text: 'Initializing display server ... OK', delay: 520 },
    ];

    bootLines.forEach(({ text, delay }) => {
      timers.push(setTimeout(() => {
        if (skipped) return;
        root.core.appendOutput(root.utils.escapeHtml(text), 'boot-line');
      }, delay));
    });

    const barDelay = 650;
    const barSteps = 20;
    const barInterval = 40;
    timers.push(setTimeout(() => {
      if (skipped) return;
      const barEl = document.createElement('div');
      barEl.className = 'out-line boot-bar';
      output.appendChild(barEl);
      let step = 0;
      const barTimer = setInterval(() => {
        if (skipped) { clearInterval(barTimer); return; }
        step++;
        const filled = '█'.repeat(step);
        const empty = '░'.repeat(barSteps - step);
        const pct = Math.round((step / barSteps) * 100);
        barEl.textContent = `[${filled}${empty}] ${pct}%`;
        if (step >= barSteps) {
          clearInterval(barTimer);
          timers.push(setTimeout(() => {
            if (skipped) return;
            root.core.appendOutput('Starting terminal service ... ready', 'boot-line');
            timers.push(setTimeout(finishBoot, 400));
          }, 100));
        }
      }, barInterval);
    }, barDelay));
  }

  boot();
})();
