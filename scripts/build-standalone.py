"""Embed the reviewed game in one HTML file, using native browser import maps."""
from pathlib import Path
import base64
import json
import re

IMPORT = re.compile(r'''/\*[\s\S]*?\*/|//[^\n]*|(?P<prefix>\b(?:from|import)\s*)(?P<quote>['"])(?P<specifier>[^'"\n]+)(?P=quote)''')


def build(root):
    root = Path(root).resolve()
    dist = root / 'dist'
    modules = {}

    def data_uri(content, mime):
        return 'data:' + mime + ';base64,' + base64.b64encode(content).decode('ascii')

    def embed(path):
        path = path.resolve()
        name = path.relative_to(dist).as_posix()
        key = 'valmont/' + name
        if key in modules:
            return key
        modules[key] = None  # Cyclic imports keep the native module semantics.
        source = path.read_text(encoding='utf8')
        if name == 'audio.js':
            count = 0
            def audio(match):
                nonlocal count
                count += 1
                asset = dist / match[1]
                mime = 'audio/wav' if asset.suffix == '.wav' else 'audio/mpeg'
                return json.dumps(data_uri(asset.read_bytes(), mime))
            source = re.sub(r"new URL\('\./(bipeur\.mp3|deux-tons\.mp3)',import\.meta\.url\)", audio, source)
            if count != 3:
                raise ValueError('Les références audio ont changé : réexaminer le fichier autonome.')
        if name == 'scene.js':
            worker = "if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});"
            if source.count(worker) != 1:
                raise ValueError('Le lancement du jeu a changé : réexaminer le fichier autonome.')
            source = source.replace(worker, '// All resources are embedded; no service worker is needed.')

        def imported(match):
            if match['prefix'] is None:
                return match[0]  # Preserve comments, including Three.js examples and notices.
            specifier = match['specifier']
            if specifier == 'three':
                target = dist / 'vendor' / 'three.module.js'
            elif specifier.startswith('.'):
                target = path.parent / specifier
            else:
                raise ValueError('Import non pris en charge : ' + specifier)
            return match['prefix'] + match['quote'] + embed(target) + match['quote']

        source = IMPORT.sub(imported, source)
        modules[key] = data_uri(source.encode('utf8'), 'text/javascript')
        return key

    entry = embed(dist / 'scene.js')
    html = (dist / 'index.html').read_text(encoding='utf8')

    def stylesheet(match):
        css = (dist / match[1]).read_text(encoding='utf8')
        # Fonts may load when online; keep readable local fallbacks when offline.
        css = css.replace("'Barlow Condensed'", "'Barlow Condensed','Arial Narrow',Arial,sans-serif")
        css = css.replace("'IBM Plex Mono'", "'IBM Plex Mono',monospace")
        return '<style>' + css.replace('</style', '<\\/style') + '</style>'

    html, count = re.subn(r'<link rel="stylesheet" href="([^"]+)">', stylesheet, html)
    if count != 4:
        raise ValueError('Les styles ont changé : réexaminer le fichier autonome.')
    importmap = json.dumps({'imports':modules}, separators=(',', ':')).replace('<', '\\u003c')
    html, count = re.subn(r'<script type="importmap">.*?</script>', lambda _: '<script type="importmap">' + importmap + '</script>', html, flags=re.S)
    if count != 1:
        raise ValueError('Import map absente ou dupliquée.')
    original = '<script type="module" src="scene.js"></script>'
    if html.count(original) != 1:
        raise ValueError('Point de démarrage absent ou dupliqué.')
    html = html.replace(original, '<script type="module">import ' + json.dumps(entry) + ';</script>')
    notices = {'credits':(root / 'THIRD_PARTY_NOTICES.md').read_text(), 'threeLicense':(dist / 'vendor/LICENSE').read_text()}
    if (root / 'LICENSE').exists():
        notices['projectLicense'] = (root / 'LICENSE').read_text()
    else:
        notices['projectLicense'] = 'Choix de licence du projet en attente. Copie locale de préparation.'
    legal = json.dumps(notices, ensure_ascii=False).replace('<', '\\u003c')
    html = html.replace('</body>', '<script type="application/json" id="valmont-credits">' + legal + '</script></body>')
    target = root / 'Jouer-Valmont.html'
    target.write_text(html, encoding='utf8')
    print(f'HTML autonome : {len(modules)} modules et sons intégrés, {target.stat().st_size / 1024**2:.1f} Mo')


if __name__ == '__main__':
    build(Path(__file__).resolve().parents[1])
