# Wachenalarm – Konzeptstand (27.10.2026)

## Core Loop
Alarm → Einsatz (xABCDE, Maßnahmen selbst wählen) → Belohnung (XP, Münzen, seltene Funde, Steckbrief, Musterlösung) → Wache ausbauen

## App-Aufbau (drei Bereiche, Tabbar unten)
1. **Wache** – Rollenwahl RS/NotSan, Regelwerk SH/SAA, isometrische Wache mit drei Etagen, Alarm-Button, Steckbriefe
2. **Fälle** – Fallbibliothek aus der Datenbank (Rollen- und Regelwerk-Umschalter): fahren, Musterlösung, bearbeiten, neu anlegen, JSON-Import
3. **Wissen** – interaktive Module + pflegbare Nachschlage-Einträge mit Suche, Kategorien, Badges „NotSan“, „SH“ und „Regional“

## Regelwerk-Umschalter SH / SAA-BPR (seit 27.10.2026)
- Standard: **SH** = Handlungsempfehlungen für den RD in Schleswig-Holstein, V10.0, Stand 15.07.2025. Alternative: **SAA/BPR 2025** (ÄLRD BW, BB, MV, NRW, SN, ST) – bleibt wegen möglichem Wechsel nach Niedersachsen/Braunschweig als Vergleich erhalten
- Gespeichert im Browser (`S.region`), Umschalter auf Wache, Fälle und Wissen
- Datenmodell Fall: Basisinhalt = SAA/BPR; Feld `sh` ist ein Overlay: `regional`, `quelle`, `steckbrief.*`, `phasen.{x–E}.aktionen` (nach Katalog-ID), `eigene` (nach id), `fragen` (nach Index), optional `eigeneNeu`, `fragenNeu`, `null` = entfernen; `ohneAlg: true` = in SH kein eigener Algorithmus (Badge „SH: SAA-Basis“)
- Ersetzte Elemente tragen in der App das Badge „SH“; Medikamentengruppe heißt „Medikamente nach SH-Handlungsempfehlungen“
- Datenmodell Wissen: `sh` überlagert titel/kern/punkte/merke/quelle; `nurRegion: "sh"|"saa"`
- Editoren: Fall-Editor mit Feld „SH-Overlay (JSON)“, Wissen-Editor mit „Regelwerk“ und „Abweichung in SH (JSON)“
- Alle 29 Fälle haben ein SH-Overlay; 8 Fälle ohne SH-Algorithmus (Aorta, arterieller Verschluss, Dehydratation, Hyperglykämie, Hypothermie, Stromunfall, Synkope, Tracheostoma) plus Angioödem laufen in SH auf SAA-Basis mit Hinweis
- Wichtige SH-Unterschiede in den Fällen: Nitro beim Hinterwandinfarkt (1 Hub) erlaubt, Furosemid 40 mg, NIV PS 5, Glucose oral 20 g/i.v. 10 g und BZ-Kontrolle nach 3 Min, Adrenalin vernebelt 5 mg, Bradykardie Adrenalin 2–10 µg/min, Urapidil 5–10 mg bis 50 mg und max. 25 %, Genfer Score statt Wells/sPESI, Esketamin + Midazolam statt Fentanyl, Metamizol statt Paracetamol, Midazolam i.v. 5 mg, TXA 1 g über 10 Min, Sepsis qSOFA > 22 / < 100, NA bei kritischem ABCDE-Problem
- Wissen: 34 Einträge mit SH-Overlay, 4 nur SAA (Fentanyl, Ibuprofen, Lidocain, Nalbuphin), 13 neue SH-Einträge (Metamizol, Ondansetron, Clemastin, Lorazepam, Diazepam rektal, Genfer Score, SHIT, Beckenschlinge, Epistaxis, Neugeborenes, Immobilisation, Checkliste 39, RD in SH nach SHRDG-DVO)
- SH-Inhalte unabhängig gegen die Quelle geprüft; 23 Befunde (keiner kritisch) behoben
- Details der Quelle: `claude/sh-handlungsempfehlungen-2025-abgleich.md`

## Rollen RS / NotSan
- Umschalter „Ich übe als RS / NotSan“ (Home und Fälle), gespeichert im Browser
- RS sieht nur Basismaßnahmen; NotSan zusätzlich Katalog-Maßnahmen (EGA, CPAP/NIV, i.v., i.o., VEL, Glukose i.v.) und fallspezifische Medikamente
- Musterlösung für RS zeigt NotSan-Schritte als „Übernimmt NotSan oder NA“
- Felder je Maßnahme/Frage: `rolle` (rs|ns), `regional`, `med`; für RS-Abweichungen `typRS`, `warumRS`, `lwRS`
- Fall: `regional` (Hinweistext), `steckbrief.ns` (NotSan-Merkpunkte)

## Regional-Kennzeichnung
- Gelbes Badge „Regional“ / ⚑ an Maßnahmen, Fragen, Fällen, Wissen; im Regelwerk SH heißt der Fallhinweis „⚑ SH“
- Vieles in SH steht „nach lokalem Protokoll“ des Trägers – so in der App benannt
- Übersicht SAA/BPR: `claude/saa-bpr-2025-uebersicht.md`

## Einsatzablauf (realistisch)
- Pro Phase x, A, B, C, D, E: nur ein **erster Eindruck**
- Maßnahmen aus festem Katalog + fallspezifische eigene Maßnahmen; Ergebnis erst nach der Maßnahme
- Monitor startet leer; Rhythmen: Sinus, absolute Arrhythmie, ST-Hebung, AV-Block III°, Schmalkomplextachykardie
- Bewertung: Pflicht (+15 XP), sinnvoll (+5), falsch, gefährlich (STOPP, grober Fehler), Abbruch, lebenswichtig
- Entscheidungsfragen nach Maßnahme oder am Phasenende

## Maßnahmen-Katalog
- x: Bodycheck, Blutung abdrücken, Druckverband, Tourniquet, Beckenschlinge
- A: Ansprechen, Mundraum, Absaugen, Esmarch, Guedel, Wendl, HWS manuell, Zervikalstütze, EGA (NotSan)
- B: AF, SpO₂, Thorax ansehen, Abhören, Abtasten, O₂, Beutel-Masken-Beatmung, CPAP/NIV (NotSan)
- C: Puls, Haut, Rekap, RR, RR beidseits, EKG, 12-Kanal-EKG, i.v. / i.o. / VEL (NotSan), Beine hoch, Notarzt
- D: AVPU, GCS, Pupillen, BZ, BE-FAST, Motorik/Sensibilität, Glukose oral, Glukose i.v. (NotSan)
- E: Entkleiden, Temperatur, Wärmeerhalt, SAMPLER, OPQRST, OK hoch, SSL, flach, Zielklinik

## Datenbank (Artifact-db)
- Sammlungen `faelle` (29) und `wissen` (68); alle lesen, nur Owner/Editoren schreiben
- Fortschritt (XP, Münzen, Wache, Rolle, Regelwerk) liegt noch im Browser (localStorage)

## Tests
- Playwright spielt alle 29 Fälle in 2 Regelwerken × 2 Rollen (116 Durchläufe) fehlerfrei durch; keine JS-Fehler

## Bekannte Widersprüche in den Quellen (in der App gekennzeichnet)
- SAA vs. BPR: Midazolam-Repetition 1–4 J; Aorta-RR-Ziel; Glucose beim Schlaganfall 8–12 vs. 8–10 g
- SH: Amiodaron-Kurzinfusion Algorithmus „mind. 10 Min“ vs. Infotabelle „über 20 Min“

## Offen / Ideen
- Lokale Protokolle deines Trägers (Heparin, Metoprolol, Morphin, TXA, Glucagon) ergänzen, sobald verfügbar
- Niedersachsen (NUN-Algorithmen) als drittes Regelwerk, falls der Wechsel nach Braunschweig kommt
- Reanimation als eigene Mechanik (Zyklen, Zeitdruck)
- Fortschritt pro Nutzer in der Datenbank
- Eigene Figuren-Grafiken, Bilder in Wissenseinträgen
- Spaced Repetition
