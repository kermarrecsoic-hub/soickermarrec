import vm from 'node:vm';
import { SECTIONS, getRepoFile, json, requireAuth } from '../../lib/server.mjs';

export default async (req) => {
  const authError = requireAuth(req);
  if (authError) return authError;
  if (req.method !== 'GET') return json({ ok: false, error: 'Method not allowed' }, 405);

  const sectionKey = new URL(req.url).searchParams.get('section');
  const section = SECTIONS[sectionKey];
  if (!section) return json({ ok: false, error: 'Unbekannte Sektion.' }, 400);

  try {
    const file = await getRepoFile(section.dataPath);
    const source = file.content.toString('utf8');
    const sandbox = { window: {} };
    vm.runInNewContext(source, sandbox, { timeout: 500 });
    const works = sandbox.window[section.globalName];
    if (!Array.isArray(works)) throw new Error(`${section.globalName} wurde nicht gefunden.`);
    return json({ ok: true, section: sectionKey, config: section, works: JSON.parse(JSON.stringify(works)) });
  } catch (error) {
    return json({ ok: false, error: error.message }, 500);
  }
};
