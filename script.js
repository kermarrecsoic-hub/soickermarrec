// V9.1 Landingpage
// Desktop: exakt das bewährte Hover-/Klick-Prinzip der V8.5.
// Mobile: Links öffnen beim ersten Tap. Die Vorschauen erscheinen unabhängig
// von der Navigation automatisch in fester Bildrotation an zufälligen Spawnpunkten.

const links = [...document.querySelectorAll('.navigation a[data-preview]')];
const navigation = document.querySelector('.navigation');
const previewLink = document.getElementById('preview-link');
const image = document.getElementById('preview');
const copyright = document.querySelector('.copyright');
const touch = matchMedia('(hover: none), (pointer: coarse)');
let active = null;
let currentSpawn = null;
let previousSpawn = null;
let hideTimer = null;
let loadVersion = 0;

function mobileMode() { return touch.matches || innerWidth <= 700; }

// Desktop: unverändert aus der bewährten Landingpage.
const desktopPoints = {
  1: [.075, .185],
  2: [.615, .16],
  3: [.85, .16],
  4: [.705, .50],
  5: [.255, .555],
  6: [.17, .715],
  7: [.40, .765],
  8: [.81, .685]
};

// Mobile: dieselben acht bisherigen Spawnpunkte. Die Bilder werden NICHT mehr
// an den Bildschirmrand geklemmt. Dadurch können sie – wie in der Skizze –
// über den Viewport hinausragen und werden dort natürlich abgeschnitten.
const mobilePoints = {
  1: [.23, .15], 2: [.69, .12], 3: [.83, .29], 4: [.82, .65],
  5: [.16, .34], 6: [.20, .74], 7: [.46, .77], 8: [.82, .72]
};

function spawnPoint(n) {
  const [x, y] = (mobileMode() ? mobilePoints : desktopPoints)[n] || [.5, .5];
  return { x: x * innerWidth, y: y * innerHeight };
}

function allowedSpawns(link) {
  const assigned = link.dataset.spawns || '1,2,3';
  return [...new Set(assigned.split(',')
    .map(Number)
    .filter(n => Number.isInteger(n) && n >= 1 && n <= 8))];
}

// ---------- Desktop: V8.5-Verhalten ----------
function safeZone() {
  const boxes = links.map(link => link.getBoundingClientRect());
  const paddingX = mobileMode() ? 18 : 42;
  const paddingY = 16;
  return {
    left: Math.min(...boxes.map(r => r.left)) - paddingX,
    right: Math.max(...boxes.map(r => r.right)) + paddingX,
    top: Math.min(...boxes.map(r => r.top)) - paddingY,
    bottom: Math.max(...boxes.map(r => r.bottom)) + paddingY
  };
}

function intersects(a, b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function previewLimits() {
  const margin = 8;
  const footerTop = copyright ? copyright.getBoundingClientRect().top : innerHeight;
  const footerGap = mobileMode() ? 12 : 18;
  return { margin, bottom: Math.max(0, Math.min(innerHeight - margin, footerTop - footerGap)) };
}

function desktopPlacement(spawn, naturalWidth, naturalHeight, zone) {
  const { bottom } = previewLimits();
  const margin = 24;
  const navGap = 20;
  const bounds = { left: margin, right: innerWidth - margin, top: margin, bottom: bottom - 16 };
  const regions = [
    { left: bounds.left, right: zone.left - navGap, top: bounds.top, bottom: bounds.bottom },
    { left: zone.right + navGap, right: bounds.right, top: bounds.top, bottom: bounds.bottom },
    { left: bounds.left, right: bounds.right, top: bounds.top, bottom: zone.top - navGap },
    { left: bounds.left, right: bounds.right, top: zone.bottom + navGap, bottom: bounds.bottom }
  ];

  const areaCap = Math.min(innerWidth * innerHeight * .115, 190000);
  const absoluteCap = 1200;
  const preferred = spawnPoint(spawn);
  const placements = [];

  for (const r of regions) {
    const availableW = r.right - r.left;
    const availableH = r.bottom - r.top;
    if (availableW < 75 || availableH < 75) continue;

    const naturalArea = naturalWidth * naturalHeight;
    const scale = Math.min(
      1,
      absoluteCap / naturalWidth,
      absoluteCap / naturalHeight,
      Math.sqrt(areaCap / naturalArea),
      availableW / naturalWidth,
      availableH / naturalHeight
    );
    if (scale <= 0) continue;

    const width = Math.floor(naturalWidth * scale);
    const height = Math.floor(naturalHeight * scale);
    const x = Math.max(r.left + width / 2, Math.min(preferred.x, r.right - width / 2));
    const y = Math.max(r.top + height / 2, Math.min(preferred.y, r.bottom - height / 2));
    const travel = Math.hypot((x - preferred.x) / innerWidth, (y - preferred.y) / innerHeight);
    const utilization = (width * height) / areaCap;
    const score = utilization - travel * .65;
    placements.push({ x, y, width, height, score, area: width * height });
  }

  return placements.sort((a, b) => b.score - a.score)[0] || null;
}

function positionDesktopImage({ keepCurrent = false } = {}) {
  if (!active || !image.naturalWidth || !image.naturalHeight || mobileMode()) return false;

  const zone = safeZone();
  const allowed = allowedSpawns(active);
  const candidates = keepCurrent && currentSpawn !== null
    ? [currentSpawn]
    : allowed.filter(n => n !== previousSpawn);
  const pool = candidates.length
    ? candidates
    : Object.keys(desktopPoints).map(Number).filter(n => n !== previousSpawn);

  const choices = pool.map(n => {
    const placement = desktopPlacement(n, image.naturalWidth, image.naturalHeight, zone);
    return placement
      ? { n, ...placement, scale: placement.area / (image.naturalWidth * image.naturalHeight) }
      : { n, scale: 0 };
  });

  const bestScale = Math.max(...choices.map(c => c.scale));
  const viable = choices.filter(c => c.scale >= Math.max(.005, bestScale * .68));
  const selection = viable.length ? viable : choices.filter(c => c.scale === bestScale);
  const chosen = selection[Math.floor(Math.random() * selection.length)];

  if (!chosen || !chosen.width || !chosen.height || chosen.scale <= 0) {
    previewLink.classList.remove('is-visible');
    return false;
  }

  currentSpawn = chosen.n;
  if (!keepCurrent) previousSpawn = chosen.n;
  previewLink.style.left = `${chosen.x}px`;
  previewLink.style.top = `${chosen.y}px`;
  image.style.width = `${chosen.width}px`;
  image.style.height = `${chosen.height}px`;
  previewLink.classList.add('is-visible');
  return true;
}

function cancelHide() {
  clearTimeout(hideTimer);
  hideTimer = null;
}

function showDesktop(link) {
  if (mobileMode()) return;
  cancelHide();
  if (active === link) return;

  currentSpawn = null;
  active = link;
  links.forEach(a => a.classList.remove('is-active'));

  previewLink.classList.remove('mobile-auto-preview', 'is-materialized');
  previewLink.href = link.href;
  previewLink.setAttribute('aria-label', `${link.textContent.trim()} öffnen`);
  previewLink.tabIndex = 0;
  previewLink.classList.remove('is-visible');
  image.alt = `Vorschau: ${link.textContent.trim()}`;

  const version = ++loadVersion;
  let displayed = false;

  async function revealWhenReady() {
    if (displayed || version !== loadVersion || active !== link || mobileMode()) return;
    try {
      if (image.decode) await image.decode();
    } catch (_) {}
    if (displayed || version !== loadVersion || active !== link || !image.naturalWidth || mobileMode()) return;

    displayed = true;
    const visible = positionDesktopImage();
    if (!visible) return;

    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (version === loadVersion && active === link && previewLink.classList.contains('is-visible')) {
        link.classList.add('is-active');
      }
    }));
  }

  image.onload = revealWhenReady;
  image.onerror = () => {
    if (version === loadVersion) previewLink.classList.remove('is-visible');
  };
  image.src = link.dataset.preview;
  if (image.complete && image.naturalWidth) revealWhenReady();
}

function hideDesktop() {
  cancelHide();
  loadVersion++;
  links.forEach(a => a.classList.remove('is-active'));
  previewLink.classList.remove('is-visible', 'is-materialized');
  previewLink.tabIndex = -1;
  active = null;
  currentSpawn = null;
}

// Desktop: Hover/Fokus zeigt die Vorschau; Bild selbst bleibt anklickbar.
links.forEach(link => {
  link.addEventListener('mouseenter', () => {
    if (!mobileMode()) showDesktop(link);
  });
  link.addEventListener('focus', () => {
    if (!mobileMode()) showDesktop(link);
  });
  // Auf Mobile gibt es bewusst KEIN preventDefault mehr: erster Tap = öffnen.
});

document.addEventListener('click', event => {
  if (mobileMode()) return;
  if (!event.target.closest('.navigation a') && !event.target.closest('#preview-link')) hideDesktop();
});

window.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !mobileMode()) hideDesktop();
});

// ---------- Mobile: zufällige autonome Vorschauen ----------
const MOBILE_VISIBLE_MS = 3000;
const MOBILE_FADE_MS = 360;
const MOBILE_GAP_MS = 500;
const MOBILE_START_MS = 1150; // nach der 0,8-s-Navigatoranimation etwas Ruhe
let mobileSequenceTimer = null;
let mobileFadeTimer = null;
let mobileRunning = false;
let mobileItems = [];
let mobileItemIndex = 0;
let previousMobileSpawn = null;

function navZoneMobile() {
  const boxes = [...document.querySelectorAll('.navigation a')].map(link => link.getBoundingClientRect());
  const padX = 10;
  const padY = 12;
  return {
    left: Math.min(...boxes.map(r => r.left)) - padX,
    right: Math.max(...boxes.map(r => r.right)) + padX,
    top: Math.min(...boxes.map(r => r.top)) - padY,
    bottom: Math.max(...boxes.map(r => r.bottom)) + padY
  };
}

function mobilePreviewSize(naturalWidth, naturalHeight) {
  // Die Bilder dürfen bewusst groß sein. Sie werden nicht in den Viewport
  // eingepasst; nur ihre maximale Gesamtgröße wird kontrolliert.
  const maxW = innerWidth * .68;
  const maxH = innerHeight * .43;
  const areaCap = innerWidth * innerHeight * .205;
  const naturalArea = naturalWidth * naturalHeight;
  const scale = Math.min(
    1,
    maxW / naturalWidth,
    maxH / naturalHeight,
    Math.sqrt(areaCap / naturalArea)
  );
  return {
    width: Math.max(80, Math.round(naturalWidth * scale)),
    height: Math.max(80, Math.round(naturalHeight * scale))
  };
}

function rectForCenter(x, y, width, height) {
  return {
    left: x - width / 2,
    right: x + width / 2,
    top: y - height / 2,
    bottom: y + height / 2
  };
}

function mobilePlacement(spawn, naturalWidth, naturalHeight) {
  const preferred = spawnPoint(spawn);
  const base = mobilePreviewSize(naturalWidth, naturalHeight);
  const zone = navZoneMobile();
  const gap = 10;
  const viewportH = innerHeight;

  function scaledSize(maxHeight = Infinity) {
    const scale = Math.min(1, maxHeight / base.height);
    return {
      width: Math.max(64, Math.round(base.width * scale)),
      height: Math.max(64, Math.round(base.height * scale))
    };
  }

  function candidate(x, y, size, kind) {
    // Der Mittelpunkt bleibt vertikal innerhalb des Viewports. Dadurch sind
    // selbst bei bewusst abgeschnittenen Bildern immer mindestens 50 % der
    // Bildhöhe sichtbar. Links/rechts darf das Bild weiterhin weit hinausragen.
    const safeY = Math.max(0, Math.min(viewportH, y));
    return { x, y: safeY, width: size.width, height: size.height, kind };
  }

  const full = scaledSize();
  const candidates = [];

  // 1) Originaler Spawnpunkt, wenn er die Navigation nicht verdeckt.
  candidates.push(candidate(preferred.x, preferred.y, full, 'spawn'));

  // 2) Links/rechts: volle Bildgröße, horizontales Clipping ist ausdrücklich erlaubt.
  candidates.push(candidate(zone.left - gap - full.width / 2, preferred.y, full, 'left'));
  candidates.push(candidate(zone.right + gap + full.width / 2, preferred.y, full, 'right'));

  // 3) Oberhalb/unterhalb: falls nötig proportional verkleinern, damit trotz
  // Clipping mindestens 50 % der Höhe sichtbar bleiben und die Navigation frei bleibt.
  const topRoom = Math.max(32, zone.top - gap);
  const topSize = scaledSize(topRoom * 2);
  candidates.push(candidate(
    preferred.x,
    zone.top - gap - topSize.height / 2,
    topSize,
    'top'
  ));

  const bottomRoom = Math.max(32, viewportH - zone.bottom - gap);
  const bottomSize = scaledSize(bottomRoom * 2);
  candidates.push(candidate(
    preferred.x,
    zone.bottom + gap + bottomSize.height / 2,
    bottomSize,
    'bottom'
  ));

  const nonOverlapping = candidates.filter(c =>
    !intersects(rectForCenter(c.x, c.y, c.width, c.height), zone)
  );
  const usable = nonOverlapping.length ? nonOverlapping : candidates;

  // Möglichst nah am ursprünglichen Spawnpunkt bleiben, aber eine unnötige
  // Verkleinerung vermeiden. Dadurch wirken die Bilder groß und frei wie in der Skizze.
  usable.sort((a, b) => {
    const da = Math.hypot(
      (a.x - preferred.x) / innerWidth,
      (a.y - preferred.y) / innerHeight
    ) + (1 - (a.width * a.height) / (full.width * full.height)) * .35;
    const db = Math.hypot(
      (b.x - preferred.x) / innerWidth,
      (b.y - preferred.y) / innerHeight
    ) + (1 - (b.width * b.height) / (full.width * full.height)) * .35;
    return da - db;
  });

  return usable[0];
}

function nextMobileItem() {
  if (!mobileItems.length) return null;
  const item = mobileItems[mobileItemIndex % mobileItems.length];
  mobileItemIndex = (mobileItemIndex + 1) % mobileItems.length;
  return item;
}

function randomSpawnFor(link) {
  const assigned = allowedSpawns(link);
  const candidates = assigned.filter(n => n !== previousMobileSpawn);
  const pool = candidates.length ? candidates : assigned;
  return pool[Math.floor(Math.random() * pool.length)];
}

function clearMobileTimers() {
  clearTimeout(mobileSequenceTimer);
  clearTimeout(mobileFadeTimer);
  mobileSequenceTimer = null;
  mobileFadeTimer = null;
}

function hideMobilePreviewInstant() {
  previewLink.classList.remove('is-visible', 'is-materialized', 'mobile-auto-preview');
  previewLink.tabIndex = -1;
  image.alt = '';
}

function scheduleNextMobilePreview(delay = MOBILE_GAP_MS) {
  if (!mobileRunning) return;
  mobileSequenceTimer = setTimeout(showNextMobilePreview, delay);
}

function showNextMobilePreview() {
  if (!mobileRunning || !mobileMode() || !mobileItems.length) return;

  const item = nextMobileItem();
  if (!item) return;
  const spawn = randomSpawnFor(item.link);
  const placement = mobilePlacement(spawn, item.width, item.height);

  previousMobileSpawn = spawn;

  previewLink.removeAttribute('href');
  previewLink.setAttribute('aria-hidden', 'true');
  previewLink.tabIndex = -1;
  previewLink.classList.add('mobile-auto-preview', 'is-visible');
  previewLink.classList.remove('is-materialized');

  previewLink.style.left = `${placement.x}px`;
  previewLink.style.top = `${placement.y}px`;
  image.style.width = `${placement.width}px`;
  image.style.height = `${placement.height}px`;
  image.alt = '';
  image.src = item.src;

  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (mobileRunning && mobileMode()) previewLink.classList.add('is-materialized');
  }));

  // Drei Sekunden sichtbar, dann Materialisierung rückwärts.
  mobileSequenceTimer = setTimeout(() => {
    previewLink.classList.remove('is-materialized');
    mobileFadeTimer = setTimeout(() => {
      previewLink.classList.remove('is-visible');
      scheduleNextMobilePreview(MOBILE_GAP_MS);
    }, MOBILE_FADE_MS);
  }, MOBILE_VISIBLE_MS);
}

async function preloadMobileItems() {
  const results = await Promise.all(links.map(link => new Promise(resolve => {
    const probe = new Image();
    probe.onload = () => resolve({
      link,
      src: link.dataset.preview,
      width: probe.naturalWidth,
      height: probe.naturalHeight
    });
    probe.onerror = () => resolve(null);
    probe.src = link.dataset.preview;
  })));
  mobileItems = results.filter(Boolean);
}

async function startMobileSequence() {
  if (mobileRunning || !mobileMode()) return;
  mobileRunning = true;
  mobileItemIndex = 0;
  active = null;
  links.forEach(a => a.classList.remove('is-active'));
  previewLink.style.pointerEvents = 'none';
  previewLink.setAttribute('aria-hidden', 'true');

  if (!mobileItems.length) await preloadMobileItems();
  if (!mobileRunning || !mobileMode()) return;
  scheduleNextMobilePreview(MOBILE_START_MS);
}

function stopMobileSequence() {
  mobileRunning = false;
  clearMobileTimers();
  hideMobilePreviewInstant();
  previewLink.style.pointerEvents = '';
  previewLink.removeAttribute('aria-hidden');
  mobileItemIndex = 0;
  previousMobileSpawn = null;
}

function syncMode() {
  if (mobileMode()) {
    hideDesktop();
    startMobileSequence();
  } else {
    stopMobileSequence();
  }
}

window.addEventListener('resize', () => {
  if (mobileMode()) {
    // Die nächste Vorschau wird mit den neuen Maßen neu positioniert.
    syncMode();
  } else {
    stopMobileSequence();
    positionDesktopImage({ keepCurrent: true });
  }
});

touch.addEventListener?.('change', syncMode);
syncMode();

// Direkten Bild-Download/Drag erschweren (kein vollständiger Kopierschutz).
document.addEventListener('contextmenu', event => {
  if (event.target.closest('img')) event.preventDefault();
});

document.addEventListener('dragstart', event => {
  if (event.target.closest('img')) event.preventDefault();
});
