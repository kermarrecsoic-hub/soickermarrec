import crypto from 'node:crypto';

export const REPO = {
  owner: process.env.GITHUB_OWNER || 'kermarrecsoic-hub',
  repo: process.env.GITHUB_REPO || 'soickermarrec',
  branch: process.env.GITHUB_BRANCH || 'main',
};

export const SECTIONS = {
  painting: {
    label: 'Painting',
    dataPath: 'data/painting.js',
    globalName: 'PAINTING_WORKS',
    imageRoot: 'images/painting',
    kind: 'art',
  },
  graphic: {
    label: 'Grafik',
    dataPath: 'data/graphic.js',
    globalName: 'GRAPHIC_WORKS',
    imageRoot: 'images/ink',
    kind: 'art',
  },
  exhibitions: {
    label: 'Exhibitions',
    dataPath: 'data/exhibitions.js',
    globalName: 'EXHIBITIONS_WORKS',
    imageRoot: 'images/exhibitions',
    kind: 'series',
  },
  architecture: {
    label: 'Architecture',
    dataPath: 'data/architecture.js',
    globalName: 'ARCHITECTURE_WORKS',
    imageRoot: 'images/architecture',
    kind: 'series',
  },
  xxx: {
    label: 'XXX',
    dataPath: 'data/xxx.js',
    globalName: 'XXX_WORKS',
    imageRoot: 'images/foto1/fotogalerie_sortiert',
    kind: 'series',
  },
};

const API = 'https://api.github.com';
const API_VERSION = '2026-03-10';

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...headers,
    },
  });
}

export function timingSafeTextEqual(a = '', b = '') {
  const aa = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

function unb64url(input) {
  return Buffer.from(input, 'base64url').toString('utf8');
}

function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 24) {
    throw new Error('SESSION_SECRET fehlt oder ist zu kurz.');
  }
  return secret;
}

function sign(value) {
  return crypto.createHmac('sha256', sessionSecret()).update(value).digest('base64url');
}

export function createSessionCookie() {
  const payload = JSON.stringify({ exp: Date.now() + 12 * 60 * 60 * 1000 });
  const encoded = b64url(payload);
  const token = `${encoded}.${sign(encoded)}`;
  return `studio_session=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200`;
}

export function clearSessionCookie() {
  return 'studio_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0';
}

function parseCookies(req) {
  const raw = req.headers.get('cookie') || '';
  const out = {};
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    if (idx < 0) continue;
    out[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  }
  return out;
}

export function isAuthenticated(req) {
  try {
    const token = parseCookies(req).studio_session;
    if (!token) return false;
    const [encoded, signature] = token.split('.');
    if (!encoded || !signature) return false;
    const expected = sign(encoded);
    if (!timingSafeTextEqual(signature, expected)) return false;
    const payload = JSON.parse(unb64url(encoded));
    return Number(payload.exp) > Date.now();
  } catch {
    return false;
  }
}

export function requireAuth(req) {
  if (!isAuthenticated(req)) return json({ ok: false, error: 'Nicht angemeldet.' }, 401);
  return null;
}

export function requireSameOrigin(req) {
  const origin = req.headers.get('origin');
  if (!origin) return null;
  const url = new URL(req.url);
  if (origin !== url.origin) return json({ ok: false, error: 'Ungültige Herkunft.' }, 403);
  return null;
}

function githubToken() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new Error('GITHUB_TOKEN ist nicht gesetzt.');
  return token;
}

export async function githubFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${githubToken()}`,
      'X-GitHub-Api-Version': API_VERSION,
      'User-Agent': 'soic-kermarrec-studio',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    let detail = '';
    try { detail = JSON.stringify(await res.json()); } catch { detail = await res.text(); }
    throw new Error(`GitHub API ${res.status}: ${detail}`);
  }
  return res;
}

export async function getRepoFile(path) {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  const res = await githubFetch(`/repos/${REPO.owner}/${REPO.repo}/contents/${encodedPath}?ref=${encodeURIComponent(REPO.branch)}`);
  const data = await res.json();

  if (Array.isArray(data)) throw new Error(`Pfad ist ein Ordner statt einer Datei: ${path}`);

  // GitHub liefert beim Contents-Endpunkt für Dateien > 1 MB kein Base64-Feld
  // mehr mit. In diesem Fall lesen wir den Blob über seine SHA nach.
  if (data?.content) {
    const content = Buffer.from(String(data.content).replace(/\n/g, ''), 'base64');
    return { content, sha: data.sha, path: data.path };
  }

  if (data?.sha) {
    const blobRes = await githubFetch(`/repos/${REPO.owner}/${REPO.repo}/git/blobs/${encodeURIComponent(data.sha)}`);
    const blob = await blobRes.json();
    if (!blob?.content) throw new Error(`Datei nicht lesbar: ${path}`);
    const content = Buffer.from(String(blob.content).replace(/\n/g, ''), 'base64');
    return { content, sha: data.sha, path: data.path || path };
  }

  throw new Error(`Datei nicht lesbar: ${path}`);
}

export async function getRepoFileIfExists(path) {
  try {
    return await getRepoFile(path);
  } catch (error) {
    if (String(error.message).includes('GitHub API 404')) return null;
    throw error;
  }
}

export async function putRepoFile(path, contentBuffer, message) {
  const existing = await getRepoFileIfExists(path);
  const body = {
    message: message || `Studio: update ${path}`,
    content: Buffer.from(contentBuffer).toString('base64'),
    branch: REPO.branch,
  };
  if (existing?.sha) body.sha = existing.sha;
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  const res = await githubFetch(`/repos/${REPO.owner}/${REPO.repo}/contents/${encodedPath}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function deleteRepoFile(path, message) {
  const existing = await getRepoFileIfExists(path);
  if (!existing?.sha) return { deleted: false };
  const body = {
    message: message || `Studio: delete ${path}`,
    sha: existing.sha,
    branch: REPO.branch,
  };
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  const res = await githubFetch(`/repos/${REPO.owner}/${REPO.repo}/contents/${encodedPath}`, {
    method: 'DELETE',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

export function safePageSlug(value) {
  const slug = String(value || '').trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Ungültiger Seiten-Slug.');
  const reserved = new Set(['about','architecture','contact','datenschutz','ex26','graphic','impressum','painting','xxx','404']);
  if (reserved.has(slug)) throw new Error('Dieser Seitenname ist reserviert.');
  return slug;
}

export function safeImagePath(value) {
  const path = String(value || '').replace(/^\/+/, '');
  if (!path.startsWith('images/')) throw new Error('Bilder dürfen nur unter images/ gespeichert werden.');
  if (path.includes('..') || path.includes('\\')) throw new Error('Ungültiger Bildpfad.');
  if (!/\.(jpe?g|png|webp)$/i.test(path)) throw new Error('Nur JPG, PNG oder WebP sind erlaubt.');
  return path;
}

export function relativeForPage(repoPath) {
  return `../${repoPath.replace(/^\/+/, '')}`;
}

export function repoPathFromRelative(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return raw.replace(/^\.\.\//, '').replace(/^\/+/, '');
}
