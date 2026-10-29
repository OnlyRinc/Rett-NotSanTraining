#!/usr/bin/env python3
"""Prüft die Inhalte in content/ auf Aufbaufehler, bevor sie veröffentlicht werden.

Geprüft wird u. a.: gültiges JSON, Pflichtfelder, bekannte Bewertungstypen, Fragen mit richtiger
und falscher Antwort, Begründung bei falschen/gefährlichen Maßnahmen, Medikamenten-Zuordnung
(Wirkstoff aus dem Katalog in src/app.js) und der Aufbau des SH-Overlays.

Aufruf:  python3 scripts/check.py
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TYPES = {'pflicht', 'sinnvoll', 'falsch', 'gefahr', 'abbruch', 'neutral'}
BAD = {'falsch', 'gefahr', 'abbruch'}
PH = ['x', 'A', 'B', 'C', 'D', 'E']
WCATS = {'Leitsymptome', 'Krankheitsbilder', 'Schemata', 'Anatomie', 'Physiologie', 'Pharmakologie', 'Normwerte', 'Sonstiges'}


def katalog():
    """Maßnahmen-IDs je Phase und Wirkstoffe aus src/app.js lesen."""
    js = (ROOT / 'src' / 'app.js').read_text(encoding='utf-8')
    cat = {}
    m = re.search(r'const CAT=\{(.*?)\n\};', js, re.S)
    for line in m.group(1).split('\n'):
        mm = re.match(r"\s*([xABCDE]):\[(.*)\],?$", line.strip())
        if mm:
            cat[mm.group(1)] = set(re.findall(r"\['([a-z0-9_]+)'", mm.group(2)))
    meds = set(re.findall(r"^ ([a-z]+):\{n:", re.search(r'const MEDCAT=\{(.*?)\n\};', js, re.S).group(1), re.M))
    return cat, meds


def check_aktion(err, where, a, cat_ids=None, key=None):
    if not isinstance(a, dict):
        err.append(f'{where}: kein Objekt'); return
    if a.get('typ') and a['typ'] not in TYPES:
        err.append(f"{where}: unbekannter typ '{a['typ']}'")
    if a.get('typ') in BAD and not str(a.get('warum', '')).strip():
        err.append(f'{where}: Begründung (warum) fehlt bei {a["typ"]}')
    if cat_ids is not None and key not in cat_ids:
        err.append(f"{where}: '{key}' ist keine Katalog-Maßnahme dieser Phase")


def check_frage(err, where, f):
    if not str(f.get('frage', '')).strip(): err.append(f'{where}: Frage fehlt')
    if not str((f.get('richtig') or {}).get('text', '')).strip(): err.append(f'{where}: richtige Antwort fehlt')
    if not [x for x in f.get('falsch', []) if str(x.get('text', '')).strip()]: err.append(f'{where}: falsche Antwort fehlt')


def check_mittel(err, where, e, meds):
    if not e.get('med'): return
    mi = e.get('mittel')
    if not mi:
        err.append(f'{where}: Medikament ohne Zuordnung (mittel) – in der Einsatzauswahl nicht wählbar'); return
    for m in mi:
        if m.get('w') not in meds: err.append(f"{where}: Wirkstoff '{m.get('w')}' fehlt im Katalog MEDCAT")
        if not str(m.get('d', '')).strip(): err.append(f'{where}: Dosis fehlt')


def run():
    err = []
    cat, meds = katalog()
    if len(cat) != 6 or not meds:
        return ['src/app.js: Maßnahmen-Katalog (CAT) oder Medikamenten-Katalog (MEDCAT) nicht lesbar']
    for f in sorted((ROOT / 'content' / 'faelle').glob('*.json')):
        n = f'faelle/{f.name}'
        try:
            d = json.loads(f.read_text(encoding='utf-8'))
        except Exception as e:
            err.append(f'{n}: kein gültiges JSON ({e})'); continue
        for k in ('titel', 'stichwort', 'patient', 'phasen'):
            if not d.get(k): err.append(f'{n}: Feld {k} fehlt')
        for p, P in (d.get('phasen') or {}).items():
            if p not in PH: err.append(f'{n}: unbekannte Phase {p}'); continue
            for k, a in (P.get('aktionen') or {}).items(): check_aktion(err, f'{n} {p}.{k}', a, cat[p], k)
            for e in P.get('eigene') or []:
                check_aktion(err, f"{n} {p}.eigene.{e.get('id')}", e)
                check_mittel(err, f"{n} {p}.eigene.{e.get('id')}", e, meds)
            for i, q in enumerate(P.get('fragen') or []): check_frage(err, f'{n} {p}.frage{i}', q)
        sh = d.get('sh')
        if sh is not None:
            if not isinstance(sh, dict): err.append(f'{n}: sh ist kein Objekt'); continue
            for p, sp in (sh.get('phasen') or {}).items():
                if p not in PH: err.append(f'{n}: sh unbekannte Phase {p}'); continue
                ids = {e.get('id') for e in d['phasen'].get(p, {}).get('eigene', [])}
                nfr = len(d['phasen'].get(p, {}).get('fragen', []))
                for k, a in (sp.get('aktionen') or {}).items():
                    if a is not None: check_aktion(err, f'{n} sh {p}.{k}', a, cat[p], k)
                for k, e in (sp.get('eigene') or {}).items():
                    if k not in ids: err.append(f"{n} sh {p}.eigene.{k}: id gibt es im Basisfall nicht")
                    elif e is not None:
                        check_aktion(err, f'{n} sh {p}.eigene.{k}', e); check_mittel(err, f'{n} sh {p}.eigene.{k}', e, meds)
                for k, q in (sp.get('fragen') or {}).items():
                    if not k.isdigit() or int(k) >= nfr: err.append(f'{n} sh {p}.fragen.{k}: Frage gibt es im Basisfall nicht')
                    elif q is not None: check_frage(err, f'{n} sh {p}.frage{k}', q)
    for f in sorted((ROOT / 'content' / 'wissen').glob('*.json')):
        n = f'wissen/{f.name}'
        try:
            d = json.loads(f.read_text(encoding='utf-8'))
        except Exception as e:
            err.append(f'{n}: kein gültiges JSON ({e})'); continue
        if not d.get('titel'): err.append(f'{n}: Titel fehlt')
        if d.get('kategorie') not in WCATS: err.append(f"{n}: unbekannte Kategorie '{d.get('kategorie')}'")
        if d.get('nurRegion') not in (None, '', 'sh', 'saa'): err.append(f'{n}: nurRegion muss sh oder saa sein')
    return err


if __name__ == '__main__':
    e = run()
    print('\n'.join(e) if e else 'Alle Inhalte in Ordnung.')
    sys.exit(1 if e else 0)
