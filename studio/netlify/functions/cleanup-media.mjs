import { createHash } from 'node:crypto';
import {
  REPO,
  SECTIONS,
  getRepoFile,
  githubFetch,
  json,
  requireAuth,
  requireSameOrigin,
} from '../../lib/server.mjs';

const PROJECT_DATA_PATHS = new Set(Object.values(SECTIONS).map(section => section.dataPath));
const DIMENSIONS_PATH = 'data/image-dimensions.js';
const IMAGE_EXT = /\.(?:jpe?g|png|webp|gif|avif)$/i;
const SOURCE_EXT = /\.(?:html?|css|js|json|xml)$/i;

function normalizeRepoPath(value = '') {
  let raw = String(value || '').trim().replace(/\\/g, '/');
  const marker = raw.indexOf('images/');
  if (marker >= 0) raw = raw.slice(marker);
  raw = raw.replace(/^(?:\.\.\/)+/, '').replace(/^\/+/, '');
  return raw.split(/[?#]/)[0];
}

function workImagePaths(work = {}) {
  const out = [];
  if (work.image) out.push(work.image);
  if (Array.isArray(work.images)) out.push(...work.images);
  if (Array.isArray(work.details)) out.push(...work.details);
  else if (work.details && typeof work.details === 'object') out.push(work.details.left, work.details.right);
  return [...new Set(out.filter(Boolean).map(normalizeRepoPath).filter(path => path.startsWith('images/')))]
}

function parseWorks(source = '') {
  const match = String(source).match(/=\s*(\[[\s\S]*\])\s*;?\s*$/);
  if (!match) throw new Error('Projektdatei konnte nicht gelesen werden.');
  return JSON.parse(match[1]);
}

function serializeWorks(section, works) {
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

function previewStem(path = '') {
  let clean = normalizeRepoPath(path);
  if (clean.startsWith('images/')) clean = clean.slice(7);
  clean = clean.replace(/\.[^.\/]+$/, '');
  return clean
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/ß/g, 'ss')
    .split('/')
    .map(part => part.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'item')
    .join('--');
}

function imageRefsFromText(text = '') {
  const refs = new Set();
  const re = /images\/[A-Za-z0-9%._~!$&'()*+,;=:@\/\-]+\.(?:jpe?g|png|webp|gif|avif)/gi;
  for (const match of String(text).matchAll(re)) refs.add(normalizeRepoPath(match[0]));
  return refs;
}

async function getTree() {
  const res = await githubFetch(`/repos/${REPO.owner}/${REPO.repo}/git/trees/${encodeURIComponent(REPO.branch)}?recursive=1`);
  const data = await res.json();
  if (data.truncated) throw new Error('Repository-Baum ist zu groß für eine sichere automatische Bereinigung.');
  return { sha: data.sha, items: data.tree || [] };
}

async function buildPlan() {
  const snapshot = await getTree();
  const blobs = snapshot.items.filter(item => item.type === 'blob');
  const existing = new Set(blobs.map(item => item.path));
  const usedImages = new Set();
  const protectedHiddenFolders = new Set();
  const dataUpdates = [];

  for (const [sectionKey, section] of Object.entries(SECTIONS)) {
    const file = await getRepoFile(section.dataPath);
    const works = parseWorks(file.content.toString('utf8'));
    // Auch unsichtbare Projekte sind gespeicherte Entwürfe und bleiben komplett
    // erhalten, unabhängig von availableWorks. Ihre Bilder sind immer benutzt.
    works.forEach(work => {
      const paths = workImagePaths(work);
      paths.forEach(path => usedImages.add(path));
      // Versteckte Projekte sind Arbeitsstände: auch ältere Versionen innerhalb
      // ihrer Projektordner bleiben erhalten, solange das Projekt existiert.
      if (work.visible === false) {
        paths.forEach(path => {
          const lastSlash = path.lastIndexOf('/');
          if (lastSlash > 'images/'.length) protectedHiddenFolders.add(path.slice(0, lastSlash + 1));
        });
      }
    });
  }

  /* Öffentliche Quellen schützen zusätzliche Site-Bilder (Landing, About,
     Contact, Social Preview, Custom Pages usw.). Projekt-Datendateien und
     generierte Share-Seiten werden ebenfalls geschützt, solange sie Bilder referenzieren. */
  const sourcePaths = blobs
    .map(item => item.path)
    .filter(path => SOURCE_EXT.test(path))
    .filter(path => !PROJECT_DATA_PATHS.has(path))
    .filter(path => path !== DIMENSIONS_PATH)
    .filter(path => !path.startsWith('studio/'));

  // Bounded parallelism: many old category/share pages otherwise cause
  // dozens of sequential GitHub requests and can time out in Netlify.
  // An error in any read stops cleanup entirely (fail closed).
  for (let i = 0; i < sourcePaths.length; i += 8) {
    const batch = await Promise.all(sourcePaths.slice(i, i + 8).map(path => getRepoFile(path)));
    batch.forEach(file => imageRefsFromText(file.content.toString('utf8')).forEach(ref => usedImages.add(ref)));
  }

  /* Studio-eigene Hauptbilder sind bewusst geschützt, auch falls eine
     bestimmte Seite sie gerade nicht direkt im Markup referenziert. */
  ['images/about.webp', 'images/contact.webp', 'images/social-preview.jpg']
    .forEach(path => usedImages.add(path));

  const imageFiles = blobs
    .map(item => item.path)
    .filter(path => path.startsWith('images/') && IMAGE_EXT.test(path));

  // Alle historischen Vorschauordner sollen ausdrücklich entfernt werden.
  const previewFiles = blobs.map(item => item.path)
    .filter(path => /^(?:Vorschaubild|images\/vorschaubild)\/.*\.(?:jpe?g|png|webp|gif|avif)$/i.test(path));
  const deletePreviews = [...new Set(previewFiles)].sort();
  const previewSet = new Set(deletePreviews);
  // Keine aktiven oder versteckten Projektdateien löschen.
  // Unbenutzte Originalbilder nur dann löschen, wenn nirgends referenziert.
  const deleteImages = imageFiles.filter(path =>
    !previewSet.has(path) &&
    !usedImages.has(path) &&
    ![...protectedHiddenFolders].some(folder => path.startsWith(folder))
  ).sort();
  const deletePaths = [...new Set([...deleteImages, ...deletePreviews])].sort();
  const planId = createHash('sha256')
    .update(`${snapshot.sha}\n${deletePaths.join('\n')}`)
    .digest('hex');

  // Keep the intrinsic-size map in sync with cleanup. Crucially, the map is
  // not treated as an image-reference source above, otherwise every stale
  // image would protect itself from deletion.
  const dimFile = await getRepoFile(DIMENSIONS_PATH).catch(() => null);
  if (dimFile) {
    const text = dimFile.content.toString('utf8');
    const match = text.match(/window\.SOIC_IMAGE_DIMENSIONS\s*=\s*(\{[\s\S]*\})\s*;?\s*$/);
    if (match) {
      try {
        const dims = JSON.parse(match[1]);
        const removed = new Set(deletePaths);
        let changed = false;
        for (const path of Object.keys(dims)) {
          if (removed.has(path)) { delete dims[path]; changed = true; }
        }
        if (changed) {
          const ordered = Object.fromEntries(Object.entries(dims).sort(([a], [b]) => a.localeCompare(b)));
          const source = `/* Managed by Soïc Studio. Reserves intrinsic image geometry before lazy loading. */\nwindow.SOIC_IMAGE_DIMENSIONS = ${JSON.stringify(ordered)};\n`;
          dataUpdates.push({ path: DIMENSIONS_PATH, content: source });
        }
      } catch {}
    }
  }

  if (dataUpdates.length) {
    const token = Date.now().toString(36);
    for (const path of ['index.html', 'pages/available.html']) {
      const file = await getRepoFile(path).catch(() => null);
      if (!file) continue;
      const html = file.content.toString('utf8');
      const next = html.replace(/(data\/(?:painting|graphic|xxx|architecture|exhibitions|image-dimensions)\.js)(?:\?v=[^"']*)?/g, `$1?v=${token}`);
      if (next !== html) dataUpdates.push({ path, content: next });
    }
  }

  return {
    baseTreeSha: snapshot.sha,
    planId,
    dataUpdates,
    deleteImages,
    deletePreviews,
    deletePaths,
  };
}

async function createBlob(content) {
  const res = await githubFetch(`/repos/${REPO.owner}/${REPO.repo}/git/blobs`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ content: Buffer.from(content).toString('base64'), encoding: 'base64' }),
  });
  return res.json();
}

async function applyPlan(plan) {
  const refRes = await githubFetch(`/repos/${REPO.owner}/${REPO.repo}/git/ref/heads/${encodeURIComponent(REPO.branch)}`);
  const ref = await refRes.json();
  const parentSha = ref?.object?.sha;
  if (!parentSha) throw new Error('Aktueller GitHub-Stand konnte nicht bestimmt werden.');

  const commitRes = await githubFetch(`/repos/${REPO.owner}/${REPO.repo}/git/commits/${encodeURIComponent(parentSha)}`);
  const parentCommit = await commitRes.json();
  const baseTree = parentCommit?.tree?.sha;
  if (!baseTree) throw new Error('Aktueller GitHub-Tree konnte nicht bestimmt werden.');
  if (baseTree !== plan.baseTreeSha) throw new Error('Repository hat sich seit der Vorschau geändert. Bitte die Löschvorschau aktualisieren.');

  const treeEntries = plan.deletePaths.map(path => ({ path, mode: '100644', type: 'blob', sha: null }));

  for (const update of plan.dataUpdates) {
    const blob = await createBlob(update.content);
    treeEntries.push({ path: update.path, mode: '100644', type: 'blob', sha: blob.sha });
  }

  if (!treeEntries.length) return { changed: false, commitSha: parentSha };

  const newTreeRes = await githubFetch(`/repos/${REPO.owner}/${REPO.repo}/git/trees`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ base_tree: baseTree, tree: treeEntries }),
  });
  const newTree = await newTreeRes.json();

  const newCommitRes = await githubFetch(`/repos/${REPO.owner}/${REPO.repo}/git/commits`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      message: `Studio: unbenutzte Bilder bereinigen (${plan.deleteImages.length} Bilder, ${plan.deletePreviews.length} Vorschaubilder)`,
      tree: newTree.sha,
      parents: [parentSha],
    }),
  });
  const newCommit = await newCommitRes.json();

  await githubFetch(`/repos/${REPO.owner}/${REPO.repo}/git/refs/heads/${encodeURIComponent(REPO.branch)}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sha: newCommit.sha, force: false }),
  });

  return { changed: true, commitSha: newCommit.sha };
}

function planResponse(plan) {
  return {
    ok: true,
    deleteImageCount: plan.deleteImages.length,
    deletePreviewCount: plan.deletePreviews.length,
    deleteImages: plan.deleteImages,
    deletePreviews: plan.deletePreviews,
    planId: plan.planId,
    totalDeleteCount: plan.deletePaths.length,
  };
}

export default async (req) => {
  const authError = requireAuth(req);
  if (authError) return authError;
  const originError = requireSameOrigin(req);
  if (originError) return originError;

  try {
    if (req.method === 'GET') {
      const plan = await buildPlan();
      return json(planResponse(plan));
    }

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      if (body?.execute !== true || typeof body?.planId !== 'string') return json({ ok: false, error: 'Bestätigung der Löschvorschau fehlt.' }, 400);
      const plan = await buildPlan();
      if (plan.planId !== body.planId) return json({ ok: false, error: 'Die Dateien haben sich seit der Vorschau geändert. Bitte erneut prüfen.', changedSincePreview: true }, 409);
      const result = await applyPlan(plan);
      return json({ ...planResponse(plan), ...result });
    }

    return json({ ok: false, error: 'Method not allowed' }, 405);
  } catch (error) {
    return json({ ok: false, error: error.message }, 500);
  }
};
