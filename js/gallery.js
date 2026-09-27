/* Soïc Kermarrec – V8 / gemeinsamer Galerie-Renderer */
(() => {
  'use strict';

  const target = document.getElementById('artworks');
  if (!target) return;

  const works = window[document.body.dataset.works || 'PAINTING_WORKS'] || [];
  const mobile = window.matchMedia('(max-width: 700px)');
  const forceSeries = target.dataset.layout === 'series';
  let uid = 0;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
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

    if (series) {
      images.style.setProperty('--series-columns', String(Math.ceil(paths.length / 2)));
      images.dataset.count = String(paths.length);
    }

    const detailIds = `details-${++uid}`;
    paths.forEach((path, index) => {
      const hero = element('div', 'hero-wrap');
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
        const toggle = () => {
          if (!mobile.matches) return;
          const open = section.classList.toggle('details-visible');
          button.setAttribute('aria-expanded', String(open));
          button.setAttribute('aria-label', `${open ? 'Hide' : 'Show'} details for ${work.title || 'work'}`);
          hint.textContent = open ? '−' : '+';
        };
        button.addEventListener('click', toggle);
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
        if (work.details[side]) {
          images.appendChild(detailFrame(work.details[side], side, work.title));
        }
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

  works.forEach((work, i) => target.appendChild(render(work, i)));

  mobile.addEventListener('change', () => {
    target.querySelectorAll('.artwork-toggle').forEach(button => {
      button.tabIndex = mobile.matches ? 0 : -1;
      if (!mobile.matches) {
        const artwork = button.closest('.artwork');
        artwork.classList.remove('details-visible');
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-label', 'Show artwork details');
        button.querySelector('.detail-hint').textContent = '+';
      }
    });
  });
})();

// Verhindert nur die direkte Bildspeicherung per Kontextmenü / Drag & Drop.
// Browser-Entwicklertools oder Screenshots können Bilder weiterhin sichern.
document.addEventListener('contextmenu', (event) => {
  if (event.target.closest('img')) event.preventDefault();
});
document.addEventListener('dragstart', (event) => {
  if (event.target.closest('img')) event.preventDefault();
});
