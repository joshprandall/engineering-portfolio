"""Read-only architecture inventory of an exact restored runtime.

HTML references and file hashes are exact. JavaScript/CSS signal extraction is
lexical, not a complete parser or proof of runtime reachability. No site files
are rewritten and no browser, network, or deployment action is performed.
"""
import argparse
import ast
import collections
import hashlib
import json
import pathlib
import posixpath
import re
import subprocess
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit

ROOT = pathlib.Path(__file__).resolve().parents[1]


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.scripts, self.styles, self.ids = [], [], []
        self.inline_scripts = self.inline_styles = 0
        self.body = {}

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'body':
            self.body = a
        if a.get('id'):
            self.ids.append(a['id'])
        if tag == 'script':
            if a.get('src'):
                self.scripts.append(a['src'])
            elif a.get('type', '').lower() not in ('application/ld+json', 'application/json'):
                self.inline_scripts += 1
        if tag == 'link' and 'stylesheet' in a.get('rel', '').split():
            self.styles.append(a.get('href', ''))
        if tag == 'style':
            self.inline_styles += 1


def local_ref(page, reference):
    url = urlsplit(reference)
    if url.scheme or reference.startswith('//') or not url.path:
        return None
    return posixpath.normpath(posixpath.join(posixpath.dirname(page), unquote(url.path))).lstrip('/')


def matches(pattern, text):
    return sorted(set(re.findall(pattern, text)))


def inventory(runtime):
    manifest = json.loads((ROOT / 'manifests/runtime-files.json').read_text())
    ambience = json.loads((ROOT / 'manifests/ambience.json').read_text())
    files = manifest['files']
    pages, scripts, styles = [], [], []
    consumers = collections.defaultdict(list)
    for row in files:
        name = row['path']
        if pathlib.Path(name).suffix not in ('.html', '.js', '.css'):
            continue
        data = (runtime / name).read_bytes()
        if len(data) != row['size'] or hashlib.sha256(data).hexdigest() != row['sha256']:
            raise ValueError('Runtime does not match reviewed manifest: ' + name)
        text = data.decode('utf-8')
        base = {'path': name, 'bytes': len(data), 'lines': len(text.splitlines())}
        if name.endswith('.html'):
            page = Page()
            page.feed(text)
            script_paths = [local_ref(name, s) for s in page.scripts]
            style_paths = [local_ref(name, s) for s in page.styles]
            for target in filter(None, script_paths + style_paths):
                consumers[target].append(name)
            pages.append({**base, 'scripts': page.scripts, 'styles': page.styles,
                          'localScripts': list(filter(None, script_paths)),
                          'localStyles': list(filter(None, style_paths)),
                          'inlineScriptBlocks': page.inline_scripts,
                          'inlineStyleBlocks': page.inline_styles,
                          'bodyAttributes': page.body,
                          'duplicateIds': [k for k, v in collections.Counter(page.ids).items() if v > 1]})
        elif name.endswith('.js'):
            scripts.append({**base,
                'globalProperties': matches(r'\bwindow\.([A-Za-z_$][\w$]*)', text),
                'eventSubscriptions': matches(r'\baddEventListener\(\s*[\'\"]([^\'\"]+)', text),
                'customEventNames': matches(r'\bCustomEvent\(\s*[\'\"]([^\'\"]+)', text),
                'preferenceKeyStrings': matches(r'[\'\"]((?:jr-|portfolio-)[A-Za-z\d_.:-]+)', text),
                'moduleImports': matches(r'\b(?:from\s*|import\s*\(?\s*)[\'\"]([^\'\"]+)', text),
                'dynamicLocalCodeStrings': matches(r'[\'\"]([\w./-]+\.(?:js|css)(?:\?[^\'\"]*)?)[\'\"]', text),
                'functionNames': matches(r'\bfunction\s+([A-Za-z_$][\w$]*)\s*\(', text),
                'signalCounts': {signal: len(re.findall(pattern, text)) for signal, pattern in {
                    'globalDocumentQueries': r'\bdocument\.querySelector(?:All)?\(',
                    'localStorageAccess': r'\blocalStorage\.',
                    'animationFrameCalls': r'\brequestAnimationFrame\(',
                    'mutationObservers': r'\bnew MutationObserver\(',
                    'resizeObservers': r'\bnew ResizeObserver\(',
                    'directAudioCreation': r'\bnew (?:Audio|AudioContext)\(',
                }.items()}})
        else:
            clean = re.sub(r'/\*.*?\*/', '', text, flags=re.S)
            selectors = [re.sub(r'\s+', ' ', m[0]).strip() for m in re.findall(r'([^{}]+)\{([^{}]*)\}', clean)]
            styles.append({**base,
                'importantTokens': len(re.findall(r'!\s*important\b', clean)),
                'rulePreludeCount': len(selectors),
                'themeSelectorMentions': sum('data-theme' in s for s in selectors),
                'backgroundSelectorMentions': sum(bool(re.search(r'(?:\.scene-|#site-scene|\.living-scenes)', s)) for s in selectors),
                'headerSelectorMentions': sum(bool(re.search(r'(?:header|#primary-nav|\.tools|\.header-tools)', s)) for s in selectors),
                'componentMentions': {label: sum(token in s for s in selectors) for label, token in {
                    'volume': '.scene-sound', 'portrait': '.portrait', 'projectCards': '.project-card',
                    'learningCards': '.lesson-card', 'solar': '.solar',
                }.items()},
                'declaredCustomProperties': matches(r'(--[\w-]+)\s*:', clean)})
    for item in scripts + styles:
        item['directHtmlConsumers'] = consumers[item['path']]
        item['directHtmlConsumerCount'] = len(item['directHtmlConsumers'])
    scene_pages = [p for p in pages if 'site-scenes.js' in p['localScripts']]
    outside_contract = []
    for page in scene_pages:
        if page['path'] not in ambience['pages']:
            outside_contract.append({'path': page['path'], 'sharedReferences': [
                ref for ref in page['scripts'] + page['styles']
                if local_ref(page['path'], ref) in {
                    'site-theme.js', 'site-scenes.js', 'site-audio.js',
                    'site-sound-control.js', 'site-scenes.css', 'site-responsive.css'
                }]})
    source_tools, invalid_tools = [], []
    tracked_python = subprocess.check_output(['git', 'ls-files', '--', 'tools/*.py'], cwd=ROOT, text=True).splitlines()
    for name in sorted(tracked_python):
        file = ROOT / name
        source_tools.append(name)
        try:
            ast.parse(file.read_text())
        except SyntaxError as error:
            invalid_tools.append({'path': name, 'line': error.lineno, 'error': error.msg})
    return {
        'scope': 'Exact runtime HTML/JS/CSS plus source Python tooling; signals require manual interpretation.',
        'sourceCommit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
        'runtimeApplicationCommit': manifest['sourceCommit'],
        'summary': {'runtimeFiles': len(files), 'htmlPages': len(pages), 'javascriptFiles': len(scripts),
                    'stylesheets': len(styles), 'sharedPages': len(ambience['pages']),
                    'runtimeBytes': sum(f['size'] for f in files),
                    'pythonToolsChecked': len(source_tools), 'invalidPythonTools': invalid_tools},
        'ambienceCoverage': {'contractVersion': ambience['version'],
                             'directSceneConsumerCount': len(scene_pages),
                             'sceneConsumersOutsideContract': outside_contract},
        'pages': pages, 'scripts': scripts, 'styles': styles,
        'limitations': ['Does not execute page behavior.', 'Dynamic imports/concatenated references can escape lexical extraction.',
                       'Counts identify coupling candidates, not automatically bugs.', 'Generated game exports are inventoried, not recommended for manual splitting.'],
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--runtime', type=pathlib.Path, default=ROOT / 'staging/website-2.0-runtime')
    parser.add_argument('--output', type=pathlib.Path, default=ROOT / 'docs/modularity-evidence/inventory.json')
    args = parser.parse_args()
    report = inventory(args.runtime)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report['summary']))
