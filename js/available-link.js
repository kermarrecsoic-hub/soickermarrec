(() => {
  'use strict';
  const link = document.querySelector('[data-available-works-link]');
  if (!link) return;
  fetch('data/available-config.json', { cache: 'no-store' })
    .then(r => r.ok ? r.json() : { enabled: false })
    .then(cfg => { if (cfg?.enabled === true) link.classList.add('is-enabled'); })
    .catch(() => {});
})();
