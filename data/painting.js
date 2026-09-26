/*
  Nur hier die Werke ergänzen und Texte ändern.
  Pfade beziehen sich auf die Seite pages/painting.html.
  Für ein Werk OHNE Detailansicht: details: null
  Du kannst den gesamten zweiten DEMO-Eintrag löschen.
*/
window.PAINTING_WORKS = [
  {
    title: "Dante",
    medium: "acrylic, ink, kyougi on canvas",
    dimensions: "65 × 46 cm",
    availability: "unavailable",
    text: "", // Hier kannst du einen eigenen längeren Beschreibungstext eintragen.
    image: "../images/painting/dante/main.jpg",
    zoom: "../images/painting/dante/zoom.jpg",
    details: {
      left: "../images/painting/dante/detail-left.jpg",
      right: "../images/painting/dante/detail-right.jpg"
    }
  },
  {
    // Demonstriert das Scrollen. Sobald du dein zweites Werk hast: ersetzen oder löschen.
    demo: true,
    title: "Zweites Werk – Platzhalter",
    medium: "Hier Material und Technik eintragen",
    dimensions: "Maße ergänzen",
    availability: "",
    text: "Dieser Eintrag zeigt, wie weitere Werke untereinander erscheinen.",
    image: "../images/painting/zweites-werk/main.jpg",
    zoom: "../images/painting/zweites-werk/main.jpg",
    details: null
  }
];
