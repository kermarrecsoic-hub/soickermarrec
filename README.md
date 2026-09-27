# Soïc Kermarrec – Portfolio V8

Diese Version baut vollständig auf dem am 27. September 2026 hochgeladenen GitHub-ZIP auf. Die vorhandenen Bilder und Werkdaten bleiben erhalten. `CNAME` und die acht URLs der vorhandenen `sitemap.xml` sind unverändert.

## So veröffentlichst du V8

1. Entpacke `Soic_Portfolio_V8_Komplett.zip` und öffne den darin enthaltenen Ordner `soickermarrec-main`.
2. Kopiere **dessen Inhalt**, nicht den äußeren Ordner, in das Hauptverzeichnis des GitHub-Repositories `soickermarrec`. Ersetze dort die gleichnamigen Dateien, aber ändere die Verzeichnisstruktur nicht. Bei Änderungen an einzelnen Dateien geht es auch über GitHub → Datei → Stiftsymbol → gesamten Inhalt ersetzen → Commit changes.
3. Weil du JavaScript lieber selbst einfügst: In `Soic_V8_JS_als_TXT.zip` findest du **jede JavaScript-Datei als vollständige `.txt`-Datei**. Öffne sie und kopiere den gesamten Inhalt in die jeweils angegebene `.js`-Datei. Die vollständige Website-ZIP enthält die korrekten `.js`-Dateien bereits; du musst die JS-Dateien **nicht zweimal** aktualisieren, wenn du wirklich den gesamten ZIP-Inhalt hochlädst.
4. `favicon.png` ist weiterhin im Hauptverzeichnis. Lade die mitgelieferte Datei mit hoch bzw. behalte deine vorhandene.
5. Kontrolliere nach GitHub Pages-Deployment die Startseite, `pages/about.html`, `pages/painting.html`, `pages/ex26.html` und `sitemap.xml`. Rufe in Google Search Console die URL-Prüfung für die Startseite und About auf.

## Alle JS-Dateien und ihre TXT-Namen

| Datei im GitHub-Repository | TXT-Datei im separaten ZIP |
|---|---|
| `script.js` | `script.js.txt` |
| `js/gallery.js` | `js/gallery.js.txt` |
| `js/editorial.js` | `js/editorial.js.txt` |
| `data/painting.js` | `data/painting.js.txt` |
| `data/graphic.js` | `data/graphic.js.txt` |
| `data/exhibitions.js` | `data/exhibitions.js.txt` |
| `data/architecture.js` | `data/architecture.js.txt` |
| `data/xxx.js` | `data/xxx.js.txt` |

## Änderungen

- **Landingpage:** dunkle Schrift `#414141`; Schriftrotation 16/16/14 px mit unveränderlicher Zeilenhöhe 20 px; untere Desktop-Spawnpunkte 6 und 8 nach innen verlegt, damit Ex. 26 und XXX größer und proportional angezeigt werden. Vorschauen bleiben anklickbar und unbeschnitten.
- **Typografie:** Navigation, About, Contact, Bildlegenden und Footer verwenden dieselbe Helvetica/Arial-Schriftfamilie und dieselbe Buchstabenweite wie der Basiszustand der Landingpage; die aktive Landingpage rotiert weiterhin vorübergehend zwischen drei Fonts.
- **Galerie:** Painting und Graphic unterstützen sanfte Mobil-Animationen für optionale Detailbilder. Ein Plus unter dem Hauptbild wird beim Öffnen zum Minus. **Dein Graphic-Datensatz enthält derzeit nur ein einziges Bild und keine Details:** ergänze später `details`, wenn du dort Zusatzbilder willst.
- **Exhibitions/Architecture/XXX:** jede Serie wird auf Desktop in zwei Reihen über die gesamte Galeriebreite verteilt. Das Projektlabel und alle Beschreibungstexte stehen unter beiden Reihen in voller Breite. Auf Smartphones bleiben die Bilder in einer Spalte untereinander; Bilder werden niemals zugeschnitten. Bestehende Ein-Bild-Projekte bleiben als Einzelbild zentriert.
- **About:** Bild und kompletter Text samt Vita haben exakt dieselbe Breite. Das Bild bleibt proportional und begrenzt sich auf 75 % der Fensterhöhe (sofern nicht die Bildschirmbreite stärker begrenzt).
- **Header:** ein durchgängiger, linearer Weiß-zu-Transparent-Verlauf ohne mehrfach abgestufte Transparenzwerte.
- **SEO:** fehlerhaftes Anführungszeichen der ursprünglichen Homepage-Description repariert; eindeutige Titles, Descriptions, Canonical- und Open-Graph-Tags auf allen Seiten; sichtbare H1 auf der Startseite; WebSite-/Person-JSON-LD, inklusive nicht-akzentuierter und gewünschter weiterer Schreibvarianten im `alternateName`-Feld; `robots.txt` mit Sitemap-Verweis. `sitemap.xml` war bereits korrekt und bleibt unverändert. Varianten in strukturierten Daten sind **keine Garantie** für Rankings bei Tippfehlern; Google trifft die Zuordnung selbst.

## Bilder oder Projekte ändern

- Vorschaubilder: `images/vorschaubild/*.jpg`; Zuordnung und erlaubte Spawnpunkte sind direkt in `index.html` über `data-preview` / `data-spawns` einstellbar.
- Werke: `data/*.js`. Die ausführlichen Bildpfade liegen in jedem Werkobjekt. Zum Hinzufügen von optionalen Details zu einem Einzelbild: `image: "../images/.../main.jpg", details: { left: "../images/.../left.jpg", right: "../images/.../right.jpg" }`. Lass den `details`-Block weg, wenn es keine Details gibt.
- Bildreihen: `images: ["../images/.../01.jpg", "../images/.../02.jpg", ...]` – jedes Array kann beliebig viele Bilder enthalten. Sehr umfangreiche Reihen erzeugen auf Desktop entsprechend schmalere Spalten, damit immer zwei Bildreihen vorhanden sind.

## Hinweis zu Datenschutz und Bildschutz

Die Website bindet für die animierte dritte Schriftart Google Fonts ein. Extern eingebundene Fonts können Datenschutzanforderungen auslösen. Außerdem verhindert der eingebaute Rechtsklick- und Drag-Schutz nur einfaches Speichern: Screenshots und Browser-Entwicklertools lassen sich dadurch nicht technisch verhindern.
