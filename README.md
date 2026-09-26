# Pain_ing – Entwurf der gemeinsamen Galerievorlage

Dieser ZIP-Ordner ist **ein gezieltes Update deines bestehenden GitHub-Repositories**, keine neue Landingpage. Nur `pages/painting.html` ersetzt eine bestehende Datei; die übrigen Dateien/Ordner sind neu. `index.html`, `style.css`, `script.js` und die bestehenden `images/*.jpg` bleiben vollständig unangetastet.

## Wie du die Dateien hochlädst

Öffne GitHub > dein Repository > **Add file > Upload files**. Ziehe **den Inhalt** dieses entpackten Ordners hinein (alle Ordner zusammen); GitHub übernimmt die Ordnerstruktur. Prüfe unbedingt, dass `pages/painting.html`, `css/gallery.css`, `js/gallery.js`, `data/painting.js` und `images/painting/dante/main.jpg` an genau diesen Stellen liegen. Dann Commit changes. Wenn GitHub das Ersetzen von `pages/painting.html` beim gemeinsamen Upload nicht erlaubt, lösche erst die alte `pages/painting.html`, committe und lade die neue hoch.

## Die Gestaltung

- Feststehender Header: Zurück-Pfeil links; Pain_ing mittig; rechts die Seitenliste, aktive Seite hellgrau.
- Weißer Verlauf unter dem Header bis unter den letzten rechten Navigationslink.
- Hauptwerk mittig, vollständig, korrektes Seitenverhältnis, Text darunter, weitere Werke beim Scrollen.
- Detailbilder optional: Bei Desktop-Hover sichtbar. Auf dem Handy: erstes Tippen auf das Hauptwerk öffnet die Details, zweites Tippen die Großansicht.
- **Kein Lupensymbol.** Ein einfacher Klick auf das Hauptwerk öffnet auf dem Desktop die hochauflösende Großansicht. Ein weiterer Klick auf das große Bild vergrößert es; durch Scrollen kannst du den Ausschnitt untersuchen. `Schließen` oder Esc schließt.

## Eigene Bilder und Texte

Ersetze `images/painting/dante/main.jpg` durch dein optimiertes Werk, `zoom.jpg` durch eine größere hochauflösende Version und die beiden `detail-*.jpg` durch vorbereitete Ausschnitte. Benutze dieselben Dateinamen, dann musst du keine Pfade verändern.

Ändere Titel, Maße, Medium, Verfügbarkeit, Freitext und Bildpfade **nur in `data/painting.js`**. Jede Klammergruppe `{...}` entspricht einem Werk. `details: null` deaktiviert die beiden Zusatzbilder. Der zweite Eintrag ist deutlich als DEMO markiert; ersetze/lösche ihn, sobald du weitere Werke hast.

**Wichtig zu den Beispielbildern:** Die Bilder in diesem Entwurf wurden aus deinem PDF entnommen und dienen nur der Demonstration. Die dort eingebettete Hauptdatei hat 929 × 1200 Pixel; die beigefügte `zoom.jpg` kann daher noch keine zusätzlichen Details zeigen. Ersetze sie unbedingt durch dein hochauflösendes Original (empfohlen: längste Kante ca. 3000–4500 Pixel, möglichst unter 8 MB).

## Weitere Seiten

Für Graph1c, Ex. 26, Arch_0 usw. folgt dasselbe Grundgerüst. Der rechte Navigator verlinkt bereits auf deine vorhandenen Unterseiten, aber das neue Design wird zunächst **nur auf Painting** angewendet; die übrigen Seiten bleiben unverändert.

### Falls du lokal durch Doppelklick testest

Da die Daten in einer normalen JS-Datei stehen, brauchst du keinen lokalen Entwicklungsserver. Doppelklick auf `pages/painting.html` im entpackten Ordner ist ausreichend. Veröffentlicht funktioniert es auf GitHub Pages direkt.
