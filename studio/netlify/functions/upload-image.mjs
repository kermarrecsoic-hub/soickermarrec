import { json, putRepoFile, requireAuth, requireSameOrigin, safeImagePath } from '../../lib/server.mjs';

export default async (req) => {
  const authError = requireAuth(req);
  if (authError) return authError;
  const originError = requireSameOrigin(req);
  if (originError) return originError;
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);

  try {
    const body = await req.json();
    const path = safeImagePath(body.path);
    const base64 = String(body.base64 || '').replace(/^data:[^,]+,/, '');
    if (!base64) return json({ ok: false, error: 'Kein Bild empfangen.' }, 400);
    const bytes = Buffer.from(base64, 'base64');
    if (bytes.length > 4_000_000) {
      return json({ ok: false, error: 'Das optimierte Bild ist größer als 4 MB. Bitte kleiner exportieren.' }, 413);
    }
    await putRepoFile(path, bytes, `Studio: Bild ${path}`);
    return json({ ok: true, path });
  } catch (error) {
    return json({ ok: false, error: error.message }, 500);
  }
};
