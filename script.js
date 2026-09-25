// V7: Acht asymmetrische Desktop-Punkte, drei erlaubte Positionen pro Link.
// Keine direkte Wiederholung; Bilder werden proportional verkleinert, falls sie die Navigation schneiden.
const links = [...document.querySelectorAll('.navigation a[data-preview]')];
const navigation = document.querySelector('.navigation');
const previewLink = document.getElementById('preview-link');
const image = document.getElementById('preview');
const touch = matchMedia('(hover: none), (pointer: coarse)');
let active = null;
let lastSpawn = null;
let currentSpawn = null;
let hideTimer = null;
let loadVersion = 0;

function mobileMode() { return touch.matches || innerWidth <= 700; }

// Desktop: relative Positionen innerhalb des sichtbaren Browserfensters.
// Die Anordnung orientiert sich an der Skizze, ist aber bewusst asymmetrisch.
const desktopPoints = {
  1: [.075, .185], // oben links
  2: [.615, .16],  // oben, leicht rechts
  3: [.925, .075], // oben rechts
  4: [.705, .50],  // rechts der Navigation
  5: [.335, .555], // links der Navigation
  6: [.075, .785], // unten links
  7: [.415, .86],  // unten, leicht links
  8: [.91, .80]   // unten rechts
};
// Mobile: eigene, locker verteilte Punkte. Kleinere Preview-Grenzen wie V6.
const mobilePoints = {
  1: [.23, .15], 2: [.69, .12], 3: [.83, .29], 4: [.82, .68],
  5: [.16, .34], 6: [.20, .82], 7: [.46, .89], 8: [.82, .85]
};
function spawnPoint(n) {
  const [x, y] = (mobileMode() ? mobilePoints : desktopPoints)[n] || [.5,.5];
  return { x: x * innerWidth, y: y * innerHeight };
}
function chooseSpawn(link) {
  const allowed = (link.dataset.spawns || '1,2,3').split(',')
    .map(Number).filter(n => Number.isInteger(n) && n >= 1 && n <= 8);
  const options = allowed.filter(n => n !== lastSpawn);
  const pool = options.length ? options : Object.keys(desktopPoints).map(Number).filter(n => n !== lastSpawn);
  return pool[Math.floor(Math.random() * pool.length)];
}

// Schutzzone: tatsächlicher Linkblock, mit zusätzlichem Weißraum ringsum.
// Der vollflächige .navigation-Container wird ausdrücklich NICHT als Schutzzone verwendet.
function safeZone() {
  const boxes = links.map(link => link.getBoundingClientRect());
  const paddingX = mobileMode() ? 18 : 65;
  const paddingY = mobileMode() ? 20 : 42;
  return {
    left: Math.min(...boxes.map(r => r.left)) - paddingX,
    right: Math.max(...boxes.map(r => r.right)) + paddingX,
    top: Math.min(...boxes.map(r => r.top)) - paddingY,
    bottom: Math.max(...boxes.map(r => r.bottom)) + paddingY
  };
}
function intersects(a,b) {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}
function rectAt(p,w,h) {
  return {left:p.x-w/2, right:p.x+w/2, top:p.y-h/2, bottom:p.y+h/2};
}
function fits(p,w,h,zone) {
  const margin = 8;
  const r=rectAt(p,w,h);
  return r.left >= margin && r.right <= innerWidth-margin &&
    r.top >= margin && r.bottom <= innerHeight-margin && !intersects(r,zone);
}
function maxScale(p, natW, natH, zone) {
  const margin = 8;
  // Originalbilder werden niemals vergrößert. Auf Mobile gelten dieselben
  // Grundgrenzen wie V6; zusätzlich schützen wir den zentralen Text.
  const fitW = Math.max(0,2*Math.min(p.x-margin,innerWidth-p.x-margin));
  const fitH = Math.max(0,2*Math.min(p.y-margin,innerHeight-p.y-margin));
  const upper = Math.min(1,1200/natW,1200/natH,fitW/natW,fitH/natH);
  if (upper <= 0) return 0;
  if (fits(p,natW*upper,natH*upper,zone)) return upper;
  // Ist der Spawn-Punkt selbst innerhalb der Schutzzone, passt hier kein Bild.
  if (p.x>zone.left && p.x<zone.right && p.y>zone.top && p.y<zone.bottom) return 0;
  let lo=0,hi=upper;
  for(let i=0;i<24;i++) {
    const mid=(lo+hi)/2;
    if(fits(p,natW*mid,natH*mid,zone)) lo=mid;
    else hi=mid;
  }
  return lo;
}
function positionImage() {
  if (!active || !image.naturalWidth || !image.naturalHeight) return;
  const zone=safeZone();
  const allowed=(active.dataset.spawns||'1,2,3').split(',').map(Number);
  // Zuerst den ausgewählten Punkt probieren. Falls dort kein sinnvoll großes
  // Bild möglich ist, auf einen anderen erlaubten Punkt ausweichen.
  const candidates=[currentSpawn,...allowed.filter(n=>n!==currentSpawn && n!==lastSpawn)];
  let best=null;
  for(const n of candidates) {
    const p=spawnPoint(n);
    const scale=maxScale(p,image.naturalWidth,image.naturalHeight,zone);
    if (!best || scale>best.scale) best={n,p,scale};
    if (scale>=.3) break;
  }
  if (!best || best.scale<.04) { previewLink.classList.remove('is-visible'); return; }
  currentSpawn=best.n;
  lastSpawn=currentSpawn;
  const w=Math.max(1,Math.floor(image.naturalWidth*best.scale));
  const h=Math.max(1,Math.floor(image.naturalHeight*best.scale));
  previewLink.style.left=`${best.p.x}px`;
  previewLink.style.top=`${best.p.y}px`;
  image.style.width=`${w}px`;
  image.style.height=`${h}px`;
  previewLink.classList.add('is-visible');
}
function cancelHide() { clearTimeout(hideTimer); hideTimer=null; }
function show(link) {
  cancelHide();
  if(active===link) return;
  currentSpawn=chooseSpawn(link);
  lastSpawn=currentSpawn;
  active=link;
  links.forEach(a=>a.classList.toggle('is-active',a===link));
  previewLink.href=link.href;
  previewLink.setAttribute('aria-label',`${link.textContent.trim()} öffnen`);
  previewLink.tabIndex=0;
  previewLink.classList.remove('is-visible');
  image.alt=`Vorschau: ${link.textContent.trim()}`;
  const version=++loadVersion;
  image.onload=()=>{if(version===loadVersion) positionImage();};
  image.onerror=()=>{if(version===loadVersion) previewLink.classList.remove('is-visible');};
  image.src=link.dataset.preview;
  if(image.complete && image.naturalWidth) positionImage();
}
function hide() {
  cancelHide();
  loadVersion++;
  links.forEach(a=>a.classList.remove('is-active'));
  previewLink.classList.remove('is-visible');
  previewLink.tabIndex=-1;
  active=null;
  currentSpawn=null;
}
function delayedHide() {
  cancelHide();
  hideTimer=setTimeout(()=>{
    if(!previewLink.matches(':hover') && !links.some(a=>a.matches(':hover'))) hide();
  },350);
}
links.forEach(link=>{
  link.addEventListener('mouseenter',()=>{if(!mobileMode()) show(link);});
  link.addEventListener('mouseleave',()=>{if(!mobileMode()) delayedHide();});
  link.addEventListener('focus',()=>{if(!mobileMode()) show(link);});
  link.addEventListener('blur',()=>{if(!mobileMode()) delayedHide();});
  link.addEventListener('click',event=>{
    if(!mobileMode()) return;
    if(active!==link) {event.preventDefault();show(link);}
  });
});
previewLink.addEventListener('mouseenter',cancelHide);
previewLink.addEventListener('mouseleave',()=>{if(!mobileMode())delayedHide();});
document.addEventListener('click',event=>{
  if(mobileMode() && !event.target.closest('.navigation a') && !event.target.closest('#preview-link')) hide();
});
window.addEventListener('resize',positionImage);
window.addEventListener('keydown',event=>{if(event.key==='Escape')hide();});
