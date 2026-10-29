#!/usr/bin/env python3
"""Baut die veröffentlichbare App nach dist/.

- prüft alle Inhalte (scripts/check.py)
- bündelt content/faelle/*.json und content/wissen/*.json zu dist/data/faelle.json und dist/data/wissen.json
- kopiert index.html, src/ und public/ (Manifest, Icons, Service Worker)
- setzt im Service Worker eine Version aus dem Inhalts-Hash, damit Updates ankommen

Aufruf:  python3 scripts/build.py
Lokal ansehen:  python3 -m http.server 8000 -d dist   →  http://localhost:8000
"""
import hashlib, json, shutil, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / 'dist'
sys.path.insert(0, str(ROOT / 'scripts'))
import check  # noqa: E402


def bundle(name):
    docs = []
    for f in sorted((ROOT / 'content' / name).glob('*.json')):
        docs.append({'id': f.stem, 'data': json.loads(f.read_text(encoding='utf-8'))})
    return docs


def main():
    errors = check.run()
    if errors:
        print('\n'.join(errors)); print(f'\n{len(errors)} Fehler – Build abgebrochen.'); sys.exit(1)
    if DIST.exists():
        shutil.rmtree(DIST)
    (DIST / 'data').mkdir(parents=True)
    shutil.copy(ROOT / 'index.html', DIST / 'index.html')
    shutil.copytree(ROOT / 'src', DIST / 'src')
    for item in (ROOT / 'public').iterdir():
        if item.is_dir():
            shutil.copytree(item, DIST / item.name)
        else:
            shutil.copy(item, DIST / item.name)
    counts = {}
    for name in ('faelle', 'wissen'):
        docs = bundle(name); counts[name] = len(docs)
        (DIST / 'data' / f'{name}.json').write_text(json.dumps(docs, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    h = hashlib.sha256()
    for f in sorted(DIST.rglob('*')):
        if f.is_file() and f.name != 'sw.js':
            h.update(f.read_bytes())
    version = h.hexdigest()[:12]
    sw = DIST / 'sw.js'
    sw.write_text(sw.read_text(encoding='utf-8').replace('__VERSION__', version), encoding='utf-8')
    (DIST / '.nojekyll').write_text('')
    print(f"dist/ gebaut · Version {version} · {counts['faelle']} Fälle · {counts['wissen']} Wissenseinträge")


if __name__ == '__main__':
    main()
