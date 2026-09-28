import { clearSessionCookie, json, requireSameOrigin } from '../../lib/server.mjs';
export default async (req) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, 405);
  const originError = requireSameOrigin(req);
  if (originError) return originError;
  return json({ ok: true }, 200, { 'set-cookie': clearSessionCookie() });
};
