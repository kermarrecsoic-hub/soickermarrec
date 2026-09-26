(() => {
  "use strict";
  const gallery = document.getElementById('artworks');
  if (!gallery) return;
  const artworks = window.PAINTING_WORKS || [];
  const mobile = window.matchMedia('(max-width: 700px)');

  function el(tag, cls, txt) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (txt) node.textContent = txt;
    return node;
  }

  function render(work) {
    const hasDetails = Boolean(work.details && (work.details.left || work.details.right));
    const section = el('section', 'artwork' + (hasDetails ? ' has-details' : '') + (work.demo ? ' is-demo' : ''));
    const images = el('div', 'artwork-images');
    const hero = el('div', 'hero-wrap');
    const main = el('img', 'artwork-main');
    main.src = work.image;
    main.alt = work.title;
    main.loading = 'lazy';
    main.decoding = 'async';
    main.draggable = false;

    if (hasDetails) {
      main.tabIndex = 0;
      main.setAttribute('role', 'button');
      main.setAttribute('aria-label', work.title + ': Detailbilder auf Mobilgeräten ein- oder ausblenden');
      main.setAttribute('aria-expanded', 'false');
      const toggle = () => {
        if (!mobile.matches) return;
        const visible = section.classList.toggle('details-visible');
        main.setAttribute('aria-expanded', String(visible));
      };
      main.addEventListener('click', toggle);
      main.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggle();
        }
      });
    }
    hero.appendChild(main);
    images.appendChild(hero);

    if (hasDetails) {
      for (const side of ['left', 'right']) {
        if (!work.details[side]) continue;
        const detail = el('img', 'detail detail-' + side);
        detail.src = work.details[side];
        detail.alt = work.title + ' – Detail ' + (side === 'left' ? 'links' : 'rechts');
        detail.loading = 'lazy';
        detail.decoding = 'async';
        detail.draggable = false;
        images.appendChild(detail);
      }
    }
    section.appendChild(images);
    const desc = el('div', 'artwork-description');
    desc.appendChild(el('h2', 'artwork-title', work.title));
    if (work.medium) desc.appendChild(el('p', 'medium', work.medium));
    if (work.dimensions) desc.appendChild(el('p', 'dimensions', work.dimensions));
    if (work.availability) desc.appendChild(el('p', 'availability', work.availability));
    if (work.text) desc.appendChild(el('p', 'free-text', work.text));
    section.appendChild(desc);
    return section;
  }

  artworks.forEach(work => gallery.appendChild(render(work)));
  mobile.addEventListener('change', () => {
    if (!mobile.matches) {
      gallery.querySelectorAll('.details-visible').forEach(section => {
        section.classList.remove('details-visible');
        section.querySelector('.artwork-main')?.setAttribute('aria-expanded', 'false');
      });
    }
  });
})();

document.addEventListener('contextmenu', event => {
  if (event.target.closest('img')) event.preventDefault();
});
document.addEventListener('dragstart', event => {
  if (event.target.closest('img')) event.preventDefault();
});
