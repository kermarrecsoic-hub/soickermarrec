// Soïc Kermarrec – V11 Landing
// Desktop + Mobile: vollbreiter Hintergrund mit weichem Weißverlauf und automatisch kontrastreicher Navigation.
// Desktop: Soïc rotiert permanent; beim Hover pausiert er und nur der gehoverte Link rotiert.

(() => {
  'use strict';

  const CONFIG_URL = 'data/landing-backgrounds.json';
  const nav = document.querySelector('.navigation');
  const home = document.querySelector('.home-banner');
  const links = [...document.querySelectorAll('.navigation a')];
  const pageLinks = links.filter(link => !link.classList.contains('home-banner'));
  const bg = document.getElementById('landing-background-image');
  const mobileQuery = matchMedia('(max-width: 700px), (hover: none) and (pointer: coarse)');
  let config = null;
  let contrastRAF = 0;

  function mode() { return mobileQuery.matches ? 'mobile' : 'desktop'; }

  function fallbackPath() {
    return mode() === 'mobile' ? bg.dataset.mobileFallback : bg.dataset.desktopFallback;
  }

  const ROTATION_MS = 10000;
  let rotationTimer = 0;
  let slotIndex = 0;
  let nextBg = null;

  function rememberedSlot() {
    const value = Number(history.state?.landingSlot);
    return Number.isInteger(value) ? value : null;
  }

  function rememberSlot() {
    try {
      history.replaceState({ ...(history.state || {}), landingSlot: slotIndex }, '');
    } catch (_) {}
  }

  function chooseInitialSlot() {
    const paths = backgroundPaths();
    if (paths.length < 2) {
      slotIndex = 0;
      rememberSlot();
      return;
    }
    const previous = rememberedSlot();
    if (previous === null) {
      slotIndex = 0;
    } else {
      const candidates = paths.map((_, index) => index).filter(index => index !== (previous % paths.length));
      slotIndex = candidates[Math.floor(Math.random() * candidates.length)];
    }
    rememberSlot();
  }

  function backgroundPaths() {
    const section = config?.[mode()];
    const slots = Array.isArray(section?.slots) ? section.slots.filter(Boolean) : [];
    return slots.length ? slots : [fallbackPath()].filter(Boolean);
  }

  function activeBackgroundPath() {
    const paths = backgroundPaths();
    return paths[slotIndex % paths.length] || fallbackPath();
  }

  async function loadConfig() {
    try {
      const response = await fetch(`${CONFIG_URL}?v=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      config = await response.json();
    } catch {
      config = null;
    }
    chooseInitialSlot();
    setBackground();
  }

  function ensureNextBackground() {
    if (nextBg) return nextBg;
    nextBg = document.createElement('img');
    nextBg.className = 'landing-background-image-next';
    nextBg.alt = '';
    nextBg.setAttribute('aria-hidden', 'true');
    bg.parentNode.insertBefore(nextBg, bg.nextSibling);
    return nextBg;
  }

  function showPath(path, animate = false) {
    if (!path) return;
    const probe = new Image();
    probe.onload = () => {
      if (!animate || !bg.src) {
        bg.src = path;
        bg.classList.remove('is-hidden');
        scheduleContrast();
        return;
      }

      const incoming = ensureNextBackground();
      incoming.src = path;
      incoming.classList.remove('is-visible');
      void incoming.offsetWidth;
      incoming.classList.add('is-visible');
      bg.classList.add('is-hidden');

      setTimeout(() => {
        bg.src = path;
        bg.classList.remove('is-hidden');
        incoming.classList.remove('is-visible');
        scheduleContrast();
      }, 900);
    };
    probe.onerror = rotateBackground;
    probe.src = path;
  }

  function setBackground(animate = false) {
    showPath(activeBackgroundPath(), animate);
  }

  function rotateBackground() {
    const paths = backgroundPaths();
    if (paths.length < 2) return;
    slotIndex = (slotIndex + 1) % paths.length;
    rememberSlot();
    setBackground(true);
  }

  function restartRotation() {
    clearInterval(rotationTimer);
    rotationTimer = setInterval(rotateBackground, ROTATION_MS);
  }

  // Die CSS-Darstellung ist exakt: Bildbreite = Viewportbreite, Bildhöhe proportional.
  // Wir sampeln eine kleine Fläche hinter jeder Textzeile, blenden rechnerisch die 90%-Deckkraft
  // und den Weißverlauf ein und wählen danach Weiß oder Dunkelgrau mit höherem Kontrast.
  function refreshContrast() {
    contrastRAF = 0;
    if (!bg.complete || !bg.naturalWidth || !bg.naturalHeight) return;

    const W = innerWidth;
    const H = innerHeight;
    const scale = W / bg.naturalWidth;
    const renderedHeight = bg.naturalHeight * scale;
    const canvas = document.createElement('canvas');
    canvas.width = bg.naturalWidth;
    canvas.height = bg.naturalHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    try { ctx.drawImage(bg, 0, 0); } catch { return; }

    const contrastTargets = [...links, ...document.querySelectorAll('.language-switch button')];
    for (const link of contrastTargets) {
      const rect = link.getBoundingClientRect();
      const sxScreen = rect.left + rect.width / 2;
      const syScreen = rect.top + rect.height / 2;
      let rgb = [255, 255, 255];

      if (syScreen >= 0 && syScreen < renderedHeight) {
        const ox = Math.max(0, Math.min(bg.naturalWidth - 1, Math.round(sxScreen / scale)));
        const oy = Math.max(0, Math.min(bg.naturalHeight - 1, Math.round(syScreen / scale)));
        const radius = Math.max(2, Math.round(9 / Math.max(scale, .01)));
        const x0 = Math.max(0, ox - radius);
        const y0 = Math.max(0, oy - radius);
        const sw = Math.min(bg.naturalWidth - x0, radius * 2 + 1);
        const sh = Math.min(bg.naturalHeight - y0, radius * 2 + 1);
        const data = ctx.getImageData(x0, y0, sw, sh).data;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
        }
        rgb = [r / count, g / count, b / count];
      }

      // 90 % Bilddeckkraft über Weiß.
      rgb = rgb.map(v => v * .90 + 255 * .10);

      // Gleiche Weißblende wie im CSS: Verlauf von 22 % bis 78 % der Viewporthöhe.
      const y = Math.max(0, Math.min(1, syScreen / H));
      let white = 0;
      if (y > .22 && y < .78) {
        const t = (y - .22) / (.78 - .22);
        // Smoothstep für einen weichen statt stufigen Verlauf.
        white = t * t * (3 - 2 * t);
      } else if (y >= .78) {
        white = 1;
      }
      rgb = rgb.map(v => v * (1 - white) + 255 * white);

      const linear = rgb.map(v => {
        v /= 255;
        return v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4);
      });
      const luminance = .2126 * linear[0] + .7152 * linear[1] + .0722 * linear[2];
      link.style.color = luminance < .46 ? '#ffffff' : '#414141';
    }
  }

  function scheduleContrast() {
    cancelAnimationFrame(contrastRAF);
    contrastRAF = requestAnimationFrame(refreshContrast);
  }

  // Nur echte Hover-Geräte übernehmen die Rotation vom Namen auf den Link.
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    pageLinks.forEach(link => {
      link.addEventListener('mouseenter', () => {
        pageLinks.forEach(other => other.classList.remove('is-active'));
        home.classList.remove('is-cycling');
        link.classList.add('is-active');
      });
      link.addEventListener('mouseleave', () => {
        link.classList.remove('is-active');
        home.classList.add('is-cycling');
      });
    });
    nav.addEventListener('mouseleave', () => {
      pageLinks.forEach(link => link.classList.remove('is-active'));
      home.classList.add('is-cycling');
    });
  }

  // Auf der Landingpage bedeutet Klick auf den Namen ausdrücklich: neu laden.
  home.addEventListener('click', event => {
    event.preventDefault();
    location.reload();
  });

  addEventListener('resize', () => {
    scheduleContrast();
  });
  mobileQuery.addEventListener?.('change', () => {
    chooseInitialSlot();
    setBackground();
    restartRotation();
  });

  loadConfig().then(() => restartRotation());
})();
