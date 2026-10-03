(function () {
  const root = window.TabOS = window.TabOS || {};
  const storage = root.storage;
  const { escapeHtml, tryMath } = root.utils;
  const core = root.core;

  function isTerminalTheme() {
    return !root.config || !root.config.get || root.config.get().layoutTheme === 'terminal';
  }

  const HEAVY_COMMANDS = ['game', 'todo', 'pomodoro', 'reset'];

  const BUILTIN_SHORTCUTS = {
    yt: { url: 'https://youtube.com', desc: 'YouTube' },
    youtube: { url: 'https://youtube.com', desc: 'YouTube' },
    gpt: { url: 'https://chatgpt.com', desc: 'ChatGPT' },
    chatgpt: { url: 'https://chatgpt.com', desc: 'ChatGPT' },
    claude: { url: 'https://claude.ai', desc: 'Claude AI' },
    gemini: { url: 'https://gemini.google.com', desc: 'Google Gemini' },
    b: { url: 'https://bing.com', desc: 'Bing' },
    bing: { url: 'https://bing.com', desc: 'Bing' },
    d: { url: 'https://duckduckgo.com', desc: 'DuckDuckGo' },
    ddg: { url: 'https://duckduckgo.com', desc: 'DuckDuckGo' },
    github: { url: 'https://github.com', desc: 'GitHub' },
    gh: { url: 'https://github.com', desc: 'GitHub' },
    so: { url: 'https://stackoverflow.com', desc: 'Stack Overflow' },
    npm: { url: 'https://npmjs.com', desc: 'NPM' },
    mdn: { url: 'https://developer.mozilla.org', desc: 'MDN Web Docs' },
    w: { url: 'https://wikipedia.org', desc: 'Wikipedia' },
    wiki: { url: 'https://wikipedia.org', desc: 'Wikipedia' },
    gitam: { url: 'https://login.gitam.edu', desc: 'GITAM Login' },
    mail: { url: 'https://mail.google.com', desc: 'Gmail' },
    gmail: { url: 'https://mail.google.com', desc: 'Gmail' },
    duo: { url: 'https://www.duolingo.com', desc: 'Duolingo' },
    duolingo: { url: 'https://www.duolingo.com', desc: 'Duolingo' },
    lc: { url: 'https://leetcode.com', desc: 'LeetCode' },
    leetcode: { url: 'https://leetcode.com', desc: 'LeetCode' },
    reddit: { url: 'https://reddit.com', desc: 'Reddit' },
    twitter: { url: 'https://twitter.com', desc: 'Twitter / X' },
    x: { url: 'https://twitter.com', desc: 'Twitter / X' },
    drive: { url: 'https://drive.google.com', desc: 'Google Drive' },
    maps: { url: 'https://maps.google.com', desc: 'Google Maps' },
    amz: { url: 'https://amazon.com', desc: 'Amazon' },
    notion: { url: 'https://notion.so', desc: 'Notion' },
  };

  let userShortcuts = storage.getJson(storage.keys.userShortcuts, {});
  let disabledShortcuts = storage.getJson(storage.keys.disabledShortcuts, []);
  let bookmarkShortcuts = storage.getJson(storage.keys.bookmarkShortcuts, {});

  const catalog = [
    ['h', 'commands manual'],
    ['help', 'commands manual'],
    ['s <query>', 'Google search'],
    ['b <query>', 'Bing search'],
    ['d <query>', 'DuckDuckGo search'],
    ['st', 'clean startup page'],
    ['anim on|off', 'toggle command & startup animation'],
    ['ip', 'show public IP address'],
    ['uuid', 'generate UUID v4'],
    ['b64 enc <text>', 'Base64 encode'],
    ['b64 dec <string>', 'Base64 decode'],
    ['hash <text>', 'SHA-256 hash generator'],
    ['json <string>', 'JSON prettifier & validator'],
    ['url enc <text>', 'URL encode'],
    ['url dec <string>', 'URL decode'],
    ['color <#hex>', 'color converter & swatch'],
    ['calc <expr>', 'calculate math expression'],
    ['ts [epoch]', 'Unix timestamp converter'],
    ['lorem [count]', 'generate placeholder dummy text'],
    ['yt <query>', 'YouTube'],
    ['gh <query>', 'GitHub search'],
    ['so <query>', 'Stack Overflow search'],
    ['npm <query>', 'NPM package search'],
    ['mdn <query>', 'MDN Web Docs search'],
    ['w <query>', 'Wikipedia search'],
    ['maps <query>', 'Google Maps search'],
    ['amz <query>', 'Amazon search'],
    ['gpt <prompt>', 'ChatGPT'],
    ['claude <prompt>', 'Claude AI'],
    ['rd <sub|query>', 'Reddit'],
    ['clear', 'clear screen'],
    ['time', 'current time'],
    ['history', 'recent commands'],
    ['config', 'settings'],
    ['config enable <widget>', 'show widget'],
    ['config disable <widget>', 'hide widget'],
    ['config accent <color>', 'accent color'],
    ['config theme <name>', 'switch theme'],
    ['widget list', 'widgets'],
    ['widget toggle <name>', 'toggle widget'],
    ['shortcut', 'open shortcuts manager'],
    ['shortcut list', 'shortcuts'],
    ['shortcut add <name> <url>', 'add shortcut'],
    ['shortcut sync', 'sync bookmark folder'],
    ['folder', 'view active bookmark folder'],
    ['rain on|off', 'rain'],
    ['rain preset mist|calm|storm', 'preset'],
    ['fact', 'next fact'],
    ['todo list', 'tasks'],
    ['todo add <task>', 'add task'],
    ['game chicken|snake|pacman|tetris', 'play'],
    ['cat [text]', 'create note'],
    ['download', 'download extension zip'],
    ['export', 'backup data'],
    ['blur', 'privacy'],
    ['layout reset', 'reset layout'],
    ['pomodoro start|pause|stop', 'focus timer'],
    ['reset', 'reset all data'],
  ];

  function allShortcuts() {
    const builtins = {};
    Object.entries(BUILTIN_SHORTCUTS).forEach(([key, value]) => {
      if (!disabledShortcuts.includes(key)) builtins[key] = { ...value, type: 'builtin' };
    });
    const bookmarks = {};
    Object.entries(bookmarkShortcuts).forEach(([key, value]) => {
      bookmarks[key] = { ...value, type: 'bookmark' };
    });
    const users = {};
    Object.entries(userShortcuts).forEach(([key, value]) => {
      users[key] = { ...value, type: 'custom' };
    });
    return { ...builtins, ...bookmarks, ...users };
  }

  function saveShortcuts() {
    storage.setJson(storage.keys.userShortcuts, userShortcuts);
    storage.setJson(storage.keys.disabledShortcuts, disabledShortcuts);
    storage.setJson(storage.keys.bookmarkShortcuts, bookmarkShortcuts);
  }

  function addShortcut(name, url, desc) {
    const cleanName = String(name || '').toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (!cleanName || !url) return false;
    const finalUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    userShortcuts[cleanName] = { url: finalUrl, desc: desc || cleanName, type: 'custom' };
    disabledShortcuts = disabledShortcuts.filter(k => k !== cleanName);
    saveShortcuts();
    if (root.config && root.config.apply) root.config.apply();
    if (root.shortcutsUI && root.shortcutsUI.render) root.shortcutsUI.render();
    return true;
  }

  function deleteShortcut(name) {
    if (userShortcuts[name]) {
      delete userShortcuts[name];
      saveShortcuts();
      if (root.config && root.config.apply) root.config.apply();
      if (root.shortcutsUI && root.shortcutsUI.render) root.shortcutsUI.render();
      return true;
    }
    if (bookmarkShortcuts[name]) {
      delete bookmarkShortcuts[name];
      saveShortcuts();
      if (root.config && root.config.apply) root.config.apply();
      if (root.shortcutsUI && root.shortcutsUI.render) root.shortcutsUI.render();
      return true;
    }
    if (BUILTIN_SHORTCUTS[name]) {
      if (!disabledShortcuts.includes(name)) disabledShortcuts.push(name);
      saveShortcuts();
      if (root.config && root.config.apply) root.config.apply();
      if (root.shortcutsUI && root.shortcutsUI.render) root.shortcutsUI.render();
      return true;
    }
    return false;
  }

  function restoreShortcut(name) {
    disabledShortcuts = disabledShortcuts.filter(k => k !== name);
    saveShortcuts();
    if (root.config && root.config.apply) root.config.apply();
    if (root.shortcutsUI && root.shortcutsUI.render) root.shortcutsUI.render();
    return true;
  }

  function setBookmarkShortcuts(newMap) {
    bookmarkShortcuts = { ...newMap };
    saveShortcuts();
    if (root.config && root.config.apply) root.config.apply();
    if (root.shortcutsUI && root.shortcutsUI.render) root.shortcutsUI.render();
  }

  function listShortcuts() {
    const all = allShortcuts();
    const entries = Object.entries(all);
    if (!entries.length) return core.appendOutput('no shortcuts.', 'info');
    const lines = entries.map(([k, v]) => `/${k}  [${v.type || 'link'}]  ->  ${v.desc}`).join('\n');
    core.appendOutput(`<pre>${escapeHtml(lines)}</pre>`, 'info');
    if (disabledShortcuts.length) core.appendOutput(`${disabledShortcuts.length} built-in disabled.`, 'info');
  }

  function handleShortcut(words, original) {
    const sub = words[1];
    const originalParts = original.split(/\s+/).filter(Boolean);
    if (!sub || sub === 'gui' || sub === 'manager' || sub === 'open') {
      if (root.shortcutsUI && root.shortcutsUI.open) {
        root.shortcutsUI.open();
        core.appendOutput('opened shortcuts manager.', 'info');
      } else {
        listShortcuts();
      }
      return;
    }
    if (sub === 'list' || sub === 'ls') {
      listShortcuts();
      core.appendOutput('usage: /shortcut add <name> <url> [desc], /shortcut delete <name>', 'info');
      return;
    }
    if (sub === 'add' || sub === 'set') {
      const name = originalParts[2] ? originalParts[2].toLowerCase().replace(/[^a-z0-9_-]/g, '') : '';
      const url = originalParts[3] || '';
      if (!name || !url) return core.appendOutput('usage: /shortcut add <name> <url> [desc]', 'error');
      const descIndex = original.indexOf(url) + url.length;
      const desc = original.slice(descIndex).trim() || name;
      addShortcut(name, url, desc);
      core.appendOutput(`shortcut /${escapeHtml(name)} -> ${escapeHtml(url)}`, 'success');
      return;
    }
    if (sub === 'sync') {
      if (root.shortcutsUI && root.shortcutsUI.syncCurrentFolder) {
        root.shortcutsUI.syncCurrentFolder();
        core.appendOutput('syncing bookmark folder...', 'info');
      } else {
        core.appendOutput('bookmark sync ready. open manager with /shortcut', 'info');
      }
      return;
    }
    if (sub === 'delete' || sub === 'remove' || sub === 'rm' || sub === 'del') {
      const name = words[2];
      if (!name) return core.appendOutput('usage: /shortcut delete <name>', 'error');
      if (deleteShortcut(name)) {
        core.appendOutput(`removed/disabled shortcut /${escapeHtml(name)}`, 'success');
      } else {
        core.appendOutput(`shortcut not found: ${escapeHtml(name)}`, 'error');
      }
      return;
    }
    if (sub === 'restore') {
      const name = words[2];
      restoreShortcut(name);
      core.appendOutput(`restored /${escapeHtml(name)}`, 'success');
      return;
    }
    core.appendOutput('usage: /shortcut [gui] | list | add <name> <url> [desc] | delete <name> | sync', 'error');
  }

  function handleFolder() {
    const folders = (root.shortcutsUI && root.shortcutsUI.getFolders) ? root.shortcutsUI.getFolders() : [];
    const current = (root.shortcutsUI && root.shortcutsUI.getCurrentFolder) ? root.shortcutsUI.getCurrentFolder() : { id: '', title: '' };

    if (!folders.length) {
      core.appendOutput('no bookmark folders detected yet. open /shortcut to configure.', 'info');
      return;
    }
    const currentTitle = current.title || (current.id ? current.id : 'Default');
    let lines = [
      '<b>📁 Bookmark Folders (Protected &amp; Read-Only):</b>',
      `Active Synced Folder: <b>${escapeHtml(currentTitle)}</b>`,
      '',
      'Available Folders:'
    ];
    folders.forEach(f => {
      const isActive = (String(f.id) === String(current.id) || f.title === current.title || f.rawTitle === current.title);
      lines.push(`${isActive ? '▶ ' : '  '}${escapeHtml(f.title)} (${f.count} links)${isActive ? '  [ACTIVE]' : ''}`);
    });
    lines.push('\n🔒 <em>Note: Bookmark folder cannot be changed from the command line. Open /shortcut to manage or change folders safely.</em>');
    core.appendOutput(`<pre>${lines.join('\n')}</pre>`, 'info');
  }

  function handleAnim(words) {
    const action = words[1];
    const current = root.config.get().startupAnim !== false;
    let next;
    if (action === 'off' || action === '0' || action === 'disable') {
      next = false;
    } else if (action === 'on' || action === '1' || action === 'enable') {
      next = true;
    } else {
      next = !current;
    }
    const cfg = root.config.get();
    cfg.startupAnim = next;
    storage.saveConfig(cfg);
    if (next) {
      document.body.classList.remove('no-anim');
      core.appendOutput('✨ Terminal &amp; command animation: <b>ENABLED</b>.', 'success');
    } else {
      document.body.classList.add('no-anim');
      core.appendOutput('⚡ Terminal &amp; command animation: <b>DISABLED</b> (instant mode active).', 'success');
    }
  }

  function handleStartupPage(words) {
    if (words[1] === 'reload' || words[1] === '-r') {
      core.appendOutput('reloading startup page...', 'info');
      setTimeout(() => location.reload(), 180);
      return;
    }
    core.dom.output.innerHTML = '';
    const user = (root.config && root.config.get) ? root.config.get().user : 'user';
    const host = (root.config && root.config.get) ? root.config.get().host : 'Amon';
    core.appendOutput(`<b>TabOS</b> [v2.4.0] — Clean startup ready`, 'info');
    core.appendOutput(`welcome back, <span style="color:var(--accent)">${escapeHtml(user)}@${escapeHtml(host)}</span>. type <span style="color:var(--green)">/h</span> for all commands.`, 'success');
    core.dom.cmdInput.value = '';
    core.dom.cmdInput.focus();
  }

  function handleIp() {
    core.appendOutput('fetching public IP address...', 'info');
    fetch('https://api.ipify.org?format=json')
      .then(r => {
        if (!r.ok) throw new Error('status ' + r.status);
        return r.json();
      })
      .then(data => {
        if (data && data.ip) {
          core.appendOutput(`🌐 Public IP: <b style="color:var(--accent);font-size:13px">${escapeHtml(data.ip)}</b> <span style="opacity:0.75">(copied)</span>`, 'success');
          if (navigator.clipboard) navigator.clipboard.writeText(data.ip).catch(() => {});
        } else {
          throw new Error('invalid response');
        }
      })
      .catch(() => {
        fetch('https://icanhazip.com')
          .then(r => r.text())
          .then(ip => {
            const clean = ip.trim();
            core.appendOutput(`🌐 Public IP: <b style="color:var(--accent);font-size:13px">${escapeHtml(clean)}</b> <span style="opacity:0.75">(copied)</span>`, 'success');
            if (navigator.clipboard) navigator.clipboard.writeText(clean).catch(() => {});
          })
          .catch(() => core.appendOutput('unable to fetch IP (network offline or blocked).', 'error'));
      });
  }

  function handleUuid() {
    let uuid;
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      uuid = crypto.randomUUID();
    } else {
      uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
    core.appendOutput(`🔑 UUID v4: <b style="color:var(--accent);font-size:13px">${uuid}</b> <span style="opacity:0.75">(copied to clipboard)</span>`, 'success');
    if (navigator.clipboard) navigator.clipboard.writeText(uuid).catch(() => {});
  }

  function handleBase64(words, commandLine) {
    const action = words[1];
    if (action === 'enc' || action === 'encode') {
      const text = commandLine.replace(/^\/?(b64|base64)\s+(enc|encode)\s+/i, '');
      if (!text) return core.appendOutput('usage: /b64 enc <text to encode>', 'error');
      try {
        const encoded = btoa(unescape(encodeURIComponent(text)));
        core.appendOutput(`<b>Base64 Encoded:</b>\n<span style="color:var(--accent)">${escapeHtml(encoded)}</span> <span style="opacity:0.75">(copied)</span>`, 'success');
        if (navigator.clipboard) navigator.clipboard.writeText(encoded).catch(() => {});
      } catch (err) {
        core.appendOutput(`encoding failed: ${escapeHtml(err.message)}`, 'error');
      }
      return;
    }
    if (action === 'dec' || action === 'decode') {
      const text = commandLine.replace(/^\/?(b64|base64)\s+(dec|decode)\s+/i, '').trim();
      if (!text) return core.appendOutput('usage: /b64 dec <base64 string>', 'error');
      try {
        const decoded = decodeURIComponent(escape(atob(text)));
        core.appendOutput(`<b>Base64 Decoded:</b>\n<span style="color:var(--green)">${escapeHtml(decoded)}</span> <span style="opacity:0.75">(copied)</span>`, 'success');
        if (navigator.clipboard) navigator.clipboard.writeText(decoded).catch(() => {});
      } catch (err) {
        core.appendOutput(`invalid base64 string: ${escapeHtml(err.message)}`, 'error');
      }
      return;
    }
    core.appendOutput('usage: /b64 enc &lt;text&gt; | /b64 dec &lt;base64&gt;', 'info');
  }

  function handleHash(words, commandLine) {
    const text = commandLine.replace(/^\/?(hash|sha256)\s+/i, '');
    if (!text) return core.appendOutput('usage: /hash <text to hash>', 'error');
    if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
      const buf = new TextEncoder().encode(text);
      crypto.subtle.digest('SHA-256', buf).then(hash => {
        const hex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
        core.appendOutput(`<b>SHA-256 Hash:</b>\n<span style="color:var(--accent)">${hex}</span> <span style="opacity:0.75">(copied)</span>`, 'success');
        if (navigator.clipboard) navigator.clipboard.writeText(hex).catch(() => {});
      }).catch(err => {
        core.appendOutput(`hash failed: ${escapeHtml(err.message)}`, 'error');
      });
    } else {
      core.appendOutput('Web Crypto API is not supported in this environment.', 'error');
    }
  }

  function handleJson(words, commandLine) {
    const text = commandLine.replace(/^\/?json\s+/i, '').trim();
    if (!text) return core.appendOutput('usage: /json <json_string> (prettifies & validates JSON)', 'error');
    try {
      const parsed = JSON.parse(text);
      const pretty = JSON.stringify(parsed, null, 2);
      core.appendOutput(`<pre style="max-height:260px;overflow-y:auto;color:var(--green);font-size:11px">${escapeHtml(pretty)}</pre>`, 'success');
      if (navigator.clipboard) navigator.clipboard.writeText(pretty).catch(() => {});
    } catch (err) {
      core.appendOutput(`Invalid JSON: ${escapeHtml(err.message)}`, 'error');
    }
  }

  function handleUrl(words, commandLine) {
    const base = words[0];
    let action = words[1];
    let text = '';
    if (base === 'urle') {
      action = 'enc';
      text = commandLine.replace(/^\/?urle\s*/i, '');
    } else if (base === 'urld') {
      action = 'dec';
      text = commandLine.replace(/^\/?urld\s*/i, '');
    } else {
      text = commandLine.replace(/^\/?url\s+(enc|dec)\s+/i, '');
    }
    if (action === 'enc' || action === 'encode') {
      if (!text) return core.appendOutput('usage: /url enc <string>', 'error');
      const res = encodeURIComponent(text);
      core.appendOutput(`<b>URL Encoded:</b>\n<span style="color:var(--accent)">${escapeHtml(res)}</span> <span style="opacity:0.75">(copied)</span>`, 'success');
      if (navigator.clipboard) navigator.clipboard.writeText(res).catch(() => {});
      return;
    }
    if (action === 'dec' || action === 'decode') {
      if (!text) return core.appendOutput('usage: /url dec <string>', 'error');
      try {
        const res = decodeURIComponent(text);
        core.appendOutput(`<b>URL Decoded:</b>\n<span style="color:var(--green)">${escapeHtml(res)}</span> <span style="opacity:0.75">(copied)</span>`, 'success');
        if (navigator.clipboard) navigator.clipboard.writeText(res).catch(() => {});
      } catch (e) {
        core.appendOutput(`decode failed: ${escapeHtml(e.message)}`, 'error');
      }
      return;
    }
    core.appendOutput('usage: /url enc &lt;text&gt; | /url dec &lt;text&gt;', 'info');
  }

  function handleColor(words) {
    const col = (words[1] || '').trim();
    if (!col) return core.appendOutput('usage: /color <#hex|rgb(r,g,b)> (e.g. /color #39c5bb)', 'error');
    const dummy = document.createElement('div');
    dummy.style.color = col;
    document.body.appendChild(dummy);
    const computed = getComputedStyle(dummy).color;
    document.body.removeChild(dummy);
    if (!computed) return core.appendOutput(`unknown color: ${escapeHtml(col)}`, 'error');

    const m = computed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return core.appendOutput(`color: ${escapeHtml(col)}`, 'info');
    const r = Number(m[1]), g = Number(m[2]), b = Number(m[3]);
    const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');

    const r1 = r / 255, g1 = g / 255, b1 = b / 255;
    const max = Math.max(r1, g1, b1), min = Math.min(r1, g1, b1);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r1: h = (g1 - b1) / d + (g1 < b1 ? 6 : 0); break;
        case g1: h = (b1 - r1) / d + 2; break;
        case b1: h = (r1 - g1) / d + 4; break;
      }
      h = Math.round(h * 60);
    }
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    const swatch = `<span style="display:inline-block;width:13px;height:13px;background:${hex};border-radius:2px;vertical-align:middle;margin-right:6px;border:1px solid rgba(255,255,255,0.3);"></span>`;
    core.appendOutput(`${swatch}<b>${hex.toUpperCase()}</b> | RGB(${r}, ${g}, ${b}) | HSL(${h}°, ${s}%, ${l}%)`, 'success');
  }

  function handleLorem(words) {
    const count = parseInt(words[1], 10) || 30;
    const wordsList = 'lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt in culpa qui officia deserunt mollit anim id est laborum'.split(' ');
    let res = [];
    for (let i = 0; i < count; i++) {
      res.push(wordsList[i % wordsList.length]);
    }
    const out = res.join(' ') + '.';
    core.appendOutput(`<b>Lorem Ipsum (${count} words):</b>\n<span style="opacity:0.9">${escapeHtml(out)}</span> <span style="opacity:0.75">(copied)</span>`, 'info');
    if (navigator.clipboard) navigator.clipboard.writeText(out).catch(() => {});
  }

  function handleCalc(words, commandLine) {
    const expr = commandLine.replace(/^\/?calc\s+/i, '').trim();
    if (!expr) return core.appendOutput('usage: /calc <math expression> (e.g. /calc sqrt(144) + 10^2)', 'error');
    try {
      const allowedFns = ['sin','cos','tan','asin','acos','atan','sqrt','cbrt','abs','floor','ceil','round','log','log10','log2','exp','pow','min','max','random'];
      let sanitized = expr
        .replace(/\^/g, '**')
        .replace(/\bpi\b/gi, 'Math.PI')
        .replace(/\be\b/gi, 'Math.E');

      allowedFns.forEach(fn => {
        const re = new RegExp(`\\b${fn}\\s*\\(`, 'gi');
        sanitized = sanitized.replace(re, `Math.${fn}(`);
      });

      if (/[^0-9\s+\-*/%(),.Math\w]/i.test(sanitized) ||
          /(window|document|global|process|fetch|alert|eval|Function|prototype|constructor|import|require)/i.test(sanitized)) {
        return core.appendOutput('invalid mathematical expression.', 'error');
      }
      const fn = new Function(`"use strict"; return (${sanitized});`);
      const val = fn();
      if (typeof val === 'number' && !isNaN(val)) {
        core.appendOutput(`= <b style="color:var(--green);font-size:14px">${val}</b>`, 'success');
      } else {
        core.appendOutput('could not evaluate expression.', 'error');
      }
    } catch (err) {
      core.appendOutput(`calc error: ${escapeHtml(err.message)}`, 'error');
    }
  }

  function handleTimestamp(words) {
    const arg = words[1];
    if (!arg) {
      const now = Date.now();
      const sec = Math.floor(now / 1000);
      core.appendOutput(`Current Unix Timestamp:\nSeconds: <b style="color:var(--accent)">${sec}</b> | Milliseconds: <b>${now}</b>`, 'success');
      core.appendOutput(`Local: ${new Date(now).toLocaleString()} | UTC: ${new Date(now).toUTCString()}`, 'info');
      return;
    }
    const num = Number(arg);
    const d = !isNaN(num) ? new Date(num > 1e11 ? num : num * 1000) : new Date(arg);
    if (isNaN(d.getTime())) return core.appendOutput('invalid timestamp or date string.', 'error');
    core.appendOutput(`Date: <b style="color:var(--accent)">${d.toLocaleString()}</b>\nUTC: ${d.toUTCString()}\nISO: ${d.toISOString()}\nEpoch (sec): ${Math.floor(d.getTime() / 1000)}`, 'success');
  }

  function showHelp(topic) {
    const t = (topic || '').toLowerCase().trim();

    if (t === 'dev') {
      const devLines = [
        '<b>🛠️ DEVELOPER TOOLS &amp; UTILITIES:</b>',
        '  /ip                     Show public IP address (auto-copies)',
        '  /uuid                   Generate cryptographic UUID v4 (auto-copies)',
        '  /b64 enc <text>         Encode string to Base64',
        '  /b64 dec <base64>       Decode Base64 string to plaintext',
        '  /hash <text>            Generate SHA-256 hash',
        '  /json <string>          Format, prettify &amp; validate JSON',
        '  /url enc <text>         URL encode string',
        '  /url dec <text>         URL decode string',
        '  /color <#hex|rgb>       Color converter (HEX/RGB/HSL) with swatch',
        '  /calc <expression>      Math evaluator (e.g. /calc sqrt(144) + 10^2)',
        '  /ts [timestamp]         Unix timestamp generator &amp; converter',
        '  /lorem [words]          Generate placeholder dummy text',
        '\nType /h to view all command categories.'
      ];
      return core.appendOutput(`<pre>${devLines.join('\n')}</pre>`, 'info');
    }

    if (t === 'search') {
      const searchLines = [
        '<b>🌐 SEARCH ENGINES &amp; QUICK WEB ROUTING:</b>',
        '  /s <query>              Google Search (or just /s)',
        '  /b <query>              Bing Search (or just /b)',
        '  /d <query>              DuckDuckGo Search (or just /d)',
        '  /yt <query>             YouTube Search',
        '  /gh <query>             GitHub Search',
        '  /so <query>             Stack Overflow Search',
        '  /npm <query>            NPM Package Search',
        '  /mdn <query>            MDN Web Docs Search',
        '  /w <query>              Wikipedia Search',
        '  /maps <query>           Google Maps',
        '  /gpt <prompt>           ChatGPT prompt',
        '  /claude <prompt>        Claude AI prompt',
        '  /rd <query|r/sub>       Reddit Search',
        '  /amz <query>            Amazon Search',
        '\nType /h to view all command categories.'
      ];
      return core.appendOutput(`<pre>${searchLines.join('\n')}</pre>`, 'info');
    }

    if (t === 'sys' || t === 'system' || t === 'config') {
      const sysLines = [
        '<b>⚡ SYSTEM &amp; CONFIGURATION:</b>',
        '  /st [reload]            Reset to clean startup page (or reload)',
        '  /anim on|off            Toggle terminal boot &amp; command animation (instant mode)',
        '  /config                 View system configuration',
        '  /config theme <name>    Change layout theme (terminal, neo)',
        '  /config accent <hex>    Change accent color',
        '  /config user <name>     Change username in prompt (e.g. user)',
        '  /config host <name>     Change hostname in prompt (e.g. Amon)',
        '  /widget list|toggle     Manage widget visibility',
        '  /layout reset           Reset widget positions',
        '  /blur [all|off]         Privacy screen blur',
        '  /clear                  Clear terminal buffer',
        '  /time                   Current time',
        '  /history                Command history',
        '\nType /h to view all command categories.'
      ];
      return core.appendOutput(`<pre>${sysLines.join('\n')}</pre>`, 'info');
    }

    if (t === 'todo') {
      const todoLines = [
        '<b>📋 TASK &amp; TODO MANAGEMENT:</b>',
        '  /todo list              List all tasks',
        '  /todo add <task>        Add new task (append ! for priority)',
        '  /todo add <task> due:DD-MM-YYYY  Add task with due date',
        '  /todo done <id>         Mark task as completed',
        '  /todo delete <id>       Remove task',
        '  /todo clear-done        Remove completed tasks',
        '  /pomodoro start|pause   Focus timer (25m)',
        '\nType /h to view all command categories.'
      ];
      return core.appendOutput(`<pre>${todoLines.join('\n')}</pre>`, 'info');
    }

    // Default Comprehensive Help (Detailed & Categorized)
    const helpLines = [
      '<b>═══════════════════════════════════════════════════════════════════════════</b>',
      '<b>  TabOS Command Manual &amp; Quick Reference (/h or ?)                     </b>',
      '<b>═══════════════════════════════════════════════════════════════════════════</b>',
      '',
      '<b>🌐 QUICK SEARCH ENGINES:</b>',
      '  /s <query>       Google Search           /b <query>       Bing Search',
      '  /d <query>       DuckDuckGo              /yt <query>      YouTube',
      '  /gh <query>      GitHub Search           /so <query>      Stack Overflow',
      '  /npm <query>     NPM Packages            /mdn <query>     MDN Web Docs',
      '  /w <query>       Wikipedia               /maps <query>    Google Maps',
      '  /gpt <prompt>    ChatGPT                 /claude <prompt> Claude AI',
      '',
      '<b>🛠️ DEVELOPER TOOLS:</b>',
      '  /ip              Public IP &amp; Network    /uuid            Generate UUID v4',
      '  /b64 enc|dec     Base64 Encode/Decode    /hash <text>     SHA-256 Hash',
      '  /json <string>   JSON Prettify/Validate  /url enc|dec     URL Encode/Decode',
      '  /color <#hex>    HEX/RGB/HSL Converter   /calc <expr>     Math Evaluator',
      '  /ts [timestamp]  Unix Epoch Converter    /lorem [words]   Dummy Text Generator',
      '',
      '<b>⚡ SYSTEM &amp; TERMINAL:</b>',
      '  /st [reload]     Startup Page / Reset    /anim on|off     Toggle Fast/Instant Mode',
      '  /config          Settings &amp; Preferences /config theme    Switch Theme',
      '  /widget          Toggle Widgets          /layout reset    Reset Grid',
      '  /blur [all|off]  Privacy Blur            /clear           Clear Screen',
      '',
      '<b>📁 SHORTCUTS &amp; BOOKMARKS:</b>',
      '  /shortcut        Open Bookmarks Manager  /shortcut list   List Links',
      '  /shortcut add    Create Custom Shortcut  /folder          View Active Folder',
      '',
      '<b>📋 PRODUCTIVITY &amp; EXTRAS:</b>',
      '  /todo [list|add] Tasks &amp; Deadlines      /pomodoro        Focus Timer',
      '  /cat [text]      Sticky Notes            /rain on|off     Ambient Rain Sound',
      '  /game            Chicken/Snake/Pacman    /download        Chrome Extension ZIP',
      '',
      '<i>Tip: Type /h dev, /h search, /h sys, /h todo for dedicated topic guides.</i>',
      '<b>═══════════════════════════════════════════════════════════════════════════</b>'
    ];

    core.appendOutput(`<pre style="line-height:1.42;font-size:11px">${helpLines.join('\n')}</pre>`, 'info');
  }

  function showHistory() {
    if (!core.state.history.length) return core.appendOutput('no history yet.', 'info');
    const lines = core.state.history.slice(0, 20).map((cmd, i) => `${i + 1}. ${cmd}`).join('\n');
    core.appendOutput(`<pre>${escapeHtml(lines)}</pre>`, 'info');
  }

  let gameScriptLoading = null;

  function loadGameModule() {
    if (typeof window.startGame === 'function') return Promise.resolve();
    if (gameScriptLoading) return gameScriptLoading;
    gameScriptLoading = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-lazy-module="game"]');
      if (existing) existing.remove();
      const script = document.createElement('script');
      script.src = 'game.js';
      script.dataset.lazyModule = 'game';
      script.onload = () => {
        if (typeof window.startGame === 'function') resolve();
        else reject(new Error('game module loaded without startGame'));
      };
      script.onerror = () => reject(new Error('failed to load game.js'));
      document.head.appendChild(script);
    }).catch(err => {
      gameScriptLoading = null;
      throw err;
    });
    return gameScriptLoading;
  }

  function launchGame(words) {
    const game = words[1] || 'chicken';
    const option = words[2] || 'medium';
    const allowed = ['chicken', 'snake', 'pacman', 'tetris'];
    if (!allowed.includes(game)) return core.appendOutput(`unknown game: ${escapeHtml(game)}. available: ${allowed.join(', ')}`, 'error');
    core.appendOutput(`launching ${escapeHtml(game)}${game === 'chicken' ? ` ${escapeHtml(option)}` : ''}...`, 'success');
    loadGameModule().then(() => {
      setTimeout(() => window.startGame(game, option), 160);
    }).catch(() => {
      core.appendOutput('failed to load game module.', 'error');
    });
  }



  function chatGptPromptUrl(prompt) {
    const params = new URLSearchParams();
    params.set('q', prompt);
    return `https://chatgpt.com/?${params.toString()}`;
  }

  function handleLayout(words) {
    if (words[1] === 'reset') {
      if (root.layout && root.layout.resetTheme) root.layout.resetTheme();
      core.appendOutput('layout reset for this theme.', 'success');
      return;
    }
    if (words[1] === 'edit') {
      const value = words[2];
      if (value !== 'on' && value !== 'off') {
        core.appendOutput('usage: /layout edit on|off', 'info');
        return;
      }
      if (root.config.get().layoutTheme === 'terminal' && value === 'on') {
        core.appendOutput('terminal theme is locked.', 'info');
        return;
      }
      if (root.layout && root.layout.setEditMode) root.layout.setEditMode(value === 'on');
      core.appendOutput(`layout edit: ${value}`, 'success');
      return;
    }
    core.appendOutput('usage: /layout reset, /layout edit on|off', 'info');
  }

  function handleWidget(words) {
    const action = words[1] || 'list';
    const name = words[2];
    const widgets = root.layout && root.layout.widgets ? root.layout.widgets() : [];
    if (action === 'list') {
      const lines = widgets.map(widget => `${widget}: ${root.layout.isVisible(widget) ? 'on' : 'off'}`).join('\n');
      core.appendOutput(`<pre>${escapeHtml(lines)}</pre>`, 'info');
      return;
    }
    if (action === 'reset') {
      if (root.layout && root.layout.resetVisibility) root.layout.resetVisibility();
      core.appendOutput('widgets reset.', 'success');
      return;
    }
    if (!name || !widgets.includes(name)) {
      core.appendOutput(`widgets: ${escapeHtml(widgets.join(', '))}`, 'info');
      core.appendOutput('usage: /widget show|hide|toggle <name>', 'info');
      return;
    }
    if (action === 'show' || action === 'on') {
      root.layout.setWidgetVisible(name, true);
      core.appendOutput(`${name}: on`, 'success');
      return;
    }
    if (action === 'hide' || action === 'off') {
      root.layout.setWidgetVisible(name, false);
      core.appendOutput(`${name}: off`, 'success');
      return;
    }
    if (action === 'toggle') {
      root.layout.toggleWidget(name);
      core.appendOutput(`${name}: ${root.layout.isVisible(name) ? 'on' : 'off'}`, 'success');
      return;
    }
    core.appendOutput('usage: /widget list|show|hide|toggle|reset', 'info');
  }

  function handleCat(commandLine) {
    const catIdx = commandLine.search(/\bcat\b/i);
    const text = catIdx >= 0 ? commandLine.slice(catIdx + 3).trim() : '';
    if (!text) {
      if (root.notes && root.notes.openNew) root.notes.openNew();
      else core.appendOutput('note editor opened.', 'info');
      return;
    }
    if (root.notes && root.notes.add) {
      root.notes.add(text);
      core.appendOutput(`note created: ${escapeHtml(text.slice(0, 40))}${text.length > 40 ? '...' : ''}`, 'success');
    } else {
      core.appendOutput('notes module not available.', 'error');
    }
  }

  function handleExport() {
    confirm('export all data (notes, tasks, config) to clipboard? type Y/N to confirm.', () => {
      const data = {
        notes: root.notes ? root.notes.all() : [],
        todos: root.todo ? root.todo.all() : [],
        shortcuts: userShortcuts,
        config: root.config ? root.config.get() : {},
      };
      const json = JSON.stringify(data, null, 2);
      navigator.clipboard.writeText(json).then(() => {
        core.appendOutput('data copied to clipboard as JSON.', 'success');
      }).catch(() => {
        core.appendOutput('clipboard access denied. check browser permissions.', 'error');
      });
    });
  }

  function handleSlash(commandLine) {
    const lowerLine = commandLine.toLowerCase().trim();
    const words = lowerLine.split(/\s+/).filter(Boolean);
    const base = words[0] || '';
    const originalWords = commandLine.split(/\s+/).filter(Boolean);

    // Block heavy commands in non-terminal themes
    if (!isTerminalTheme() && HEAVY_COMMANDS.includes(base)) {
      return core.appendOutput(`/${base} is only available in terminal theme.`, 'error');
    }

    if (base === 'help' || base === 'h' || base === '?') return showHelp(words[1]);
    if (base === 'clear' || base === 'cls') {
      core.dom.output.innerHTML = '';
      return;
    }
    if (base === 'time') return core.appendOutput(escapeHtml(core.dom.clock.textContent), 'info');
    if (base === 'history') return showHistory();

    if (base === 'anim' || base === 'animation') return handleAnim(words);
    if (base === 'st' || base === 'startup') return handleStartupPage(words);
    if (base === 'ip') return handleIp();
    if (base === 'uuid') return handleUuid();
    if (base === 'b64' || base === 'base64') return handleBase64(words, commandLine);
    if (base === 'hash' || base === 'sha256') return handleHash(words, commandLine);
    if (base === 'json') return handleJson(words, commandLine);
    if (base === 'url' || base === 'urle' || base === 'urld') return handleUrl(words, commandLine);
    if (base === 'color' || base === 'hex') return handleColor(words);
    if (base === 'calc') return handleCalc(words, commandLine);
    if (base === 'ts' || base === 'timestamp') return handleTimestamp(words);
    if (base === 'lorem') return handleLorem(words);

    if (base === 'layout') return handleLayout(words);
    if (base === 'widget' || base === 'widgets') return handleWidget(words);
    if (base === 'config') return root.config.handle(words, commandLine);
    if (base === 'shortcut' || base === 'shortcuts') return handleShortcut(words, commandLine);
    if (base === 'folder' || base === 'folders') return handleFolder();
    if (base === 'rain') return root.rain.handle(words);
    if (base === 'fact') return root.facts.handle(words);
    if (base === 'todo') return root.todo.handle(words, commandLine);
    if (base === 'pomodoro') return root.todo.handlePomodoro(words);
    if (base === 'game') return launchGame(words);
    if (base === 'blur') return handleBlur(words);
    if (base === 'reset') return handleReset();
    if (base === 'cat') return handleCat(commandLine);
    if (base === 'download') {
      core.appendOutput('initiating download for tabos-chrome-extension.zip...', 'info');
      if (typeof window.downloadExtensionZip === 'function') {
        window.downloadExtensionZip();
      } else {
        const dlBtn = document.getElementById('extDlBtn');
        if (dlBtn) dlBtn.click();
        else window.location.href = '/api/download-extension';
      }
      return;
    }
    if (base === 'export') return handleExport();

    // ── Search & Web Quick Commands ──
    if (base === 's') {
      const q = commandLine.replace(/^\/?s(\s+|$)/i, '').trim();
      if (q) return core.routeTo(`https://www.google.com/search?q=${encodeURIComponent(q)}`, `Google: "${q}"`);
      return core.routeTo(`https://www.google.com`, 'Google');
    }
    if (base === 'b' || base === 'bing') {
      const q = commandLine.replace(/^\/?(b|bing)(\s+|$)/i, '').trim();
      if (q) return core.routeTo(`https://www.bing.com/search?q=${encodeURIComponent(q)}`, `Bing: "${q}"`);
      return core.routeTo(`https://www.bing.com`, 'Bing');
    }
    if (base === 'd' || base === 'ddg' || base === 'duck') {
      const q = commandLine.replace(/^\/?(d|ddg|duck)(\s+|$)/i, '').trim();
      if (q) return core.routeTo(`https://duckduckgo.com/?q=${encodeURIComponent(q)}`, `DuckDuckGo: "${q}"`);
      return core.routeTo(`https://duckduckgo.com`, 'DuckDuckGo');
    }
    if (base === 'yt' && originalWords.length > 1) {
      const q = commandLine.replace(/^\/?yt\s+/i, '').trim();
      return core.routeTo(`https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`, `YouTube: "${q}"`);
    }
    if (base === 'gh' && originalWords.length > 1) {
      const q = commandLine.replace(/^\/?gh\s+/i, '').trim();
      return core.routeTo(`https://github.com/search?q=${encodeURIComponent(q)}`, `GitHub: "${q}"`);
    }
    if (base === 'so' && originalWords.length > 1) {
      const q = commandLine.replace(/^\/?so\s+/i, '').trim();
      return core.routeTo(`https://stackoverflow.com/search?q=${encodeURIComponent(q)}`, `StackOverflow: "${q}"`);
    }
    if (base === 'npm' && originalWords.length > 1) {
      const q = commandLine.replace(/^\/?npm\s+/i, '').trim();
      return core.routeTo(`https://www.npmjs.com/search?q=${encodeURIComponent(q)}`, `NPM: "${q}"`);
    }
    if (base === 'mdn' && originalWords.length > 1) {
      const q = commandLine.replace(/^\/?mdn\s+/i, '').trim();
      return core.routeTo(`https://developer.mozilla.org/search?q=${encodeURIComponent(q)}`, `MDN: "${q}"`);
    }
    if ((base === 'w' || base === 'wiki') && originalWords.length > 1) {
      const q = commandLine.replace(/^\/?(w|wiki)\s+/i, '').trim();
      return core.routeTo(`https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}`, `Wikipedia: "${q}"`);
    }
    if (base === 'maps' && originalWords.length > 1) {
      const q = commandLine.replace(/^\/?maps\s+/i, '').trim();
      return core.routeTo(`https://www.google.com/maps/search/${encodeURIComponent(q)}`, `Maps: "${q}"`);
    }
    if (base === 'amz' && originalWords.length > 1) {
      const q = commandLine.replace(/^\/?amz\s+/i, '').trim();
      return core.routeTo(`https://www.amazon.com/s?k=${encodeURIComponent(q)}`, `Amazon: "${q}"`);
    }
    if (base === 'gpt' && originalWords.length > 1) {
      const q = commandLine.slice(4).trim();
      return core.routeTo(chatGptPromptUrl(q), `ChatGPT: "${q}"`);
    }
    if (base === 'claude' && originalWords.length > 1) {
      const q = commandLine.slice(7).trim();
      return core.routeTo(`https://claude.ai/new?q=${encodeURIComponent(q)}`, `Claude: "${q}"`);
    }
    if (base === 'rd' && originalWords.length > 1) {
      const sub = commandLine.slice(3).trim();
      if (/^r\//i.test(sub)) {
        return core.routeTo(`https://www.reddit.com/${encodeURIComponent(sub)}`, `Reddit: ${sub}`);
      }
      return core.routeTo(`https://www.reddit.com/search/?q=${encodeURIComponent(sub)}`, `Reddit: "${sub}"`);
    }
    if (base === 'g' && originalWords.length > 1) {
      const q = commandLine.slice(2).trim();
      return core.routeTo(`https://www.google.com/search?q=${encodeURIComponent(q)}`, `Google: "${q}"`);
    }

    // ── Easter eggs ──
    if (base === 'sudo') return core.appendOutput('nice try. you\'re not root here.', 'error');
    if (base === 'exit') {
      core.appendOutput('there is no escape.', 'error');
      const v = document.createElement('div');
      v.className = 'void-overlay';
      v.innerHTML = '<span class="void-text">...</span>';
      document.body.appendChild(v);
      setTimeout(() => v.remove(), 2500);
      return;
    }
    if (base === 'hello' || base === 'hi') {
      const greetings = ['hey there! 👋', 'hello, human.', 'sup.', 'greetings, traveler.', 'yo.', '*waves*'];
      return core.appendOutput(greetings[Math.floor(Math.random() * greetings.length)], 'success');
    }
    if (base === 'coffee') {
      core.appendOutput('brewing... ☕', 'success');
      const orig = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
      document.documentElement.style.setProperty('--accent', '#6f4e37');
      setTimeout(() => document.documentElement.style.setProperty('--accent', orig), 1500);
      return;
    }
    if (base === '42') return core.appendOutput('the answer to life, the universe, and everything.', 'info');
    if (base === 'hack') {
      const chars = '01アイウエオカキクケコサシスセソ█▓░';
      let count = 0;
      const iv = setInterval(() => {
        let line = '';
        for (let i = 0; i < 48; i++) line += chars[Math.floor(Math.random() * chars.length)];
        core.appendOutput(`<span style="color:var(--green);font-size:10px">${line}</span>`, 'info');
        count++;
        if (count > 8) { clearInterval(iv); core.appendOutput('access granted.', 'success'); }
      }, 80);
      return;
    }
    if (base === 'matrix') {
      let count = 0;
      const iv = setInterval(() => {
        let line = '';
        for (let i = 0; i < 60; i++) line += String.fromCharCode(0x30A0 + Math.random() * 96);
        core.appendOutput(`<span style="color:#00ff41;font-size:9px;opacity:0.7">${line}</span>`, 'info');
        count++;
        if (count > 6) { clearInterval(iv); core.appendOutput('wake up, Neo...', 'success'); }
      }, 60);
      return;
    }
    if (base === 'fortune') {
      const fortunes = ['A surprise awaits you at your next commit.','You will mass-delete node_modules... again.','Your code will compile on the first try. Just kidding.','A segfault is in your future. In C, not here.','The bug is not where you think it is.','Today is a good day to refactor.','You will discover a missing semicolon.','An unexpected rebase will bring clarity.'];
      return core.appendOutput(`🥠 ${fortunes[Math.floor(Math.random() * fortunes.length)]}`, 'info');
    }
    if (base === 'xkcd') {
      const quotes = ['There are only two hard problems in CS: cache invalidation, naming things, and off-by-one errors.','It works on my machine.','// TODO: fix this later','sudo make me a sandwich.','The cloud is just someone else\'s computer.','Have you tried turning it off and on again?'];
      return core.appendOutput(quotes[Math.floor(Math.random() * quotes.length)], 'info');
    }
    if (lowerLine === 'rm -rf /' || lowerLine === 'rm -rf') {
      core.appendOutput('deleting system files...', 'error');
      document.body.style.transition = 'transform 0.05s';
      let shakes = 0;
      const shakeIv = setInterval(() => {
        document.body.style.transform = `translateX(${(Math.random() - 0.5) * 8}px)`;
        shakes++;
        if (shakes > 14) { clearInterval(shakeIv); document.body.style.transform = ''; core.appendOutput('just kidding. nice try though.', 'success'); }
      }, 40);
      return;
    }

    // Shortcut lookup
    const shortcuts = allShortcuts();
    if (shortcuts[lowerLine]) {
      const url = shortcuts[lowerLine].url;
      if (!/^https?:\/\//i.test(url)) {
        core.appendOutput(`blocked: unsafe URL scheme in shortcut /${escapeHtml(lowerLine)}`, 'error');
        return;
      }
      core.appendOutput(`open: ${escapeHtml(shortcuts[lowerLine].desc)}`, 'success');
      setTimeout(() => { window.location.href = url; }, 160);
      return;
    }

    core.appendOutput(`command not found: /${escapeHtml(lowerLine)}`, 'error');
  }

  let pendingConfirm = null;

  function confirm(message, callback) {
    if (pendingConfirm) {
      core.appendOutput('answer the pending confirmation first.', 'error');
      return false;
    }
    pendingConfirm = { callback };
    core.dom.cmdInput.disabled = true;
    core.dom.cmdInput.placeholder = 'type Y/N...';
    core.appendOutput(message, 'info');
    setTimeout(() => { core.dom.cmdInput.disabled = false; core.dom.cmdInput.focus(); }, 50);
    return true;
  }

  function handleBlur(words) {
    const sub = words[1];
    const action = words[2];
    const targets = blurTargets();

    if (!sub) {
      const allBlurred = Object.values(targets).every(group => group.length && group.every(el => el.classList.contains('blurred')));
      Object.keys(targets).forEach(key => setBlurred(key, !allBlurred));
      saveBlurState();
      core.appendOutput(allBlurred ? 'blur disabled.' : 'blur enabled.', 'success');
      return;
    }
    if (sub === 'all' && action === 'off') {
      Object.keys(targets).forEach(key => setBlurred(key, false));
      saveBlurState();
      core.appendOutput('all blur disabled.', 'success');
      return;
    }
    if (targets[sub]) {
      const on = action !== 'off';
      setBlurred(sub, on);
      saveBlurState();
      core.appendOutput(`${sub} blur ${on ? 'enabled' : 'disabled'}.`, 'success');
      return;
    }
    core.appendOutput('usage: /blur [notes|todo|terminal|facts] [on|off]', 'error');
  }

  function blurTargets() {
    return {
      notes: [document.getElementById('stickyPanel'), ...document.querySelectorAll('.floating-note')].filter(Boolean),
      todo: [document.getElementById('todoPanel')].filter(Boolean),
      terminal: [document.getElementById('output')].filter(Boolean),
      facts: [document.getElementById('factBar')].filter(Boolean),
    };
  }

  function setBlurred(key, on) {
    if (key === 'notes' && root.notes && root.notes.setBlurred) {
      root.notes.setBlurred(on);
      return;
    }
    (blurTargets()[key] || []).forEach(el => el.classList.toggle('blurred', on));
  }

  function saveBlurState() {
    const state = {};
    Object.entries(blurTargets()).forEach(([key, group]) => {
      state[key] = group.some(el => el.classList.contains('blurred'));
    });
    storage.setJson(storage.keys.blurState, state);
  }

  function restoreBlurState() {
    const state = storage.getJson(storage.keys.blurState, {});
    Object.entries(state).forEach(([key, blurred]) => {
      setBlurred(key, !!blurred);
    });
  }

  function handleReset() {
    confirm('this will erase all data. type Y to confirm, N to cancel.', () => {
      core.appendOutput('resetting all data...', 'error');
      setTimeout(() => {
        Object.values(storage.keys).forEach(k => localStorage.removeItem(k));
        location.reload();
      }, 600);
    });
  }

  // Known command names for slash-less execution
  const KNOWN_COMMANDS = ['help','h','?','clear','cls','time','history','layout','widget','widgets','config',
    'shortcut','shortcuts','folder','folders','rain','fact','todo','pomodoro','game','blur','reset','cat','download','export',
    'sudo','exit','hello','hi','coffee','hack','matrix','fortune','xkcd','42',
    'yt','gpt','claude','rd','g','s','b','bing','d','ddg','st','startup','anim','animation',
    'ip','uuid','b64','base64','hash','sha256','json','url','urle','urld','color','hex','calc','ts','timestamp','lorem',
    'gh','so','npm','mdn','w','wiki','maps','amz'];

  function handle(raw) {
    const command = raw.trim();
    if (!command) return;

    if (pendingConfirm) {
      core.echoCommand(command);
      const answer = command.trim().toLowerCase();
      const callback = pendingConfirm.callback;
      pendingConfirm = null;
      core.dom.cmdInput.placeholder = '';
      if (answer === 'y' || answer === 'yes') callback();
      else core.appendOutput('cancelled.', 'info');
      return;
    }

    const cmdFirstWord = command.replace(/^\//, '').split(/\s+/)[0].toLowerCase();
    const isKnownCmd = KNOWN_COMMANDS.includes(cmdFirstWord) || allShortcuts()[cmdFirstWord] || /^g:\s*/i.test(command) || command === '?';
    if (isKnownCmd) core.saveHistory(command);
    core.echoCommand(command);

    if (command === '?') return showHelp();
    if (command.startsWith('/')) return handleSlash(command.slice(1).trim());

    // g: prefix for google search
    if (/^g:\s*/i.test(command)) {
      const q = command.replace(/^g:\s*/i, '').trim();
      if (q) return core.routeTo(`https://www.google.com/search?q=${encodeURIComponent(q)}`, `search: "${q}"`);
      return core.appendOutput('usage: g: <query>', 'error');
    }

    // Try math first
    const math = tryMath(command);
    if (math !== null) return core.appendOutput(`= ${math}`, 'info');

    // Try as a command without slash
    const lowerCmd = command.toLowerCase().trim();
    const firstWord = lowerCmd.split(/\s+/)[0];
    if (KNOWN_COMMANDS.includes(firstWord) || lowerCmd === 'rm -rf /' || lowerCmd === 'rm -rf') {
      return handleSlash(command);
    }

    // Check shortcuts
    const shortcuts = allShortcuts();
    if (shortcuts[lowerCmd]) {
      const url = shortcuts[lowerCmd].url;
      if (!/^https?:\/\//i.test(url)) {
        core.appendOutput(`blocked: unsafe URL scheme.`, 'error');
        return;
      }
      core.appendOutput(`open: ${escapeHtml(shortcuts[lowerCmd].desc)}`, 'success');
      setTimeout(() => { window.location.href = url; }, 160);
      return;
    }

    core.appendOutput(`unknown command: ${escapeHtml(command)}. type /help`, 'error');
  }

  function patternMatches(pattern, query) {
    const p = pattern.toLowerCase().split(/\s+/);
    const q = query.toLowerCase().split(/\s+/);
    for (let i = 0; i < q.length; i++) {
      if (!p[i]) {
        const last = p[p.length - 1] || '';
        return last.startsWith('<') || last.startsWith('[') || last.includes('|');
      }
      if (p[i].startsWith('<') || p[i].includes('|') || p[i].startsWith('[')) {
        if (i === p.length - 1) return true;
        continue;
      }
      if (!p[i].startsWith(q[i])) return false;
    }
    return true;
  }

  function completions(query) {
    const raw = query.replace(/^\//, '').trim();
    const q = raw.toLowerCase();

    // 1. Exact or prefix command matches from catalog (e.g. /s -> /s <query>)
    const exactCatalog = catalog
      .filter(([usage]) => {
        const first = usage.toLowerCase().split(/\s+/)[0];
        return first === q || first.startsWith(q);
      })
      .sort(([a], [b]) => {
        const fa = a.toLowerCase().split(/\s+/)[0];
        const fb = b.toLowerCase().split(/\s+/)[0];
        if (fa === q && fb !== q) return -1;
        if (fb === q && fa !== q) return 1;
        return 0;
      })
      .map(([usage, desc]) => [usage, { desc, type: 'command' }]);

    // 2. Shortcuts (prioritize key startsWith over contains)
    const all = allShortcuts();
    const shortcutPrefix = [];
    const shortcutContains = [];

    Object.entries(all).forEach(([key, value]) => {
      const k = key.toLowerCase();
      const d = (value.desc || '').toLowerCase();
      const u = (value.url || '').toLowerCase();
      const item = [
        key,
        {
          desc: value.type === 'bookmark'
            ? `[${value.folderTitle || 'Bookmark'}] ${value.desc || value.url}`
            : (value.desc || value.url),
          type: value.type || 'custom',
          url: value.url,
        }
      ];

      if (!q) {
        shortcutPrefix.push(item);
      } else if (k.startsWith(q)) {
        shortcutPrefix.push(item);
      } else if (q.length > 1 && (k.includes(q) || d.includes(q) || u.includes(q))) {
        shortcutContains.push(item);
      }
    });

    // 3. Other catalog entries matching pattern
    const otherCatalog = catalog
      .filter(([usage]) => {
        const first = usage.toLowerCase().split(/\s+/)[0];
        return first !== q && !first.startsWith(q) && (!q || patternMatches(usage, q));
      })
      .map(([usage, desc]) => [usage, { desc, type: 'command' }]);

    return [...exactCatalog, ...shortcutPrefix, ...otherCatalog, ...shortcutContains].slice(0, 16);
  }

  function init() {
    root.core.dom.cmdInput.focus();
    restoreBlurState();
    if (root.config && root.config.apply) root.config.apply();
  }

  root.shortcuts = {
    all: allShortcuts,
    add: addShortcut,
    delete: deleteShortcut,
    restore: restoreShortcut,
    setBookmarkShortcuts,
    builtins: () => ({ ...BUILTIN_SHORTCUTS }),
    disabled: () => [...disabledShortcuts],
  };
  root.commands = {
    init,
    handle,
    completions,
    showHelp,
    confirm,
  };
})();
