import { getRepoFileIfExists, json, putRepoFile, requireAuth, requireSameOrigin, safePageSlug } from '../../lib/server.mjs';

const SITE = 'https://soickermarrec.de';
const TYPO_KEYWORDS = 'Soïc Kermarrec, Soic Kermarrec, S. Kermarrec, Soick Kermarrec, Soik Kermarrec, Kermarek, Kermarreg, Keramrec, Kermarec, Künstler Leipzig, artist Leipzig';

function esc(value = '') {
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

function paragraphs(value = '') {
  return String(value).trim().split(/\n\s*\n/).filter(Boolean)
    .map(block => `<p>${esc(block).replace(/\n/g, '<br>')}</p>`).join('\n');
}

function pageHtml(page) {
  const title = esc(page.title);
  const description = esc(page.description || `${page.title} — Soïc Kermarrec`);
  const url = `${SITE}/pages/${page.slug}.html`;
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} | Soïc Kermarrec</title>
<meta name="description" content="${description}">
<meta name="keywords" content="${TYPO_KEYWORDS}">
<meta name="author" content="Soïc Kermarrec">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${url}">
<link rel="icon" href="/favicon.png" type="image/png">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Soïc Kermarrec">
<meta property="og:title" content="${title} | Soïc Kermarrec">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/images/social-preview.jpg">
<meta property="og:image:alt" content="Soïc Kermarrec — Künstlerportfolio">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title} | Soïc Kermarrec">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${SITE}/images/social-preview.jpg">
<link rel="stylesheet" href="../css/gallery.css">
<script defer src="../js/i18n.js"></script>
</head>
<body class="gallery-page custom-page">
<header class="site-header"><nav class="site-nav" aria-label="Portfolio sections">
<a href="../index.html">Soïc Kermarrec</a><a data-i18n="nav.painting" href="painting.html">Malerei</a><a data-i18n="nav.graphic" href="graphic.html">Tinte</a><a data-i18n="nav.exhibitions" href="ex26.html">Ausstellung</a><a data-i18n="nav.architecture" href="architecture.html">Arch.0</a><a data-i18n="nav.photography" href="xxx.html">Fotografie</a><a data-i18n="nav.about" href="about.html">About</a><a data-i18n="nav.contact" href="contact.html">Kontakt</a>
</nav></header>
<main class="editorial-page custom-page-shell"><div class="editorial-text custom-page-content"><h1 class="custom-page-title">${title}</h1>${paragraphs(page.body)}</div></main>
<footer class="site-footer"><a class="footer-instagram" href="https://www.instagram.com/soicyv/" rel="noopener noreferrer me" target="_blank">Instagram</a><nav class="footer-links" aria-label="Legal links"><a data-i18n="legal.imprint" href="impressum.html">Impressum</a><a data-i18n="legal.privacy" href="datenschutz.html">Datenschutz</a></nav></footer>
</body></html>\n`;
}

async function loadPages() {
  const file = await getRepoFileIfExists('data/custom-pages.json');
  if (!file) return [];
  const parsed = JSON.parse(file.content.toString('utf8'));
  return Array.isArray(parsed) ? parsed : [];
}

async function saveSitemap(pages) {
  const sitemapFile = await getRepoFileIfExists('sitemap.xml');
  if (!sitemapFile) return;
  let source = sitemapFile.content.toString('utf8');
  source = source.replace(/\n?\s*<!-- CUSTOM_PAGES_START -->[\s\S]*?<!-- CUSTOM_PAGES_END -->\s*/m, '\n');
  const block = `\n  <!-- CUSTOM_PAGES_START -->\n${pages.map(page => `  <url><loc>${SITE}/pages/${page.slug}.html</loc></url>`).join('\n')}\n  <!-- CUSTOM_PAGES_END -->\n`;
  source = source.replace(/\s*<\/urlset>\s*$/, `${block}\n</urlset>\n`);
  await putRepoFile('sitemap.xml', Buffer.from(source), 'Studio: Sitemap aktualisiert');
}

export default async (req) => {
  const authError = requireAuth(req); if (authError) return authError;
  const originError = requireSameOrigin(req); if (originError) return originError;
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);
  try {
    const body = await req.json();
    const slug = safePageSlug(body.slug);
    const title = String(body.title || '').trim().slice(0, 120);
    if (!title) return json({ ok: false, error: 'Titel fehlt.' }, 400);
    const page = {
      title,
      slug,
      description: String(body.description || '').trim().slice(0, 320),
      body: String(body.body || '').trim().slice(0, 30000),
      updatedAt: new Date().toISOString(),
    };
    const pages = await loadPages();
    const index = pages.findIndex(item => item.slug === slug);
    if (index >= 0) pages[index] = page; else pages.push(page);
    pages.sort((a, b) => a.title.localeCompare(b.title, 'de'));
    await putRepoFile(`pages/${slug}.html`, Buffer.from(pageHtml(page)), `Studio: Seite ${title}`);
    await putRepoFile('data/custom-pages.json', Buffer.from(JSON.stringify(pages, null, 2) + '\n'), 'Studio: Seitenliste aktualisiert');
    await saveSitemap(pages);
    return json({ ok: true, page });
  } catch (error) {
    return json({ ok: false, error: error.message }, 500);
  }
};
