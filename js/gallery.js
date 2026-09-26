(() => {
  "use strict";
  const gallery = document.getElementById('artworks');
  const dialog = document.getElementById('zoom-dialog');
  const zoomImage = document.getElementById('zoom-image');
  const zoomSurface = document.getElementById('zoom-surface');
  const closeButton = document.getElementById('zoom-close');
  const artworks = window.PAINTING_WORKS || [];

  // No HTML from data: user-written text always inserted with textContent.
  function el(tag, cls, txt) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (txt) node.textContent = txt;
    return node;
  }
  function openZoom(work) {
    zoomImage.classList.remove('zoomed');
    zoomImage.src = work.zoom || work.image;
    zoomImage.alt = work.title + ' – Großansicht';
    dialog.showModal();
  }
  function render(work) {
    const section = el('section','artwork' + (work.details ? ' has-details' : '') + (work.demo ? ' is-demo' : ''));
    const images = el('div','artwork-images');
    const hero = el('div','hero-wrap');
    const main = el('img','artwork-main');
    main.src=work.image; main.alt=work.title;
    main.loading='lazy'; main.decoding='async'; main.tabIndex=0;
    main.setAttribute('role','button');
    main.setAttribute('aria-label',work.title + ': Großansicht öffnen');
    // Auf Mobilgeräten öffnet schon das erste Tippen die Großansicht.
    // Desktop: Detailbilder erscheinen weiterhin beim Hover.
    const activate = () => openZoom(work);
    main.addEventListener('click',activate);
    main.addEventListener('keydown', e=> { if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();} });
    hero.appendChild(main);
    images.appendChild(hero);
    if (work.details) {
      for(const side of ['left','right']) {
        const detail = el('img','detail detail-' + side);
        detail.src = work.details[side]; detail.alt=work.title + ' – Detail ' + (side==='left' ? 'links' : 'rechts');
        detail.loading='lazy'; detail.decoding='async';
        images.appendChild(detail);
      }
    }
    section.appendChild(images);
    const desc=el('div','artwork-description');
    desc.appendChild(el('h2','artwork-title',work.title));
    if(work.medium) desc.appendChild(el('p','medium',work.medium));
    if(work.dimensions)desc.appendChild(el('p','dimensions',work.dimensions));
    if(work.availability)desc.appendChild(el('p','availability',work.availability));
    if(work.text)desc.appendChild(el('p','free-text',work.text));
    section.appendChild(desc);
    return section;
  }
  artworks.forEach(w=>gallery.appendChild(render(w)));
  closeButton.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
  zoomImage.addEventListener('click',()=>{
    zoomImage.classList.toggle('zoomed');
    if(!zoomImage.classList.contains('zoomed'))zoomSurface.scrollTo({top:0,left:0,behavior:'instant'});
  });
  dialog.addEventListener('close',()=>{
    zoomImage.removeAttribute('src'); zoomImage.classList.remove('zoomed');
  });
})();
document.addEventListener("contextmenu", (event) => {
  if (event.target.closest("img")) {
    event.preventDefault();
  }
});

document.addEventListener("dragstart", (event) => {
  if (event.target.closest("img")) {
    event.preventDefault();
  }
});
