/* Always load current project data from GitHub Pages without stale browser cache. */
(() => {
  'use strict';
  const own = document.currentScript;
  const base = own?.dataset?.base || '';
  const files = ['painting', 'graphic', 'exhibitions', 'architecture', 'xxx'];
  const stamp = Date.now();
  const load = src => new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `${base}data/${src}.js?v=${stamp}`;
    script.async = false;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Could not load ${src}.js`));
    document.head.appendChild(script);
  });
  window.SoicProjectDataReady = (async () => {
    for (const file of files) await load(file);
  })().catch(error => { console.error(error); });
})();
