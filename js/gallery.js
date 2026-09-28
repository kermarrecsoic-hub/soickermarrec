/* Soïc Kermarrec – V9 / gemeinsamer Galerie-Renderer mit 4–2–1-Spalten-Toggle */
(() => {
  'use strict';

  const target = document.getElementById('artworks');
  if (!target) return;

  const works = window[document.body.dataset.works || 'PAINTING_WORKS'] || [];
  const mobile = window.matchMedia('(max-width: 700px)');
  const forceSeries = target.dataset.layout === 'series';
  const STORAGE_KEY = 'soic-series-columns';
  let uid = 0;
  let currentColumns = null;

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

  function setColumns(columns, persist = true) {
    if (![1, 2, 4].includes(columns)) return;
    currentColumns = columns;
    target.dataset.columns = String(columns);
    target.querySelectorAll('.artwork-images.is-series').forEach(images => layoutSeries(images, columns));

    document.querySelectorAll('.series-view-toggle button').forEach(button => {
      const active = Number(button.dataset.columns) === columns;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, String(columns)); } catch (_) {}
    }
  }

  function initialColumns() {
    try {
      const stored = Number(localStorage.getItem(STORAGE_KEY));
      if ([1, 2, 4].includes(stored)) return stored;
    } catch (_) {}
    return mobile.matches ? 1 : 2;
  }

  function makeViewToggle() {
    if (!forceSeries) return;
    const header = document.querySelector('.site-header');
    if (!header) return;

    const controls = element('div', 'series-view-toggle');
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', 'Images per row');

    [4, 2, 1].forEach(columns => {
      const button = element('button', '', String(columns));
      button.type = 'button';
      button.dataset.columns = String(columns);
      button.setAttribute('aria-label', `${columns} ${columns === 1 ? 'column' : 'columns'}`);
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => setColumns(columns, true));
      controls.appendChild(button);
    });

    header.appendChild(controls);
  }

  function render(work, workIndex) {
    const paths = Array.isArray(work.images) && work.images.length
      ? work.images.filter(Boolean)
      : (work.image ? [work.image] : []);
    if (!paths.length) return document.createDocumentFragment();

    const series = forceSeries || paths.length > 1;
    const hasDetails = !series && Boolean(work.details &&
      (work.details.left || work.details.right));
    const classes = ['artwork'];
    if (hasDetails) classes.push('has-details');
    if (work.demo) classes.push('is-demo');
    if (series) classes.push('series-artwork');

    const section = element('section', classes.join(' '));
    const images = element('div', 'artwork-images' +
      (series ? ' is-series' : '') +
      (series && paths.length === 1 ? ' is-single' : ''));

    const detailIds = `details-${++uid}`;

    paths.forEach((path, index) => {
      const hero = element('div', 'hero-wrap');
      if (series) hero.dataset.seriesIndex = String(index);

      const alt = work.title
        ? `${work.title} – image ${index + 1}`
        : `Project image ${index + 1}`;
      const main = artworkImage(path, alt, workIndex === 0 && index === 0);

      if (hasDetails && index === 0) {
        const button = element('button', 'artwork-toggle');
        button.type = 'button';
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-controls', detailIds);
        button.setAttribute('aria-label', `Show details for ${work.title || 'work'}`);
        const hint = element('span', 'detail-hint', '+');
        hint.setAttribute('aria-hidden', 'true');
        button.append(main, hint);

        button.addEventListener('click', () => {
          if (!mobile.matches) return;
          const open = section.classList.toggle('details-visible');
          button.setAttribute('aria-expanded', String(open));
          button.setAttribute('aria-label', `${open ? 'Hide' : 'Show'} details for ${work.title || 'work'}`);
          hint.textContent = open ? '−' : '+';
        });
        button.tabIndex = mobile.matches ? 0 : -1;
        hero.appendChild(button);
      } else {
        hero.appendChild(main);
      }

      images.appendChild(hero);
    });

    if (hasDetails) {
      images.id = detailIds;
      for (const side of ['left', 'right']) {
        if (work.details[side]) images.appendChild(detailFrame(work.details[side], side, work.title));
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
    setColumns(initialColumns(), false);
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

    // Eine vom Nutzer gewählte Ansicht bleibt beim Drehen/Resizen erhalten.
    // Ohne gespeicherte Wahl gilt beim ersten Laden mobil 1, Desktop 2.
    if (forceSeries && currentColumns) setColumns(currentColumns, false);
  });
})();

// Verhindert nur die direkte Bildspeicherung per Kontextmenü / Drag & Drop.
// Browser-Entwicklertools oder Screenshots können Bilder weiterhin sichern.
document.addEventListener('contextmenu', event => {
  if (event.target.closest('img')) event.preventDefault();
});
document.addEventListener('dragstart', event => {
  if (event.target.closest('img')) event.preventDefault();
});
