import { json, putRepoFile, requireAuth, requireSameOrigin } from '../../lib/server.mjs';

function validateDevice(device) {
  if (!device || !Array.isArray(device.slots) || device.slots.length !== 3) throw new Error('Es werden genau drei Slots erwartet.');
  const active = Number(device.active);
  if (![1,2,3].includes(active)) throw new Error('Ungültiger aktiver Slot.');
  for (const path of device.slots) {
    if (!/^images\/landing\/(mobile|desktop)-[123]\.jpg$/.test(String(path))) throw new Error('Ungültiger Slot-Pfad.');
  }
}

export default async (req) => {
  const authError = requireAuth(req);
  if (authError) return authError;
  const originError = requireSameOrigin(req);
  if (originError) return originError;
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);
  try {
    const body = await req.json();
    const config = body.config;
    validateDevice(config?.mobile);
    validateDevice(config?.desktop);
    await putRepoFile('data/landing-backgrounds.json', Buffer.from(`${JSON.stringify(config, null, 2)}\n`, 'utf8'), 'Studio: Landing-Hintergrund aktualisiert');
    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, error: error.message }, 400);
  }
};
