import { SECTIONS, json, putRepoFile, requireAuth, requireSameOrigin } from '../../lib/server.mjs';

function serialize(section, works) {
  const cleaned = works.map(work => {
    const copy = { ...work };
    delete copy._folder;
    delete copy._ui;
    if (Array.isArray(copy.images)) copy.images = copy.images.filter(Boolean);
    if (Array.isArray(copy.details)) {
      copy.details = copy.details.filter(Boolean);
      if (!copy.details.length) delete copy.details;
    } else if (copy.details && !copy.details.left && !copy.details.right) {
      delete copy.details;
    }
    return copy;
  });
  return `/* Verwaltet über Soïc Studio. Manuelle Änderungen bleiben möglich. */\nwindow.${section.globalName} = ${JSON.stringify(cleaned, null, 2)};\n`;
}

export default async (req) => {
  const authError = requireAuth(req);
  if (authError) return authError;
  const originError = requireSameOrigin(req);
  if (originError) return originError;
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);

  try {
    const body = await req.json();
    const section = SECTIONS[body.section];
    if (!section || !Array.isArray(body.works)) return json({ ok: false, error: 'Ungültige Daten.' }, 400);
    const source = serialize(section, body.works);
    await putRepoFile(section.dataPath, Buffer.from(source, 'utf8'), `Studio: ${section.label} aktualisiert`);
    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, error: error.message }, 500);
  }
};
