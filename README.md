# Wachenalarm 🚑

Lern-App für Rettungssanitäter und Notfallsanitäter – Einsätze nach xABCDE fahren, Maßnahmen und Medikamente selbst wählen, die eigene Rettungswache ausbauen.

- **29 Einsätze** von ACS bis Verbrennung, jeweils mit Musterlösung und Steckbrief
- **Rollen:** RS (Basismaßnahmen) oder NotSan (zusätzlich invasive Maßnahmen und Medikamente)
- **Regelwerk umschaltbar:** Schleswig-Holstein (Handlungsempfehlungen V10.0, 15.07.2025) oder SAA/BPR 2025 (BW, BB, MV, NRW, SN, ST)
- **Wissen:** Medikamente, Schemata, Leitsymptome, interaktive Anatomie
- **Installierbar** auf dem Handy und offline nutzbar (PWA)

> Lernhilfe, eigene Aufbereitung. Verbindlich sind die Vorgaben deines Trägers bzw. ÄLRD.

## Loslegen

```bash
npm install                      # einmalig, für die Tests (Playwright)
npx playwright install chromium  # einmalig
npm start                        # baut dist/ und startet http://localhost:8000
npm test                         # spielt alle Fälle automatisch durch
```

Voraussetzungen: Python 3.10+ und Node.js 20+.

## Inhalte bearbeiten

Fälle und Wissen liegen als JSON in `content/`. Zwei Wege:

1. **Direkt im Repository** (z. B. mit Claude Code) – Aufbau siehe `CLAUDE.md`.
2. **Im Browser:** unten auf der Wache „Bearbeitungsmodus an“, Fälle/Einträge bearbeiten, dann „Exportieren“.
   Die Datei mit `python3 scripts/apply_export.py <datei>` übernehmen und committen.

Vor jedem Commit: `npm test`.

## Veröffentlichen

Jeder Push auf `main` prüft und baut die App und veröffentlicht `dist/` über GitHub Pages
(Workflow `.github/workflows/pages.yml`). Einmalig in GitHub: *Settings → Pages → Source: GitHub Actions*.

Hinweis: GitHub Pages für **private** Repositories braucht einen kostenpflichtigen GitHub-Plan.
Alternativ das Repository öffentlich machen oder `dist/` über Netlify oder Cloudflare Pages ausliefern.

## Quellen

- Handlungsempfehlungen für den Rettungsdienst in Schleswig-Holstein, V10.0, Stand 15.07.2025 (Träger des RD SH, UAG AK ÄLRD)
- Standardarbeitsanweisungen und Behandlungspfade im Rettungsdienst 2025, ÄLRD BW, BB, MV, NRW, SN, ST, Stand 30.04.2025
- SHRDG-DVO vom 27.11.2023

Zusammenfassungen der Quellen: `docs/`.
