const SITE = 'https://soickermarrec.de';

const GALLERY_PATHS = {
  painting: 'pages/painting.html',
  graphic: 'pages/graphic.html',
};

const IMAGE_ROOTS = {
  painting: 'images/painting',
  graphic: 'images/ink',
};

function cleanRepoPath(value = '') {
  return String(value).trim().replace(/^\.\.\//, '').replace(/^\/+/, '');
}

export function slugifyShare(value = '') {
  return String(value)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function workImages(work = {}) {
  if (Array.isArray(work.images) && work.images.length) return work.images.filter(Boolean);
  return work.image ? [work.image] : [];
}

export function shareIdForWork(sectionKey, work = {}, index = 0) {
  const explicit = slugifyShare(work.shareId || '');
  if (explicit) return explicit;

  const first = cleanRepoPath(workImages(work)[0] || '');
  const root = IMAGE_ROOTS[sectionKey];
  if (root && first.startsWith(`${root}/`)) {
    const rest = first.slice(root.length + 1);
    const folder = rest.includes('/') ? rest.split('/')[0] : rest.replace(/\.[^.]+$/, '');
    const fromFolder = slugifyShare(folder);
    if (fromFolder) return fromFolder;
  }

  return slugifyShare(work.title || '') || `werk-${index + 1}`;
}

export function sharePagePath(sectionKey, work, index = 0) {
  return `share/${sectionKey}/${shareIdForWork(sectionKey, work, index)}.html`;
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function absoluteUrl(repoPath) {
  return new URL(cleanRepoPath(repoPath), `${SITE}/`).href;
}

export function renderSharePage(sectionKey, work = {}, index = 0) {
  const galleryPath = GALLERY_PATHS[sectionKey];
  if (!galleryPath) throw new Error('Für diesen Bereich gibt es keine Werk-Share-Seite.');

  const id = shareIdForWork(sectionKey, work, index);
  const sharePath = sharePagePath(sectionKey, work, index);
  const shareUrl = absoluteUrl(sharePath);
  const targetUrl = `${absoluteUrl(galleryPath)}#werk-${encodeURIComponent(id)}`;
  const firstImage = workImages(work)[0] || 'images/social-preview.jpg';
  const imageUrl = absoluteUrl(firstImage);
  const title = String(work.title || 'Werk').trim() || 'Werk';
  const description = [work.medium, work.dimensions].filter(Boolean).join(' · ') || `Werk von Soïc Kermarrec`;
  const fullTitle = `${title} — Soïc Kermarrec`;

  return `<!doctype html>\n<html lang="de">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1">\n<title>${escapeHtml(fullTitle)}</title>\n<meta name="description" content="${escapeHtml(description)}">\n<meta name="robots" content="noindex,follow,max-image-preview:large">\n<link rel="canonical" href="${escapeHtml(targetUrl)}">\n<meta property="og:type" content="article">\n<meta property="og:site_name" content="Soïc Kermarrec">\n<meta property="og:title" content="${escapeHtml(fullTitle)}">\n<meta property="og:description" content="${escapeHtml(description)}">\n<meta property="og:url" content="${escapeHtml(shareUrl)}">\n<meta property="og:image" content="${escapeHtml(imageUrl)}">\n<meta property="og:image:alt" content="${escapeHtml(title)} — Soïc Kermarrec">\n<meta name="twitter:card" content="summary_large_image">\n<meta name="twitter:title" content="${escapeHtml(fullTitle)}">\n<meta name="twitter:description" content="${escapeHtml(description)}">\n<meta name="twitter:image" content="${escapeHtml(imageUrl)}">\n<script>location.replace(${JSON.stringify(targetUrl)});<\/script>\n</head>\n<body>\n<p><a href="${escapeHtml(targetUrl)}">${escapeHtml(title)} — Soïc Kermarrec</a></p>\n</body>\n</html>\n`;
}
