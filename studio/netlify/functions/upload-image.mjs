import { getRepoFileIfExists, json, putRepoFile, requireAuth, requireSameOrigin, safeImagePath } from '../../lib/server.mjs';

const DIMENSIONS_PATH = 'data/image-dimensions.js';

function parseDimensions(source = '') {
  const match = String(source).match(/window\.SOIC_IMAGE_DIMENSIONS\s*=\s*(\{[\s\S]*\})\s*;?\s*$/);
  if (!match) return {};
  try { return JSON.parse(match[1]); } catch { return {}; }
}

async function updateDimensions(path, width, height) {
  width = Math.round(Number(width));
  height = Math.round(Number(height));
  if (!(width > 0 && height > 0)) return;
  const existing = await getRepoFileIfExists(DIMENSIONS_PATH);
  const map = existing ? parseDimensions(existing.content.toString('utf8')) : {};
  map[path] = [width, height];
  const ordered = Object.fromEntries(Object.entries(map).sort(([a], [b]) => a.localeCompare(b)));
  const source = `/* Managed by Soïc Studio. Reserves intrinsic image geometry before lazy loading. */\nwindow.SOIC_IMAGE_DIMENSIONS = ${JSON.stringify(ordered)};\n`;
  await putRepoFile(DIMENSIONS_PATH, Buffer.from(source), `Studio: Bildmaße ${path}`);
}

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
    await updateDimensions(path, body.width, body.height);
    return json({ ok: true, path });
  } catch (error) {
    return json({ ok: false, error: error.message }, 500);
  }
};
