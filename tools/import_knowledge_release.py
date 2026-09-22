#!/usr/bin/env python3
"""Import the checked v1.1.0 public site from a user-uploaded release ZIP.

Run from the engineering-portfolio repository root:
    python3 tools/import_knowledge_release.py release-upload/Joshua_Randall_Knowledge_Platform_v1.1.0_DEEP_LEARNING_EDITION.zip
"""
from __future__ import annotations
import csv
import io
import json
import re
import shutil
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GAME_ARTICLE = re.compile(r'<article\b(?=[^>]*\bid=["\']evil-wizard["\'])[^>]*>.*?</article>', re.S | re.I)


def add_once(text: str, anchor: str, insertion: str) -> str:
    if insertion in text:
        return text
    if anchor not in text:
        raise ValueError(f'Missing HTML integration anchor: {anchor}')
    return text.replace(anchor, insertion + anchor, 1)


def patch_page(name: str, text: str, old_projects: str) -> str:
    for wrong, right in {'Â·': '·', 'â†—': '↗', 'â†’': '→', 'â€“': '–', 'â€”': '—', 'â€™': '’'}.items():
        text = text.replace(wrong, right)
    if name not in ('index.html', 'projects.html'):
        return text
    text = re.sub(r'<header(?![^>]*\bclass=)([^>]*)>', r'<header class="site-header"\1>', text, count=1)
    text = text.replace('<nav aria-label="Primary">', '<nav id="primary-nav" aria-label="Primary">', 1)
    text = text.replace('id="menu"', 'id="menu" aria-controls="primary-nav"', 1)
    text = add_once(text, '<script src="app.js" defer></script>', '<script src="site-resilience.js" defer></script>')
    text = add_once(text, '<link rel="stylesheet" href="styles.css">', '<link rel="stylesheet" href="site-resilience.css">')
    if name == 'index.html':
        text = re.sub(r'(<div class="visual-top">.*?<span)(>\s*0[1-5] / 05\s*</span>)', r'\1 id="layer-count"\2', text, count=1, flags=re.S)
    else:
        saved = GAME_ARTICLE.search(old_projects)
        if saved and not GAME_ARTICLE.search(text):
            text = text.replace('<div class="project-grid">', '<div class="project-grid">' + saved.group(0), 1)
        cards = len(re.findall(r'<article class="project-card"', text))
        text = re.sub(r'(<span id="filter-count"[^>]*>)\d+ projects', rf'\g<1>{cards} projects', text, count=1)
    return text


def import_release(path: Path) -> dict:
    if not path.is_file():
        raise FileNotFoundError(path)
    live_projects = ROOT / 'release-upload' / 'live-projects.html'
    old_projects = live_projects.read_text(encoding='utf-8') if live_projects.exists() else ((ROOT / 'projects.html').read_text(encoding='utf-8') if (ROOT/'projects.html').exists() else '')
    with zipfile.ZipFile(path) as archive:
        if archive.testzip() is not None:
            raise ValueError('ZIP checksum failed')
        entries = {}
        manifest_rows = None
        for entry in archive.infolist():
            if entry.is_dir():
                continue
            name = entry.filename.replace('\\', '/')
            if '\x00' in name or name.startswith('/') or '..' in name.split('/'):
                raise ValueError(f'Unsafe archive path: {name}')
            if name.endswith('VERIFICATION_MANIFEST_v1.1.0.csv'):
                manifest_rows = sum(1 for _ in csv.DictReader(io.StringIO(archive.read(entry).decode('utf-8-sig'))))
            if '/public_html/' not in name:
                continue
            relative = name.split('/public_html/', 1)[1]
            if not relative or relative.startswith('.') or relative in ('app.js', 'styles.css'):
                continue
            if relative.startswith('assets/') or not relative.endswith(('.html', '.js', '.css', '.json', '.txt')):
                continue
            entries[relative] = archive.read(entry)
        required = {'index.html','projects.html','learn.html','knowledge-data.js','knowledge.js','knowledge.css','verification-manifest.json','deep-learning/index.json'}
        if not required.issubset(entries):
            raise ValueError(f'Missing release files: {sorted(required-entries.keys())}')
        if manifest_rows != 8000:
            raise ValueError(f'Expected 8000 verification rows, got {manifest_rows}')
        verification = json.loads(entries['verification-manifest.json'])
        if verification.get('count') != 8000 or len(verification.get('records', verification.get('objects', []))) != 8000:
            raise ValueError('Verification JSON does not have 8000 entries')
        json.loads(entries['deep-learning/index.json'])
        if live_projects.exists():
            if not GAME_ARTICLE.search(old_projects) or 'id="quantum"' not in old_projects or 'learn.html' not in old_projects:
                raise ValueError('Live projects file lacks game, qubit, or learning link; refusing regression')
            entries['projects.html'] = old_projects.encode('utf-8')
        for name in ('index.html','projects.html'):
            entries[name] = patch_page(name, entries[name].decode('utf-8'), old_projects).encode('utf-8')
        for name in ('index.html','projects.html'):
            source = entries[name].decode('utf-8')
            for ref in re.findall(r'<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"', source):
                if ref.startswith(('https://','http://','#','mailto:')):
                    continue
                target = ref.split('?',1)[0]
                if target not in entries and not (ROOT/target).exists() and target not in ('site-resilience.js', 'site-resilience.css'):
                    if target.startswith('assets/'):
                        continue  # Original OSU assets remain external to this source ZIP.
                    raise ValueError(f'Unresolved reference: {name} -> {target}')
        for relative, data in entries.items():
            target = ROOT / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(data)
        for filename in ('site-resilience.js','site-resilience.css'):
            shutil.copyfile(ROOT/'site-repair'/filename, ROOT/filename)
    report = {'verified_objects':manifest_rows,'imported_files':len(entries),'protected_files':['app.js','styles.css','assets/'],'game_card_preserved':bool(GAME_ARTICLE.search((ROOT/'projects.html').read_text(encoding='utf-8')))}
    (ROOT/'SITE_IMPORT_REPORT.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
    return report


if __name__ == '__main__':
    try:
        print(json.dumps(import_release(Path(sys.argv[1]).resolve()), indent=2))
    except (IndexError, OSError, ValueError, zipfile.BadZipFile) as exc:
        sys.exit(f'Import refused; existing site not intentionally removed: {exc}')
