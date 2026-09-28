import { isAuthenticated, json } from '../../lib/server.mjs';
export default async (req) => json({ ok: isAuthenticated(req) }, isAuthenticated(req) ? 200 : 401);
