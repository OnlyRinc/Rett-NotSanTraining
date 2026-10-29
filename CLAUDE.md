# Wachenalarm – Hinweise für Claude Code

Gamifizierte, ADHS-taugliche Lern-App für Rettungssanitäter (RS) und Notfallsanitäter (NotSan).
Spieler fahren Einsätze nach xABCDE, wählen Maßnahmen selbst, bekommen XP/Münzen und bauen ihre Rettungswache aus.
Besitzer: Felix (RS, Bundeswehrfeuerwehr, Schleswig-Holstein). Sprache der App und aller Texte: **Deutsch**.

## Befehle
- `python3 scripts/check.py` – Inhalte prüfen (läuft auch im Build)
- `python3 scripts/build.py` – baut `dist/` (Bündel `dist/data/*.json`, Service-Worker-Version)
- `npm test` – Build + Playwright: spielt alle Fälle in 2 Regelwerken × 2 Rollen fehlerfrei durch (muss grün sein)
- `npm start` – Build + lokaler Server auf http://localhost:8000
- `python3 scripts/apply_export.py <datei>` – im Browser bearbeitete Inhalte (Bearbeitungsmodus → Exportieren) übernehmen

## Aufbau
- `index.html` – Markup (Tabs Wache / Fälle / Wissen, Overlays für Alarm, Einsatz, Auswertung, Editor)
- `src/styles.css` – Design-Tokens in `:root`, Dark Mode über `prefers-color-scheme`
- `src/store.js` – **einzige Datenschnittstelle** (`window.Store`). Heute: statische JSON + lokale Entwürfe.
  Ein späteres Backend (z. B. Supabase) muss nur diese Schnittstelle erfüllen: `collection(n).onSnapshot`, `doc(id).set/delete`, `canEdit`, `pending`, `exportChanges`, `discardChanges`.
- `src/app.js` – gesamte App-Logik (klassisches Script, globale Funktionen; Tests rufen sie direkt auf)
- `content/faelle/*.json`, `content/wissen/*.json` – **Inhalte, Quelle der Wahrheit**. Dateiname = ID.
- `public/` – Manifest, Icons, Service Worker (`__VERSION__` wird beim Build ersetzt)
- `docs/` – Konzept und ausgewertete Quellen (SH-Handlungsempfehlungen, SAA/BPR)

Fortschritt (XP, Münzen, Wache, Rolle, Regelwerk) liegt im `localStorage` (`wachenalarm.v1`).

## Fall-Datenmodell (content/faelle)
- Kopf: `titel` (Diagnose, wird erst in der Auswertung gezeigt), `stichwort` (z. B. „RD 2 · Atemnot“), `level`, `status` (aktiv|entwurf), `patient`, `situation`, `quelle`, `regional`, `vitalwerte` {hf, sys, dia, spo2, af, gcs, bz, temp}, `rhythmus` (sinus|afib|stemi|avb3|svt)
- `phasen.{x,A,B,C,D,E}`: `eindruck`, `aktionen` (Schlüssel = Katalog-ID aus `CAT` in app.js), `eigene` (fallspezifische Maßnahmen mit `id`), `fragen`
- Maßnahme: `typ` (pflicht|sinnvoll|falsch|gefahr|abbruch|neutral), `ergebnis`, `warum`, `danach` (Vitalwerte nach der Maßnahme), `lebenswichtig`
- Rollen: `rolle` (rs|ns), `med` (Medikament), `typRS`/`warumRS`/`lwRS` (Abweichung für RS), `regional`
- Medikamente: `mittel: [{w: <Schlüssel aus MEDCAT>, d: <Dosis-Label exakt wie in MEDCAT> | '*'}]` – Spieler wählt erst Wirkstoff, dann Dosis
- Frage: `nach` (Maßnahmen-ID oder leer = Phasenende), `frage`, `befunde`, `richtig {text, warum}`, `falsch [{text, warum, schwer?: gefahr|abbruch}]`, `rolle`, `regional`
- `steckbrief`: `kern`, `erkennen`, `tun`, `vermeiden`, `ns`
- `sh`: **Overlay für das Regelwerk Schleswig-Holstein** – `regional`, `quelle`, `steckbrief.*`, `phasen.P.aktionen.<id>` / `eigene.<id>` / `fragen.<index>` ersetzen das Element komplett (`null` = entfernen), `eigeneNeu`, `fragenNeu`, `ohneAlg: true` (SH hat keinen eigenen Algorithmus)
- Nicht bewertete Katalog-Maßnahmen bewertet `autoRate()` in app.js aus den Vitalwerten (Untersuchung / Vertretbar / Nicht sinnvoll / Gefährlich). Passt das nicht, die Maßnahme im Fall explizit bewerten.

## Wissen-Datenmodell (content/wissen)
`kategorie`, `titel`, `kern`, `punkte[]`, `merke`, `tags[]`, `quelle`, `rolle` (ns), `regional`, `sh` (überlagert titel/kern/punkte/merke/quelle), `nurRegion` (sh|saa)

## Regeln für Inhalte (wichtig)
- Medizinische Aussagen nur aus den Quellen in `docs/` (SH-Handlungsempfehlungen V10.0, SAA/BPR 2025) – mit Seitenangabe in `quelle`. Nichts erfinden; bei Unsicherheit nachfragen.
- Standard-Regelwerk ist SH. SAA/BPR bleibt als Vergleich (Felix erwägt einen Wechsel nach Niedersachsen).
- „Nach lokalem Protokoll“ in SH als solches benennen, nicht mit Zahlen füllen, die die Quelle nicht nennt.
- Im laufenden Einsatz nichts verraten: keine Begründungen, keine Diagnose im Titel, keine Zählungen von Pflichtmaßnahmen. Begründungen erscheinen erst in der Auswertung.
- Wenig Fließtext, kurze Sätze, Bildhaftes bevorzugen (ADHS-tauglich). Gamification-Belohnungen sofort sichtbar.
- Nach jeder Inhaltsänderung: `npm test` muss grün sein.

## Nächste Ausbaustufen (Ideen)
- Backend für Login, Fortschritt über Geräte und Bearbeiten im Browser (Supabase; nur `src/store.js` + Auth-UI)
- Niedersachsen (NUN) als drittes Regelwerk
- Reanimation als eigene Mechanik, Spaced Repetition, Bilder in Wissenseinträgen
