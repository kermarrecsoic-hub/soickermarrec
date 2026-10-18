(async () => {
  'use strict';
  if (window.SoicProjectDataReady) await window.SoicProjectDataReady;

  const lang = window.SoicI18n?.currentLanguage?.() || 'de';
  const copy = {
    de: { intro:'Gib deine E-Mail-Adresse ein, um verfügbare Arbeiten und Preise zu sehen.', updates:'Bei neuen Projekten per E-Mail benachrichtigen.', submit:'Liste öffnen', privacy:'Die Adresse wird über Netlify Forms gespeichert. Projektbenachrichtigungen sind freiwillig.', current:'Aktuell verfügbare Arbeiten', empty:'Zurzeit sind keine Arbeiten in dieser Liste.', priceOnRequest:'Preis auf Anfrage', contact:'Contact', status:'Liste wird geöffnet …', hidden:'Diese Seite ist derzeit nicht verfügbar.' },
    fr: { intro:'Saisissez votre adresse e-mail pour voir les œuvres disponibles et leurs prix.', updates:'M’informer par e-mail lors de la publication de nouveaux projets.', submit:'Ouvrir la liste', privacy:'L’adresse est enregistrée via Netlify Forms. Les notifications de projets sont facultatives.', current:'Œuvres disponibles', empty:'Aucune œuvre ne figure actuellement dans cette liste.', priceOnRequest:'Prix sur demande', contact:'Contact', status:'Ouverture de la liste …', hidden:'Cette page est actuellement indisponible.' },
    en: { intro:'Enter your email address to view available works and prices.', updates:'Notify me by email when new projects are published.', submit:'Open list', privacy:'The address is stored through Netlify Forms. Project notifications are optional.', current:'Currently available works', empty:'No works are currently in this list.', priceOnRequest:'Price on request', contact:'Contact', status:'Opening list …', hidden:'This page is currently unavailable.' }
  }[lang] || {};

  const gate=document.getElementById('availableGate');
  const shell=document.getElementById('availableListShell');
  const list=document.getElementById('availableList');
  const empty=document.getElementById('availableEmpty');
  const form=document.getElementById('availableAccessForm');
  const status=document.getElementById('availableFormStatus');
  const sink=document.getElementById('availableSubmitFrame');
  const trigger=document.querySelector('.available-current-section');
  const siteName=document.querySelector('.available-site-name');
  const menu=document.querySelector('.available-nav-menu');
  const frost=document.querySelector('.available-nav-frost');
  const finePointer=matchMedia('(hover:hover) and (pointer:fine)');

  let navOpen=false, navTimer=0;
  const setOpen=open=>{ navOpen=!!open; trigger?.setAttribute('aria-expanded', String(navOpen)); menu?.classList.toggle('is-open', navOpen); frost?.classList.toggle('is-open', navOpen); };
  const cancelClose=()=>clearTimeout(navTimer);
  const scheduleClose=()=>{ clearTimeout(navTimer); navTimer=setTimeout(()=>setOpen(false),150); };
  trigger?.addEventListener('click',e=>{ e.stopPropagation(); setOpen(!navOpen); });
  if(finePointer.matches){
    trigger?.addEventListener('mouseenter',()=>{cancelClose();setOpen(true)});
    trigger?.addEventListener('mouseleave',scheduleClose);
    menu?.addEventListener('mouseenter',cancelClose);
    menu?.addEventListener('mouseleave',()=>{
      menu.querySelectorAll('a').forEach(a=>a.classList.remove('is-active'));
      siteName?.classList.add('is-cycling');
      scheduleClose();
    });
    menu?.querySelectorAll('a').forEach(link=>{
      link.addEventListener('mouseenter',()=>{
        siteName?.classList.remove('is-cycling');
        menu.querySelectorAll('a').forEach(a=>a.classList.remove('is-active'));
        link.classList.add('is-active');
      });
      link.addEventListener('mouseleave',()=>{
        link.classList.remove('is-active');
        siteName?.classList.add('is-cycling');
      });
    });
  }
  frost?.addEventListener('click',()=>setOpen(false));
  document.addEventListener('keydown',e=>{ if(e.key==='Escape'){ if(viewer?.classList.contains('is-open')) closeViewer(); else setOpen(false); } });

  document.querySelector('.available-intro').textContent=copy.intro;
  document.querySelector('.available-check span').textContent=copy.updates;
  form.querySelector('button[type="submit"]').textContent=copy.submit;
  document.querySelector('.available-privacy-note').childNodes[0].textContent=`${copy.privacy} `;
  document.querySelector('.available-list-intro p').textContent=copy.current;
  empty.textContent=copy.empty;

  const availableWorks=works=>(works||[]).map((work,index)=>({work,index})).filter(item=>item.work&&item.work.availableWorks===true);
  const accent=work=>/^#[0-9a-f]{6}$/i.test(work.navColor||'')?work.navColor:'#777777';
  const stripYear=title=>String(title||'').replace(/,?\s*(?:19|20)\d{2}\s*$/,'').trim();
  const imageList=work=>{
    const mains=Array.isArray(work.images)?work.images.filter(Boolean):[work.image].filter(Boolean);
    const details=[];
    if(Array.isArray(work.details)) details.push(...work.details.filter(Boolean));
    else if(work.details&&typeof work.details==='object'){ if(work.details.left)details.push(work.details.left); if(work.details.right)details.push(work.details.right); }
    return [...new Set([...mains,...details])];
  };

  function contactUrl(work){
    const title=work.title||'Untitled';
    const subject=`Purchase inquiry — ${title}`;
    const body=[`Hello Soïc,`,'',`I would like to purchase: ${title}`,work.medium?`Medium: ${work.medium}`:'',work.dimensions?`Dimensions: ${work.dimensions}`:'',work.price?`Listed price: ${work.price}`:'','',`Please let me know whether the work is still available and how I can proceed with the purchase.`,'',`Best,`].filter((v,i,a)=>v!==''||(i&&a[i-1]!=='')).join('\n');
    return `mailto:soickermarrec@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  let viewer=null, viewerImage=null, viewerItems=[], viewerIndex=0, pointerStart=null;
  function ensureViewer(){
    if(viewer) return;
    viewer=document.createElement('div'); viewer.className='available-viewer'; viewer.setAttribute('aria-hidden','true');
    const stage=document.createElement('div'); stage.className='available-viewer-stage';
    viewerImage=document.createElement('img'); viewerImage.className='available-viewer-image'; stage.appendChild(viewerImage);
    const close=document.createElement('button'); close.className='available-viewer-close'; close.type='button'; close.textContent='×'; close.setAttribute('aria-label','Close');
    const prev=document.createElement('button'); prev.className='available-viewer-prev'; prev.type='button'; prev.textContent='‹';
    const next=document.createElement('button'); next.className='available-viewer-next'; next.type='button'; next.textContent='›';
    const count=document.createElement('div'); count.className='available-viewer-count';
    viewer.append(stage, close, prev, next, count); document.body.appendChild(viewer);
    const show=i=>{ if(!viewerItems.length)return; viewerIndex=(i+viewerItems.length)%viewerItems.length; viewerImage.src=viewerItems[viewerIndex]; count.textContent=`${viewerIndex+1} / ${viewerItems.length}`; prev.hidden=next.hidden=viewerItems.length<2; };
    viewer._show=show;
    close.addEventListener('click',closeViewer);
    prev.addEventListener('click',e=>{e.stopPropagation();show(viewerIndex-1)});
    next.addEventListener('click',e=>{e.stopPropagation();show(viewerIndex+1)});
    viewer.addEventListener('click',e=>{ if(e.target===viewer||e.target===stage) closeViewer(); });
    stage.addEventListener('pointerdown',e=>{ pointerStart={x:e.clientX,y:e.clientY,t:performance.now()}; });
    stage.addEventListener('pointerup',e=>{ if(!pointerStart)return; const dx=e.clientX-pointerStart.x,dy=e.clientY-pointerStart.y; if(performance.now()-pointerStart.t<700&&Math.abs(dx)>48&&Math.abs(dx)>Math.abs(dy)*1.2)show(viewerIndex+(dx<0?1:-1)); pointerStart=null; });
    document.addEventListener('keydown',e=>{ if(!viewer.classList.contains('is-open'))return; if(e.key==='ArrowLeft')show(viewerIndex-1); if(e.key==='ArrowRight')show(viewerIndex+1); });
  }
  function openViewer(items,index=0,label=''){ viewerItems=[...new Set(items.filter(Boolean))]; if(!viewerItems.length)return; ensureViewer(); viewerImage.alt=label; viewer._show(index); viewer.classList.add('is-open'); viewer.setAttribute('aria-hidden','false'); document.documentElement.classList.add('available-viewer-open'); }
  function closeViewer(){ if(!viewer)return; viewer.classList.remove('is-open'); viewer.setAttribute('aria-hidden','true'); document.documentElement.classList.remove('available-viewer-open'); }

  function row(work){
    const article=document.createElement('article'); article.className='available-row'; article.style.setProperty('--accent',accent(work));
    const thumbWrap=document.createElement('button'); thumbWrap.type='button'; thumbWrap.className='available-thumb-wrap';
    const image=document.createElement('img'); image.className='available-thumb'; image.alt=stripYear(work.title)||'Artwork'; image.loading='lazy'; image.decoding='async';
    const images=imageList(work); image.src=images[0]||'../images/social-preview.jpg'; thumbWrap.appendChild(image); thumbWrap.addEventListener('click',()=>openViewer(images,0,work.title||'Artwork'));
    const meta=document.createElement('div'); meta.className='available-meta'; const title=document.createElement('h2'); title.textContent=work.title||'Untitled'; meta.appendChild(title);
    [work.medium,work.dimensions].filter(Boolean).forEach(value=>{const p=document.createElement('p');p.textContent=value;meta.appendChild(p)});
    const price=document.createElement('div'); price.className='available-price'; price.textContent=work.price||copy.priceOnRequest;
    const contactCell=document.createElement('div'); contactCell.className='available-contact-cell'; const contact=document.createElement('a'); contact.className='available-contact-button'; contact.href=contactUrl(work); contact.textContent=copy.contact; contact.setAttribute('aria-label',`${copy.contact}: ${work.title||'Untitled'}`); contactCell.appendChild(contact);
    article.append(thumbWrap,meta,price,contactCell); return article;
  }

  function render(){
    const painting=availableWorks(window.PAINTING_WORKS); const graphic=availableWorks(window.GRAPHIC_WORKS); const works=[...painting,...graphic];
    list.innerHTML=''; works.forEach(item=>list.appendChild(row(item.work))); empty.hidden=works.length>0;
  }
  function grantAccess(){ try{localStorage.setItem('soicAvailableWorksAccess','1')}catch(_){} gate.hidden=true; shell.hidden=false; render(); scrollTo({top:0,behavior:'auto'}); }
  async function checkEnabled(){ try{const res=await fetch('../data/available-config.json',{cache:'no-store'});const cfg=res.ok?await res.json():{enabled:false};if(cfg?.enabled!==true){document.querySelector('.available-gate-inner').innerHTML=`<p class="available-intro">${copy.hidden}</p>`;return false}return true}catch(_){return false} }
  let submitted=false;
  form.addEventListener('submit',event=>{ if(!form.reportValidity()){event.preventDefault();return} submitted=true; status.textContent=copy.status; setTimeout(grantAccess,650); });
  sink.addEventListener('load',()=>{if(submitted)grantAccess()});
  checkEnabled().then(enabled=>{if(!enabled)return;let hasAccess=false;try{hasAccess=localStorage.getItem('soicAvailableWorksAccess')==='1'}catch(_){}if(hasAccess)grantAccess()});
})();
