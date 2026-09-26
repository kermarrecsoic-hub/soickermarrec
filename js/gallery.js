(() => {
  "use strict";
  const target=document.getElementById('artworks');
  if (!target) return;
  const key=document.body.dataset.works || 'PAINTING_WORKS';
  const works=window[key] || [];
  const mobile=window.matchMedia('(max-width: 700px)');
  function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;}
  function mainImage(path,title){const i=el('img','artwork-main');i.src=path;i.alt=title;i.loading='lazy';i.decoding='async';i.draggable=false;return i;}
  function render(work){
    const paths=(Array.isArray(work.images)&&work.images.length ? work.images : (work.image?[work.image]:[]));
    if(!paths.length)return document.createDocumentFragment();
    const series=paths.length>1;
    const hasDetails=!series && Boolean(work.details && (work.details.left || work.details.right));
    const section=el('section','artwork'+(hasDetails?' has-details':'')+(work.demo?' is-demo':''));
    const images=el('div','artwork-images'+(series?' is-series':''));
    paths.forEach((path,index)=>{
      const hero=el('div','hero-wrap');const main=mainImage(path,work.title?(work.title+' – Bild '+(index+1)):'Projektbild '+(index+1));
      if(hasDetails && index===0){
        main.tabIndex=0;main.setAttribute('role','button');main.setAttribute('aria-expanded','false');
        main.setAttribute('aria-label','Auf dem Smartphone Details anzeigen oder ausblenden');
        const toggle=()=>{if(!mobile.matches)return;let visible=section.classList.toggle('details-visible');main.setAttribute('aria-expanded',String(visible));};
        main.addEventListener('click',toggle);main.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();toggle();}});
      }
      hero.appendChild(main);images.appendChild(hero);
    });
    if(hasDetails){for(const side of ['left','right']){if(!work.details[side])continue;const i=el('img','detail detail-'+side);i.src=work.details[side];i.alt=(work.title||'Werk')+' – Detail '+side;i.loading='lazy';i.draggable=false;images.appendChild(i);}}
    section.appendChild(images);
    const desc=el('div','artwork-description');
    if(work.title)desc.appendChild(el('h2','artwork-title',work.title));
    if(work.medium)desc.appendChild(el('p','medium',work.medium));
    if(work.dimensions)desc.appendChild(el('p','dimensions',work.dimensions));
    if(work.availability)desc.appendChild(el('p','availability',work.availability));
    if(work.text)desc.appendChild(el('p','free-text',work.text));
    section.appendChild(desc);
    return section;
  }
  works.forEach(w=>target.appendChild(render(w)));
  mobile.addEventListener('change',()=>{if(!mobile.matches)target.querySelectorAll('.details-visible').forEach(n=>{n.classList.remove('details-visible');n.querySelector('.artwork-main')?.setAttribute('aria-expanded','false');});});
})();
// Einfaches Herunterladen erschweren – Screenshots und Browser-Entwicklertools bleiben möglich.
document.addEventListener('contextmenu',e=>{if(e.target.closest('img'))e.preventDefault();});
document.addEventListener('dragstart',e=>{if(e.target.closest('img'))e.preventDefault();});
