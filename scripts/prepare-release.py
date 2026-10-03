"""Regenerate public deployment artifacts locally; no upload or network access."""
from pathlib import Path
import hashlib
import json
import runpy


def prepare(root):
    root = Path(root).resolve()
    if (root / '.openai').exists():
        raise ValueError('Utiliser ce script dans le dépôt public ; exporter séparément le checkout Sites historique.')
    dist = root / 'dist'
    if not (dist / 'index.html').is_file() or not (root / 'THIRD_PARTY_NOTICES.md').is_file():
        raise ValueError('Racine du dépôt public Valmont introuvable.')
    assets = sorted(p for p in dist.rglob('*') if p.is_file() and p.name != 'sw.js')
    digest = hashlib.sha256()
    for path in assets:
        digest.update(path.relative_to(root).as_posix().encode())
        digest.update(path.read_bytes())
    template = (root / 'scripts/sw.js.template').read_text(encoding='utf8')
    if template.count('@@HASH@@') != 1 or template.count('@@FILES@@') != 1:
        raise ValueError('Le modèle du service worker a changé ; réexaminer sa génération.')
    cache_version = digest.hexdigest()[:16]
    worker = template.replace('@@HASH@@', cache_version).replace('@@FILES@@', json.dumps(
        ['./'] + ['./' + p.relative_to(dist).as_posix() for p in assets]))
    (dist / 'sw.js').write_text(worker, encoding='utf8')
    runpy.run_path(str(root / 'scripts/build-standalone.py'))['build'](root)

    # Include public project files, never Git internals, local outputs or environment files.
    excluded = {'.git', '.openai', 'outputs', 'node_modules', '__pycache__', '.DS_Store'}
    candidates = [p for folder in ['dist', 'scripts', 'tests', '.github']
                  for p in (root / folder).rglob('*') if p.is_file()]
    candidates.extend(p for p in root.iterdir() if p.is_file() and (
        p.suffix in {'.md', '.json', '.html'} or p.name in {'.gitignore', '.nvmrc', 'LICENSE', 'LICENSE-MIT.proposed'}))
    public_files = [p for p in candidates if p.name != 'RELEASE-MANIFEST.json'
                    and not any(part in excluded or part.startswith('.env') for part in p.relative_to(root).parts)
                    and p.suffix != '.pyc']
    manifest = {
        'status': 'ready-for-publication' if (root / 'LICENSE').exists() else 'awaiting-license',
        'files': {p.relative_to(root).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
                  for p in sorted(public_files)},
    }
    (root / 'RELEASE-MANIFEST.json').write_text(
        json.dumps(manifest, indent=2) + '\n', encoding='utf8')
    print(f'Cache public : {cache_version} ; manifeste : {len(public_files)} fichiers. Aucun fichier envoyé en ligne.')


if __name__ == '__main__':
    prepare(Path(__file__).resolve().parents[1])
