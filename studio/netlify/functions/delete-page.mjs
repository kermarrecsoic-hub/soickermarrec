import { deleteRepoFile, getRepoFileIfExists, json, putRepoFile, requireAuth, requireSameOrigin, safePageSlug } from '../../lib/server.mjs';

async function loadPages() {
  const file = await getRepoFileIfExists('data/custom-pages.json');
  if (!file) return [];
  const parsed = JSON.parse(file.content.toString('utf8'));
  return Array.isArray(parsed) ? parsed : [];
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
    // Die Continuous-Website hat absichtlich nur die Root-URL in sitemap.xml.
    // Custom Pages sind noindex und dürfen die Sitemap daher weder beim
    // Erstellen noch beim Löschen verändern.
    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, error: error.message }, 500);
  }
};
