# Soïc Studio — ONE-SHOT Stand 2026-10-19

Dieses Verzeichnis ist der serverseitige Verwaltungsbereich für soickermarrec.de. Die öffentliche Portfolio-Website läuft weiterhin statisch über GitHub Pages. Netlify wird ausschließlich für das geschützte Studio, GitHub-Schreibzugriffe und Netlify Forms verwendet.

## Vor dem EINEN Production-Deploy

1. In Netlify Builds stoppen bzw. gestoppt lassen.
2. Unter **Forms** die **Form detection aktivieren**. Die beiden statischen Form-Blueprints liegen in `studio/public/available-access.html` und `studio/public/project-updates.html`; Netlify erkennt sie beim nächsten Deploy.
3. Unter **Environment variables** prüfen:
   - `ADMIN_PASSWORD` — Studio-Passwort
   - `SESSION_SECRET` — mindestens 24 Zeichen, besser 40+
   - `GITHUB_TOKEN` — Fine-grained GitHub token mit Contents: Read and write für das Repo
   - optional `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_BRANCH`; Defaults sind `kermarrecsoic-hub`, `soickermarrec`, `main`.
4. Site base directory muss `studio` sein. `studio/netlify.toml` setzt `public` und `netlify/functions` relativ dazu.
5. Die endgültigen Repository-Dateien zuerst nach GitHub hochladen. Erst danach Netlify wieder aktivieren und genau einen Production-Deploy der aktuellen `main`-Version auslösen.
6. Nach erfolgreichem Deploy Builds wieder auf **Stopped builds** setzen.

## Available Works

`Available Works` ist standardmäßig deaktiviert (`data/available-config.json`). Im Studio gibt es einen eigenen Bereich **Available Works**. Dort kann die öffentliche Verlinkung später ohne neuen Netlify-Deploy ein- oder ausgeschaltet werden.

Bei Malerei und Grafik werden pro Projekt unabhängig gespeichert:
- `visible` — auf der normalen Portfolio-Seite sichtbar
- `availableWorks` — in Available Works sichtbar
- `price` — Preis / Preistext
- `layout` — auto / diptych / multiple / portrait / landscape

Ein Werk kann nur in Available Works stehen, nur im Portfolio, in beiden oder in keinem Bereich.

Die Seite `pages/available.html` ist für Suchmaschinen `noindex`. Sie ist ein **Soft Gate**, kein kryptografisch geschützter Kundenbereich: Besucher müssen eine E-Mail-Adresse eingeben, bevor die Liste angezeigt wird, die statischen Projektdaten liegen technisch aber weiterhin im öffentlichen Repository. Für vertrauliche Preise wäre später eine serverseitige Datenquelle notwendig.

### Netlify Forms

Es gibt zwei Formulare:
- `available-works-access` — Zugang zur Available-Works-Liste; optionales Häkchen für Projektbenachrichtigungen
- `project-updates` — optionale Vormerkung über den Reach-out-Dialog eines Projekts

Aktuell werden **keine automatischen E-Mails versendet**. Die Einträge werden nur in Netlify Forms gespeichert und können dort später als Liste/CSV verwendet werden.

## Projektkontakt / Reach out

Öffentliche Projekte besitzen nach der Beschreibung einen dezenten Kontakt-Button. Er öffnet eine vorbereitete E-Mail an `soickermarrec@gmail.com`. Optional kann sich die Person für spätere Projektbenachrichtigungen vormerken; diese Vormerkung nutzt das Netlify-Formular `project-updates`.

## Bilder / Upload

Neue Bild-Uploads werden im Browser vor dem Upload optimiert:
- WebP
- keine Hochskalierung
- maximal ca. 3000 px längste Seite
- hohe Qualität (ca. 0,94)
- Function-Payload bleibt unter der vorgesehenen Größenbegrenzung

`upload-image.mjs` speichert nur das endgültige Bild. Das alte Low-Res-Vorschaubild-System wird nicht mehr verwendet. Beim Upload werden Breite und Höhe zusätzlich in `data/image-dimensions.js` geschrieben, damit die öffentliche Seite den endgültigen Platz eines Bildes schon vor dem Lazy Loading kennt und beim Nachladen nicht springt.

## Layouts

Für Malerei/Grafik:
- `auto`: klassischer vertikaler Aufbau
- `diptych`: ein Hauptbild geschlossen; geöffnet Details 2×2 Desktop / untereinander Mobile; gesamte Komposition max. 80vw
- `multiple`: mehrere Arbeiten/Paneele als Projektgruppe
- `portrait`: Hauptbild mittig, Desktop-Details links/rechts flankierend; Beschreibung zentriert unter Hauptbild; Mobile linear
- `landscape`: Hauptbild mittig; Beschreibung darunter; Details darunter im Desktop-Raster / Mobile linear

Die Beschreibung bleibt bei allen Layouts zentriert unter dem Hauptbild.

## Cleanup

Unter **Mediathek → Unbenutzte Medien aufräumen**:
1. GET berechnet zunächst nur einen Plan.
2. Das Studio zeigt Anzahl und versteckte Projekte an.
3. Erst nach Bestätigung führt POST die Bereinigung aus.
4. Die Änderung wird als ein GitHub-Commit geschrieben.

Entfernt werden:
- nicht mehr referenzierte Bilder
- alte `Vorschaubild/`- und `images/vorschaubild/`-Bestände
- Projekte mit `visible:false`, sofern sie **nicht** `availableWorks:true` sind
- dazugehörige veraltete Share-Seiten
- entfernte Bildpfade aus `data/image-dimensions.js`

Wichtig: Vor dem Cleanup keine Bildordner manuell löschen. Der Cleanup prüft den dann aktuellen GitHub-Stand.

## Share-Seiten

Malerei/Grafik besitzen Social-Share-Seiten unter `share/`. Sie sind `noindex` und leiten auf die aktuelle One-Page-URL mit `#work-...` weiter. Beim Speichern betroffener Projekte werden die Share-Seiten aktualisiert bzw. bei unsichtbaren Projekten entfernt.

## SEO / öffentliche Website

Die indexierbare Hauptseite ist ausschließlich `https://soickermarrec.de/`. Alte Kategorie-Unterseiten bleiben aus Kompatibilitätsgründen vorhanden, sind aber `noindex,follow`. `sitemap.xml` listet nur die Root-URL. Available Works ist `noindex,nofollow`.

Das Studio darf keine `meta keywords` oder zusätzliche indexierbare Custom Pages erzeugen. Custom Pages aus dem Studio sind `noindex`.

## Netlify-Credits klein halten

`studio/netlify.toml` enthält eine Build-Ignore-Regel. Reine Content-Commits des Studios unter `data/`, `images/` oder `share/` sollen keinen neuen Studio-Deploy auslösen. Nach dem ONE-SHOT-Deploy Builds wieder stoppen. Das bereits veröffentlichte Studio und seine Functions bleiben erreichbar, während automatische Builds ausbleiben.
