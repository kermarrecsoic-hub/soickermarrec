(() => {
  'use strict';

  const lang = window.SoicI18n?.currentLanguage?.() || 'de';
  const page = location.pathname.endsWith('datenschutz.html') ? 'privacy' : 'imprint';

  const content = {
    de: {
      imprint: {
        title: 'Impressum',
        s1h: 'Anbieterkennzeichnung',
        s1b: '<p>Soïc Kermarrec<br>Karl-Liebknecht-Straße 91<br>04275 Leipzig<br>Deutschland</p><p>Angaben nach § 18 Abs. 1 MStV; soweit anwendbar zugleich Angaben nach § 5 DDG.</p>',
        s2h: 'Kontakt',
        s2b: '<p>E-Mail: <a href="mailto:soickermarrec@gmail.com">soickermarrec@gmail.com</a></p>',
        s3h: 'Inhalte und Urheberrecht',
        s3b: '<p>Die auf dieser Website gezeigten Werke, Fotografien und sonstigen Inhalte sind urheberrechtlich geschützt. Eine Verwendung außerhalb der gesetzlichen Schranken des Urheberrechts bedarf der vorherigen Zustimmung.</p>'
      },
      privacy: {
        title: 'Datenschutz',
        s1h: 'Verantwortlicher',
        s1b: '<p>Soïc Kermarrec<br>Karl-Liebknecht-Straße 91<br>04275 Leipzig<br>Deutschland<br>E-Mail: <a href="mailto:soickermarrec@gmail.com">soickermarrec@gmail.com</a></p>',
        s2h: 'Hosting über GitHub Pages',
        s2b: '<p>Diese Website wird über GitHub Pages bereitgestellt. Beim Besuch einer GitHub-Pages-Website protokolliert GitHub die IP-Adresse des Besuchers zu Sicherheitszwecken. Dabei können außerdem technisch notwendige Zugriffsdaten verarbeitet werden. Weitere Informationen finden sich in der <a href="https://docs.github.com/de/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer">Datenschutzerklärung von GitHub</a>.</p><p>Die Verarbeitung erfolgt zur sicheren und technisch zuverlässigen Bereitstellung der Website auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO.</p>',
        s3h: 'Cookies, Tracking und Schriftarten',
        s3b: '<p>Das öffentliche Portfolio verwendet keine Analyse- oder Marketing-Tracker und setzt selbst keine Cookies. Sprache und Galerieansicht werden nicht dauerhaft im Browser gespeichert. Die Schriftart Michroma wird lokal von dieser Website geladen; beim Laden der Schrift wird keine Verbindung zu Google Fonts hergestellt.</p><p>Der separat passwortgeschützte Studio-Bereich verwendet ausschließlich eine technisch notwendige Sitzung, damit die Anmeldung funktioniert.</p>',
        s4h: 'Kontaktaufnahme',
        s4b: '<p>Wenn Sie per E-Mail Kontakt aufnehmen, werden die von Ihnen übermittelten Daten ausschließlich zur Bearbeitung der Anfrage verarbeitet. Rechtsgrundlage ist je nach Inhalt der Anfrage Art. 6 Abs. 1 lit. b oder lit. f DSGVO.</p>',
        s5h: 'Ihre Rechte',
        s5b: '<p>Im Rahmen der gesetzlichen Voraussetzungen bestehen insbesondere Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Außerdem besteht ein Beschwerderecht bei einer zuständigen Datenschutz-Aufsichtsbehörde.</p>'
      }
    },
    fr: {
      imprint: {
        title: 'Mentions légales',
        s1h: 'Identification de l’éditeur',
        s1b: '<p>Soïc Kermarrec<br>Karl-Liebknecht-Straße 91<br>04275 Leipzig<br>Allemagne</p><p>Informations conformément au § 18 al. 1 MStV et, le cas échéant, au § 5 DDG.</p>',
        s2h: 'Contact',
        s2b: '<p>E-mail : <a href="mailto:soickermarrec@gmail.com">soickermarrec@gmail.com</a></p>',
        s3h: 'Contenus et droit d’auteur',
        s3b: '<p>Les œuvres, photographies et autres contenus présentés sur ce site sont protégés par le droit d’auteur. Toute utilisation dépassant les exceptions prévues par la loi nécessite une autorisation préalable.</p>'
      },
      privacy: {
        title: 'Confidentialité',
        s1h: 'Responsable du traitement',
        s1b: '<p>Soïc Kermarrec<br>Karl-Liebknecht-Straße 91<br>04275 Leipzig<br>Allemagne<br>E-mail : <a href="mailto:soickermarrec@gmail.com">soickermarrec@gmail.com</a></p>',
        s2h: 'Hébergement via GitHub Pages',
        s2b: '<p>Ce site est publié via GitHub Pages. Lors de la visite d’un site GitHub Pages, GitHub journalise l’adresse IP du visiteur à des fins de sécurité. D’autres données techniques nécessaires au fonctionnement peuvent également être traitées. Pour plus d’informations, consultez la <a href="https://docs.github.com/fr/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer">politique de confidentialité de GitHub</a>.</p><p>Le traitement repose sur l’art. 6, par. 1, let. f RGPD afin de fournir le site de manière sûre et techniquement fiable.</p>',
        s3h: 'Cookies, suivi et polices',
        s3b: '<p>Le portfolio public n’utilise ni outils d’analyse ni suivi marketing et ne dépose lui-même aucun cookie. La langue et l’affichage de la galerie ne sont pas enregistrés durablement dans le navigateur. La police Michroma est chargée localement depuis ce site ; aucune connexion à Google Fonts n’est établie pour son chargement.</p><p>L’espace Studio séparé et protégé par mot de passe utilise uniquement une session techniquement nécessaire à la connexion.</p>',
        s4h: 'Prise de contact',
        s4b: '<p>Si vous me contactez par e-mail, les données transmises sont traitées uniquement pour répondre à votre demande. Selon la nature de la demande, la base juridique est l’art. 6, par. 1, let. b ou let. f RGPD.</p>',
        s5h: 'Vos droits',
        s5b: '<p>Dans les conditions prévues par la loi, vous disposez notamment de droits d’accès, de rectification, d’effacement, de limitation, de portabilité et d’opposition. Vous pouvez également déposer une réclamation auprès d’une autorité de contrôle compétente.</p>'
      }
    },
    en: {
      imprint: {
        title: 'Legal notice',
        s1h: 'Provider information',
        s1b: '<p>Soïc Kermarrec<br>Karl-Liebknecht-Straße 91<br>04275 Leipzig<br>Germany</p><p>Information pursuant to § 18(1) MStV and, where applicable, § 5 DDG.</p>',
        s2h: 'Contact',
        s2b: '<p>Email: <a href="mailto:soickermarrec@gmail.com">soickermarrec@gmail.com</a></p>',
        s3h: 'Content and copyright',
        s3b: '<p>The artworks, photographs and other content shown on this website are protected by copyright. Any use beyond statutory copyright exceptions requires prior permission.</p>'
      },
      privacy: {
        title: 'Privacy',
        s1h: 'Controller',
        s1b: '<p>Soïc Kermarrec<br>Karl-Liebknecht-Straße 91<br>04275 Leipzig<br>Germany<br>Email: <a href="mailto:soickermarrec@gmail.com">soickermarrec@gmail.com</a></p>',
        s2h: 'Hosting via GitHub Pages',
        s2b: '<p>This website is published through GitHub Pages. When a GitHub Pages website is visited, GitHub logs the visitor’s IP address for security purposes. Other technically necessary access data may also be processed. Further information is available in <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" target="_blank" rel="noopener noreferrer">GitHub’s privacy statement</a>.</p><p>Processing is based on Art. 6(1)(f) GDPR for the secure and technically reliable provision of the website.</p>',
        s3h: 'Cookies, tracking and fonts',
        s3b: '<p>The public portfolio uses no analytics or marketing trackers and does not itself set cookies. Language and gallery view are not stored permanently in the browser. The Michroma font is loaded locally from this website; loading the font does not establish a connection to Google Fonts.</p><p>The separate password-protected Studio area uses only a technically necessary session so that login can function.</p>',
        s4h: 'Contact',
        s4b: '<p>If you contact me by email, the data you provide is processed solely in order to handle your enquiry. Depending on the enquiry, the legal basis is Art. 6(1)(b) or Art. 6(1)(f) GDPR.</p>',
        s5h: 'Your rights',
        s5b: '<p>Subject to the statutory requirements, you have rights including access, rectification, erasure, restriction of processing, data portability and objection. You also have the right to lodge a complaint with a competent data protection supervisory authority.</p>'
      }
    }
  };

  const data = (content[lang] || content.en)[page];
  if (!data) return;
  document.querySelectorAll('[data-legal]').forEach(el => {
    const key = el.dataset.legal;
    if (data[key]) el.textContent = data[key];
  });
  document.querySelectorAll('[data-legal-html]').forEach(el => {
    const key = el.dataset.legalHtml;
    if (data[key]) el.innerHTML = data[key];
  });
})();
