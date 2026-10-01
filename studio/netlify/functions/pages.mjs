import { getRepoFileIfExists, json, requireAuth } from '../../lib/server.mjs';

export default async (req) => {
  const authError = requireAuth(req);
  if (authError) return authError;
  if (req.method !== 'GET') return json({ ok: false, error: 'Method not allowed' }, 405);
  try {
    const file = await getRepoFileIfExists('data/custom-pages.json');
    const pages = file ? JSON.parse(file.content.toString('utf8')) : [];
    return json({ ok: true, pages: Array.isArray(pages) ? pages : [] });
  } catch (error) {
    return json({ ok: false, error: error.message }, 500);
  }
};
