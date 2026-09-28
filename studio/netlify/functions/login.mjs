import { createSessionCookie, json, requireSameOrigin, timingSafeTextEqual } from '../../lib/server.mjs';

export default async (req) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);
  const originError = requireSameOrigin(req);
  if (originError) return originError;

  const expected = process.env.ADMIN_PASSWORD || '';
  if (!expected) return json({ ok: false, error: 'ADMIN_PASSWORD ist auf Netlify noch nicht gesetzt.' }, 500);

  let body;
  try { body = await req.json(); } catch { return json({ ok: false, error: 'Ungültige Anfrage.' }, 400); }
  if (!timingSafeTextEqual(body?.password || '', expected)) {
    return json({ ok: false, error: 'Falsches Passwort.' }, 401);
  }

  return json({ ok: true }, 200, { 'set-cookie': createSessionCookie() });
};
