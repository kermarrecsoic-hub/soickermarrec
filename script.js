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

  function activeBackgroundPath() {
    const section = config?.[mode()];
    const active = Math.max(1, Math.min(3, Number(section?.active) || 1));
    const path = section?.slots?.[active - 1];
    return path || fallbackPath();
  }

  async function loadConfig() {
    try {
      const response = await fetch(`${CONFIG_URL}?v=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      config = await response.json();
    } catch {
      config = null;
    }
    setBackground();
  }

  function setBackground() {
    const path = activeBackgroundPath();
    if (!path) return;
    const next = new Image();
    next.onload = () => {
      bg.src = path;
      bg.onload = scheduleContrast;
      if (bg.complete) scheduleContrast();
    };
    next.onerror = () => {
      const fallback = fallbackPath();
      if (fallback && path !== fallback) bg.src = fallback;
    };
    next.src = path;
  }

  // Die CSS-Darstellung ist exakt: Bildbreite = Viewportbreite, Bildhöhe proportional.
  // Wir sampeln eine kleine Fläche hinter jeder Textzeile, blenden rechnerisch die 80%-Deckkraft
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

    for (const link of links) {
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

      // 80 % Bilddeckkraft über Weiß.
      rgb = rgb.map(v => v * .80 + 255 * .20);

      // Gleiche Weißblende wie im CSS: oben frei, ab ca. 1/3 weich, bei ca. 2/3 weiß.
      const y = Math.max(0, Math.min(1, syScreen / H));
      let white = 0;
      if (y > .32 && y < .68) {
        const t = (y - .32) / (.68 - .32);
        // Smoothstep für einen weichen statt stufigen Verlauf.
        white = t * t * (3 - 2 * t);
      } else if (y >= .68) {
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
    setBackground();
    scheduleContrast();
  });
  mobileQuery.addEventListener?.('change', () => setBackground());

  loadConfig();
})();
