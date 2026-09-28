import { REPO, githubFetch, json, requireAuth } from '../../lib/server.mjs';

export default async (req) => {
  const authError = requireAuth(req);
  if (authError) return authError;
  if (req.method !== 'GET') return json({ ok: false, error: 'Method not allowed' }, 405);
  try {
    const res = await githubFetch(`/repos/${REPO.owner}/${REPO.repo}/git/trees/${encodeURIComponent(REPO.branch)}?recursive=1`);
    const data = await res.json();
    const images = (data.tree || [])
      .filter(item => item.type === 'blob' && /^images\//.test(item.path) && /\.(jpe?g|png|webp)$/i.test(item.path))
      .map(item => item.path)
      .sort((a, b) => a.localeCompare(b, 'de', { numeric: true, sensitivity: 'base' }));
    return json({ ok: true, images, truncated: Boolean(data.truncated) });
  } catch (error) {
    return json({ ok: false, error: error.message }, 500);
  }
};
