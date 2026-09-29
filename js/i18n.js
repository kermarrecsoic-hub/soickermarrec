/* Soïc Kermarrec – DE / FR / EN */
(() => {
  'use strict';

  const VALID = ['de', 'fr', 'en'];

  const copy = {
    de: {
      nav: {
        painting: 'Malerei',
        graphic: 'Tinte',
        exhibitions: 'Ausstellung',
        architecture: 'Arch.0',
        photography: 'Fotografie',
        about: 'About',
        contact: 'Kontakt'
      },
      footer: '© 2026 Soïc Kermarrec, alle Rechte vorbehalten',
      legal: { imprint: 'Impressum', privacy: 'Datenschutz' },
      about: {
        bio1: 'Soïc Kermarrec wurde 2004 in Leipzig geboren und lebt und arbeitet in dieser Stadt als Künstler und Architekturstudent.<br>In seiner Jugend wollte er den großen Mangaka nacheifern und kam so zur Grafik mit Tinte und Feder. Als er 2025 nach Paris zog, fing er an, seine Eindrücke und Erlebnisse in Farben auf die Leinwand zu bannen, was zu seinem jetzigen Werk führte.',
        bio2: 'Er arbeitet intuitiv und stellt mit Tinte und Acryl, verschiedenen Fragmenten und Schrift Abhängigkeiten zwischen den einzelnen Elementen her. So entstehen visuelle Eindrücke, in denen sich komplexe und manchmal zufällige Zusammenhänge unserer subjektiv wahrgenommenen Realität widerspiegeln.',
        study: 'B.A. Architektur, HTWK Leipzig',
        exchange: 'Auslandsstudium ENSA PVS, Paris',
        ex8: 'Ausstellung 8qm Paris',
        ex111: 'Ausstellung 1+1+1',
        exwar: 'Ausstellung „Im Krieg“',
        exaerial: 'Ausstellung Aerial&Art'
      },
      contact: {
        intro: 'Alle Anfragen zur Verfügbarkeit von Werken, Projekten und Ausstellungen bitte per E-Mail.',
        email: 'E-Mail'
      },
      page: {
        painting: 'Malerei',
        graphic: 'Tinte',
        exhibitions: 'Ausstellung',
        architecture: 'Architektur',
        photography: 'Fotografie',
        about: 'About',
        contact: 'Kontakt'
      },
      gallery: {
        imagesPerRow: 'Bilder pro Reihe',
        oneColumn: '1 Spalte',
        columns: 'Spalten',
        showDetails: 'Details zeigen',
        hideDetails: 'Details ausblenden',
        work: 'Werk',
        image: 'Bild',
        detail: 'Detail'
      },
      meta: {
        homeTitle: 'Soïc Kermarrec — Malerei, Tinte, Fotografie & Architektur',
        homeDescription: 'Portfolio von Soïc Kermarrec, Künstler und Architekturstudent aus Leipzig. Malerei, Tinte, Ausstellungen, Fotografie und Architektur, geprägt durch seine Zeit in Paris.',
        paintingTitle: 'Malerei | Soïc Kermarrec',
        paintingDescription: 'Malerei von Soïc Kermarrec: Acryl, Tinte und Mixed Media. Seine Malereipraxis entwickelte sich während seiner Zeit in Paris.',
        graphicTitle: 'Tinte | Soïc Kermarrec',
        graphicDescription: 'Tuschezeichnungen und grafische Arbeiten von Soïc Kermarrec.',
        exhibitionsTitle: 'Ausstellung | Soïc Kermarrec',
        exhibitionsDescription: 'Ausstellungen von Soïc Kermarrec, darunter Aerial&Art (2026), mit Arbeiten zwischen Leipzig und Paris.',
        architectureTitle: 'Architektur | Soïc Kermarrec — Leipzig & Paris',
        architectureDescription: 'Architektur- und Raumprojekte von Soïc Kermarrec zwischen Leipzig und Paris.',
        photographyTitle: 'Fotografie | Soïc Kermarrec',
        photographyDescription: 'Fotografie und experimentelle visuelle Arbeiten von Soïc Kermarrec.',
        aboutTitle: 'About | Soïc Kermarrec – Leipzig & Paris',
        aboutDescription: 'Soïc Kermarrec über seine künstlerische Arbeit und seine Zeit in Leipzig und Paris.',
        contactTitle: 'Kontakt | Soïc Kermarrec',
        contactDescription: 'Kontakt zu Soïc Kermarrec für Verfügbarkeit von Werken, Projekte und Ausstellungen.',
        imprintTitle: 'Impressum | Soïc Kermarrec',
        imprintDescription: 'Anbieterkennzeichnung und Kontaktdaten von Soïc Kermarrec.',
        privacyTitle: 'Datenschutz | Soïc Kermarrec',
        privacyDescription: 'Datenschutzhinweise für das Portfolio von Soïc Kermarrec.'
      }
    },
    fr: {
      nav: {
        painting: 'Peinture',
        graphic: 'Encre',
        exhibitions: 'Expositions',
        architecture: 'Arch.0',
        photography: 'Photographie',
        about: 'À propos',
        contact: 'Contact'
      },
      footer: '© 2026 Soïc Kermarrec, tous droits réservés',
      legal: { imprint: 'Mentions légales', privacy: 'Confidentialité' },
      about: {
        bio1: 'Soïc Kermarrec est né à Leipzig en 2004 et y vit et travaille comme artiste et étudiant en architecture.<br>Dans sa jeunesse, il voulait suivre les traces des grands mangakas et s’est ainsi tourné vers le dessin à l’encre et à la plume. Lorsqu’il s’installe à Paris en 2025, il commence à transposer sur la toile, par la couleur, ses impressions et ses expériences, ce qui l’amène à son travail actuel.',
        bio2: 'Il travaille de manière intuitive et crée, avec l’encre et l’acrylique, différents fragments et l’écriture, des relations entre les éléments. Il en résulte des impressions visuelles dans lesquelles se reflètent les liens complexes et parfois fortuits de notre réalité perçue subjectivement.',
        study: 'B.A. Architecture, HTWK Leipzig',
        exchange: 'Études en échange, ENSA PVS, Paris',
        ex8: 'Exposition 8qm Paris',
        ex111: 'Exposition 1+1+1',
        exwar: 'Exposition « Im Krieg »',
        exaerial: 'Exposition Aerial&Art'
      },
      contact: {
        intro: 'Pour toute demande concernant la disponibilité des œuvres, les projets ou les expositions, merci de me contacter par e-mail.',
        email: 'E-mail'
      },
      page: {
        painting: 'Peinture',
        graphic: 'Encre',
        exhibitions: 'Expositions',
        architecture: 'Architecture',
        photography: 'Photographie',
        about: 'À propos',
        contact: 'Contact'
      },
      gallery: {
        imagesPerRow: 'Images par rangée',
        oneColumn: '1 colonne',
        columns: 'colonnes',
        showDetails: 'Afficher les détails',
        hideDetails: 'Masquer les détails',
        work: 'Œuvre',
        image: 'image',
        detail: 'détail'
      },
      meta: {
        homeTitle: 'Soïc Kermarrec — Peinture, encre, photographie & architecture',
        homeDescription: 'Portfolio de Soïc Kermarrec, artiste et étudiant en architecture à Leipzig. Peinture, encre, expositions, photographie et architecture, marquées par son séjour à Paris.',
        paintingTitle: 'Peinture | Soïc Kermarrec',
        paintingDescription: 'Peintures de Soïc Kermarrec : acrylique, encre et techniques mixtes. Sa pratique picturale s’est développée pendant son séjour à Paris.',
        graphicTitle: 'Encre | Soïc Kermarrec',
        graphicDescription: 'Dessins à l’encre et œuvres graphiques de Soïc Kermarrec.',
        exhibitionsTitle: 'Expositions | Soïc Kermarrec',
        exhibitionsDescription: 'Expositions de Soïc Kermarrec, dont Aerial&Art (2026), avec des œuvres développées entre Leipzig et Paris.',
        architectureTitle: 'Architecture | Soïc Kermarrec — Leipzig & Paris',
        architectureDescription: 'Projets d’architecture et d’espace de Soïc Kermarrec entre Leipzig et Paris.',
        photographyTitle: 'Photographie | Soïc Kermarrec',
        photographyDescription: 'Photographie et projets visuels expérimentaux de Soïc Kermarrec.',
        aboutTitle: 'À propos | Soïc Kermarrec – Leipzig & Paris',
        aboutDescription: 'Soïc Kermarrec présente son travail artistique et son parcours entre Leipzig et Paris.',
        contactTitle: 'Contact | Soïc Kermarrec',
        contactDescription: 'Contacter Soïc Kermarrec pour la disponibilité des œuvres, les projets et les expositions.',
        imprintTitle: 'Mentions légales | Soïc Kermarrec',
        imprintDescription: 'Mentions légales et coordonnées de Soïc Kermarrec.',
        privacyTitle: 'Confidentialité | Soïc Kermarrec',
        privacyDescription: 'Informations relatives à la protection des données pour le portfolio de Soïc Kermarrec.'
      }
    },
    en: {
      nav: {
        painting: 'Painting',
        graphic: 'Ink',
        exhibitions: 'Exhibitions',
        architecture: 'Arch.0',
        photography: 'Photography',
        about: 'About',
        contact: 'Contact'
      },
      footer: '© 2026 Soïc Kermarrec, all rights reserved',
      legal: { imprint: 'Legal notice', privacy: 'Privacy' },
      about: {
        bio1: 'Soïc Kermarrec was born in Leipzig in 2004 and lives and works there as an artist and architecture student.<br>In his youth, he wanted to follow in the footsteps of the great manga artists and thus came to drawing with ink and nib. When he moved to Paris in 2025, he began translating his impressions and experiences into colour on canvas, leading to his current body of work.',
        bio2: 'He works intuitively, using ink and acrylic, various fragments and writing to establish relationships between individual elements. The result is a series of visual impressions in which the complex and sometimes accidental connections of our subjectively perceived reality are reflected.',
        study: 'B.A. Architecture, HTWK Leipzig',
        exchange: 'Exchange studies, ENSA PVS, Paris',
        ex8: 'Exhibition 8qm Paris',
        ex111: 'Exhibition 1+1+1',
        exwar: 'Exhibition “Im Krieg”',
        exaerial: 'Exhibition Aerial&Art'
      },
      contact: {
        intro: 'For enquiries about artwork availability, projects and exhibitions, please get in touch by email.',
        email: 'Email'
      },
      page: {
        painting: 'Painting',
        graphic: 'Ink',
        exhibitions: 'Exhibitions',
        architecture: 'Architecture',
        photography: 'Photography',
        about: 'About',
        contact: 'Contact'
      },
      gallery: {
        imagesPerRow: 'Images per row',
        oneColumn: '1 column',
        columns: 'columns',
        showDetails: 'Show details',
        hideDetails: 'Hide details',
        work: 'Work',
        image: 'image',
        detail: 'detail'
      },
      meta: {
        homeTitle: 'Soïc Kermarrec — Painting, ink, photography & architecture',
        homeDescription: 'Portfolio of Soïc Kermarrec, an artist and architecture student in Leipzig. Painting, ink, exhibitions, photography and architecture shaped by his time in Paris.',
        paintingTitle: 'Painting | Soïc Kermarrec',
        paintingDescription: 'Paintings by Soïc Kermarrec: acrylic, ink and mixed media. His painting practice developed during his time in Paris.',
        graphicTitle: 'Ink | Soïc Kermarrec',
        graphicDescription: 'Ink drawings and graphic works by Soïc Kermarrec.',
        exhibitionsTitle: 'Exhibitions | Soïc Kermarrec',
        exhibitionsDescription: 'Exhibitions by Soïc Kermarrec, including Aerial&Art (2026), with work developed between Leipzig and Paris.',
        architectureTitle: 'Architecture | Soïc Kermarrec — Leipzig & Paris',
        architectureDescription: 'Architecture and spatial projects by Soïc Kermarrec between Leipzig and Paris.',
        photographyTitle: 'Photography | Soïc Kermarrec',
        photographyDescription: 'Photography and experimental visual projects by Soïc Kermarrec.',
        aboutTitle: 'About | Soïc Kermarrec – Leipzig & Paris',
        aboutDescription: 'Soïc Kermarrec on his artistic practice and his time between Leipzig and Paris.',
        contactTitle: 'Contact | Soïc Kermarrec',
        contactDescription: 'Contact Soïc Kermarrec about artwork availability, projects and exhibitions.',
        imprintTitle: 'Legal notice | Soïc Kermarrec',
        imprintDescription: 'Legal notice and contact details for Soïc Kermarrec.',
        privacyTitle: 'Privacy | Soïc Kermarrec',
        privacyDescription: 'Privacy information for the portfolio of Soïc Kermarrec.'
      }
    }
  };

  const fieldTranslations = {
    medium: {
      'acrylic, ink, kyougi on canvas': {
        de: 'Acryl, Tinte, Kyougi auf Leinwand',
        fr: 'acrylique, encre, kyougi sur toile',
        en: 'acrylic, ink, kyougi on canvas'
      },
      'acrylic, ink, paper fragments on canvas': {
        de: 'Acryl, Tinte, Papierfragmente auf Leinwand',
        fr: 'acrylique, encre, fragments de papier sur toile',
        en: 'acrylic, ink, paper fragments on canvas'
      },
      'ink, water and white pencil on paper': {
        de: 'Tinte, Wasser und weißer Stift auf Papier',
        fr: 'encre, eau et crayon blanc sur papier',
        en: 'ink, water and white pencil on paper'
      },
      'ink on paper': {
        de: 'Tinte auf Papier',
        fr: 'encre sur papier',
        en: 'ink on paper'
      },
      'ink, watercolor on paper': {
        de: 'Tinte, Aquarell auf Papier',
        fr: 'encre, aquarelle sur papier',
        en: 'ink, watercolor on paper'
      },
      'ink, Watercolor on paper': {
        de: 'Tinte, Aquarell auf Papier',
        fr: 'encre, aquarelle sur papier',
        en: 'ink, watercolor on paper'
      },
      'ink, kyougi on paper': {
        de: 'Tinte, Kyougi auf Papier',
        fr: 'encre, kyougi sur papier',
        en: 'ink, kyougi on paper'
      }
    },
    availability: {
      unavailable: { de: 'nicht verfügbar', fr: 'indisponible', en: 'unavailable' },
      available: { de: 'verfügbar', fr: 'disponible', en: 'available' }
    }
  };

  function getByPath(object, path) {
    return String(path).split('.').reduce((value, key) => value && value[key], object);
  }

  function t(path, lang = currentLanguage()) {
    return getByPath(copy[lang] || copy.en, path) ?? getByPath(copy.en, path) ?? path;
  }

  function browserLanguage() {
    const langs = navigator.languages?.length ? navigator.languages : [navigator.language || 'en'];
    for (const raw of langs) {
      const lang = String(raw || '').toLowerCase().split('-')[0];
      if (VALID.includes(lang)) return lang;
    }
    return 'en';
  }

  function currentLanguage() {
    const fromUrl = new URL(location.href).searchParams.get('lang');
    return VALID.includes(fromUrl) ? fromUrl : browserLanguage();
  }

  function propagateLanguage(lang) {
    document.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      try {
        const url = new URL(href, location.href);
        if (url.origin !== location.origin) return;
        url.searchParams.set('lang', lang);
        link.href = url.href;
      } catch (_) {}
    });
  }

  function pageKey() {
    const name = location.pathname.split('/').pop() || 'index.html';
    if (!name || name === 'index.html') return 'home';
    return ({
      'painting.html': 'painting',
      'graphic.html': 'graphic',
      'ex26.html': 'exhibitions',
      'architecture.html': 'architecture',
      'xxx.html': 'photography',
      'about.html': 'about',
      'contact.html': 'contact',
      'impressum.html': 'imprint',
      'datenschutz.html': 'privacy'
    })[name] || 'home';
  }

  function applyMeta(lang) {
    const key = pageKey();
    const titleKey = key === 'home' ? 'homeTitle' : `${key}Title`;
    const descriptionKey = key === 'home' ? 'homeDescription' : `${key}Description`;
    document.title = t(`meta.${titleKey}`, lang);
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute('content', t(`meta.${descriptionKey}`, lang));
  }

  function applyStaticText(lang) {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(node => {
      node.textContent = t(node.dataset.i18n, lang);
    });
    document.querySelectorAll('[data-i18n-html]').forEach(node => {
      node.innerHTML = t(node.dataset.i18nHtml, lang);
    });
    applyMeta(lang);
  }

  function makeSwitch(lang) {
    if (document.querySelector('.language-switch')) return;
    const nav = document.createElement('nav');
    nav.className = 'language-switch';
    nav.setAttribute('aria-label', 'Language / Sprache / Langue');

    VALID.forEach(code => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = code.toUpperCase();
      button.dataset.lang = code;
      button.classList.toggle('is-active', code === lang);
      button.setAttribute('aria-pressed', String(code === lang));
      button.addEventListener('click', () => {
        const url = new URL(location.href);
        url.searchParams.set('lang', code);
        location.href = url.href;
      });
      nav.appendChild(button);
    });

    document.body.appendChild(nav);
  }

  function localizeField(field, value, lang = currentLanguage()) {
    const table = fieldTranslations[field];
    if (!table || value == null) return value;
    const exact = table[String(value)];
    return exact?.[lang] ?? value;
  }

  function localizeWork(work, lang = currentLanguage()) {
    return {
      ...work,
      medium: localizeField('medium', work.medium, lang),
      availability: localizeField('availability', work.availability, lang)
    };
  }

  const lang = currentLanguage();
  applyStaticText(lang);
  makeSwitch(lang);
  propagateLanguage(lang);

  window.SoicI18n = {
    language: lang,
    currentLanguage: () => lang,
    t: (path) => t(path, lang),
    localizeField: (field, value) => localizeField(field, value, lang),
    localizeWork: (work) => localizeWork(work, lang)
  };
})();
