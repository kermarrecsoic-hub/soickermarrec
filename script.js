// Raster: Desktop 3 x 2; Mobile 2 x 3. Jeder Spawn-Punkt = exakte Zellmitte.
// Jedes Vorschaubild bleibt unbeschnitten und unverzerrt, maximal 1200 x 1200 px.
// Zu kleine Originalbilder werden niemals hochskaliert.
const links = [...document.querySelectorAll('.navigation a[data-preview]')];
const image = document.getElementById('preview');
const touch = matchMedia('(hover: none), (pointer: coarse)');
let active = null;

function mobileMode() { return touch.matches || innerWidth <= 700; }
function spawnPoint(value) {
  const columns = mobileMode() ? 2 : 3;
  const rows = mobileMode() ? 3 : 2;
  const index = Math.min(6, Math.max(1, Number(value) || 1)) - 1;
  const column = index % columns;
  const row = Math.floor(index / columns);
  return {x: (column + .5) * innerWidth / columns, y: (row + .5) * innerHeight / rows};
}
function positionImage(link) {
  const p = spawnPoint(link.dataset.spawn);
  // Maximaler mittiger Rahmen, der auch an Rand-Spawns im sichtbaren Fenster bleibt.
  const margin = 8;
  const fitWidth = Math.max(1, 2 * Math.min(p.x - margin, innerWidth - p.x - margin));
  const fitHeight = Math.max(1, 2 * Math.min(p.y - margin, innerHeight - p.y - margin));
  image.style.left = `${p.x}px`;
  image.style.top = `${p.y}px`;
  image.style.maxWidth = `${Math.min(1200, fitWidth)}px`;
  image.style.maxHeight = `${Math.min(1200, fitHeight)}px`;
}
function show(link) {
  links.forEach(a => a.classList.toggle('is-active', a === link));
  active = link;
  positionImage(link);
  // Nur eine Vorschau gleichzeitig; Dateien können leicht im images-Ordner ersetzt werden.
  image.src = link.dataset.preview;
  image.classList.add('is-visible');
}
function hide() {
  links.forEach(a => a.classList.remove('is-active'));
  image.classList.remove('is-visible');
  image.removeAttribute('src');
  active = null;
}
links.forEach(link => {
  link.addEventListener('mouseenter', () => { if (!mobileMode()) show(link); });
  link.addEventListener('mouseleave', () => { if (!mobileMode() && active === link) hide(); });
  link.addEventListener('focus', () => { if (!mobileMode()) show(link); });
  link.addEventListener('blur', () => { if (!mobileMode() && active === link) hide(); });
  link.addEventListener('click', event => {
    if (!mobileMode()) return; // Desktop: Klick öffnet Seite sofort.
    if (active !== link) {event.preventDefault(); show(link);} // 1. Tap = Vorschau; 2. Tap = Link.
  });
});
document.addEventListener('click', event => {
  if (mobileMode() && !event.target.closest('.navigation a')) hide();
});
window.addEventListener('resize', () => { if (active) positionImage(active); });
window.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
image.addEventListener('error', () => image.classList.remove('is-visible'));
