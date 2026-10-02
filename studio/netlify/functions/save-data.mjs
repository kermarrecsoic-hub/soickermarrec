import { SECTIONS, deleteRepoFile, json, putRepoFile, requireAuth, requireSameOrigin } from '../../lib/server.mjs';
import { renderSharePage, shareIdForWork, sharePagePath } from '../../lib/share-pages.mjs';

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

    // Nur Malerei/Grafik brauchen werkbezogene Social-Preview-Seiten.
    // Beim normalen Sortieren wird nichts neu erzeugt; beim Bearbeiten/Anlegen
    // aktualisieren wir nur die betroffene Seite, damit ein Studio-Speichern schnell bleibt.
    if (section.kind === 'art' && body.shareWorkId) {
      const wanted = String(body.shareWorkId);
      const index = body.works.findIndex((work, i) => shareIdForWork(body.section, work, i) === wanted);
      if (index >= 0) {
        const work = body.works[index];
        const pagePath = sharePagePath(body.section, work, index);
        const html = renderSharePage(body.section, work, index);
        await putRepoFile(pagePath, Buffer.from(html, 'utf8'), `Studio: Share-Seite ${wanted} aktualisiert`);
      }
    }

    if (section.kind === 'art' && body.deleteShareId) {
      const id = String(body.deleteShareId).replace(/[^a-z0-9-]/g, '');
      if (id) await deleteRepoFile(`share/${body.section}/${id}.html`, `Studio: Share-Seite ${id} entfernt`);
    }

    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, error: error.message }, 500);
  }
};
