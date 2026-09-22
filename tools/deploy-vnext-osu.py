#!/usr/bin/env python3
"""Install only the pinned vNext overlay on Joshua Randall's existing OSU website."""
from pathlib import Path
import argparse
import datetime
import hashlib
import os
import shutil
import stat
import subprocess
import sys
import tarfile
import tempfile
import zipfile

COMMIT = '656151a6bdcd5498c2bcb4d3e85667d8fe5831f4'
FILENAME = 'Joshua_Randall_Portfolio_vNext_Foundations_RC_20260922.zip'
URL = 'https://raw.githubusercontent.com/joshprandall/engineering-portfolio/' + COMMIT + '/release-upload/' + FILENAME
EXPECTED_SHA = '23ea365a6a1cd446ac490ac5d1f129103d07e60878d12bcdbce5775c9b4deef7'
REQUIRED = (
    'index.html', 'projects.html', 'app.js', 'styles.css', 'knowledge.js',
    'knowledge-data.js', 'knowledge.css', 'site-resilience.js',
    'site-resilience.css', 'games/3d-battle-chess/index.html',
    'games/3d-battle-chess/engine.js', 'games/3d-battle-chess/boot.js',
    'games/evil-wizard/index.html', 'assets/fusion-presentation.mp4',
)

def fail(message):
    raise RuntimeError(message)

def install(site, source_zip=None):
    site = site.expanduser().resolve()
    if site.name != 'public_html' or not site.is_dir() or site.is_symlink():
        fail('Unexpected website directory: ' + str(site))
    for name in REQUIRED:
        if not (site/name).is_file():
            fail('Live-only or required site file is missing: ' + name + '. Nothing changed.')
    with tempfile.TemporaryDirectory(prefix='portfolio-vnext-', dir=site.parent) as temp:
        archive = Path(temp)/FILENAME
        if source_zip:
            shutil.copyfile(source_zip, archive)
        else:
            print('Downloading pinned GitHub release…', flush=True)
            subprocess.run(['curl', '--fail', '--location', '--silent', '--show-error',
                            '--retry', '2', '--max-time', '120', URL, '--output', str(archive)], check=True)
        digest = hashlib.sha256(archive.read_bytes()).hexdigest()
        if digest != EXPECTED_SHA:
            fail('ZIP checksum mismatch. No website files changed.')
        with zipfile.ZipFile(archive) as z:
            names = z.namelist()
            if len(names) != 29 or len(names) != len(set(names)) or z.testzip() is not None:
                fail('ZIP integrity/manifest check failed; no website files changed.')
            files = {}
            for info in z.infolist():
                name = info.filename
                path = Path(name)
                mode = (info.external_attr >> 16)
                if (path.is_absolute() or len(path.parts) < 1 or '..' in path.parts
                    or '\\' in name or stat.S_ISLNK(mode) or name.endswith('/')):
                    fail('Unsafe release path ' + name)
                if name.startswith('games/') or name.startswith('assets/') and name != 'assets/quantum-lab-reference.jpg':
                    fail('Release attempts to replace game or protected asset: ' + name)
                target = site/path
                if any(p.is_symlink() for p in (target, *target.parents) if p != site.parent and p != site.parent.parent):
                    fail('Symlink target blocked: ' + name)
                files[name] = z.read(info)
        for name in ('index.html','projects.html','knowledge.js','portfolio-next.js','learning-next.js','learning-capstones.js', 'learning-capstones.json'):
            if name not in files: fail('Missing essential vNext file: '+name)
        # A file that the vNext page expects must already exist on the host or arrive in the overlay.
        from html.parser import HTMLParser
        from urllib.parse import urlsplit, unquote
        class References(HTMLParser):
            def __init__(self): super().__init__(); self.refs=[]
            def handle_starttag(self, tag, attrs):
                a=dict(attrs)
                if tag=='script' and a.get('src'): self.refs.append(a['src'])
                if tag=='link' and a.get('rel')=='stylesheet' and a.get('href'): self.refs.append(a['href'])
        for name, data in files.items():
            if not name.endswith('.html'): continue
            parser=References();parser.feed(data.decode('utf-8'))
            for ref in parser.refs:
                if ref.startswith(('http:', 'https:', '//')): continue
                path=unquote(urlsplit(ref).path)
                resolved=(Path(name).parent / path).as_posix()
                if resolved not in files and not (site/resolved).is_file():
                    fail(f'{name} refers to absent required script/style: {resolved}')
        backup = site.parent / ('public_html-before-vnext-' + datetime.datetime.now().strftime('%Y%m%d-%H%M%S') + '.tar.gz')
        print('Verified release: 29 files. Backing up entire live website…',flush=True)
        part=Path(str(backup)+'.part')
        try:
            with tarfile.open(part, 'w:gz') as tar: tar.add(site,arcname='public_html',recursive=True)
            if part.stat().st_size < 1024: fail('Backup archive unexpectedly small')
            part.replace(backup)
        finally:
            if part.exists(): part.unlink()
        print('BACKUP:',backup,flush=True)
        previous={}
        installed=[]
        try:
            # Keep the homepage unchanged until supporting files and all project pages are in place.
            ordered=sorted(files, key=lambda n:(n=='index.html',n=='projects.html',n))
            for name in ordered:
                dest=site/name
                if not dest.parent.exists(): dest.parent.mkdir(parents=True,mode=0o755)
                previous[name]=dest.read_bytes() if dest.is_file() else None
                fd,temporary=tempfile.mkstemp(prefix='.vnext-',dir=dest.parent)
                try:
                    with os.fdopen(fd,'wb') as stream: stream.write(files[name])
                    os.chmod(temporary,0o644)
                    os.replace(temporary,dest)
                    installed.append(name)
                finally:
                    if os.path.exists(temporary): os.unlink(temporary)
            os.chmod(site,0o755)
            for name in ('assets','games','games/3d-battle-chess'):
                folder=site/name
                if folder.is_dir(): os.chmod(folder,0o755)
            for name in installed:
                if (site/name).read_bytes()!=files[name]: fail('Post-install verification failed for '+name)
        except Exception:
            print('Install encountered an error; restoring overwritten files…',flush=True)
            for name in reversed(installed):
                dest=site/name
                original=previous[name]
                if original is None: dest.unlink(missing_ok=True); continue
                fd,temporary=tempfile.mkstemp(prefix='.rollback-',dir=dest.parent)
                with os.fdopen(fd,'wb') as stream: stream.write(original)
                os.chmod(temporary,0o644)
                os.replace(temporary,dest)
            raise
        for name in ('games/evil-wizard/index.html','assets/fusion-presentation.mp4','games/3d-battle-chess/boot.js'):
            if not (site/name).is_file(): fail('Preservation check failed: '+name)
        print('VNEXT DEPLOYED: 29 files; Evil Wizard, fusion video, and Battle Chess preserved.',flush=True)
        print('ROLLBACK BACKUP:',backup,flush=True)
        print('Open https://web.engr.oregonstate.edu/~randjosh/ and test the menu, cards, labs and chess.',flush=True)

if __name__=='__main__':
    a=argparse.ArgumentParser()
    a.add_argument('--site',type=Path,default=Path.home()/'public_html')
    a.add_argument('--zip',type=Path,default=None,help='Offline test mode: use this exact release ZIP')
    args=a.parse_args()
    try: install(args.site,args.zip)
    except Exception as exc:
        print('STOP:',str(exc),file=sys.stderr,flush=True)
        sys.exit(1)
