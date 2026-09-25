# Soïc Kermarrec — Portfolio

## Inhalt
- `index.html`: Startseite mit allen sieben Links. `data-spawn="1"` bis `"6"` wählt einen Rastermittelpunkt. `data-preview="images/painting.jpg"` wählt das zugehörige Bild.
- `style.css`: Gestaltung und Schriftwechsel Baskerville → Arial → Michroma (jeweils eine Sekunde). Baskerville wird lokal verwendet; auf Geräten ohne Baskerville erscheint Georgia. Michroma wird über Google Fonts geladen.
- `script.js`: 6 Spawn-Punkte (Desktop: 3 Spalten × 2 Zeilen; Mobil: 2 Spalten × 3 Zeilen), responsive Vorschauen und Mobile-Tap-Steuerung.
- `images/`: 7 austauschbare JPG-Platzhalter. Gleicher Dateiname = kein Code-Update erforderlich. Für PNG musst du zusätzlich in `index.html` `.jpg` durch `.png` ersetzen.
- `pages/`: 7 vorbereitete Unterseiten; ersetze dort später den Platzhaltertext.

## Vorschau-Regeln
- Kein Zuschneiden, keine Verzerrung, kein Hochskalieren. Bild wird in seinem nativen Pixelmaß gezeigt, solange es in den maximalen 1200 × 1200-px-Rahmen passt.
- Größere Bilder werden proportional verkleinert. Auf kleinen Displays und randnahen Spawn-Punkten kann der Rahmen zum Schutz vor Überlauf nochmals verkleinert werden.
- Bildmittelpunkt = Rasterzellenmittelpunkt. Die Rasterzellen selbst begrenzen das Bild nicht: Nachbarzellen dürfen überlappt werden.
- Desktop: Hover = Vorschau + Schriftwechsel; Maus weg = schließen; Klick = Seite.
- Mobil: 1. Tippen = Vorschau; 2. Tippen auf denselben Link = Seite. Tippen auf eine andere Zeile wechselt die Vorschau. Tippen auf freien Bereich schließt sie.

## Empfohlene Bilddateien
- 800–1200 Pixel an der längsten Kante; größere Dateien sind nicht nötig, sofern keine hochauflösende Vorschau gewünscht wird.
- JPEG vorzugsweise ca. 150–500 KB; PNG nur für Transparenzen oder scharfe Grafiken, vorzugsweise unter 800 KB.
- Obergrenze je Preview: ungefähr 1 MB. Es gibt technisch keine Mindest-KB-Zahl.
- Farben: sRGB.

## Frisches GitHub-Repository
1. ZIP lokal entpacken.
2. Repository bei GitHub öffnen → **Add file** → **Upload files**.
3. Den *Inhalt* des entpackten Ordners inklusive `images/` und `pages/` hochladen; nicht die ZIP und nicht den äußeren Ordner. `index.html` muss direkt im Repository-Hauptverzeichnis liegen.
4. **Commit changes** anklicken.
5. **Settings** → **Pages** → **Build and deployment**: `Deploy from a branch`, `main`, `/(root)` → **Save**.
6. GitHub zeigt danach die öffentliche Adresse (meist `https://BENUTZERNAME.github.io/REPOSITORY/`).

Bei späteren Änderungen eine Bilddatei mit genau gleichem Namen im `images/`-Ordner austauschen und committen.
