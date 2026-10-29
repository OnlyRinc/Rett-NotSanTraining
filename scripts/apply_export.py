#!/usr/bin/env python3
"""Übernimmt eine aus der App exportierte Änderungsdatei (Bearbeitungsmodus → Exportieren) in content/.

Aufruf:  python3 scripts/apply_export.py ~/Downloads/wachenalarm-aenderungen-2026-10-29.json

Für jede Sammlung (faelle, wissen) wird ein Eintrag geschrieben oder – bei null – gelöscht.
Danach prüft das Skript die Inhalte. Änderungen anschließend mit git ansehen und committen.
"""
import json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / 'scripts'))
import check  # noqa: E402

if len(sys.argv) != 2:
    print(__doc__); sys.exit(1)
data = json.loads(Path(sys.argv[1]).read_text(encoding='utf-8'))
n = 0
for col in ('faelle', 'wissen'):
    for doc_id, doc in (data.get(col) or {}).items():
        if not re.fullmatch(r'[a-z0-9][a-z0-9\-]{0,80}', doc_id):
            print(f'Übersprungen, ungültige ID: {col}/{doc_id}'); continue
        path = ROOT / 'content' / col / f'{doc_id}.json'
        if doc is None:
            if path.exists(): path.unlink(); print(f'gelöscht  {col}/{doc_id}'); n += 1
        else:
            doc.pop('aktualisiert', None)
            path.write_text(json.dumps(doc, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
            print(f'geschrieben {col}/{doc_id}'); n += 1
print(f'{n} Änderungen übernommen.')
errors = check.run()
print('\n'.join(errors) if errors else 'Prüfung: alles in Ordnung.')
sys.exit(1 if errors else 0)
