(() => {
  'use strict';

  const API = '/.netlify/functions/';
  const SITE = 'https://soickermarrec.de/';
  const SECTION_CONFIG = {
    painting: { label: 'Malerei', root: 'images/painting', kind: 'art' },
    graphic: { label: 'Grafik', root: 'images/ink', kind: 'art' },
    exhibitions: { label: 'Ausstellung', root: 'images/exhibitions', kind: 'series' },
    architecture: { label: 'Arch.0', root: 'images/architecture', kind: 'series' },
    xxx: { label: 'Fotografie', root: 'images/foto1/fotogalerie_sortiert', kind: 'series' },
  };
  const SITE_IMAGES = [
    { label: 'About – Hauptbild', path: 'images/about.webp' },
    { label: 'Kontakt – Hauptbild', path: 'images/contact.webp' },
    { label: 'Social Preview – Standard (ideal 1200 × 630)', path: 'images/social-preview.jpg' },
  ];

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const loginShell = $('#loginShell');
  const appShell = $('#appShell');
  const loginForm = $('#loginForm');
  const loginMessage = $('#loginMessage');
  const workspaceTitle = $('#workspaceTitle');
  const workspaceEyebrow = $('#workspaceEyebrow');
  const workspaceContent = $('#workspaceContent');
  const headerActions = $('#headerActions');
  const statusLine = $('#statusLine');
  const sectionNav = $('#sectionNav');
  const editorDialog = $('#editorDialog');
  const mediaDialog = $('#mediaDialog');
  const toast = $('#toast');

  const state = {
    view: 'painting',
    section: 'painting',
    works: [],
    media: [],
    mediaLoaded: false,
    editor: null,
    picker: null,
    busy: false,
    landingConfig: null,
    customPages: [],
  };

  async function api(name, options = {}) {
    const res = await fetch(`${API}${name}`, {
      credentials: 'same-origin',
      cache: 'no-store',
      ...options,
      headers: {
        ...(options.body ? { 'content-type': 'application/json' } : {}),
        ...(options.headers || {}),
      },
    });
    let data = {};
    try { data = await res.json(); } catch {}
    if (!res.ok || data.ok === false) {
      if (res.status === 401 && name !== 'login') showLogin();
      throw new Error(data.error || `Fehler ${res.status}`);
    }
    return data;
  }

  function setStatus(message = '', isError = false) {
    statusLine.textContent = message;
    statusLine.style.color = isError ? '#9a4242' : '';
  }

  let toastTimer;
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
  }

  function showLogin() {
    appShell.hidden = true;
    loginShell.hidden = false;
    setTimeout(() => $('#passwordInput')?.focus(), 20);
  }

  function showApp() {
    loginShell.hidden = true;
    appShell.hidden = false;
  }

  async function boot() {
    try {
      await api('session');
      showApp();
      await setView('painting');
    } catch {
      showLogin();
    }
  }

  loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    loginMessage.textContent = '';
    const button = loginForm.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      await api('login', { method: 'POST', body: JSON.stringify({ password: $('#passwordInput').value }) });
      $('#passwordInput').value = '';
      showApp();
      await setView('painting');
    } catch (error) {
      loginMessage.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  });

  $('#logoutButton').addEventListener('click', async () => {
    try { await api('logout', { method: 'POST', body: '{}' }); } catch {}
    showLogin();
  });

  $('#mobileMenuButton').addEventListener('click', () => $('.sidebar').classList.toggle('is-open'));

  sectionNav.addEventListener('click', async event => {
    const button = event.target.closest('button[data-view]');
    if (!button) return;
    $('.sidebar').classList.remove('is-open');
    await setView(button.dataset.view);
  });

  function markActiveNav(view) {
    $$('button[data-view]', sectionNav).forEach(button => button.classList.toggle('is-active', button.dataset.view === view));
  }

  async function setView(view) {
    state.view = view;
    markActiveNav(view);
    headerActions.innerHTML = '';
    workspaceContent.innerHTML = '';
    setStatus('Lade …');

    if (SECTION_CONFIG[view]) {
      state.section = view;
      workspaceEyebrow.textContent = 'Portfolio';
      workspaceTitle.textContent = SECTION_CONFIG[view].label;
      const add = button('Neues Projekt', 'primary', () => openProjectEditor(-1));
      headerActions.appendChild(add);
      if (view === 'xxx') {
        headerActions.prepend(button('Alle Bilder nach Sättigung', 'secondary', sortAllPhotographyBySaturation));
      }
      try {
        const data = await api(`content?section=${encodeURIComponent(view)}`);
        state.works = Array.isArray(data.works) ? data.works : [];
        renderProjects();
        setStatus(`${state.works.length} ${state.works.length === 1 ? 'Projekt' : 'Projekte'} · Änderungen werden direkt auf GitHub veröffentlicht.`);
      } catch (error) {
        setStatus(error.message, true);
      }
      return;
    }

    if (view === 'pages') {
      workspaceEyebrow.textContent = 'Website';
      workspaceTitle.textContent = 'Seiten';
      headerActions.appendChild(button('Neue Seite', 'primary', () => openPageEditor()));
      await renderPages();
      return;
    }

    if (view === 'media') {
      workspaceEyebrow.textContent = 'Dateien';
      workspaceTitle.textContent = 'Mediathek';
      await renderMediaPage();
      return;
    }

    if (view === 'site-images') {
      workspaceEyebrow.textContent = 'Website';
      workspaceTitle.textContent = 'Seitenbilder';
      renderSiteImages();
      setStatus('Diese Uploads ersetzen das jeweilige Bild direkt auf der Website.');
      return;
    }

    if (view === 'landing-backgrounds') {
      workspaceEyebrow.textContent = 'Landingpage';
      workspaceTitle.textContent = 'Hintergrund-Slots';
      await renderLandingBackgrounds();
      return;
    }
  }

  function button(text, className, onClick) {
    const el = document.createElement('button');
    el.type = 'button';
    el.textContent = text;
    if (className) el.className = className;
    if (onClick) el.addEventListener('click', onClick);
    return el;
  }

  function toRepoPath(path = '') {
    return String(path).replace(/^\.\.\//, '').replace(/^\/+/, '');
  }

  function toDataPath(path = '') {
    const clean = toRepoPath(path);
    return clean ? `../${clean}` : '';
  }

  function publicUrl(path = '') {
    return `${SITE}${encodeURI(toRepoPath(path))}?studio=${Date.now()}`;
  }

  function studioImageUrl(path = '') {
    return `${API}image-proxy?path=${encodeURIComponent(toRepoPath(path))}&v=${Date.now()}`;
  }

  function workImages(work) {
    if (Array.isArray(work.images) && work.images.length) return work.images.filter(Boolean);
    return work.image ? [work.image] : [];
  }

  function workDetails(work) {
    if (Array.isArray(work.details)) return work.details.filter(Boolean);
    const out = [];
    if (work.details?.left) out.push(work.details.left);
    if (work.details?.right) out.push(work.details.right);
    return out;
  }

  function renderProjects() {
    workspaceContent.innerHTML = '';
    if (!state.works.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = '<p>Noch keine Projekte.</p>';
      empty.appendChild(button('Erstes Projekt anlegen', 'primary', () => openProjectEditor(-1)));
      workspaceContent.appendChild(empty);
      return;
    }

    const list = document.createElement('div');
    list.className = 'project-list';
    state.works.forEach((work, index) => list.appendChild(projectCard(work, index)));
    workspaceContent.appendChild(list);
  }

  function projectCard(work, index) {
    const card = document.createElement('article');
    card.className = 'project-card';
    card.draggable = true;
    card.dataset.index = index;
    const images = workImages(work);

    const thumb = document.createElement('div');
    thumb.className = `project-thumb${images.length ? '' : ' empty'}`;
    if (images[0]) {
      const img = document.createElement('img');
      img.src = publicUrl(images[0]);
      img.alt = '';
      img.loading = 'lazy';
      thumb.appendChild(img);
      if (images.length > 1) {
        const count = document.createElement('span');
        count.className = 'project-count';
        count.textContent = `${images.length} Bilder`;
        thumb.appendChild(count);
      }
    } else {
      thumb.textContent = 'Kein Bild';
    }

    const body = document.createElement('div');
    body.className = 'project-card-body';
    const title = document.createElement('div');
    title.className = 'project-card-title';
    title.textContent = work.title || 'Untitled';
    const meta = document.createElement('div');
    meta.className = 'project-card-meta';
    meta.textContent = [work.medium, work.dimensions].filter(Boolean).join(' · ') || '—';
    const actions = document.createElement('div');
    actions.className = 'project-card-actions';
    const handle = document.createElement('span');
    handle.className = 'drag-handle';
    handle.textContent = '⋮⋮';
    handle.title = 'Zum Sortieren ziehen';
    actions.append(handle, button('Bearbeiten', 'secondary', () => openProjectEditor(index)));
    body.append(title, meta, actions);
    card.append(thumb, body);

    card.addEventListener('dragstart', event => {
      card.classList.add('is-dragging');
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(index));
    });
    card.addEventListener('dragend', () => card.classList.remove('is-dragging'));
    card.addEventListener('dragover', event => { event.preventDefault(); card.classList.add('drag-over'); });
    card.addEventListener('dragleave', () => card.classList.remove('drag-over'));
    card.addEventListener('drop', async event => {
      event.preventDefault();
      card.classList.remove('drag-over');
      const from = Number(event.dataTransfer.getData('text/plain'));
      const to = Number(card.dataset.index);
      if (!Number.isInteger(from) || from === to) return;
      const [moved] = state.works.splice(from, 1);
      state.works.splice(to, 0, moved);
      renderProjects();
      try {
        setStatus('Reihenfolge wird gespeichert …');
        await saveWorks();
        setStatus('Reihenfolge veröffentlicht.');
      } catch (error) {
        setStatus(error.message, true);
      }
    });
    return card;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function slugify(value = '') {
    return String(value)
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 52) || 'untitled';
  }

  function deriveFolder(work, config) {
    const first = toRepoPath(workImages(work)[0] || '');
    const prefix = `${config.root}/`;
    if (first.startsWith(prefix)) {
      const rest = first.slice(prefix.length);
      const segment = rest.split('/')[0];
      if (segment && rest.includes('/')) return segment;
    }
    return slugify(work.title || 'untitled');
  }

  function workShareId(work, index, config = SECTION_CONFIG[state.section]) {
    if (work?.shareId) return slugify(work.shareId);
    const folder = deriveFolder(work || {}, config);
    if (folder && folder !== 'untitled') return slugify(folder);
    return slugify(work?.title || `werk-${Math.max(0, index) + 1}`);
  }

  function openProjectEditor(index) {
    const config = SECTION_CONFIG[state.section];
    const isNew = index < 0;
    const work = isNew ? { title: '', medium: '', dimensions: '', availability: '', text: '', images: [] } : clone(state.works[index]);
    let mainPaths = workImages(work);
    let detailPaths = workDetails(work);
    // Older Holzdruck entries stored all wood prints as main images. Migrate
    // them in the editor without deleting a single repository path.
    if ((work.layout === 'multiple' || work.layout === 'six-grid' || work.layout === 'portrait-eight-grid' || /holz/i.test(work.title || '')) && mainPaths.length > 1) {
      detailPaths = [...mainPaths.slice(1), ...detailPaths];
      mainPaths = mainPaths.slice(0, 1);
    }
    const main = mainPaths.map(path => ({ path: toRepoPath(path), preview: publicUrl(path) }));
    const details = [...new Set(detailPaths)].map(path => ({ path: toRepoPath(path), preview: publicUrl(path) }));
    state.editor = { index, isNew, work, main, details, config };

    $('#editorTitle').textContent = isNew ? 'Neues Projekt' : (work.title || 'Untitled');
    $('#fieldTitle').value = work.title || '';
    $('#fieldMedium').value = work.medium || '';
    $('#fieldDimensions').value = work.dimensions || '';
    $('#fieldAvailability').value = work.availability || '';
    $('#fieldText').value = work.text || '';
    $('#fieldLayout').value = work.layout || '';
    $('#layoutField').hidden = config.kind !== 'art';
    $('#fieldFolder').value = deriveFolder(work, config);
    $('#folderPrefix').textContent = `${config.root}/`;
    const folderField = document.querySelector('.folder-field');
    if (folderField) folderField.hidden = state.section === 'xxx';
    $('#detailSection').hidden = config.kind !== 'art';
    $('#sortMainBySaturation').hidden = state.section !== 'xxx';
    $('#deleteProjectButton').hidden = isNew;
    renderEditorImages();
    editorDialog.showModal();
  }

  function renderEditorImages() {
    const editor = state.editor;
    if (!editor) return;
    const strip = $('#mainImageStrip');
    strip.innerHTML = '';
    editor.main.forEach((item, index) => {
      const box = document.createElement('div');
      box.className = 'image-item';
      box.draggable = true;
      box.dataset.index = index;
      const img = document.createElement('img');
      img.src = item.preview || publicUrl(item.path);
      img.alt = '';
      const remove = button('×', 'image-remove', () => {
        if (item.preview?.startsWith('blob:')) URL.revokeObjectURL(item.preview);
        editor.main.splice(index, 1);
        renderEditorImages();
      });
      remove.setAttribute('aria-label', 'Bild entfernen');
      const path = document.createElement('span');
      path.className = 'image-path';
      path.textContent = item.file ? item.file.name : item.path;
      box.append(img, remove, path);
      box.addEventListener('dragstart', event => {
        box.classList.add('is-dragging');
        event.dataTransfer.setData('text/plain', String(index));
      });
      box.addEventListener('dragend', () => box.classList.remove('is-dragging'));
      box.addEventListener('dragover', event => event.preventDefault());
      box.addEventListener('drop', event => {
        event.preventDefault();
        const from = Number(event.dataTransfer.getData('text/plain'));
        const to = Number(box.dataset.index);
        if (!Number.isInteger(from) || from === to) return;
        const [moved] = editor.main.splice(from, 1);
        editor.main.splice(to, 0, moved);
        renderEditorImages();
      });
      strip.appendChild(box);
    });
    renderDetailImages();
  }

  function renderDetailImages() {
    const editor = state.editor;
    const strip = $('#detailImageStrip');
    if (!editor || !strip) return;
    strip.innerHTML = '';
    editor.details.forEach((item, index) => {
      const box = document.createElement('div');
      box.className = 'image-item';
      box.draggable = true;
      box.dataset.index = index;
      const img = document.createElement('img');
      img.src = item.preview || publicUrl(item.path);
      img.alt = '';
      const remove = button('×', 'image-remove', () => {
        if (item.preview?.startsWith('blob:')) URL.revokeObjectURL(item.preview);
        editor.details.splice(index, 1);
        renderDetailImages();
      });
      remove.setAttribute('aria-label', 'Detailbild entfernen');
      const path = document.createElement('span');
      path.className = 'image-path';
      path.textContent = item.file ? item.file.name : item.path;
      box.append(img, remove, path);
      box.addEventListener('dragstart', event => {
        box.classList.add('is-dragging');
        event.dataTransfer.setData('text/plain', String(index));
      });
      box.addEventListener('dragend', () => box.classList.remove('is-dragging'));
      box.addEventListener('dragover', event => event.preventDefault());
      box.addEventListener('drop', event => {
        event.preventDefault();
        const from = Number(event.dataTransfer.getData('text/plain'));
        const to = Number(box.dataset.index);
        if (!Number.isInteger(from) || from === to) return;
        const [moved] = editor.details.splice(from, 1);
        editor.details.splice(to, 0, moved);
        renderDetailImages();
      });
      strip.appendChild(box);
    });
  }

  $('#fieldTitle').addEventListener('input', () => {
    if (!state.editor?.isNew) return;
    const folder = $('#fieldFolder');
    if (!folder.dataset.touched) folder.value = slugify($('#fieldTitle').value);
  });
  $('#fieldFolder').addEventListener('input', event => { event.target.dataset.touched = '1'; });

  $('#mainImageInput').addEventListener('change', event => {
    const files = [...event.target.files];
    files.forEach(file => state.editor.main.push({ file, preview: URL.createObjectURL(file) }));
    event.target.value = '';
    renderEditorImages();
  });

  $('#detailImageInput').addEventListener('change', event => {
    const files = [...event.target.files];
    files.forEach(file => state.editor.details.push({ file, preview: URL.createObjectURL(file) }));
    event.target.value = '';
    renderDetailImages();
  });

  $('#chooseDetailsFromMedia').addEventListener('click', () => openMediaPicker({ multiple: true, onPick(paths) {
    paths.forEach(path => {
      if (!state.editor.details.some(item => item.path === path)) {
        state.editor.details.push({ path, preview: publicUrl(path) });
      }
    });
    renderDetailImages();
  }}));

  $('#cancelEditorButton').addEventListener('click', () => editorDialog.close());

  $('#deleteProjectButton').addEventListener('click', async () => {
    const editor = state.editor;
    if (!editor || editor.isNew) return;
    if (!confirm(`„${editor.work.title || 'Untitled'}“ wirklich von der Seite entfernen? Die Bilddateien bleiben in der Mediathek.`)) return;
    const deleteShareId = editor.config.kind === 'art' ? workShareId(editor.work, editor.index, editor.config) : '';
    state.works.splice(editor.index, 1);
    try {
      setBusy(true);
      await saveWorks({ deleteShareId });
      editorDialog.close();
      renderProjects();
      showToast('Projekt entfernt');
    } catch (error) {
      alert(error.message);
    } finally { setBusy(false); }
  });

  $('#saveProjectButton').addEventListener('click', saveProject);

  function cleanFolder(value) {
    return slugify(value || 'untitled');
  }

  function nextPhotographyNumber(paths, rootPath) {
    const prefix = `${rootPath}/`;
    let max = 0;
    for (const raw of paths || []) {
      const path = toRepoPath(raw);
      if (!path.startsWith(prefix)) continue;
      const name = path.slice(prefix.length);
      const match = name.match(/^(\d+)\.(?:jpe?g|png|webp)$/i);
      if (match) max = Math.max(max, Number(match[1]));
    }
    return max + 1;
  }


  async function analysisBlobForItem(item) {
    if (item.file) return item.file;
    if (item.path) {
      const response = await fetch(`${API}image-proxy?path=${encodeURIComponent(toRepoPath(item.path))}`, {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`Bild konnte nicht analysiert werden: ${item.path}`);
      return response.blob();
    }
    return null;
  }

  function navColorContrastAgainstWhite(rgb) {
    const channel = value => {
      const c = value / 255;
      return c <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4);
    };
    const luminance = .2126 * channel(rgb[0]) + .7152 * channel(rgb[1]) + .0722 * channel(rgb[2]);
    return 1.05 / (luminance + .05);
  }

  function readableNavColor(rgb, minContrast = 4.5) {
    const source = rgb.map(value => Math.max(0, Math.min(255, value)));
    if (navColorContrastAgainstWhite(source) >= minContrast) return source.map(Math.round);
    let low = 0, high = 1, best = [65, 65, 65];
    for (let i = 0; i < 24; i++) {
      const factor = (low + high) / 2;
      const candidate = source.map(value => value * factor);
      if (navColorContrastAgainstWhite(candidate) >= minContrast) {
        best = candidate.map(Math.round);
        low = factor;
      } else {
        high = factor;
      }
    }
    return best;
  }

  async function representativeColorForItem(item) {
    const blob = await analysisBlobForItem(item);
    if (!blob) return null;
    const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
    const maxSide = 128;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const data = ctx.getImageData(0, 0, width, height).data;
    let r = 0, g = 0, b = 0, weight = 0;
    let fallbackR = 0, fallbackG = 0, fallbackB = 0, fallbackN = 0;
    for (let i = 0; i < data.length; i += 4) {
      const pr = data[i], pg = data[i + 1], pb = data[i + 2];
      fallbackR += pr; fallbackG += pg; fallbackB += pb; fallbackN++;
      const max = Math.max(pr, pg, pb);
      const min = Math.min(pr, pg, pb);
      const chroma = (max - min) / 255;
      const luminance = (.2126 * pr + .7152 * pg + .0722 * pb) / 255;
      // Fast weiße neutrale Bildränder werden nicht als "Projektfarbe" gewertet.
      // Helle, tatsächlich farbige Pixel bleiben dagegen erhalten.
      if (luminance > .94 && chroma < .09) continue;
      const w = .35 + 1.25 * chroma + .35 * (1 - luminance);
      r += pr * w; g += pg * w; b += pb * w; weight += w;
    }
    if (weight) return [r / weight, g / weight, b / weight];
    return fallbackN ? [fallbackR / fallbackN, fallbackG / fallbackN, fallbackB / fallbackN] : null;
  }

  async function projectNavColorForItems(items) {
    const usable = (items || []).filter(item => item?.file || item?.path);
    if (!usable.length) return '';
    // Sehr große Fotoreihen werden gleichmäßig abgetastet, damit ein Studio-Save
    // nicht dutzende Originaldateien nur für die Navigatorfarbe laden muss.
    const sample = usable.length <= 12
      ? usable
      : Array.from({ length: 12 }, (_, i) => usable[Math.round(i * (usable.length - 1) / 11)]);
    const colors = [];
    for (const item of sample) {
      const color = await representativeColorForItem(item);
      if (color) colors.push(color);
    }
    if (!colors.length) return '';
    const average = [0, 1, 2].map(channel => colors.reduce((sum, color) => sum + color[channel], 0) / colors.length);
    const [r, g, b] = readableNavColor(average);
    return `#${[r, g, b].map(value => value.toString(16).padStart(2, '0')).join('')}`;
  }

  async function saturationScoreForItem(item) {
    let blob;
    if (item.file) {
      blob = item.file;
    } else if (item.path) {
      const response = await fetch(`${API}image-proxy?path=${encodeURIComponent(toRepoPath(item.path))}`, {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`Bild konnte nicht analysiert werden: ${item.path}`);
      blob = await response.blob();
    } else {
      return 0;
    }
    const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
    const maxSide = 160;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const data = ctx.getImageData(0, 0, w, h).data;
    let sum = 0, weightSum = 0;
    for (let i = 0; i < data.length; i += 16) { // jedes vierte Pixel genügt
      const r = data[i] / 255, g = data[i + 1] / 255, b = data[i + 2] / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const sat = max === 0 ? 0 : (max - min) / max;
      // Sehr dunkle oder nahezu weiße Pixel weniger stark gewichten: relevante Bildfarbe zählt mehr.
      const valueWeight = .28 + .72 * (1 - Math.abs(max - .55) / .55);
      const weight = Math.max(.08, valueWeight);
      sum += sat * weight;
      weightSum += weight;
    }
    return weightSum ? sum / weightSum : 0;
  }

  async function sortItemsBySaturation(items) {
    const scored = [];
    for (let i = 0; i < items.length; i++) {
      setStatus(`Sättigung wird analysiert … ${i + 1}/${items.length}`);
      scored.push({ item: items[i], score: await saturationScoreForItem(items[i]), original: i });
    }
    scored.sort((a, b) => (b.score - a.score) || (a.original - b.original));
    return scored.map(entry => entry.item);
  }

  $('#sortMainBySaturation').addEventListener('click', async () => {
    if (!state.editor || state.section !== 'xxx' || state.editor.main.length < 2) return;
    const btn = $('#sortMainBySaturation');
    btn.disabled = true;
    try {
      state.editor.main = await sortItemsBySaturation(state.editor.main);
      renderEditorImages();
      showToast('Satte Bilder oben, ungesättigte unten');
      setStatus('Automatisch sortiert. Du kannst die Reihenfolge jetzt per Drag & Drop weiter ändern.');
    } catch (error) {
      setStatus(error.message, true);
    } finally {
      btn.disabled = false;
    }
  });

  async function sortAllPhotographyBySaturation() {
    if (state.section !== 'xxx' || !state.works.length) return;
    if (!confirm('Alle Bilder innerhalb der Fotografie-Projekte nach Sättigung sortieren? Satte Bilder stehen danach oben; anschließend kannst du weiter manuell sortieren.')) return;
    try {
      for (let wi = 0; wi < state.works.length; wi++) {
        const work = state.works[wi];
        const raw = workImages(work).map(path => ({ path: toRepoPath(path) }));
        if (raw.length < 2) continue;
        setStatus(`Projekt ${wi + 1}/${state.works.length}: Sättigung wird analysiert …`);
        const sorted = await sortItemsBySaturation(raw);
        work.images = sorted.map(item => toDataPath(item.path));
        delete work.image;
      }
      await saveWorks();
      renderProjects();
      showToast('Fotografie nach Sättigung sortiert');
      setStatus('Gespeichert: satte Bilder oben, ungesättigte unten. Manuelles Drag & Drop bleibt möglich.');
    } catch (error) {
      setStatus(error.message, true);
    }
  }

  async function saveProject() {
    const editor = state.editor;
    if (!editor) return;
    if (!editor.main.length) {
      alert('Bitte mindestens ein Hauptbild hinzufügen.');
      return;
    }
    const isPhotography = state.section === 'xxx';
    const folder = isPhotography ? '' : cleanFolder($('#fieldFolder').value);
    if (!isPhotography && !folder) {
      alert('Bitte einen Ordnernamen angeben.');
      return;
    }

    try {
      setBusy(true);
      setStatus('Bilder werden optimiert und hochgeladen …');
      const stamp = new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14);
      const mainPaths = [];
      let nextPhoto = 1;
      if (isPhotography) {
        const media = await ensureMedia();
        nextPhoto = nextPhotographyNumber(media, editor.config.root);
      }
      for (let i = 0; i < editor.main.length; i++) {
        const item = editor.main[i];
        if (item.file) {
          const blob = await optimizeImage(item.file);
          const path = isPhotography
            ? `${editor.config.root}/${String(nextPhoto++).padStart(2, '0')}.webp`
            : `${editor.config.root}/${folder}/main-${stamp}-${String(i + 1).padStart(2, '0')}.webp`;
          await uploadBlob(path, blob);
          mainPaths.push(path);
        } else if (item.path) {
          mainPaths.push(item.path);
        }
      }

      const detailPaths = [];
      for (let i = 0; i < editor.details.length; i++) {
        const item = editor.details[i];
        if (item.file) {
          const blob = await optimizeImage(item.file);
          const path = `${editor.config.root}/${folder}/detail-${stamp}-${String(i + 1).padStart(2, '0')}.webp`;
          await uploadBlob(path, blob);
          detailPaths.push(path);
        } else if (item.path) {
          detailPaths.push(item.path);
        }
      }

      const titleValue = $('#fieldTitle').value.trim();
      let computedNavColor = editor.work.navColor || '';
      try {
        setStatus('Projektfarbe für den Navigator wird berechnet …');
        computedNavColor = await projectNavColorForItems(editor.main) || computedNavColor;
      } catch (error) {
        console.warn('Navigatorfarbe konnte nicht neu berechnet werden:', error);
      }
      const stableShareId = editor.config.kind === 'art'
        ? (editor.work.shareId || (!editor.isNew ? workShareId(editor.work, editor.index, editor.config) : slugify(folder || titleValue || `werk-${Date.now()}`)))
        : '';
      const updated = {
        ...editor.work,
        title: titleValue,
        medium: $('#fieldMedium').value.trim(),
        dimensions: $('#fieldDimensions').value.trim(),
        availability: $('#fieldAvailability').value.trim(),
        text: $('#fieldText').value.trim(),
        images: mainPaths.map(toDataPath),
      };
      if (computedNavColor) updated.navColor = computedNavColor;
      else delete updated.navColor;
      if (editor.config.kind === 'art' && $('#fieldLayout').value) updated.layout = $('#fieldLayout').value;
      else delete updated.layout;
      if (stableShareId) updated.shareId = stableShareId;
      delete updated.image;
      if (editor.config.kind === 'art' && detailPaths.length) {
        updated.details = detailPaths.map(toDataPath);
      } else {
        delete updated.details;
      }

      if (editor.isNew) state.works.push(updated);
      else state.works[editor.index] = updated;

      setStatus('Projektdatei und Teilen-Vorschau werden veröffentlicht …');
      await saveWorks({ shareWorkId: stableShareId });
      state.mediaLoaded = false;
      editorDialog.close();
      renderProjects();
      setStatus(`${state.works.length} Projekte · zuletzt gerade eben aktualisiert.`);
      showToast('Veröffentlicht');
    } catch (error) {
      alert(`Speichern fehlgeschlagen:\n${error.message}`);
      setStatus(error.message, true);
    } finally {
      setBusy(false);
    }
  }

  function setBusy(busy) {
    state.busy = busy;
    $$('#editorDialog button, #editorDialog input, #editorDialog textarea, #editorDialog select').forEach(el => {
      if (el.id === 'cancelEditorButton') return;
      el.disabled = busy;
    });
  }

  async function saveWorks({ shareWorkId = '', deleteShareId = '' } = {}) {
    return api('save-data', {
      method: 'POST',
      body: JSON.stringify({ section: state.section, works: state.works, shareWorkId, deleteShareId })
    });
  }

  async function optimizeImage(file, maxSide = 3000, quality = 0.94) {
    // Studio-Uploads werden standardmäßig als WebP gespeichert. 3000 px an der
    // längsten Seite reichen auch für große Retina-Darstellungen, ohne kleine
    // Dateien künstlich hochzuskalieren. Qualität 0.94 ist visuell praktisch
    // verlustfrei und reduziert die Übertragungsgröße deutlich.
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: true });
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    for (const q of [quality, 0.92, 0.89, 0.86]) {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', q));
      if (blob && blob.size <= 3_950_000) return blob;
    }
    throw new Error(`${file.name} ist auch als vorsichtig optimiertes WebP größer als 4 MB.`);
  }

  async function uploadBlob(path, blob) {
    const base64 = await blobToBase64(blob);
    return api('upload-image', { method: 'POST', body: JSON.stringify({ path, base64 }) });
  }

  async function ensureMedia() {
    if (state.mediaLoaded) return state.media;
    const data = await api('media');
    state.media = data.images || [];
    state.mediaLoaded = true;
    return state.media;
  }

  async function openMediaPicker({ multiple, onPick }) {
    state.picker = { multiple, selected: new Set(), onPick };
    $('#mediaSelectionHint').textContent = multiple ? 'Mehrere Bilder möglich' : 'Ein Bild auswählen';
    $('#mediaDoneButton').hidden = !multiple;
    $('#mediaDoneButton').disabled = true;
    $('#mediaDoneButton').textContent = 'Auswahl übernehmen';
    $('#mediaSearch').value = '';
    mediaDialog.showModal();
    $('#mediaPickerGrid').innerHTML = '<div class="empty-state">Lade Mediathek …</div>';
    try {
      await ensureMedia();
      renderMediaPicker();
    } catch (error) {
      $('#mediaPickerGrid').innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
    }
  }

  function renderMediaPicker() {
    const grid = $('#mediaPickerGrid');
    const query = $('#mediaSearch').value.trim().toLowerCase();
    grid.innerHTML = '';
    state.media.filter(path => !query || path.toLowerCase().includes(query)).forEach(path => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'media-picker-item';
      const img = document.createElement('img');
      img.src = publicUrl(path);
      img.alt = '';
      img.loading = 'lazy';
      const label = document.createElement('span');
      label.textContent = path;
      item.append(img, label);
      item.addEventListener('click', () => {
        if (state.picker.multiple) {
          if (state.picker.selected.has(path)) {
            state.picker.selected.delete(path);
            item.style.outline = '';
          } else {
            state.picker.selected.add(path);
            item.style.outline = '2px solid #2e2e2e';
          }
          $('#mediaSelectionHint').textContent = `${state.picker.selected.size} ausgewählt`;
          $('#mediaDoneButton').disabled = state.picker.selected.size === 0;
          $('#mediaDoneButton').textContent = `Auswahl übernehmen (${state.picker.selected.size})`;
        } else {
          state.picker.onPick([path]);
          mediaDialog.close();
        }
      });
      item.addEventListener('dblclick', () => {
        if (!state.picker.multiple) return;
        if (!state.picker.selected.has(path)) state.picker.selected.add(path);
        state.picker.onPick([...state.picker.selected]);
        mediaDialog.close();
      });
      grid.appendChild(item);
    });
  }

  $('#mediaSearch').addEventListener('input', renderMediaPicker);
  $('#mediaDoneButton').addEventListener('click', () => {
    if (!state.picker?.multiple || !state.picker.selected.size) return;
    state.picker.onPick([...state.picker.selected]);
    mediaDialog.close();
  });
  $('#closeMediaDialog').addEventListener('click', () => mediaDialog.close());

  async function renderMediaPage() {
    workspaceContent.innerHTML = '';
    const toolbar = document.createElement('div');
    toolbar.className = 'media-page-toolbar';
    const search = document.createElement('input');
    search.type = 'search';
    search.placeholder = 'Bilder durchsuchen …';
    const folder = document.createElement('input');
    folder.type = 'text';
    folder.value = 'images/uploads';
    folder.placeholder = 'images/ordner';
    const uploadLabel = document.createElement('label');
    uploadLabel.className = 'primary file-button';
    uploadLabel.textContent = 'Bilder ablegen';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.multiple = true;
    fileInput.hidden = true;
    uploadLabel.appendChild(fileInput);
    toolbar.append(search, folder, uploadLabel);
    const grid = document.createElement('div');
    grid.className = 'media-page-grid';
    workspaceContent.append(toolbar, grid);

    function paint() {
      const query = search.value.trim().toLowerCase();
      grid.innerHTML = '';
      state.media.filter(path => !query || path.toLowerCase().includes(query)).forEach(path => {
        const card = document.createElement('article');
        card.className = 'media-card';
        const img = document.createElement('img');
        img.src = publicUrl(path);
        img.loading = 'lazy';
        img.alt = '';
        const p = document.createElement('p');
        p.textContent = path;
        card.append(img, p);
        grid.appendChild(card);
      });
    }

    search.addEventListener('input', paint);
    fileInput.addEventListener('change', async () => {
      const files = [...fileInput.files];
      if (!files.length) return;
      let target = folder.value.trim().replace(/^\/+|\/+$/g, '');
      if (!target.startsWith('images/')) target = `images/${target}`;
      if (target.includes('..')) return alert('Ungültiger Ordner.');
      uploadLabel.style.opacity = '.55';
      fileInput.disabled = true;
      try {
        for (let i = 0; i < files.length; i++) {
          setStatus(`Upload ${i + 1}/${files.length}: ${files[i].name}`);
          const blob = await optimizeImage(files[i]);
          const base = slugify(files[i].name.replace(/\.[^.]+$/, ''));
          const path = `${target}/${base}-${Date.now()}-${i + 1}.jpg`;
          await uploadBlob(path, blob);
        }
        state.mediaLoaded = false;
        await ensureMedia();
        paint();
        showToast(`${files.length} Bilder hochgeladen`);
        setStatus(`${state.media.length} Bilder in der Mediathek.`);
      } catch (error) {
        setStatus(error.message, true);
      } finally {
        fileInput.value = '';
        fileInput.disabled = false;
        uploadLabel.style.opacity = '';
      }
    });

    try {
      await ensureMedia();
      paint();
      setStatus(`${state.media.length} Bilder im Repository. Uploads landen direkt in GitHub.`);
    } catch (error) {
      setStatus(error.message, true);
    }
  }

  function renderSiteImages() {
    workspaceContent.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'site-image-grid';
    SITE_IMAGES.forEach(target => {
      const card = document.createElement('article');
      card.className = 'site-image-card';
      const img = document.createElement('img');
      img.src = publicUrl(target.path);
      img.alt = '';
      const body = document.createElement('div');
      body.className = 'site-image-card-body';
      const title = document.createElement('h3');
      title.textContent = target.label;
      const path = document.createElement('p');
      path.textContent = target.path;
      const label = document.createElement('label');
      label.className = 'secondary file-button';
      label.textContent = 'Bild ersetzen';
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.hidden = true;
      label.appendChild(input);
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file) return;
        label.style.opacity = '.55';
        input.disabled = true;
        try {
          setStatus(`${target.label} wird ersetzt …`);
          const blob = await optimizeImage(file, 2400, .92);
          await uploadBlob(target.path, blob);
          img.src = publicUrl(target.path);
          state.mediaLoaded = false;
          showToast('Bild ersetzt');
          setStatus('Veröffentlicht. GitHub Pages benötigt eventuell kurz zum Aktualisieren.');
        } catch (error) {
          setStatus(error.message, true);
        } finally {
          input.value = '';
          input.disabled = false;
          label.style.opacity = '';
        }
      });
      body.append(title, path, label);
      card.append(img, body);
      grid.appendChild(card);
    });
    workspaceContent.appendChild(grid);
  }


  async function loadLandingConfig() {
    const data = await api('landing-config');
    state.landingConfig = data.config;
    return state.landingConfig;
  }

  async function renderLandingBackgrounds() {
    workspaceContent.innerHTML = '<div class="empty-state">Lade Hintergrund-Slots …</div>';
    try {
      const cfg = await loadLandingConfig();
      workspaceContent.innerHTML = '';
      const intro = document.createElement('p');
      intro.className = 'landing-slot-intro';
      intro.textContent = 'Mobile und Desktop haben jeweils drei feste Bild-Slots. Alle vorhandenen Bilder wechseln auf der Landingpage automatisch alle 10 Sekunden.';
      workspaceContent.appendChild(intro);

      for (const device of ['mobile', 'desktop']) {
        const section = document.createElement('section');
        section.className = 'landing-slot-section';
        const h = document.createElement('h2');
        h.textContent = device === 'mobile' ? 'Mobile' : 'Desktop / Web';
        const grid = document.createElement('div');
        grid.className = 'landing-slot-grid';
        const group = cfg[device];

        group.slots.forEach((path, index) => {
          const slotNumber = index + 1;
          const card = document.createElement('article');
          card.className = 'landing-slot-card';

          const preview = document.createElement('div');
          preview.className = 'landing-slot-preview';
          const img = document.createElement('img');
          img.src = studioImageUrl(path);
          img.alt = '';
          img.onerror = () => {
            preview.classList.add('is-empty');
            img.remove();
            preview.textContent = 'Slot leer';
          };
          preview.appendChild(img);

          const body = document.createElement('div');
          body.className = 'landing-slot-body';
          const title = document.createElement('h3');
          title.textContent = `Slot ${slotNumber}`;
          const p = document.createElement('p');
          p.textContent = path;

          const actions = document.createElement('div');
          actions.className = 'compact-actions';
          const label = document.createElement('label');
          label.className = 'secondary file-button';
          label.textContent = 'Bild ersetzen';
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.hidden = true;
          label.appendChild(input);

          input.addEventListener('change', async () => {
            const file = input.files?.[0];
            if (!file) return;
            input.disabled = true;
            label.style.opacity = '.55';

            try {
              setStatus(`${device === 'mobile' ? 'Mobile' : 'Desktop'} Slot ${slotNumber} wird hochgeladen …`);
              const blob = await optimizeImage(file, 2800, .92);
              await uploadBlob(path, blob);
              state.mediaLoaded = false;
              showToast(`Slot ${slotNumber} aktualisiert`);
              setStatus('In GitHub gespeichert. Die Studio-Vorschau liest das neue Bild direkt aus dem Repository.');
              await renderLandingBackgrounds();
            } catch (error) {
              setStatus(error.message, true);
            } finally {
              input.value = '';
              input.disabled = false;
              label.style.opacity = '';
            }
          });

          actions.append(label);
          body.append(title, p, actions);
          card.append(preview, body);
          grid.appendChild(card);
        });

        section.append(h, grid);
        workspaceContent.appendChild(section);
      }

      setStatus('3 Mobile- und 3 Desktop-Slots · Wechsel auf der Landingpage alle 10 Sekunden.');
    } catch (error) {
      workspaceContent.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
      setStatus(error.message, true);
    }
  }

  async function renderPages() {
    workspaceContent.innerHTML = '<div class="empty-state">Lade Seiten …</div>';
    try {
      const data = await api('pages');
      state.customPages = Array.isArray(data.pages) ? data.pages : [];
      workspaceContent.innerHTML = '';
      if (!state.customPages.length) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.innerHTML = '<p>Noch keine zusätzlichen Seiten.</p>';
        empty.appendChild(button('Erste Seite anlegen', 'primary', () => openPageEditor()));
        workspaceContent.appendChild(empty);
      } else {
        const list = document.createElement('div');
        list.className = 'project-list';
        state.customPages.forEach(page => {
          const card = document.createElement('article');
          card.className = 'project-card custom-page-card';
          const body = document.createElement('div');
          body.className = 'project-card-body';
          const title = document.createElement('div');
          title.className = 'project-card-title';
          title.textContent = page.title;
          const meta = document.createElement('div');
          meta.className = 'project-card-meta';
          meta.textContent = `/pages/${page.slug}.html`;
          const actions = document.createElement('div');
          actions.className = 'project-card-actions';
          const open = document.createElement('a');
          open.className = 'secondary';
          open.href = `${SITE}pages/${encodeURIComponent(page.slug)}.html`;
          open.target = '_blank';
          open.rel = 'noreferrer';
          open.textContent = 'Öffnen ↗';
          const edit = button('Bearbeiten', 'secondary', () => openPageEditor(page));
          actions.append(open, edit);
          body.append(title, meta, actions);
          card.appendChild(body);
          list.appendChild(card);
        });
        workspaceContent.appendChild(list);
      }
      setStatus(`${state.customPages.length} zusätzliche Seiten · neue Seiten werden als echte HTML-Dateien veröffentlicht.`);
    } catch (error) {
      workspaceContent.innerHTML = `<div class="empty-state">${escapeHtml(error.message)}</div>`;
      setStatus(error.message, true);
    }
  }

  function openPageEditor(page = null) {
    const dialog = $('#pageDialog');
    const existing = Boolean(page);
    $('#pageEditorTitle').textContent = existing ? page.title : 'Neue Seite';
    $('#pageTitle').value = page?.title || '';
    $('#pageSlug').value = page?.slug || '';
    $('#pageSlug').readOnly = existing;
    if (!existing) delete $('#pageSlug').dataset.touched;
    $('#pageDescription').value = page?.description || '';
    $('#pageBody').value = page?.body || '';
    $('#deletePageButton').hidden = !existing;
    dialog.dataset.originalSlug = page?.slug || '';
    dialog.showModal();
  }

  $('#pageTitle').addEventListener('input', () => {
    const slug = $('#pageSlug');
    if (!slug.readOnly && !slug.dataset.touched) slug.value = slugify($('#pageTitle').value);
  });
  $('#pageSlug').addEventListener('input', event => { event.target.dataset.touched = '1'; });
  $('#cancelPageButton').addEventListener('click', () => $('#pageDialog').close());
  $('#savePageButton').addEventListener('click', async () => {
    const title = $('#pageTitle').value.trim();
    const slug = slugify($('#pageSlug').value);
    if (!title || !slug) return alert('Bitte Titel und URL-Slug angeben.');
    try {
      $('#savePageButton').disabled = true;
      setStatus('Seite wird veröffentlicht …');
      await api('save-page', { method: 'POST', body: JSON.stringify({
        title, slug, description: $('#pageDescription').value.trim(), body: $('#pageBody').value.trim()
      }) });
      $('#pageDialog').close();
      showToast('Seite veröffentlicht');
      await renderPages();
    } catch (error) {
      alert(`Seite konnte nicht gespeichert werden:
${error.message}`);
      setStatus(error.message, true);
    } finally {
      $('#savePageButton').disabled = false;
    }
  });
  $('#deletePageButton').addEventListener('click', async () => {
    const slug = $('#pageDialog').dataset.originalSlug;
    if (!slug || !confirm(`Seite /pages/${slug}.html wirklich löschen?`)) return;
    try {
      $('#deletePageButton').disabled = true;
      await api('delete-page', { method: 'POST', body: JSON.stringify({ slug }) });
      $('#pageDialog').close();
      showToast('Seite gelöscht');
      await renderPages();
    } catch (error) {
      alert(error.message);
    } finally {
      $('#deletePageButton').disabled = false;
    }
  });

  function escapeHtml(value) {
    const div = document.createElement('div');
    div.textContent = String(value);
    return div.innerHTML;
  }

  boot();
})();
