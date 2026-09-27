// V8.4: Desktop-Vorschauen mit begrenzter Bildfläche und flexiblen Spawn-Bereichen.
// Mobile-Positionierung wie bisher, alle Bilder bleiben proportional.
const links = [...document.querySelectorAll('.navigation a[data-preview]')];
const navigation = document.querySelector('.navigation');
const previewLink = document.getElementById('preview-link');
const image = document.getElementById('preview');
const copyright = document.querySelector('.copyright');
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
  3: [.85, .16],  // oben rechts – weiter innen für erkennbare Bildgröße
  4: [.705, .50],  // rechts der Navigation
  5: [.255, .555], // links der Navigation
  6: [.17, .715], // unten links: weiter über dem Copyright, mehr Höhe für Ex. 26
  7: [.40, .765], // unterhalb der Navigation, über dem Copyright
  8: [.81, .685] // unten rechts: Platz für eine größere XXX-Vorschau
};
// Mobile: eigene, locker verteilte Punkte. Kleinere Preview-Grenzen wie V6.
const mobilePoints = {
  1: [.23, .15], 2: [.69, .12], 3: [.83, .29], 4: [.82, .65],
  5: [.16, .34], 6: [.20, .74], 7: [.46, .77], 8: [.82, .72]
};
function spawnPoint(n) {
  const [x, y] = (mobileMode() ? mobilePoints : desktopPoints)[n] || [.5,.5];
  return { x: x * innerWidth, y: y * innerHeight };
}
function allowedSpawns(link) {
  // Nur hier im HTML ändern: data-spawns="1,2,8". Keine versteckten Overrides.
  const assigned = link.dataset.spawns || '1,2,3';
  return [...new Set(assigned.split(',')
    .map(Number).filter(n => Number.isInteger(n) && n >= 1 && n <= 8))];
}

// Schutzzone: tatsächlicher Linkblock, mit zusätzlichem Weißraum ringsum.
// Der vollflächige .navigation-Container wird ausdrücklich NICHT als Schutzzone verwendet.
function safeZone() {
  const boxes = links.map(link => link.getBoundingClientRect());
  // Geringerer Abstand vor allem in Y: größere Bilder ober-/unterhalb der Liste.
  const paddingX = mobileMode() ? 18 : 42;
  const paddingY = mobileMode() ? 16 : 16;
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
function previewLimits() {
  const margin = 8;
  // Tatsächliche Footer-Kante verwenden, damit Bilder nie über dem
  // Copyright-Text liegen – unabhängig von Bildschirmhöhe und Schriftgröße.
  const footerTop = copyright ? copyright.getBoundingClientRect().top : innerHeight;
  const footerGap = mobileMode() ? 12 : 18;
  return { margin, bottom: Math.max(0, Math.min(innerHeight - margin, footerTop - footerGap)) };
}
function rectAt(p,w,h) {
  return {left:p.x-w/2, right:p.x+w/2, top:p.y-h/2, bottom:p.y+h/2};
}
function fits(p,w,h,zone) {
  const { margin, bottom } = previewLimits();
  const r = rectAt(p,w,h);
  return r.left >= margin && r.right <= innerWidth - margin &&
    r.top >= margin && r.bottom <= bottom && !intersects(r,zone);
}
function maxScale(p, natW, natH, zone) {
  const { margin, bottom } = previewLimits();
  // Originalbilder werden niemals vergrößert. Auf Mobile gelten dieselben
  // Grundgrenzen wie V6; zusätzlich schützen wir den zentralen Text.
  const fitW = Math.max(0,2*Math.min(p.x-margin,innerWidth-p.x-margin));
  const fitH = Math.max(0,2*Math.min(p.y-margin,bottom-p.y));
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
// Desktop: Der Spawnpunkt definiert eine bevorzugte Gegend, NICHT einen
// unverrückbaren Bildmittelpunkt. Vier maximal nutzbare Bereiche umgehen die
// zentrale Navigation. Erst positionieren, nur wenn nötig proportional verkleinern.
function desktopPlacement(spawn, naturalWidth, naturalHeight, zone) {
  const { bottom } = previewLimits();
  const margin = 24;
  const navGap = 20;
  const bounds = { left: margin, right: innerWidth-margin, top: margin, bottom: bottom-16 };
  const regions = [
    { name: 'left', left: bounds.left, right: zone.left-navGap, top: bounds.top, bottom: bounds.bottom },
    { name: 'right', left: zone.right+navGap, right: bounds.right, top: bounds.top, bottom: bounds.bottom },
    { name: 'top', left: bounds.left, right: bounds.right, top: bounds.top, bottom: zone.top-navGap },
    { name: 'bottom', left: bounds.left, right: bounds.right, top: zone.bottom+navGap, bottom: bounds.bottom }
  ];
  // Ca. 11 % der sichtbaren Bildschirmfläche: der Mittelweg zwischen den
  // beiden gelungenen Beispielen. Die große Painting-Vorschau erreicht nicht
  // mehr fast 20 % der Gesamtfläche. Keine Vergrößerung kleiner Originale.
  const areaCap = Math.min(innerWidth*innerHeight*.115, 190000);
  const absoluteCap = 1200;
  const preferred = spawnPoint(spawn);
  const placements = [];
  for (const r of regions) {
    const availableW = r.right-r.left;
    const availableH = r.bottom-r.top;
    if (availableW < 75 || availableH < 75) continue;
    const naturalArea = naturalWidth*naturalHeight;
    const scale = Math.min(
      1, absoluteCap/naturalWidth, absoluteCap/naturalHeight,
      Math.sqrt(areaCap/naturalArea),
      availableW/naturalWidth, availableH/naturalHeight
    );
    if (scale <= 0) continue;
    const width = Math.floor(naturalWidth*scale);
    const height = Math.floor(naturalHeight*scale);
    const x = Math.max(r.left+width/2, Math.min(preferred.x, r.right-width/2));
    const y = Math.max(r.top+height/2, Math.min(preferred.y, r.bottom-height/2));
    const travel = Math.hypot((x-preferred.x)/innerWidth,(y-preferred.y)/innerHeight);
    const utilization = (width*height)/areaCap;
    // Möglichst große Bilder bevorzugen; nur bei ähnlichen Bildgrößen die
    // Position möglichst nah am ursprünglichen Spawnpunkt wählen.
    const score = utilization - travel*.65;
    placements.push({x,y,width,height,score,area:width*height});
  }
  return placements.sort((a,b)=>b.score-a.score)[0] || null;
}
function positionImage({ keepCurrent = false } = {}) {
  if (!active || !image.naturalWidth || !image.naturalHeight) return false;
  const zone = safeZone();
  const allowed = allowedSpawns(active);
  const candidates = keepCurrent && currentSpawn !== null
    ? [currentSpawn]
    : allowed.filter(n => n !== previousSpawn);
  const pool = candidates.length ? candidates
    : Object.keys(mobileMode() ? mobilePoints : desktopPoints)
        .map(Number).filter(n => n !== previousSpawn);
  let choices;
  if (mobileMode()) {
    // Bewährte mobile Darstellung und Touch-Interaktion unverändert lassen.
    choices = pool.map(n => {
      const p = spawnPoint(n);
      const scale = maxScale(p,image.naturalWidth,image.naturalHeight,zone);
      return {n, x:p.x, y:p.y, width:Math.floor(image.naturalWidth*scale),
        height:Math.floor(image.naturalHeight*scale), scale};
    });
  } else {
    choices = pool.map(n => {
      const placement = desktopPlacement(n,image.naturalWidth,image.naturalHeight,zone);
      return placement ? {n,...placement,scale:placement.area/(image.naturalWidth*image.naturalHeight)}
        : {n,scale:0};
    });
  }
  const bestScale = Math.max(...choices.map(c=>c.scale));
  const viable = choices.filter(c=>c.scale >= Math.max(mobileMode() ? .04 : .005,bestScale*.68));
  const selection = viable.length ? viable : choices.filter(c=>c.scale===bestScale);
  const chosen = selection[Math.floor(Math.random()*selection.length)];
  if (!chosen || !chosen.width || !chosen.height || chosen.scale <= 0) {
    previewLink.classList.remove('is-visible');
    return false;
  }
  currentSpawn = chosen.n;
  if (!keepCurrent) previousSpawn = chosen.n;
  previewLink.style.left = `${chosen.x}px`;
  previewLink.style.top = `${chosen.y}px`;
  image.style.width = `${chosen.width}px`;
  image.style.height = `${chosen.height}px`;
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
// Desktop: Eine geöffnete Vorschau bleibt nach Verlassen des Links sichtbar.
// Ein neuer Link ersetzt sie; Klick auf den Hintergrund oder Escape schließt sie.
links.forEach(link => {
  link.addEventListener('mouseenter', () => { if (!mobileMode()) show(link); });
  link.addEventListener('focus', () => { if (!mobileMode()) show(link); });
  link.addEventListener('click', event => {
    if (!mobileMode()) return;
    if (active !== link) { event.preventDefault(); show(link); }
  });
});
document.addEventListener('click', event => {
  if (!event.target.closest('.navigation a') && !event.target.closest('#preview-link')) hide();
});
window.addEventListener('resize',()=>positionImage({keepCurrent:true}));
window.addEventListener('keydown',event=>{if(event.key==='Escape')hide();});

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
