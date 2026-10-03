/* Soïc Kermarrec – Galerie-Renderer: Projekt-Layouts + Serien-Layouts */
(() => {
  'use strict';

  const target = document.getElementById('artworks');
  if (!target) return;

  const rawWorks = window[document.body.dataset.works || 'PAINTING_WORKS'] || [];
  const i18n = window.SoicI18n || null;
  const works = rawWorks.map(work => i18n?.localizeWork ? i18n.localizeWork(work) : work);
  const tr = (key, fallback) => {
    if (!i18n?.t) return fallback;
    const value = i18n.t(key);
    return value === key ? fallback : value;
  };

  const mobile = window.matchMedia('(max-width: 700px)');
  const forceSeries = target.dataset.layout === 'series';
  const projectGrid = !forceSeries && (
    document.body.classList.contains('painting-page') ||
    document.body.classList.contains('graphic-page')
  );
  const shareSection = document.body.classList.contains('painting-page')
    ? 'painting'
    : (document.body.classList.contains('graphic-page') ? 'graphic' : '');

  let uid = 0;
  let currentColumns = null;
  let currentProjectColumns = 1;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function artworkImage(src, alt, first) {
    const img = element('img', 'artwork-main');
    img.src = src;
    img.alt = alt;
    img.loading = first ? 'eager' : 'lazy';
    img.decoding = 'async';
    img.draggable = false;
    return img;
  }

  function classifyOrientation(img, hero, section, primary = false) {
    const apply = () => {
      if (!img.naturalWidth || !img.naturalHeight) return;
      const ratio = img.naturalWidth / img.naturalHeight;
      const landscape = ratio > 1;
      // Nahezu quadratische Bilder sollen sich wie Hochformate verhalten:
      // Details bleiben seitlich. Erst deutlich breite Querformate (ab 1.18:1)
      // bekommen ihre Details unter dem Hauptbild.
      const wideLandscape = ratio >= 1.18;

      hero.classList.toggle('is-landscape', landscape);
      hero.classList.toggle('is-portrait', !landscape);

      if (primary) {
        section.classList.toggle('is-landscape-main', wideLandscape);
        section.classList.toggle('is-portrait-main', !wideLandscape);
        section.classList.toggle('is-squareish-main', !wideLandscape && ratio >= 0.88 && ratio < 1.18);
        requestAnimationFrame(() => syncProjectDescription(section));
      }
    };

    if (img.complete) apply();
    else img.addEventListener('load', apply, { once: true });
  }

  function detailPathsForWork(work, rawMainPaths) {
    const details = [];
    if (Array.isArray(work.details)) {
      details.push(...work.details.filter(Boolean));
    } else if (work.details && typeof work.details === 'object') {
      if (work.details.left) details.push(work.details.left);
      if (work.details.right) details.push(work.details.right);
    }

    // Legacy migration for the Holzdruck layout: older Studio versions stored
    // every wood print as a main image. Keep only the first as the real main
    // image and expose the remaining images as details without losing paths.
    const legacyDetailLayout = work.layout === 'six-grid' || work.layout === 'portrait-eight-grid' || /holz/i.test(work.title || '');
    const mainPaths = [...rawMainPaths];
    if (legacyDetailLayout && mainPaths.length > 1) {
      details.unshift(...mainPaths.slice(1));
      mainPaths.splice(1);
    }

    return {
      mainPaths,
      detailPaths: [...new Set(details.filter(Boolean))],
    };
  }

  function detailGallery(paths, title) {
    const gallery = element('div', 'detail-gallery');
    paths.forEach((src, index) => {
      const figure = element('div', 'detail-gallery-item');
      const img = element('img', 'detail-image');
      img.src = src;
      img.alt = `${title || 'Work'} – detail ${index + 1}`;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.draggable = false;
      img.classList.add('detail-openable');
      img.tabIndex = 0;
      img.setAttribute('role', 'button');
      img.setAttribute('aria-label', `${title || 'Work'} – Detail vergrößern`);
      figure.appendChild(img);
      gallery.appendChild(figure);
    });
    return gallery;
  }

  function detailFrame(src, side, title) {
    const frame = element('div', `detail-frame detail-frame-${side}`);
    const inner = element('div', 'detail-inner');
    const img = element('img', 'detail-image');
    img.src = src;
    img.alt = `${title || 'Work'} – ${side} detail`;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.draggable = false;
    img.classList.add('detail-openable');
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', `${title || 'Work'} – Detail vergrößern`);
    inner.appendChild(img);
    frame.appendChild(inner);
    return frame;
  }

  let detailLightbox = null;
  let detailLightboxImage = null;
  let lastDetailTrigger = null;

  function ensureDetailLightbox() {
    if (detailLightbox) return;

    detailLightbox = element('div', 'detail-lightbox');
    detailLightbox.setAttribute('aria-hidden', 'true');

    const stage = element('div', 'detail-lightbox-stage');
    stage.setAttribute('role', 'dialog');
    stage.setAttribute('aria-modal', 'true');
    stage.setAttribute('aria-label', 'Detailansicht');

    const close = element('button', 'detail-lightbox-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Detailansicht schließen');

    detailLightboxImage = element('img', 'detail-lightbox-image');
    detailLightboxImage.alt = '';

    stage.append(detailLightboxImage, close);
    detailLightbox.appendChild(stage);
    document.body.appendChild(detailLightbox);

    const closeLightbox = () => {
      if (!detailLightbox.classList.contains('is-open')) return;
      detailLightbox.classList.remove('is-open');
      detailLightbox.setAttribute('aria-hidden', 'true');
      document.documentElement.classList.remove('detail-lightbox-open');
      const previousTrigger = lastDetailTrigger;
      lastDetailTrigger = null;

      window.setTimeout(() => {
        if (!detailLightbox.classList.contains('is-open')) {
          detailLightboxImage.removeAttribute('src');
        }
      }, 260);

      if (previousTrigger) {
        previousTrigger.focus({ preventScroll: true });
      }
    };

    close.addEventListener('click', closeLightbox);
    detailLightbox.addEventListener('click', event => {
      if (event.target === detailLightbox) closeLightbox();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') closeLightbox();
    });
  }

  function openDetailLightbox(img) {
    if (!img?.src) return;
    ensureDetailLightbox();

    lastDetailTrigger = img;
    detailLightboxImage.src = img.currentSrc || img.src;
    detailLightboxImage.alt = img.alt || 'Detail';

    detailLightbox.classList.add('is-open');
    detailLightbox.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('detail-lightbox-open');

    requestAnimationFrame(() => {
      detailLightbox.querySelector('.detail-lightbox-close')?.focus({ preventScroll: true });
    });
  }

  function setupDetailLightboxTriggers() {
    target.querySelectorAll('.detail-openable').forEach(img => {
      img.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        openDetailLightbox(img);
      });

      img.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openDetailLightbox(img);
        }
      });
    });
  }

  function orderedSeriesItems(images) {
    return [...images.querySelectorAll('.hero-wrap[data-series-index]')]
      .sort((a, b) => Number(a.dataset.seriesIndex) - Number(b.dataset.seriesIndex));
  }

  function layoutSeries(images, columns) {
    if (!images.classList.contains('is-series')) return;
    const items = orderedSeriesItems(images);
    if (!items.length) return;

    images.querySelectorAll(':scope > .series-column').forEach(column => column.remove());
    images.dataset.columns = String(columns);
    images.style.setProperty('--series-columns', String(columns));

    const wrappers = Array.from({ length: columns }, (_, index) => {
      const column = element('div', 'series-column');
      column.dataset.column = String(index + 1);
      images.appendChild(column);
      return column;
    });

    items.forEach((item, index) => wrappers[index % columns].appendChild(item));
  }

  function setColumns(columns) {
    if (![1, 2, 4].includes(columns)) return;
    currentColumns = columns;
    target.dataset.columns = String(columns);
    target.querySelectorAll('.artwork-images.is-series').forEach(images => layoutSeries(images, columns));

    document.querySelectorAll('.series-view-toggle:not(.project-view-toggle) button').forEach(button => {
      const active = Number(button.dataset.columns) === columns;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function setProjectColumns(columns) {
    if (![1, 2].includes(columns)) return;
    currentProjectColumns = columns;
    target.dataset.projectColumns = String(columns);

    document.querySelectorAll('.project-view-toggle button').forEach(button => {
      const active = Number(button.dataset.columns) === columns;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    syncAllProjectDescriptions();
  }

  function animateLayoutChange(applyLayout) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      applyLayout();
      return;
    }

    target.classList.add('is-layout-switching');
    window.setTimeout(() => {
      applyLayout();
      target.classList.remove('is-layout-switching');
      target.classList.add('is-layout-entering');
      requestAnimationFrame(() => {
        // Force one painted frame with the new layout before restoring visibility.
        requestAnimationFrame(() => {
          target.classList.remove('is-layout-entering');
        });
      });
    }, 120);
  }

  function setupScrollReveal() {
    const artworks = [...target.querySelectorAll(':scope > .artwork')];
    if (!artworks.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        !('IntersectionObserver' in window)) {
      artworks.forEach(section => section.classList.add('is-in-view'));
      return;
    }

    artworks.forEach(section => section.classList.add('scroll-reveal'));

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in-view');
        observer.unobserve(entry.target);
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -7% 0px'
    });

    artworks.forEach((section, index) => {
      // Das erste bereits sichtbare Projekt soll beim Laden ebenfalls weich erscheinen.
      observer.observe(section);
    });
  }

  function initialColumns() {
    return mobile.matches ? 1 : 2;
  }

  function makeViewToggle() {
    if (!forceSeries) return;
    const header = document.querySelector('.site-header');
    if (!header) return;

    const controls = element('div', 'series-view-toggle');
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', tr('gallery.imagesPerRow', 'Images per row'));

    [1, 2, 4].forEach(columns => {
      const button = element('button', '', '•'.repeat(columns));
      button.type = 'button';
      button.dataset.columns = String(columns);
      button.setAttribute('aria-label', columns === 1
        ? tr('gallery.oneColumn', '1 column')
        : `${columns} ${tr('gallery.columns', 'columns')}`);
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        if (columns === currentColumns) return;
        animateLayoutChange(() => setColumns(columns));
      });
      controls.appendChild(button);
    });

    header.appendChild(controls);
  }

  function makeProjectViewToggle() {
    if (!projectGrid) return;
    const header = document.querySelector('.site-header');
    if (!header) return;

    const controls = element('div', 'series-view-toggle project-view-toggle');
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', tr('gallery.projectsPerRow', 'Projects per row'));

    [1, 2].forEach(columns => {
      const button = element('button', '', '•'.repeat(columns));
      button.type = 'button';
      button.dataset.columns = String(columns);
      button.setAttribute('aria-label', columns === 1
        ? tr('gallery.oneColumn', '1 column')
        : `2 ${tr('gallery.columns', 'columns')}`);
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => {
        if (columns === currentProjectColumns) return;
        animateLayoutChange(() => setProjectColumns(columns));
      });
      controls.appendChild(button);
    });

    header.appendChild(controls);
  }

  function setupDetailToggle(button, section, hint, work, detailIds) {
    button.type = 'button';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', detailIds);
    button.setAttribute('aria-label', `${tr('gallery.showDetails', 'Show details')}: ${work.title || tr('gallery.work', 'work')}`);
    button.addEventListener('click', () => {
      if (!mobile.matches) return;
      const open = section.classList.toggle('details-visible');
      button.setAttribute('aria-expanded', String(open));
      button.setAttribute('aria-label', `${open ? tr('gallery.hideDetails', 'Hide details') : tr('gallery.showDetails', 'Show details')}: ${work.title || tr('gallery.work', 'work')}`);
      hint.textContent = open ? '−' : '+';
    });
    button.tabIndex = mobile.matches ? 0 : -1;
  }

  function slugifyShare(value = '') {
    return String(value)
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  }

  function workShareId(work, workIndex, paths = []) {
    const explicit = slugifyShare(work.shareId || '');
    if (explicit) return explicit;

    const first = String(paths[0] || work.image || '').replace(/^\.\.\//, '').replace(/^\/+/, '');
    const root = shareSection === 'painting' ? 'images/painting/' : 'images/ink/';
    if (shareSection && first.startsWith(root)) {
      const rest = first.slice(root.length);
      const folder = rest.includes('/') ? rest.split('/')[0] : rest.replace(/\.[^.]+$/, '');
      const fromFolder = slugifyShare(folder);
      if (fromFolder) return fromFolder;
    }
    return slugifyShare(work.title || '') || `werk-${workIndex + 1}`;
  }

  function sharePageUrl(id) {
    return new URL(`/share/${shareSection}/${encodeURIComponent(id)}.html`, window.location.origin).href;
  }

  function fileNameForShare(title, mime = 'image/jpeg') {
    const ext = mime.includes('png') ? 'png' : (mime.includes('webp') ? 'webp' : 'jpg');
    return `${slugifyShare(title || 'soic-kermarrec') || 'soic-kermarrec'}.${ext}`;
  }

  async function shareWork(work, id, mainPath) {
    const title = work.title || tr('gallery.work', 'Werk');
    const url = sharePageUrl(id);
    const text = `${title} — Soïc Kermarrec`;

    // Auf unterstützten Mobilgeräten wird zusätzlich das echte Hauptbild an
    // den nativen Teilen-Dialog übergeben. WhatsApp kann so Bild + Link erhalten.
    if (navigator.share) {
      try {
        let file = null;
        if (mainPath && navigator.canShare) {
          try {
            const response = await fetch(mainPath, { cache: 'force-cache' });
            if (response.ok) {
              const blob = await response.blob();
              const candidate = new File([blob], fileNameForShare(title, blob.type), { type: blob.type || 'image/jpeg' });
              if (navigator.canShare({ files: [candidate] })) file = candidate;
            }
          } catch {}
        }

        const data = { title: text, text, url };
        if (file) data.files = [file];
        await navigator.share(data);
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }

    // Desktop/Fallback: direkt WhatsApp/WhatsApp Web mit werkbezogener URL.
    // Die Share-Seite besitzt eigene Open-Graph-Tags mit dem Hauptbild.
    const message = `${text}\n${url}`;
    window.location.href = `https://wa.me/?text=${encodeURIComponent(message)}`;
  }

  function addShareControl(description, work, workIndex, paths, section) {
    if (!shareSection || !paths.length) return;
    const id = workShareId(work, workIndex, paths);
    section.id = `werk-${id}`;
    section.dataset.shareId = id;

    const button = element('button', 'work-share-button', '•');
    button.type = 'button';
    button.setAttribute('aria-label', `${tr('gallery.shareViaWhatsApp', 'Werk über WhatsApp teilen')}: ${work.title || tr('gallery.work', 'Werk')}`);
    button.addEventListener('click', () => shareWork(work, id, paths[0]));
    description.appendChild(button);
  }

  function syncProjectDescription(section) {
    if (!projectGrid || !section) return;
    const description = section.querySelector('.artwork-description');
    if (!description) return;

    description.style.maxWidth = '100%';

    if (currentProjectColumns === 2) {
      description.style.width = '100%';
      return;
    }

    let reference = null;
    if (section.classList.contains('multi-main-artwork')) {
      reference = section.querySelector('.main-stack');
    } else {
      reference = section.querySelector('.hero-wrap .artwork-main');
    }
    if (!reference) return;

    const rect = reference.getBoundingClientRect();
    if (!rect.width) return;
    description.style.width = `${Math.round(rect.width)}px`;
  }

  function alignMobileProjectDescriptionRows() {
    if (!projectGrid) return;

    const sections = [...target.querySelectorAll(':scope > .artwork')];
    sections.forEach(section => section.style.removeProperty('--row-align-offset'));

    if (!mobile.matches || currentProjectColumns !== 2) return;

    const alignPair = pair => {
      if (pair.length < 2) return;
      const positions = pair.map(section => {
        const description = section.querySelector('.artwork-description');
        if (!description) return 0;
        const sectionRect = section.getBoundingClientRect();
        const descriptionRect = description.getBoundingClientRect();
        return descriptionRect.top - sectionRect.top;
      });
      const targetTop = Math.max(...positions);
      pair.forEach((section, index) => {
        const offset = Math.max(0, targetTop - positions[index]);
        section.style.setProperty('--row-align-offset', `${Math.round(offset)}px`);
      });
    };

    let pair = [];
    sections.forEach(section => {
      if (section.classList.contains('multi-main-artwork')) {
        alignPair(pair);
        pair = [];
        return;
      }
      pair.push(section);
      if (pair.length === 2) {
        alignPair(pair);
        pair = [];
      }
    });
    alignPair(pair);
  }

  function syncAllProjectDescriptions() {
    if (!projectGrid) return;
    requestAnimationFrame(() => {
      target.querySelectorAll('.artwork').forEach(syncProjectDescription);
      requestAnimationFrame(alignMobileProjectDescriptionRows);
    });
  }

  function scrollToSharedWork() {
    const hash = decodeURIComponent(window.location.hash || '');
    if (!hash.startsWith('#werk-')) return;
    const targetWork = document.getElementById(hash.slice(1));
    if (!targetWork) return;
    requestAnimationFrame(() => targetWork.scrollIntoView({ block: 'start', behavior: 'auto' }));
  }

  function render(work, workIndex) {
    const rawMainPaths = Array.isArray(work.images) && work.images.length
      ? work.images.filter(Boolean)
      : (work.image ? [work.image] : []);
    const normalized = detailPathsForWork(work, rawMainPaths);
    const paths = normalized.mainPaths;
    const detailPaths = normalized.detailPaths;
    if (!paths.length) return document.createDocumentFragment();

    const series = forceSeries;
    const multiMain = !forceSeries && paths.length > 1;
    const twoMain = multiMain && paths.length === 2;
    const specialGrid = multiMain && paths.length >= 6;
    const sixMain = specialGrid && paths.length === 6;
    const nineMain = specialGrid && paths.length === 9;
    const hasDetails = !forceSeries && detailPaths.length > 0;
    const detailGrid = hasDetails && detailPaths.length > 2;
    const detailsBottomGrid = hasDetails && detailPaths.length >= 4;
    const woodDetailArtwork = !forceSeries && (
      work.layout === 'six-grid' ||
      work.layout === 'portrait-eight-grid' ||
      /holz/i.test(work.title || '')
    );

    const classes = ['artwork'];
    if (projectGrid) classes.push('project-grid-artwork');
    if (hasDetails) classes.push('has-details');
    if (detailGrid) classes.push('has-detail-gallery');
    if (detailsBottomGrid) classes.push('details-bottom-grid');
    if (woodDetailArtwork) classes.push('wood-detail-artwork');
    if (work.demo) classes.push('is-demo');
    if (series) classes.push('series-artwork');
    if (multiMain) classes.push('multi-main-artwork');
    if (twoMain) classes.push('two-main-artwork');
    if (specialGrid) classes.push('special-main-artwork');
    if (sixMain) classes.push('six-main-artwork');
    if (nineMain) classes.push('nine-main-artwork');

    const section = element('section', classes.join(' '));
    const images = element('div', 'artwork-images' +
      (series ? ' is-series' : '') +
      (multiMain ? ' is-multi-main' : '') +
      (series && paths.length === 1 ? ' is-single' : ''));

    const detailIds = `details-${++uid}`;

    if (multiMain) {
      const mainStack = element('div', 'main-stack');
      paths.forEach((path, index) => {
        const hero = element('div', 'hero-wrap');
        hero.dataset.mainIndex = String(index);
        const alt = work.title
          ? `${work.title} – image ${index + 1}`
          : `Artwork image ${index + 1}`;
        const main = artworkImage(path, alt, workIndex === 0 && index === 0);
        classifyOrientation(main, hero, section, index === 0);
        hero.appendChild(main);
        mainStack.appendChild(hero);
      });
      images.appendChild(mainStack);

      if (hasDetails) {
        const button = element('button', 'artwork-toggle multi-main-detail-toggle');
        const hint = element('span', 'detail-hint', '+');
        hint.setAttribute('aria-hidden', 'true');
        button.appendChild(hint);
        setupDetailToggle(button, section, hint, work, detailIds);
        images.appendChild(button);
      }
    } else {
      paths.forEach((path, index) => {
        const hero = element('div', 'hero-wrap');
        if (series) hero.dataset.seriesIndex = String(index);

        const alt = work.title
          ? `${work.title} – image ${index + 1}`
          : `Project image ${index + 1}`;
        const main = artworkImage(path, alt, workIndex === 0 && index === 0);
        classifyOrientation(main, hero, section, index === 0);

        if (hasDetails && index === 0) {
          const button = element('button', 'artwork-toggle');
          const hint = element('span', 'detail-hint', '+');
          hint.setAttribute('aria-hidden', 'true');
          button.append(main, hint);
          setupDetailToggle(button, section, hint, work, detailIds);
          hero.appendChild(button);
        } else {
          hero.appendChild(main);
        }

        images.appendChild(hero);
      });
    }

    if (hasDetails) {
      images.id = detailIds;
      if (detailGrid) {
        images.appendChild(detailGallery(detailPaths, work.title));
      } else {
        if (detailPaths[0]) images.appendChild(detailFrame(detailPaths[0], 'left', work.title));
        if (detailPaths[1]) images.appendChild(detailFrame(detailPaths[1], 'right', work.title));
      }
    }

    section.appendChild(images);

    const description = element('div', 'artwork-description' +
      (series ? ' is-series-description' : ''));
    if (work.title) description.appendChild(element('h2', 'artwork-title', work.title));
    if (work.medium) description.appendChild(element('p', 'medium', work.medium));
    if (work.dimensions) description.appendChild(element('p', 'dimensions', work.dimensions));
    if (work.availability) description.appendChild(element('p', 'availability', work.availability));
    if (work.text) description.appendChild(element('p', 'free-text', work.text));
    addShareControl(description, work, workIndex, paths, section);
    section.appendChild(description);

    if (projectGrid) {
      section.querySelectorAll('.artwork-main').forEach(img => {
        if (img.complete) requestAnimationFrame(() => syncProjectDescription(section));
        else img.addEventListener('load', () => syncProjectDescription(section), { once: true });
      });
    }

    return section;
  }

  works.forEach((work, index) => target.appendChild(render(work, index)));
  setupDetailLightboxTriggers();
  scrollToSharedWork();
  window.addEventListener('hashchange', scrollToSharedWork);

  if (forceSeries) {
    makeViewToggle();
    setColumns(initialColumns());
  }

  if (projectGrid) {
    makeProjectViewToggle();
    setProjectColumns(1);
  }

  setupScrollReveal();

  let descriptionResizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(descriptionResizeTimer);
    descriptionResizeTimer = setTimeout(syncAllProjectDescriptions, 80);
  });

  mobile.addEventListener('change', () => {
    target.querySelectorAll('.artwork-toggle').forEach(button => {
      button.tabIndex = mobile.matches ? 0 : -1;
      if (!mobile.matches) {
        const artwork = button.closest('.artwork');
        artwork.classList.remove('details-visible');
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-label', 'Show artwork details');
        const hint = button.querySelector('.detail-hint');
        if (hint) hint.textContent = '+';
      }
    });

    if (forceSeries && currentColumns) setColumns(currentColumns);
    if (projectGrid) setProjectColumns(currentProjectColumns);
  });
})();
