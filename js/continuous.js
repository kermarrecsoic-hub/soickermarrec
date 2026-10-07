/* Soïc Kermarrec — continuous one-page portfolio */
(() => {
  'use strict';

  if (!document.body.classList.contains('continuous-home')) return;

  const mobile = matchMedia('(max-width: 700px), (hover: none) and (pointer: coarse)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const i18n = window.SoicI18n || null;
  const tr = (key, fallback) => {
    const value = i18n?.t?.(key);
    return value && value !== key ? value : fallback;
  };

  const sourceMap = {
    painting: { works: window.PAINTING_WORKS || [], mode: 'projects' },
    graphic: { works: window.GRAPHIC_WORKS || [], mode: 'projects' },
    exhibitions: { works: window.EXHIBITIONS_WORKS || [], mode: 'series' },
    architecture: { works: window.ARCHITECTURE_WORKS || [], mode: 'series' },
    photography: { works: window.XXX_WORKS || [], mode: 'series' }
  };

  const sectionIds = ['painting', 'graphic', 'exhibitions', 'architecture', 'photography', 'about', 'contact'];
  const visibleWorks = works => (works || [])
    .filter(work => work && work.visible !== false)
    .map(work => i18n?.localizeWork ? i18n.localizeWork(work) : work);

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function imagePaths(work) {
    const mains = Array.isArray(work.images) ? [...work.images.filter(Boolean)] : [work.image].filter(Boolean);
    const details = [];
    if (Array.isArray(work.details)) details.push(...work.details.filter(Boolean));
    else if (work.details && typeof work.details === 'object') {
      if (work.details.left) details.push(work.details.left);
      if (work.details.right) details.push(work.details.right);
    }

    const legacyMultiple = work.layout === 'multiple' || work.layout === 'six-grid' || work.layout === 'portrait-eight-grid' || /holz/i.test(work.title || '');
    if (legacyMultiple && mains.length > 1) details.unshift(...mains.splice(1));

    return {
      main: mains[0] || '',
      mains,
      details: [...new Set(details)],
      all: [...new Set([...mains, ...details])]
    };
  }

  const deferredImages = new Set();
  const deferredImageObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const img = entry.target;
          const src = img.dataset.src;
          if (src && !img.src) img.src = src;
          delete img.dataset.src;
          deferredImages.delete(img);
          deferredImageObserver.unobserve(img);
        });
      }, { rootMargin: '1000px 0px' })
    : null;

  function makeImage(src, alt, eager = false) {
    const img = el('img');
    img.alt = alt || '';
    img.loading = eager ? 'eager' : 'lazy';
    img.decoding = 'async';
    img.draggable = false;
    try { img.fetchPriority = eager ? 'high' : 'low'; } catch (_) {}

    if (eager || !deferredImageObserver) {
      img.src = src;
    } else {
      img.dataset.src = src;
      deferredImages.add(img);
      deferredImageObserver.observe(img);
    }
    return img;
  }

  function slugifyShare(value = '') {
    return String(value)
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/ß/g, 'ss')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60);
  }

  function projectShareId(work, index, mainPath, sectionId) {
    const explicit = slugifyShare(work.shareId || '');
    if (explicit) return explicit;

    const first = String(mainPath || work.image || '').replace(/^\.\.\//, '').replace(/^\/+/, '');
    const root = sectionId === 'painting' ? 'images/painting/' : 'images/ink/';
    if (first.startsWith(root)) {
      const rest = first.slice(root.length);
      const folder = rest.includes('/') ? rest.split('/')[0] : rest.replace(/\.[^.]+$/, '');
      const fromFolder = slugifyShare(folder);
      if (fromFolder) return fromFolder;
    }
    return slugifyShare(work.title || '') || `werk-${index + 1}`;
  }

  function projectShareUrl(work, index, mainPath, sectionId) {
    const id = projectShareId(work, index, mainPath, sectionId);
    return new URL(`/share/${sectionId}/${encodeURIComponent(id)}.html`, window.location.origin).href;
  }

  function shareFileName(title, mime = 'image/jpeg') {
    const ext = mime.includes('png') ? 'png' : (mime.includes('webp') ? 'webp' : 'jpg');
    return `${slugifyShare(title || 'soic-kermarrec') || 'soic-kermarrec'}.${ext}`;
  }

  async function shareProject(work, index, mainPath, sectionId) {
    const title = work.title || tr('gallery.work', 'Werk');
    const url = projectShareUrl(work, index, mainPath, sectionId);
    const text = `${title} — Soïc Kermarrec`;

    if (navigator.share) {
      try {
        let file = null;
        if (mainPath && navigator.canShare) {
          try {
            const response = await fetch(mainPath, { cache: 'force-cache' });
            if (response.ok) {
              const blob = await response.blob();
              const candidate = new File([blob], shareFileName(title, blob.type), { type: blob.type || 'image/jpeg' });
              if (navigator.canShare({ files: [candidate] })) file = candidate;
            }
          } catch {}
        }
        const data = { title: text, text, url };
        if (file) data.files = [file];
        await navigator.share(data);
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }

    const message = `${text}\n${url}`;
    window.location.href = `https://wa.me/?text=${encodeURIComponent(message)}`;
  }

  function setProjectToggleState(card, open) {
    card.querySelector('.project-main-button')?.setAttribute('aria-expanded', String(open));
    const expand = card.querySelector('.project-expand-control');
    if (expand) {
      expand.textContent = open ? '−' : '+';
      expand.setAttribute('aria-expanded', String(open));
      expand.setAttribute('aria-label', open ? tr('gallery.hideDetails', 'Details ausblenden') : tr('gallery.showDetails', 'Details zeigen'));
    }
  }

  function addDescription(panel, work) {
    const box = el('div', 'project-description');
    if (work.title) box.appendChild(el('h3', '', work.title));
    if (work.medium) box.appendChild(el('p', 'medium', work.medium));
    if (work.dimensions) box.appendChild(el('p', 'dimensions', work.dimensions));
    if (work.availability) box.appendChild(el('p', 'availability', work.availability));
    if (work.text) box.appendChild(el('p', 'free-text', work.text));
    panel.appendChild(box);
  }

  let globalColumns = 1;
  const allArtworkContainers = () => [...document.querySelectorAll('.continuous-artworks')];

  function setGlobalColumns(columns) {
    if (![1, 2].includes(columns)) return;
    globalColumns = columns;
    document.documentElement.style.setProperty('--global-columns', String(columns));
    allArtworkContainers().forEach(container => {
      container.dataset.columns = String(columns);
    });
    document.querySelectorAll('.global-columns button').forEach(button => {
      const active = Number(button.dataset.columns) === columns;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });

    if (columns === 2) {
      document.querySelectorAll('.continuous-project.is-open').forEach(card => closeProject(card, true));
    }
  }

  function makeGlobalColumns() {
    const wrap = document.querySelector('.global-columns');
    if (!wrap) return;
    wrap.innerHTML = '';
    [1, 2].forEach(columns => {
      const button = el('button', 'column-dot-button');
      button.type = 'button';
      button.dataset.columns = String(columns);
      button.setAttribute('aria-label', columns === 1 ? tr('gallery.oneColumn', '1 Spalte') : `2 ${tr('gallery.columns', 'Spalten')}`);

      const dots = el('span', 'column-dots');
      dots.setAttribute('aria-hidden', 'true');
      for (let i = 0; i < columns; i += 1) dots.appendChild(el('span', 'column-dot'));
      button.appendChild(dots);

      button.addEventListener('click', () => setGlobalColumns(columns));
      wrap.appendChild(button);
    });
    setGlobalColumns(1);
  }


  function touchDistance(touches) {
    if (!touches || touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  }

  // Vor dem Continuous-Scroll-Umbau konnte man mobil mit zwei Fingern
  // zwischen 1 und 2 Spalten wechseln. Diese Funktion gilt jetzt global
  // für den gesamten Portfolio-Inhalt.
  function setupMobilePinchColumns() {
    const target = document.querySelector('.continuous-content');
    if (!target) return;

    let startDistance = 0;
    let handled = false;
    const threshold = 46;

    const reset = () => {
      startDistance = 0;
      handled = false;
    };

    target.addEventListener('touchstart', event => {
      if (!mobile.matches || event.touches.length !== 2) return;
      startDistance = touchDistance(event.touches);
      handled = false;
    }, { passive: true });

    target.addEventListener('touchmove', event => {
      if (!mobile.matches || event.touches.length !== 2 || !startDistance) return;
      event.preventDefault();
      if (handled) return;

      const delta = touchDistance(event.touches) - startDistance;
      if (Math.abs(delta) < threshold) return;

      const next = delta < 0 ? 2 : 1;
      if (next !== globalColumns) setGlobalColumns(next);
      handled = true;
    }, { passive: false });

    target.addEventListener('touchend', event => {
      if (event.touches.length < 2) reset();
    }, { passive: true });
    target.addEventListener('touchcancel', reset, { passive: true });

    target.addEventListener('gesturestart', event => {
      if (mobile.matches) event.preventDefault();
    }, { passive: false });
    target.addEventListener('gesturechange', event => {
      if (mobile.matches) event.preventDefault();
    }, { passive: false });
  }

  function openProject(card, pinned = false) {
    if (!card) return;
    if (globalColumns === 2) setGlobalColumns(1);
    document.querySelectorAll('.continuous-project.is-open').forEach(other => {
      if (other !== card && other.dataset.pinned !== 'true') closeProject(other, true);
    });
    card.classList.add('is-open');
    if (pinned) card.dataset.pinned = 'true';
    setProjectToggleState(card, true);
  }

  function closeProject(card, force = false) {
    if (!card) return;
    if (!force && card.dataset.pinned === 'true') return;
    card.classList.remove('is-open');
    card.dataset.pinned = 'false';
    setProjectToggleState(card, false);
  }

  function wireProjectInteraction(card, button) {
    button.addEventListener('click', event => {
      event.preventDefault();

      // Zwei Spalten sind reine Vorschau: Klick wechselt auf eine Spalte
      // und öffnet genau dieses Werk. Das Plus ist dort bewusst ausgeblendet.
      if (globalColumns === 2) {
        setGlobalColumns(1);
        openProject(card, true);
        requestAnimationFrame(() => card.scrollIntoView({ behavior: 'smooth', block: 'start' }));
        return;
      }

      // In einer Spalte wird ausschließlich per Klick geöffnet/geschlossen.
      // Hover bleibt nur der leichte Bild-Zoom aus dem CSS.
      if (card.classList.contains('is-open') && card.dataset.pinned === 'true') closeProject(card, true);
      else openProject(card, true);
    });
  }

  function renderProject(work, index, sectionId) {
    const paths = imagePaths(work);
    if (!paths.main) return null;

    const card = el('article', `continuous-project layout-${work.layout || 'auto'}`);
    card.dataset.pinned = 'false';
    card.dataset.navColor = work.navColor || '';
    card.dataset.section = sectionId;
    card.id = `${sectionId}-work-${index + 1}`;

    const shell = el('div', 'project-main-shell');
    const button = el('button', 'project-main-button');
    button.type = 'button';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', `${work.title || tr('gallery.work', 'Werk')} – öffnen`);
    const img = makeImage(paths.main, work.title || tr('gallery.work', 'Werk'), index === 0 && sectionId === 'painting');
    img.className = 'project-main-image';
    button.appendChild(img);
    shell.appendChild(button);

    const controls = el('div', 'project-under-controls');
    const expandButton = el('button', 'project-expand-control', '+');
    expandButton.type = 'button';
    expandButton.setAttribute('aria-expanded', 'false');
    expandButton.setAttribute('aria-label', tr('gallery.showDetails', 'Details zeigen'));
    expandButton.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      if (globalColumns === 2) {
        setGlobalColumns(1);
        openProject(card, true);
        requestAnimationFrame(() => card.scrollIntoView({ behavior: 'smooth', block: 'start' }));
        return;
      }
      if (card.classList.contains('is-open') && card.dataset.pinned === 'true') closeProject(card, true);
      else openProject(card, true);
    });
    controls.appendChild(expandButton);

    const syncControlsToMainImage = () => {
      const width = Math.round(img.getBoundingClientRect().width);
      if (width > 0) controls.style.width = `${width}px`;
    };
    if (img.complete && img.naturalWidth) requestAnimationFrame(syncControlsToMainImage);
    else img.addEventListener('load', syncControlsToMainImage, { once: true });
    if ('ResizeObserver' in window) {
      const controlResizeObserver = new ResizeObserver(syncControlsToMainImage);
      controlResizeObserver.observe(img);
    }

    if (sectionId === 'painting' || sectionId === 'graphic') {
      const shareButton = el('button', 'project-share-control', '•');
      shareButton.type = 'button';
      shareButton.setAttribute('aria-label', `${tr('gallery.shareViaWhatsApp', 'Werk teilen')}: ${work.title || tr('gallery.work', 'Werk')}`);
      shareButton.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        shareProject(work, index, paths.main, sectionId);
      });
      controls.appendChild(shareButton);
    }

    shell.appendChild(controls);
    card.appendChild(shell);

    const expanded = el('div', 'project-expanded');
    addDescription(expanded, work);

    if (paths.details.length) {
      const details = el('div', 'project-details-grid');
      paths.details.forEach((src, detailIndex) => {
        const detailButton = el('button', 'project-detail-button');
        detailButton.type = 'button';
        const detailImage = makeImage(src, `${work.title || tr('gallery.work', 'Werk')} – ${tr('gallery.detail', 'Detail')} ${detailIndex + 1}`);
        detailButton.appendChild(detailImage);
        detailButton.addEventListener('click', event => {
          event.preventDefault();
          event.stopPropagation();
          const all = [paths.main, ...paths.details];
          openViewer(all, detailIndex + 1, work.title || tr('gallery.work', 'Werk'));
        });
        details.appendChild(detailButton);
      });
      expanded.appendChild(details);
    }

    card.appendChild(expanded);
    wireProjectInteraction(card, button);
    return card;
  }

  function renderSeriesProject(work, workIndex, sectionId) {
    const paths = imagePaths(work);
    if (!paths.mains.length) return null;

    const article = el('article', 'series-project');
    article.dataset.navColor = work.navColor || '';
    article.dataset.section = sectionId;
    article.id = `${sectionId}-project-${workIndex + 1}`;

    const grid = el('div', 'series-grid');
    paths.mains.forEach((src, imageIndex) => {
      const button = el('button', 'series-image-button');
      button.type = 'button';
      button.dataset.galleryIndex = String(imageIndex);
      if (sectionId === 'architecture' && workIndex === 0 && imageIndex === 0) button.classList.add('architecture-feature');

      const img = makeImage(src, work.title || `${tr('gallery.image', 'Bild')} ${imageIndex + 1}`, false);
      button.appendChild(img);
      button.addEventListener('click', () => openViewer(paths.all, imageIndex, work.title || sectionId));
      grid.appendChild(button);
    });
    article.appendChild(grid);
    if (work.title) article.appendChild(el('h3', 'series-project-title', work.title));
    return article;
  }

  function renderSections() {
    Object.entries(sourceMap).forEach(([sectionId, source]) => {
      const target = document.querySelector(`#${sectionId} .continuous-artworks`);
      if (!target) return;
      target.innerHTML = '';
      const works = visibleWorks(source.works);
      works.forEach((work, index) => {
        const node = source.mode === 'projects'
          ? renderProject(work, index, sectionId)
          : renderSeriesProject(work, index, sectionId);
        if (node) target.appendChild(node);
      });
    });
  }

  /* ---------- Multi-image viewer ---------- */
  let viewer = null;
  let viewerImage = null;
  let viewerCounter = null;
  let viewerPrev = null;
  let viewerNext = null;
  let viewerItems = [];
  let viewerIndex = 0;
  let scale = 1;
  let tx = 0;
  let ty = 0;
  const pointers = new Map();
  let gestureStart = null;
  let pinchStart = null;

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

  function applyViewerTransform() {
    if (!viewerImage) return;
    viewerImage.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
    viewer?.classList.toggle('is-zoomed', scale > 1.01);
  }

  function resetViewerTransform() {
    scale = 1;
    tx = 0;
    ty = 0;
    applyViewerTransform();
  }

  function setViewerScale(next, originX = 0, originY = 0) {
    const old = scale;
    scale = clamp(next, 1, 4);
    if (scale <= 1.01) {
      resetViewerTransform();
      return;
    }
    if (old > 0 && old !== scale) {
      const ratio = scale / old;
      tx = originX - (originX - tx) * ratio;
      ty = originY - (originY - ty) * ratio;
    }
    applyViewerTransform();
  }

  function showViewerIndex(index) {
    if (!viewerItems.length) return;
    viewerIndex = (index + viewerItems.length) % viewerItems.length;
    resetViewerTransform();
    viewerImage.src = viewerItems[viewerIndex];
    viewerCounter.textContent = `${viewerIndex + 1} / ${viewerItems.length}`;
    const multiple = viewerItems.length > 1;
    viewerPrev.hidden = !multiple;
    viewerNext.hidden = !multiple;
  }

  function closeViewer() {
    if (!viewer?.classList.contains('is-open')) return;
    viewer.classList.remove('is-open');
    viewer.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('media-viewer-open');
    pointers.clear();
    resetViewerTransform();
    setTimeout(() => {
      if (!viewer.classList.contains('is-open')) viewerImage.removeAttribute('src');
    }, 240);
  }

  function stepViewer(delta) {
    if (!viewerItems.length || scale > 1.01) return;
    showViewerIndex(viewerIndex + delta);
  }

  function ensureViewer() {
    if (viewer) return;
    viewer = el('div', 'media-viewer');
    viewer.setAttribute('aria-hidden', 'true');

    const stage = el('div', 'media-viewer-stage');
    stage.setAttribute('role', 'dialog');
    stage.setAttribute('aria-modal', 'true');
    stage.setAttribute('aria-label', 'Galerie');

    viewerImage = el('img', 'media-viewer-image');
    viewerImage.alt = '';
    stage.appendChild(viewerImage);

    const close = el('button', 'viewer-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Galerie schließen');
    viewerPrev = el('button', 'viewer-prev', '‹');
    viewerPrev.type = 'button';
    viewerPrev.setAttribute('aria-label', 'Vorheriges Bild');
    viewerNext = el('button', 'viewer-next', '›');
    viewerNext.type = 'button';
    viewerNext.setAttribute('aria-label', 'Nächstes Bild');
    const zoomOut = el('button', 'viewer-zoom-out', '−');
    zoomOut.type = 'button';
    zoomOut.setAttribute('aria-label', 'Verkleinern');
    const zoomIn = el('button', 'viewer-zoom-in', '+');
    zoomIn.type = 'button';
    zoomIn.setAttribute('aria-label', 'Vergrößern');
    viewerCounter = el('div', 'viewer-counter');

    viewer.append(stage, close, viewerPrev, viewerNext, zoomOut, zoomIn, viewerCounter);
    document.body.appendChild(viewer);

    close.addEventListener('click', closeViewer);
    viewerPrev.addEventListener('click', event => { event.stopPropagation(); stepViewer(-1); });
    viewerNext.addEventListener('click', event => { event.stopPropagation(); stepViewer(1); });
    zoomIn.addEventListener('click', event => { event.stopPropagation(); setViewerScale(scale + .5); });
    zoomOut.addEventListener('click', event => { event.stopPropagation(); setViewerScale(scale - .5); });

    viewer.addEventListener('click', event => {
      if (event.target === viewer) closeViewer();
    });
    viewer.addEventListener('wheel', event => {
      if (event.target === viewer) event.preventDefault();
    }, { passive: false });

    viewerImage.addEventListener('dblclick', event => {
      event.preventDefault();
      const rect = viewerImage.getBoundingClientRect();
      const ox = event.clientX - (rect.left + rect.width / 2);
      const oy = event.clientY - (rect.top + rect.height / 2);
      setViewerScale(scale > 1.1 ? 1 : 2.4, ox, oy);
    });

    stage.addEventListener('wheel', event => {
      if (!viewer.classList.contains('is-open')) return;
      event.preventDefault();
      const rect = stage.getBoundingClientRect();
      const ox = event.clientX - (rect.left + rect.width / 2);
      const oy = event.clientY - (rect.top + rect.height / 2);
      setViewerScale(scale * (event.deltaY < 0 ? 1.12 : .89), ox, oy);
    }, { passive: false });

    const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

    stage.addEventListener('pointerdown', event => {
      if (!viewer.classList.contains('is-open')) return;
      stage.setPointerCapture?.(event.pointerId);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (pointers.size === 1) {
        gestureStart = { x: event.clientX, y: event.clientY, tx, ty, time: performance.now() };
        viewer.classList.toggle('is-dragging', scale > 1.01);
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchStart = { distance: distance(a, b), scale };
      }
    });

    stage.addEventListener('pointermove', event => {
      if (!pointers.has(event.pointerId)) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (pointers.size >= 2) {
        const [a, b] = [...pointers.values()];
        if (!pinchStart) pinchStart = { distance: distance(a, b), scale };
        const d = distance(a, b);
        setViewerScale(pinchStart.scale * (d / Math.max(1, pinchStart.distance)));
        return;
      }

      if (scale > 1.01 && gestureStart) {
        tx = gestureStart.tx + (event.clientX - gestureStart.x);
        ty = gestureStart.ty + (event.clientY - gestureStart.y);
        applyViewerTransform();
      }
    });

    const finishPointer = event => {
      const start = gestureStart;
      const wasSingle = pointers.size === 1;
      pointers.delete(event.pointerId);
      viewer.classList.remove('is-dragging');
      pinchStart = null;
      if (!wasSingle || !start || scale > 1.01) {
        if (!pointers.size) gestureStart = null;
        return;
      }
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      const elapsed = performance.now() - start.time;
      if (elapsed < 700 && Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.25) {
        stepViewer(dx < 0 ? 1 : -1);
      }
      gestureStart = null;
    };
    stage.addEventListener('pointerup', finishPointer);
    stage.addEventListener('pointercancel', finishPointer);

    document.addEventListener('keydown', event => {
      if (!viewer.classList.contains('is-open')) return;
      if (event.key === 'Escape') closeViewer();
      else if (event.key === 'ArrowLeft') stepViewer(-1);
      else if (event.key === 'ArrowRight') stepViewer(1);
      else if (event.key === '+' || event.key === '=') setViewerScale(scale + .5);
      else if (event.key === '-') setViewerScale(scale - .5);
    });
  }

  function openViewer(items, index = 0, label = '') {
    const clean = [...new Set((items || []).filter(Boolean))];
    if (!clean.length) return;
    ensureViewer();
    viewerItems = clean;
    viewerImage.alt = label;
    showViewerIndex(index);
    viewer.classList.add('is-open');
    viewer.setAttribute('aria-hidden', 'false');
    document.documentElement.classList.add('media-viewer-open');
    viewer.querySelector('.viewer-close')?.focus({ preventScroll: true });
  }

  /* ---------- Fixed UI + dropdown ---------- */
  function setupContentUi() {
    const landingNav = document.querySelector('.landing-navigation');
    const trigger = document.querySelector('.continuous-nav-trigger');
    const menu = document.querySelector('.continuous-nav-menu');
    const frost = document.querySelector('.continuous-nav-frost');
    const name = document.querySelector('.continuous-name');
    if (!landingNav || !trigger || !menu || !frost || !name) return;

    let open = false;
    let scheduled = false;

    const setOpen = value => {
      open = Boolean(value);
      document.body.classList.toggle('continuous-nav-open', open);
      trigger.setAttribute('aria-expanded', String(open));
      frost.setAttribute('aria-hidden', String(!open));
      if (open) requestAnimationFrame(() => menu.querySelector('a[aria-current="page"]')?.focus({ preventScroll: true }) || menu.querySelector('a')?.focus({ preventScroll: true }));
    };

    trigger.addEventListener('click', () => setOpen(true));
    frost.addEventListener('click', () => setOpen(false));
    menu.addEventListener('click', event => {
      if (event.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && open) setOpen(false);
    });

    name.addEventListener('click', event => {
      event.preventDefault();
      setOpen(false);
      history.replaceState(null, '', `${location.pathname}${location.search}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    if (finePointer.matches) {
      menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('mouseenter', () => {
          name.classList.remove('is-cycling');
          menu.querySelectorAll('a').forEach(a => a.classList.remove('is-active'));
          link.classList.add('is-active');
        });
        link.addEventListener('mouseleave', () => {
          link.classList.remove('is-active');
          name.classList.add('is-cycling');
        });
      });
      menu.addEventListener('mouseleave', () => {
        menu.querySelectorAll('a').forEach(a => a.classList.remove('is-active'));
        name.classList.add('is-cycling');
      });
    }

    const update = () => {
      scheduled = false;
      const uiVisible = landingNav.getBoundingClientRect().bottom <= 0;
      document.body.classList.toggle('content-ui-visible', uiVisible);
      if (!uiVisible && open) setOpen(false);
    };
    const requestUpdate = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(update);
    };
    addEventListener('scroll', requestUpdate, { passive: true });
    addEventListener('resize', requestUpdate, { passive: true });
    requestUpdate();
  }

  /* ---------- section + project color tracking ---------- */
  function hexToRgb(hex) {
    const value = String(hex || '').trim().replace('#', '');
    if (!/^[0-9a-f]{6}$/i.test(value)) return null;
    return [0, 2, 4].map(offset => parseInt(value.slice(offset, offset + 2), 16));
  }
  function srgb(v) {
    const c = v / 255;
    return c <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4);
  }
  function readable(rgb) {
    if (!rgb) return null;
    let out = rgb.map(v => clamp(Math.round(v), 0, 255));
    const contrast = arr => {
      const L = .2126 * srgb(arr[0]) + .7152 * srgb(arr[1]) + .0722 * srgb(arr[2]);
      return 1.05 / (L + .05);
    };
    if (contrast(out) >= 4.5) return out;
    for (let f = .94; f >= .2; f -= .04) {
      const candidate = out.map(v => Math.round(v * f));
      if (contrast(candidate) >= 4.5) return candidate;
    }
    return [65,65,65];
  }
  const rgbCss = rgb => `rgb(${rgb.join(',')})`;

  async function averageColor(img) {
    try {
      if (!img.complete) await new Promise(resolve => img.addEventListener('load', resolve, { once: true }));
      if (!img.naturalWidth || !img.naturalHeight) return null;
      const ratio = Math.min(48 / img.naturalWidth, 48 / img.naturalHeight, 1);
      const w = Math.max(1, Math.round(img.naturalWidth * ratio));
      const h = Math.max(1, Math.round(img.naturalHeight * ratio));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      let r=0,g=0,b=0,n=0;
      for (let i=0;i<data.length;i+=4) {
        const a = data[i+3] / 255;
        if (a < .1) continue;
        r += data[i]*a; g += data[i+1]*a; b += data[i+2]*a; n += a;
      }
      return n ? readable([r/n,g/n,b/n]) : null;
    } catch (_) { return null; }
  }

  function setupScrollState() {
    const name = document.querySelector('.continuous-name');
    const menuLinks = [...document.querySelectorAll('.continuous-nav-menu a[href^="#"]')];
    const photoButtons = [...document.querySelectorAll('#photography .series-image-button')];
    photoButtons.forEach(button => {
      const img = button.querySelector('img');
      averageColor(img).then(rgb => { if (rgb) button.dataset.imageColor = rgbCss(rgb); });
    });

    let scheduled = false;
    const visibleAmount = rect => Math.max(0, Math.min(innerHeight, rect.bottom) - Math.max(0, rect.top));

    const update = () => {
      scheduled = false;
      const viewportCenter = innerHeight / 2;

      // Aktive Seite im Dropdown.
      let activeSection = null;
      let bestSectionDistance = Infinity;
      sectionIds.forEach(id => {
        const section = document.getElementById(id);
        if (!section) return;
        const rect = section.getBoundingClientRect();
        if (rect.bottom <= 0 || rect.top >= innerHeight) return;
        const distance = Math.abs((Math.max(0, rect.top) + Math.min(innerHeight, rect.bottom)) / 2 - viewportCenter);
        if (distance < bestSectionDistance) { bestSectionDistance = distance; activeSection = id; }
      });
      menuLinks.forEach(link => {
        const active = link.getAttribute('href') === `#${activeSection}`;
        if (active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });

      if (!name || !document.body.classList.contains('content-ui-visible')) return;

      // Fotografie: Farbe des am stärksten sichtbaren Fotos.
      if (activeSection === 'photography' && photoButtons.length) {
        let best = null, bestVisible = -1, bestDistance = Infinity;
        photoButtons.forEach(button => {
          const rect = button.getBoundingClientRect();
          const visible = visibleAmount(rect);
          if (visible <= 0) return;
          const distance = Math.abs((rect.top + rect.bottom)/2 - viewportCenter);
          if (visible > bestVisible + 1 || (Math.abs(visible-bestVisible)<=1 && distance < bestDistance)) {
            best = button; bestVisible = visible; bestDistance = distance;
          }
        });
        if (best) {
          name.style.setProperty('--scroll-project-color', best.dataset.imageColor || '#595857');
          return;
        }
      }

      const candidates = [...document.querySelectorAll('.continuous-project, .series-project')];
      let best = null, bestVisible = -1, bestDistance = Infinity;
      candidates.forEach(node => {
        const rect = node.getBoundingClientRect();
        const visible = visibleAmount(rect);
        if (visible <= 0) return;
        const distance = Math.abs((rect.top + rect.bottom)/2 - viewportCenter);
        if (visible > bestVisible + 1 || (Math.abs(visible-bestVisible)<=1 && distance < bestDistance)) {
          best = node; bestVisible = visible; bestDistance = distance;
        }
      });
      const rgb = readable(hexToRgb(best?.dataset.navColor));
      name.style.setProperty('--scroll-project-color', rgb ? rgbCss(rgb) : 'var(--ink)');
    };

    const requestUpdate = () => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(update);
    };
    addEventListener('scroll', requestUpdate, { passive: true });
    addEventListener('resize', requestUpdate, { passive: true });
    addEventListener('load', requestUpdate, { once: true });
    requestUpdate();
  }

  renderSections();
  makeGlobalColumns();
  setupMobilePinchColumns();
  setupContentUi();
  setupScrollState();
})();
