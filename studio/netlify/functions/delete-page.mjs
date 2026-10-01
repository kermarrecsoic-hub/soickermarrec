import { deleteRepoFile, getRepoFileIfExists, json, putRepoFile, requireAuth, requireSameOrigin, safePageSlug } from '../../lib/server.mjs';
const SITE = 'https://soickermarrec.de';
async function loadPages() {
  const file = await getRepoFileIfExists('data/custom-pages.json');
  if (!file) return [];
  const parsed = JSON.parse(file.content.toString('utf8'));
  return Array.isArray(parsed) ? parsed : [];
}
async function saveSitemap(pages) {
  const file = await getRepoFileIfExists('sitemap.xml');
  if (!file) return;
  let source = file.content.toString('utf8').replace(/\n?\s*<!-- CUSTOM_PAGES_START -->[\s\S]*?<!-- CUSTOM_PAGES_END -->\s*/m, '\n');
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
    const pages = (await loadPages()).filter(page => page.slug !== slug);
    await deleteRepoFile(`pages/${slug}.html`, `Studio: Seite ${slug} gelöscht`);
    await putRepoFile('data/custom-pages.json', Buffer.from(JSON.stringify(pages, null, 2) + '\n'), 'Studio: Seitenliste aktualisiert');
    await saveSitemap(pages);
    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, error: error.message }, 500);
  }
};
