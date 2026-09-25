// V8: Mobile-Spawnwechsel korrigiert; kein direkter Wiederholungs-Punkt.
// Keine direkte Wiederholung; Bilder werden proportional verkleinert, falls sie die Navigation schneiden.
const links = [...document.querySelectorAll('.navigation a[data-preview]')];
const navigation = document.querySelector('.navigation');
const previewLink = document.getElementById('preview-link');
const image = document.getElementById('preview');
const touch = matchMedia('(hover: none), (pointer: coarse)');
let active = null;
let currentSpawn = null;
let previousSpawn = null; // Vorheriger tatsächlich angezeigter Punkt
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
function allowedSpawns(link) {
  // Contact und Painting tauschen die im Screenshot gezeigten Desktop-Spawnpunkte.
  // Contact: Punkt 1 statt 4; Painting: Punkt 4 statt 1.
  const assigned = link.getAttribute('href')?.endsWith('/contact.html') ? '1,2,8'
    : link.getAttribute('href')?.endsWith('/painting.html') ? '4,5,7'
    : (link.dataset.spawns || '1,2,3');
  return [...new Set(assigned.split(',')
    .map(Number).filter(n => Number.isInteger(n) && n >= 1 && n <= 8))];
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
function positionImage({ keepCurrent = false } = {}) {
  if (!active || !image.naturalWidth || !image.naturalHeight) return;
  const zone = safeZone();
  const allowed = allowedSpawns(active);
  // Beim Linkwechsel den vorherigen sichtbaren Punkt konsequent ausschließen.
  // Bei einer Größenänderung bleibt der bereits gewählte Punkt erhalten.
  const candidates = keepCurrent && currentSpawn !== null
    ? [currentSpawn]
    : allowed.filter(n => n !== previousSpawn);
  // Sollte ein Link nur den vorherigen Punkt anbieten, auf alle anderen
  // acht Punkte ausweichen, statt dieselbe Position zu wiederholen.
  const pool = candidates.length ? candidates
    : Object.keys(mobileMode() ? mobilePoints : desktopPoints)
        .map(Number).filter(n => n !== previousSpawn);
  const choices = pool.map(n => {
    const p = spawnPoint(n);
    return { n, p, scale: maxScale(p, image.naturalWidth, image.naturalHeight, zone) };
  });
  // Nur Punkte berücksichtigen, an denen die Vorschau erkennbar groß bleibt.
  // Dadurch verschwindet die Rotation auf schmalen Mobilgeräten nicht scheinbar.
  const bestScale = Math.max(...choices.map(c => c.scale));
  const viable = choices.filter(c => c.scale >= Math.max(.04, bestScale * .65));
  const selection = viable.length ? viable : choices.filter(c => c.scale === bestScale);
  const chosen = selection[Math.floor(Math.random() * selection.length)];
  if (!chosen || chosen.scale < .04) {
    previewLink.classList.remove('is-visible');
    return false;
  }
  currentSpawn = chosen.n;
  if (!keepCurrent) previousSpawn = chosen.n;
  const w = Math.max(1, Math.floor(image.naturalWidth * chosen.scale));
  const h = Math.max(1, Math.floor(image.naturalHeight * chosen.scale));
  previewLink.style.left = `${chosen.p.x}px`;
  previewLink.style.top = `${chosen.p.y}px`;
  image.style.width = `${w}px`;
  image.style.height = `${h}px`;
  previewLink.classList.add('is-visible');
  return true;
}

function cancelHide() { clearTimeout(hideTimer); hideTimer=null; }
function show(link) {
  cancelHide();
  if(active===link) return;
  currentSpawn=null;
  active=link;
  // Schrift bleibt Arial, bis die neue Vorschau tatsächlich sichtbar ist.
  links.forEach(a=>a.classList.remove('is-active'));
  previewLink.href=link.href;
  previewLink.setAttribute('aria-label',`${link.textContent.trim()} öffnen`);
  previewLink.tabIndex=0;
  previewLink.classList.remove('is-visible');
  image.alt=`Vorschau: ${link.textContent.trim()}`;
  const version=++loadVersion;
  let displayed = false;
  async function revealWhenReady() {
    if (displayed || version !== loadVersion || active !== link) return;
    // decode() wartet auch bei Bildern aus dem Browsercache auf die Dekodierung.
    try {
      if (image.decode) await image.decode();
    } catch (_) {
      // Einige Browser unterstützen decode() nur eingeschränkt.
    }
    if (displayed || version !== loadVersion || active !== link || !image.naturalWidth) return;
    displayed = true;
    const visible = positionImage();
    if (!visible) return;
    // Zwei Frames: erst Bild positionieren, dann einen sichtbaren Paint abwarten.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (version === loadVersion && active === link && previewLink.classList.contains('is-visible')) {
        link.classList.add('is-active');
      }
    }));
  }
  image.onload = revealWhenReady;
  image.onerror = () => {
    if (version === loadVersion) previewLink.classList.remove('is-visible');
  };
  image.src = link.dataset.preview;
  if (image.complete && image.naturalWidth) revealWhenReady();
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
window.addEventListener('resize',()=>positionImage({keepCurrent:true}));
window.addEventListener('keydown',event=>{if(event.key==='Escape')hide();});
