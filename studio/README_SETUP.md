# Soïc Studio – V11 Einrichtung

Das Studio ist in diesem Paket bereits vollständig enthalten. Du musst den Ordner `studio/` erst dann einrichten, wenn du das Portal benutzen willst; die normale Website funktioniert auch ohne Netlify-Studio.

## Was V11 im Studio zusätzlich kann
- Landing-Hintergrund: drei Mobile-Slots + drei Desktop-Slots; Bild hochladen und aktiven Slot wählen.
- Fotografie: Bilder eines Fotografie-Projekts automatisch nach Sättigung sortieren. Standard: **satt oben → ungesättigt unten**.
- Danach bleibt die Reihenfolge jederzeit manuell per Drag & Drop änderbar.
- Alle bisherigen Projekt-, Mediathek- und Bildfunktionen bleiben erhalten.

## 1. GitHub-Token
GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens.
Repository: `soickermarrec`; Berechtigung **Contents: Read and write**.
Token kopieren und nicht in Dateien oder GitHub eintragen.

## 2. Netlify-Projekt
Neues Netlify-Projekt aus deinem GitHub-Repository erstellen.
Base directory: `studio`
Die `studio/netlify.toml` übernimmt Publish- und Functions-Pfade.

## 3. Environment Variables in Netlify
- `ADMIN_PASSWORD` = dein gewünschtes Studio-Passwort
- `SESSION_SECRET` = lange zufällige Zeichenfolge (mindestens 24 Zeichen; besser 40+)
- `GITHUB_TOKEN` = Fine-grained GitHub-Token
Optional, falls Repository/Branch anders heißen:
- `GITHUB_OWNER`
- `GITHUB_REPO`
- `GITHUB_BRANCH`

## 4. Subdomain
In Netlify `studio.soickermarrec.de` als Custom Domain hinzufügen.
Netlify zeigt dir die Zieladresse (z. B. `dein-studio.netlify.app`).
In netcup CloudDNS:
- Host: `studio`
- Typ: `CNAME`
- Ziel: die von Netlify angegebene `.netlify.app`-Adresse

## 5. Nutzung
About → `Studio` → anmelden.

### Landing-Hintergrund
`Landing-Hintergrund` öffnen. Es gibt Mobile Slot 1–3 und Desktop Slot 1–3.
- `Bild einsetzen`: Slot befüllen/ersetzen
- `Aktivieren`: bestimmt, welcher Slot auf der Website sichtbar ist
V11 startet mit Mobile Slot 1 = bisheriges Ausstellung-Vorschaubild und Desktop Slot 1 = bisheriges Fotografie/XXX-Vorschaubild.

### Fotografie nach Sättigung
`Fotografie` öffnen.
- Für alle Projekte: `Alle Bilder nach Sättigung`
- Für ein einzelnes Projekt: `Bearbeiten` → `Nach Sättigung`
Sortierung: höchste Sättigung zuerst, geringste Sättigung zuletzt.
Danach kannst du die Hauptbilder weiterhin per Drag & Drop verschieben und mit `Speichern & veröffentlichen` festlegen.

Das Studio ändert die **Galerie-Reihenfolge in data/xxx.js**; es benennt die Bilddateien nicht physisch um. Das ist für die Website robuster und vermeidet gebrochene Pfade.
