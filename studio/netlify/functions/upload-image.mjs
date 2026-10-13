import { json, putRepoFile, requireAuth, requireSameOrigin, safeImagePath } from '../../lib/server.mjs';

function safePreviewPath(value) {
  const path = String(value || '').replace(/^\/+/, '');
  if (!path.startsWith('Vorschaubild/')) throw new Error('Vorschaubilder dürfen nur unter Vorschaubild/ gespeichert werden.');
  if (path.includes('..') || path.includes('\\')) throw new Error('Ungültiger Vorschaubildpfad.');
  if (!/\.webp$/i.test(path)) throw new Error('Vorschaubilder müssen WebP sein.');
  return path;
}

export default async (req) => {
  const authError = requireAuth(req);
  if (authError) return authError;
  const originError = requireSameOrigin(req);
  if (originError) return originError;
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);

  try {
    const body = await req.json();
    const previewOnly = body.previewOnly === true;
    let path = '';

    if (!previewOnly) {
      path = safeImagePath(body.path);
      const base64 = String(body.base64 || '').replace(/^data:[^,]+,/, '');
      if (!base64) return json({ ok: false, error: 'Kein Bild empfangen.' }, 400);
      const bytes = Buffer.from(base64, 'base64');
      if (bytes.length > 4_000_000) {
        return json({ ok: false, error: 'Das optimierte Bild ist größer als 4 MB. Bitte kleiner exportieren.' }, 413);
      }
      await putRepoFile(path, bytes, `Studio: Bild ${path}`);
    }

    const previews = Array.isArray(body.previews) ? body.previews.slice(0, 4) : [];
    if (previewOnly && !previews.length) return json({ ok: false, error: 'Keine Vorschaubilder empfangen.' }, 400);
    for (const preview of previews) {
      const previewPath = safePreviewPath(preview?.path);
      const previewBase64 = String(preview?.base64 || '').replace(/^data:[^,]+,/, '');
      if (!previewBase64) continue;
      const previewBytes = Buffer.from(previewBase64, 'base64');
      if (previewBytes.length > 250_000) throw new Error('Vorschaubild ist unerwartet groß.');
      await putRepoFile(previewPath, previewBytes, `Studio: Vorschaubild ${previewPath}`);
    }

    return json({ ok: true, path: path || null, previews: previews.map(item => item.path) });
  } catch (error) {
    return json({ ok: false, error: error.message }, 500);
  }
};
