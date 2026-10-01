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
      const landscape = img.naturalWidth > img.naturalHeight;
      hero.classList.toggle('is-landscape', landscape);
      hero.classList.toggle('is-portrait', !landscape);

      if (primary) {
        section.classList.toggle('is-landscape-main', landscape);
        section.classList.toggle('is-portrait-main', !landscape);
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
    inner.appendChild(img);
    frame.appendChild(inner);
    return frame;
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

    [4, 2, 1].forEach(columns => {
      const button = element('button', '', String(columns));
      button.type = 'button';
      button.dataset.columns = String(columns);
      button.setAttribute('aria-label', columns === 1
        ? tr('gallery.oneColumn', '1 column')
        : `${columns} ${tr('gallery.columns', 'columns')}`);
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => setColumns(columns));
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
      const button = element('button', '', String(columns));
      button.type = 'button';
      button.dataset.columns = String(columns);
      button.setAttribute('aria-label', columns === 1
        ? tr('gallery.oneColumn', '1 column')
        : `2 ${tr('gallery.columns', 'columns')}`);
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => setProjectColumns(columns));
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

    const classes = ['artwork'];
    if (projectGrid) classes.push('project-grid-artwork');
    if (hasDetails) classes.push('has-details');
    if (detailGrid) classes.push('has-detail-gallery');
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
    section.appendChild(description);

    return section;
  }

  works.forEach((work, index) => target.appendChild(render(work, index)));

  if (forceSeries) {
    makeViewToggle();
    setColumns(initialColumns());
  }

  if (projectGrid) {
    makeProjectViewToggle();
    setProjectColumns(1);
  }

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
