// V5: Pro Link 2–3 mögliche Rasterpunkte. Ein neuer Link verwendet nie den letzten Punkt.
// Desktop: 3 × 2; Mobile: 2 × 3. Alle Punkte sind exakt zentrierte Rasterzellen.
const links = [...document.querySelectorAll('.navigation a[data-preview]')];
const image = document.getElementById('preview');
const touch = matchMedia('(hover: none), (pointer: coarse)');
let active = null;
let lastSpawn = null;
let currentSpawn = null;
let hideTimer = null;

function mobileMode() { return touch.matches || innerWidth <= 700; }
function chooseSpawn(link) {
  const allowed = (link.dataset.spawns || '1,2,3').split(',')
    .map(Number).filter(n => Number.isInteger(n) && n >= 1 && n <= 6);
  const choices = allowed.filter(n => n !== lastSpawn);
  const pool = choices.length ? choices : [1,2,3,4,5,6].filter(n => n !== lastSpawn);
  return pool[Math.floor(Math.random() * pool.length)];
}
function spawnPoint(n) {
  const cols = mobileMode() ? 2 : 3;
  const rows = mobileMode() ? 3 : 2;
  const index = n - 1;
  return {
    x: ((index % cols) + .5) * innerWidth / cols,
    y: (Math.floor(index / cols) + .5) * innerHeight / rows
  };
}
function positionImage() {
  if (!active || !currentSpawn) return;
  const p = spawnPoint(currentSpawn);
  const margin = mobileMode() ? 6 : 8;
  // Mobile: größere Vorschauen als zuvor. Der Bildmittelpunkt bleibt der Spawn-Punkt.
  // Bei randnahen Punkten dürfen die Bilder andere Rasterzellen überlagern,
  // aber nicht über die Fensterkante hinauslaufen.
  const fitW = 2 * Math.min(p.x - margin, innerWidth - p.x - margin);
  const fitH = 2 * Math.min(p.y - margin, innerHeight - p.y - margin);
  // Auf Mobilgeräten wird der Rahmen gegenüber V4 bewusst vergrößert.
  const maxW = mobileMode() ? innerWidth * .90 : fitW;
  const maxH = mobileMode() ? innerHeight * .55 : fitH;
  image.style.maxWidth = `${Math.min(1200, Math.max(1, maxW))}px`;
  image.style.maxHeight = `${Math.min(1200, Math.max(1, maxH))}px`;
  // Bei Bedarf den tatsächlichen Bildmittelpunkt etwas nach innen verschieben,
  // damit das gesamte Bild sichtbar bleibt (kein Beschnitt am Displayrand).
  const ratio = Math.min(1, maxW / (image.naturalWidth || maxW), maxH / (image.naturalHeight || maxH));
  const w = (image.naturalWidth || maxW) * ratio;
  const h = (image.naturalHeight || maxH) * ratio;
  const x = mobileMode() ? Math.max(w / 2 + margin, Math.min(innerWidth - w / 2 - margin, p.x)) : p.x;
  const y = mobileMode() ? Math.max(h / 2 + margin, Math.min(innerHeight - h / 2 - margin, p.y)) : p.y;
  image.style.left = `${x}px`;
  image.style.top = `${y}px`;
}
function cancelHide() { clearTimeout(hideTimer); hideTimer = null; }
function show(link) {
  cancelHide();
  if (active === link) return;
  currentSpawn = chooseSpawn(link);
  lastSpawn = currentSpawn;
  active = link;
  links.forEach(a => a.classList.toggle('is-active', a === link));
  image.src = link.dataset.preview;
  image.alt = `Vorschau: ${link.textContent.trim()} – klicken zum Öffnen`;
  image.setAttribute('role', 'link');
  image.setAttribute('tabindex', '0');
  image.setAttribute('aria-label', `${link.textContent.trim()} öffnen`);
  positionImage();
  image.classList.add('is-visible');
}
function hide() {
  cancelHide();
  links.forEach(a => a.classList.remove('is-active'));
  image.classList.remove('is-visible');
  image.removeAttribute('src');
  image.removeAttribute('tabindex');
  active = null;
  currentSpawn = null;
}
function delayedHide() {
  cancelHide();
  hideTimer = setTimeout(() => {
    if (!image.matches(':hover') && !links.some(a => a.matches(':hover'))) hide();
  }, 350);
}
function openActive() { if (active) window.location.href = active.href; }
links.forEach(link => {
  link.addEventListener('mouseenter', () => { if (!mobileMode()) show(link); });
  link.addEventListener('mouseleave', () => { if (!mobileMode()) delayedHide(); });
  link.addEventListener('focus', () => { if (!mobileMode()) show(link); });
  link.addEventListener('blur', () => { if (!mobileMode()) delayedHide(); });
  link.addEventListener('click', event => {
    if (!mobileMode()) return; // Desktop: Link öffnet direkt.
    if (active !== link) { event.preventDefault(); show(link); }
    // Zweiter Tap auf denselben Link: Browser navigiert.
  });
});
image.addEventListener('mouseenter', cancelHide);
image.addEventListener('mouseleave', () => { if (!mobileMode()) delayedHide(); });
image.addEventListener('click', event => { event.stopPropagation(); openActive(); });
image.addEventListener('keydown', event => {
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openActive(); }
});
document.addEventListener('click', event => {
  if (mobileMode() && !event.target.closest('.navigation a') && event.target !== image) hide();
});
window.addEventListener('resize', positionImage);
window.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
image.addEventListener('load', positionImage);
image.addEventListener('error', () => image.classList.remove('is-visible'));
