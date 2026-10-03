(function () {
  const root = window.TabOS = window.TabOS || {};
  const storage = root.storage;
  const { escapeHtml } = root.utils;

  let currentFolders = [];
  let currentSearchQuery = '';

  function isChromeExtension() {
    return typeof chrome !== 'undefined' && Boolean(chrome.bookmarks && chrome.bookmarks.getTree);
  }

  function extractFoldersFromTree(nodes, path = '') {
    let folders = [];
    for (const node of nodes) {
      if (!node.url && node.children) {
        let name = node.title;
        if (!name) {
          if (node.id === '1') name = 'Bookmarks Bar';
          else if (node.id === '2') name = 'Other Bookmarks';
          else if (node.id === '3') name = 'Mobile Bookmarks';
          else name = 'Root Folder';
        }
        const fullPath = path ? `${path} / ${name}` : name;
        const directBookmarks = node.children.filter(c => c.url).length;
        folders.push({
          id: node.id,
          title: fullPath,
          rawTitle: name,
          count: directBookmarks,
          node: node,
        });
        folders = folders.concat(extractFoldersFromTree(node.children, fullPath));
      }
    }
    return folders;
  }

  function extractBookmarksFromNode(node, list) {
    if (node.url && /^https?:\/\//i.test(node.url)) {
      list.push({ title: node.title || node.url, url: node.url });
    }
    if (node.children) {
      for (const child of node.children) {
        extractBookmarksFromNode(child, list);
      }
    }
  }

  function slugify(text) {
    return String(text || 'bm')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 24) || 'bm';
  }

  function loadBookmarkFolders(onLoaded) {
    const select = document.getElementById('scBookmarkFolderSelect');
    const statusEl = document.getElementById('scBookmarkStatus');
    if (!select) return;

    select.innerHTML = '<option value="">-- Choose Bookmark Folder --</option>';

    if (isChromeExtension()) {
      try {
        chrome.bookmarks.getTree(tree => {
          currentFolders = extractFoldersFromTree(tree);
          const savedFolder = storage.getRaw(storage.keys.bookmarkFolder) || '';

          currentFolders.forEach(folder => {
            const opt = document.createElement('option');
            opt.value = folder.id;
            opt.textContent = `${folder.title} (${folder.count} bookmarks)`;
            if (String(folder.id) === String(savedFolder) || folder.rawTitle === savedFolder || folder.title === savedFolder) {
              opt.selected = true;
            }
            select.appendChild(opt);
          });

          if (savedFolder && statusEl) {
            const matched = currentFolders.find(f => String(f.id) === String(savedFolder) || f.rawTitle === savedFolder || f.title === savedFolder);
            if (matched) {
              storage.setRaw(storage.keys.bookmarkFolderTitle, matched.title);
              statusEl.textContent = `Active synced folder: "${matched.title}"`;
            }
          }
          if (typeof onLoaded === 'function') onLoaded(currentFolders);
        });
      } catch (err) {
        console.warn('Failed to load Chrome bookmarks:', err);
      }
    } else {
      // Running in web preview / dev server environment
      const webPresetFolders = [
        { id: 'web-work', title: 'Work Bookmarks', rawTitle: 'Work Bookmarks', count: 3, bookmarks: [
          { title: 'GitHub Dashboard', url: 'https://github.com' },
          { title: 'Google Docs', url: 'https://docs.google.com' },
          { title: 'Stack Overflow', url: 'https://stackoverflow.com' },
        ]},
        { id: 'web-social', title: 'Daily & Social', rawTitle: 'Daily & Social', count: 3, bookmarks: [
          { title: 'Reddit', url: 'https://reddit.com' },
          { title: 'Twitter / X', url: 'https://twitter.com' },
          { title: 'Hacker News', url: 'https://news.ycombinator.com' },
        ]},
      ];
      currentFolders = webPresetFolders;
      const savedFolder = storage.getRaw(storage.keys.bookmarkFolder) || '';

      webPresetFolders.forEach(folder => {
        const opt = document.createElement('option');
        opt.value = folder.id;
        opt.textContent = `${folder.title} (${folder.count} links)`;
        if (folder.id === savedFolder || folder.title === savedFolder) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });

      if (savedFolder && statusEl) {
        const matched = currentFolders.find(f => f.id === savedFolder || f.title === savedFolder);
        if (matched) {
          storage.setRaw(storage.keys.bookmarkFolderTitle, matched.title);
          statusEl.textContent = `Active synced folder: "${matched.title}"`;
        }
      } else if (statusEl) {
        statusEl.innerHTML = `<span style="opacity:0.85;">💡 <em>When loaded in Chrome as an extension, your real browser bookmark folders appear here automatically!</em></span>`;
      }
      if (typeof onLoaded === 'function') onLoaded(currentFolders);
    }
  }

  function saveAndSyncFolder(folderId) {
    const statusEl = document.getElementById('scBookmarkStatus');
    if (!folderId) {
      if (statusEl) {
        statusEl.textContent = 'Please choose a bookmark folder first.';
        statusEl.style.color = 'var(--red)';
      }
      return;
    }

    storage.setRaw(storage.keys.bookmarkFolder, String(folderId));
    const matched = currentFolders.find(f => String(f.id) === String(folderId) || f.rawTitle === folderId || f.title === folderId);
    if (matched) {
      storage.setRaw(storage.keys.bookmarkFolderTitle, matched.title);
    }

    syncFolder(folderId);
  }

  function syncFolder(folderId) {
    const statusEl = document.getElementById('scBookmarkStatus');
    if (!folderId) {
      if (statusEl) {
        statusEl.textContent = 'Please choose a bookmark folder first.';
        statusEl.style.color = 'var(--red)';
      }
      return;
    }

    if (isChromeExtension()) {
      chrome.bookmarks.getTree(tree => {
        const bookmarks = [];
        function find(nodes) {
          for (const n of nodes) {
            if (String(n.id) === String(folderId) || (n.title && n.title.toLowerCase() === folderId.toLowerCase())) {
              extractBookmarksFromNode(n, bookmarks);
              return true;
            }
            if (n.children && find(n.children)) return true;
          }
          return false;
        }
        find(tree);

        applySyncedBookmarks(bookmarks, folderId);
      });
    } else {
      // Web preview fallback
      const found = currentFolders.find(f => f.id === folderId || f.title === folderId);
      if (found && found.bookmarks) {
        applySyncedBookmarks(found.bookmarks, folderId);
      } else {
        if (statusEl) statusEl.textContent = 'Folder not found.';
      }
    }
  }

  function applySyncedBookmarks(bookmarks, folderId) {
    const statusEl = document.getElementById('scBookmarkStatus');
    const existing = (root.shortcuts && root.shortcuts.all) ? root.shortcuts.all() : {};
    const newMap = {};

    const matched = currentFolders.find(f => String(f.id) === String(folderId) || f.rawTitle === folderId || f.title === folderId);
    const folderTitle = matched ? (matched.rawTitle || matched.title) : (storage.getRaw(storage.keys.bookmarkFolderTitle) || folderId);

    bookmarks.forEach(bm => {
      const baseSlug = slugify(bm.title);
      let slug = baseSlug;
      let counter = 1;
      while (newMap[slug] || (existing[slug] && existing[slug].type === 'custom')) {
        slug = `${baseSlug}-${counter++}`;
      }
      newMap[slug] = {
        url: bm.url,
        desc: bm.title || bm.url,
        type: 'bookmark',
        folder: folderId,
        folderTitle: folderTitle,
      };
    });

    if (root.shortcuts && root.shortcuts.setBookmarkShortcuts) {
      root.shortcuts.setBookmarkShortcuts(newMap);
    }
    storage.setRaw(storage.keys.bookmarkFolder, String(folderId));
    storage.setRaw(storage.keys.bookmarkFolderTitle, folderTitle);

    const count = Object.keys(newMap).length;
    if (statusEl) {
      statusEl.textContent = `✓ Saved & synced folder "${folderTitle}" (${count} bookmark${count === 1 ? '' : 's'})!`;
      statusEl.style.color = 'var(--accent)';
    }

    renderShortcutsList();
  }

  function renderShortcutsList() {
    const container = document.getElementById('scListContainer');
    const countEl = document.getElementById('scCount');
    if (!container || !root.shortcuts) return;

    const all = root.shortcuts.all();
    const query = currentSearchQuery.trim().toLowerCase();

    const filtered = Object.entries(all).filter(([key, val]) => {
      if (!query) return true;
      return key.toLowerCase().includes(query) ||
        (val.desc && val.desc.toLowerCase().includes(query)) ||
        (val.url && val.url.toLowerCase().includes(query));
    });

    if (countEl) countEl.textContent = Object.keys(all).length;

    if (!filtered.length) {
      container.innerHTML = `<div style="padding:16px;text-align:center;color:var(--fg2);font-size:11px;">No shortcuts match "${escapeHtml(query)}"</div>`;
      return;
    }

    container.innerHTML = filtered.map(([key, val]) => {
      const type = val.type || (key in (root.shortcuts.builtins ? root.shortcuts.builtins() : {}) ? 'builtin' : 'custom');
      const isCustom = type === 'custom';
      const isBookmark = type === 'bookmark';
      const tagClass = isCustom ? 'custom' : isBookmark ? 'bookmark' : '';
      const tagLabel = isCustom ? 'Custom' : isBookmark ? 'Bookmark' : 'Built-in';

      return `
        <div class="sm-item" data-key="${escapeHtml(key)}">
          <div class="sm-item-left">
            <span class="sm-item-tag ${tagClass}">${tagLabel}</span>
            <span class="sm-item-name">/${escapeHtml(key)}</span>
            <span class="sm-item-desc" title="${escapeHtml(val.url)}">${escapeHtml(val.desc || val.url)}</span>
          </div>
          <div class="sm-item-actions">
            <a href="${escapeHtml(val.url)}" class="sm-btn-icon" target="_blank" rel="noopener" title="Open ${escapeHtml(val.url)}">Open ↗</a>
            <button type="button" class="sm-btn-icon del sc-delete-btn" data-key="${escapeHtml(key)}" title="${isCustom || isBookmark ? 'Delete shortcut' : 'Disable shortcut'}">
              ${isCustom || isBookmark ? '✕' : 'Disable'}
            </button>
          </div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.sc-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const key = e.currentTarget.dataset.key;
        if (root.shortcuts && root.shortcuts.delete) {
          root.shortcuts.delete(key);
          renderShortcutsList();
        }
      });
    });
  }

  function openModal() {
    const modal = document.getElementById('shortcutsModal');
    if (!modal) return;
    modal.classList.add('show');
    loadBookmarkFolders();
    renderShortcutsList();
    const nameInput = document.getElementById('scNameInput');
    if (nameInput) setTimeout(() => nameInput.focus(), 50);
  }

  function closeModal() {
    const modal = document.getElementById('shortcutsModal');
    if (modal) modal.classList.remove('show');
  }

  function init() {
    const btn = document.getElementById('shortcutsBtn');
    if (btn) btn.addEventListener('click', openModal);

    const closeBtn = document.getElementById('shortcutsModalClose');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    const doneBtn = document.getElementById('shortcutsModalDone');
    if (doneBtn) doneBtn.addEventListener('click', closeModal);

    const modal = document.getElementById('shortcutsModal');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }

    // Add shortcut form
    const addBtn = document.getElementById('addShortcutBtn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const nameInput = document.getElementById('scNameInput');
        const urlInput = document.getElementById('scUrlInput');
        const descInput = document.getElementById('scDescInput');

        const name = (nameInput ? nameInput.value : '').trim();
        const url = (urlInput ? urlInput.value : '').trim();
        const desc = (descInput ? descInput.value : '').trim() || name;

        if (!name || !url) {
          if (nameInput && !name) nameInput.focus();
          else if (urlInput && !url) urlInput.focus();
          return;
        }

        if (root.shortcuts && root.shortcuts.add) {
          root.shortcuts.add(name, url, desc);
          if (nameInput) nameInput.value = '';
          if (urlInput) urlInput.value = '';
          if (descInput) descInput.value = '';
          renderShortcutsList();
          if (nameInput) nameInput.focus();
        }
      });
    }

    // Bookmark sync button & auto-save on select change
    const folderSelect = document.getElementById('scBookmarkFolderSelect');
    if (folderSelect) {
      folderSelect.addEventListener('change', (e) => {
        const folderId = e.target.value;
        if (folderId) {
          saveAndSyncFolder(folderId);
        }
      });
    }

    const syncBtn = document.getElementById('syncBookmarksBtn');
    if (syncBtn) {
      syncBtn.addEventListener('click', () => {
        const select = document.getElementById('scBookmarkFolderSelect');
        const folderId = select ? select.value : '';
        if (folderId) {
          saveAndSyncFolder(folderId);
        } else {
          const statusEl = document.getElementById('scBookmarkStatus');
          if (statusEl) {
            statusEl.textContent = 'Please choose a bookmark folder first.';
            statusEl.style.color = 'var(--red)';
          }
        }
      });
    }

    // Load folders immediately on startup
    loadBookmarkFolders((folders) => {
      const savedFolder = storage.getRaw(storage.keys.bookmarkFolder);
      const existingBms = storage.getJson(storage.keys.bookmarkShortcuts, {});
      if (savedFolder && Object.keys(existingBms).length === 0) {
        syncFolder(savedFolder);
      }
    });

    // Search filter
    const searchInput = document.getElementById('scSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value;
        renderShortcutsList();
      });
    }

    // Escape key closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const smModal = document.getElementById('shortcutsModal');
        if (smModal && smModal.classList.contains('show')) {
          closeModal();
        }
      }
    });
  }

  root.shortcutsUI = {
    init,
    open: openModal,
    close: closeModal,
    render: renderShortcutsList,
    syncFolder: saveAndSyncFolder,
    getFolders: () => currentFolders,
    getCurrentFolder: () => ({
      id: storage.getRaw(storage.keys.bookmarkFolder) || '',
      title: storage.getRaw(storage.keys.bookmarkFolderTitle) || storage.getRaw(storage.keys.bookmarkFolder) || ''
    }),
    syncCurrentFolder: () => {
      const savedFolder = storage.getRaw(storage.keys.bookmarkFolder);
      if (savedFolder) saveAndSyncFolder(savedFolder);
      else openModal();
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
