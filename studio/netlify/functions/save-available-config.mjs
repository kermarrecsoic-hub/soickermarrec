import { json, putRepoFile, requireAuth, requireSameOrigin } from '../../lib/server.mjs';

export default async (req) => {
  const authError = requireAuth(req); if (authError) return authError;
  const originError = requireSameOrigin(req); if (originError) return originError;
  if (req.method !== 'POST') return json({ok:false,error:'Method not allowed'},405);
  try {
    const body = await req.json();
    const config = { enabled: body?.config?.enabled === true };
    await putRepoFile('data/available-config.json', Buffer.from(`${JSON.stringify(config, null, 2)}\n`, 'utf8'), 'Studio: Available Works Sichtbarkeit aktualisiert');
    return json({ok:true, config});
  } catch (error) { return json({ok:false,error:error.message},400); }
};
