import { getRepoFile, json, requireAuth, safeImagePath } from '../../lib/server.mjs';

function mime(path) {
  if (/\.png$/i.test(path)) return 'image/png';
  if (/\.webp$/i.test(path)) return 'image/webp';
  return 'image/jpeg';
}

export default async (req) => {
  const authError = requireAuth(req);
  if (authError) return authError;
  if (req.method !== 'GET') return json({ ok: false, error: 'Method not allowed' }, 405);
  try {
    const path = safeImagePath(new URL(req.url).searchParams.get('path'));
    const file = await getRepoFile(path);
    return new Response(file.content, {
      status: 200,
      headers: {
        'content-type': mime(path),
        'cache-control': 'private, max-age=60',
      },
    });
  } catch (error) {
    return json({ ok: false, error: error.message }, 500);
  }
};
