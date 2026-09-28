#!/usr/bin/env python3
"""Deploy one exact tested commit with a full backup, byte checks and rollback."""
import argparse, datetime, hashlib, os, re, shutil, stat, tarfile, tempfile, time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from zipfile import ZipFile

PUBLIC_URL = 'https://web.engr.oregonstate.edu/~randjosh/'
DAY_MEDIA_SOURCES = {
    'assets/scenes/day/waterfall.mp4': 'https://www.pexels.com/download/video/7351460/',
    'assets/scenes/day/river.mp4': 'https://www.pexels.com/download/video/33886656/',
    'assets/scenes/day/beach-birds.mp4': 'https://www.pexels.com/download/video/9982425/',
}
DAY_AUDIO_SOURCES = {
    'assets/audio/day/waterfall.ogg': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Water%20fall.ogg',
    'assets/audio/day/river.ogg': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Sanna%20river%20rapids.ogg',
    'assets/audio/day/beach-near.ogg': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Cape%20May%20Shorebirds%20closer.ogg',
    'assets/audio/day/beach-far.ogg': 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Cape%20May%20Shorebirds%20%28distant%29.ogg',
}
WEB_DIRS = ('assets', 'deep-learning', 'labs', 'qubit-preview-20260921')
PROTECTED_ROOT_FILES = set()
PROTECTED_PREFIXES = ('games/', 'geometric-lab/')
THEME_SHELL_FILES = ('geometric-lab/index.html', 'geometric-lab/app.js')
PRESERVE_IF_PRESENT = ('assets/fusion-presentation.mp4',)
PROTECTED_REQUIRED = tuple(PROTECTED_ROOT_FILES) + (
    'games/3d-battle-chess/index.html', 'games/evil-wizard/index.html',
    'games/evil-wizard/play.html', 'geometric-lab/index.html',
)
REQUIRED = THEME_SHELL_FILES + (
    'site-theme.js', 'site-scenes.js', 'site-audio.js', 'site-sound-control.js', 'site-scenes.css',
    'assets/audio/dark-theme-user.wav',
    'assets/scenes/webb-cosmic-cliffs.webp', 'assets/scenes/mountain-valley.svg',
    'assets/scenes/day/waterfall.mp4', 'assets/scenes/day/river.mp4', 'assets/scenes/day/beach-birds.mp4',
    'index.html', 'expertise-experience.html', 'projects.html', 'security-research.html', 'security-research.css', 'security-research.js', 'game-development.html', 'learn.html', 'lesson.html',
    'learn-browse.html', 'learn-capstones.html', 'learn-glossary.html', 'learn-labs.html', 'learn-map.html',
    'learn-mastery.html', 'learn-paths.html', 'learn-practice.html', 'learn-verify.html',
    'app.js', 'styles.css', 'site-resilience.js',
    'site-resilience.css', 'portfolio-next.js', 'portfolio-next.css', 'portfolio-home.css',
    'quantum-cube.js', 'handheld-experience.js', 'handheld-experience.css',
    'science-experiments.js', 'science-experiments.css', 'knowledge.js', 'knowledge.css',
    'learning-depth.js', 'learning-depth.css', 'learning-next.js', 'learning-next.css',
    'project-battle-chess.html', 'project-geometric-ai.html', 'play-evil-wizard.html',
    'learning-capstones.json', 'labs/qpe.js', 'labs/emergent.js', 'agent-workbench.js',
    'qubit-preview-20260921/index.html', 'qubit-preview-20260921/app.js',
    'qubit-preview-20260921/qubit.js', 'assets/fonts/fonts.css',
    'assets/joshua-randall-headshot.jpg', 'assets/systems-lab.jpg', 'assets/quantum-field-notes.jpg',
)

def protected(name):
    return name in PROTECTED_ROOT_FILES or name in PRESERVE_IF_PRESENT or (name.startswith(PROTECTED_PREFIXES) and name not in THEME_SHELL_FILES)

def digest(file):
    h = hashlib.sha256()
    with file.open('rb') as source:
        for chunk in iter(lambda: source.read(1024*1024), b''):
            h.update(chunk)
    return h.hexdigest()

def release_files(source):
    files = [p for p in source.iterdir() if p.is_file() and
             (p.suffix in {'.html','.css','.js','.mjs'} or p.name in
              {'verification-manifest.json','learning-capstones.json','README_KNOWLEDGE_PLATFORM.txt'})]
    files.extend(source/name for name in THEME_SHELL_FILES)
    for directory in WEB_DIRS:
        files.extend(p for p in (source/directory).rglob('*') if p.is_file())
    return sorted(p for p in files if not protected(p.relative_to(source).as_posix()))

def _valid_mp4(path):
    try:
        if not path.is_file() or path.stat().st_size <= 1024*1024:
            return False
        with path.open('rb') as source_file:
            return b'ftyp' in source_file.read(32)
    except OSError:
        return False

def _valid_ogg(path):
    try:
        if not path.is_file() or path.stat().st_size <= 32768:
            return False
        with path.open('rb') as source_file:
            return source_file.read(4) == b'OggS'
    except OSError:
        return False

def _reuse_media(source, site, name, validator):
    target = source/name
    for candidate in (site/name, Path.home()/'.cache/jr-portfolio-media'/name):
        if validator(candidate):
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(candidate, target)
            print('Reusing cached Day media:', name, flush=True)
            return True
    return False

def _cache_media(source_file, name):
    try:
        cache = Path.home()/'.cache/jr-portfolio-media'/name
        cache.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source_file, cache)
        cache.chmod(0o600)
    except OSError:
        pass

def _download_with_retry(request, temp, timeout, label, attempts=5):
    for attempt in range(1, attempts+1):
        try:
            with urlopen(request, timeout=timeout) as response, temp.open('wb') as output:
                content_type = response.headers.get('Content-Type','')
                shutil.copyfileobj(response, output, length=512*1024)
                return content_type
        except HTTPError as error:
            retryable = error.code == 429 or 500 <= error.code < 600
            if not retryable or attempt >= attempts:
                raise
            try:
                retry_after = float(error.headers.get('Retry-After') or 0)
            except (TypeError, ValueError):
                retry_after = 0
            delay = min(10.0, max(retry_after, 3.0 * (2 ** (attempt-1))))
            print(f'{label} was rate-limited ({error.code}); retrying in {delay:.0f}s [{attempt}/{attempts}]', flush=True)
            if temp.exists():
                temp.unlink()
            time.sleep(delay)
        except URLError:
            if attempt >= attempts:
                raise
            delay = min(20.0, 2.0 * (2 ** (attempt-1)))
            print(f'{label} network retry in {delay:.0f}s [{attempt}/{attempts}]', flush=True)
            if temp.exists():
                temp.unlink()
            time.sleep(delay)

def materialize_day_media(source, site):
    """Prefer already-deployed/cached media, then download. Audio is optional because runtime has a remote fallback."""
    for name, url in DAY_MEDIA_SOURCES.items():
        target = source/name
        if _valid_mp4(target) or _reuse_media(source, site, name, _valid_mp4):
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        temp = target.with_suffix(target.suffix+'.downloading')
        request = Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (compatible; JoshuaRandallPortfolioDeploy/1.1; +https://web.engr.oregonstate.edu/~randjosh/)',
            'Referer': 'https://www.pexels.com/',
            'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
        })
        print('Downloading licensed Day video:', name, flush=True)
        try:
            content_type = _download_with_retry(request, temp, 120, 'Day video '+name, attempts=4)
            if 'video' not in content_type and 'octet-stream' not in content_type:
                raise RuntimeError(f'Unexpected media type for {name}: {content_type}')
            if not _valid_mp4(temp):
                raise RuntimeError(f'Day video download is invalid: {name}')
            os.replace(temp, target)
            _cache_media(target, name)
        finally:
            if temp.exists():
                temp.unlink()

    for index, (name, url) in enumerate(DAY_AUDIO_SOURCES.items()):
        target = source/name
        if _valid_ogg(target) or _reuse_media(source, site, name, _valid_ogg):
            continue
        target.parent.mkdir(parents=True, exist_ok=True)
        temp = target.with_suffix(target.suffix+'.downloading')
        request = Request(url, headers={
            'User-Agent': 'JoshuaRandallPortfolioDeploy/1.1 (+https://web.engr.oregonstate.edu/~randjosh/)',
            'Referer': 'https://commons.wikimedia.org/',
            'Accept': 'audio/ogg,audio/*;q=0.9,application/ogg;q=0.8,*/*;q=0.5',
        })
        print('Downloading Day ambience:', name, flush=True)
        try:
            content_type = _download_with_retry(request, temp, 90, 'Day ambience '+name, attempts=3)
            if not any(token in content_type for token in ('audio', 'ogg', 'octet-stream')):
                raise RuntimeError(f'Unexpected Day audio media type for {name}: {content_type}')
            if not _valid_ogg(temp):
                raise RuntimeError(f'Day ambience download is invalid: {name}')
            os.replace(temp, target)
            _cache_media(target, name)
            # Do not burst four Wikimedia downloads through the same OSU egress.
            if index < len(DAY_AUDIO_SOURCES)-1:
                time.sleep(2.0)
        except (HTTPError, URLError, RuntimeError) as error:
            if temp.exists():
                temp.unlink()
            print('WARNING: could not cache Day ambience:', name, '-', error, flush=True)
            print('         Deployment will continue; browser audio uses the matching Wikimedia fallback.', flush=True)

def validate_source(source):
    missing = [name for name in REQUIRED if not (source/name).is_file()]
    if missing:
        raise RuntimeError('Incomplete release: '+', '.join(missing))
    home = (source/'index.html').read_text()
    if 'quantum-cube.js' not in home or 'portfolio-home.css' not in home:
        raise RuntimeError('Homepage and animation/style assets do not match.')
    if (source/'projects.html').read_text().count('class="project-card"') != 16:
        raise RuntimeError('The release must preserve all 16 projects.')
    for file in release_files(source):
        if file.is_symlink():
            raise RuntimeError('Symbolic links are not release files: '+str(file))

def safe_extract(archive, destination):
    destination = destination.resolve()
    for item in archive.infolist():
        target = (destination/item.filename).resolve()
        if not target.is_relative_to(destination) or stat.S_ISLNK(item.external_attr >> 16):
            raise RuntimeError('Unsafe archive member: '+item.filename)
    archive.extractall(destination)

def copy_file(source, target):
    new_dirs = []
    parent = target.parent
    while not parent.exists():
        new_dirs.append(parent)
        parent = parent.parent
    target.parent.mkdir(parents=True, exist_ok=True)
    for directory in new_dirs:
        directory.chmod(0o755)
    temp = target.with_name('.'+target.name+'.deploying')
    try:
        shutil.copyfile(source, temp)
        temp.chmod(0o644)
        os.replace(temp, target)
    finally:
        if temp.exists():
            temp.unlink()

def create_backup(site, partial):
    """Create the broadest possible site backup without failing on host-owned unreadable paths."""
    skipped = []
    def remember(error):
        name = getattr(error, 'filename', None) or str(error)
        if name not in skipped:
            skipped.append(name)

    with tarfile.open(partial, 'w:gz') as archive:
        archive.add(site, arcname=site.name, recursive=False)
        for root, dirs, files in os.walk(site, topdown=True, followlinks=False, onerror=remember):
            root = Path(root)
            rel_root = root.relative_to(site)
            for name in list(dirs):
                path = root/name
                arcname = Path(site.name)/rel_root/name
                try:
                    archive.add(path, arcname=arcname.as_posix(), recursive=False)
                except (PermissionError, OSError) as error:
                    remember(error)
                    dirs.remove(name)
            for name in files:
                path = root/name
                arcname = Path(site.name)/rel_root/name
                try:
                    archive.add(path, arcname=arcname.as_posix(), recursive=False)
                except (PermissionError, OSError) as error:
                    remember(error)
    if skipped:
        print('Backup skipped host-inaccessible paths that deployment will not modify:', flush=True)
        for name in skipped:
            print('  -', name, flush=True)

def protected_hashes(site):
    return {p.relative_to(site).as_posix():digest(p) for p in site.rglob('*')
            if p.is_file() and protected(p.relative_to(site).as_posix())}

def deploy(source, site, verify_public=None):
    source, site = source.resolve(), site.resolve()
    validate_source(source)
    missing = [name for name in PROTECTED_REQUIRED if not (site/name).is_file()]
    if missing:
        raise RuntimeError('Existing protected experiences missing; nothing changed: '+', '.join(missing))
    files = release_files(source)
    for file in files:
        if not (site/file.relative_to(source)).resolve().is_relative_to(site):
            raise RuntimeError('A destination resolves outside public_html.')
    protected_before = protected_hashes(site)
    stamp = datetime.datetime.now().strftime('%Y%m%d-%H%M%S-%f')
    backup_name = 'public_html-before-'+stamp+'.tar.gz'
    backup = site.parent/backup_name
    partial = Path(str(backup)+'.part')
    try:
        print('Creating full backup:', backup, flush=True)
        create_backup(site, partial)
        os.replace(partial,backup)
    except PermissionError:
        if partial.exists():
            partial.unlink()
        backup = Path(tempfile.gettempdir())/backup_name
        partial = Path(str(backup)+'.part')
        print('Home directory blocks backup creation; using temporary backup:', backup, flush=True)
        create_backup(site, partial)
        os.replace(partial,backup)
    installed = []
    with tempfile.TemporaryDirectory(prefix='portfolio-rollback-') as undo_name:
        undo = Path(undo_name)
        try:
            # Publish supporting files first; switch page HTML last.
            for source_file in sorted(files,key=lambda p:p.suffix=='.html'):
                name = source_file.relative_to(source)
                target, original = site/name, undo/name
                existed = target.is_file()
                if existed:
                    original.parent.mkdir(parents=True,exist_ok=True)
                    shutil.copy2(target,original)
                installed.append((name,existed))
                copy_file(source_file,target)
            for file in files:
                if digest(file)!=digest(site/file.relative_to(source)):
                    raise RuntimeError('Deployed bytes differ: '+file.relative_to(source).as_posix())
            if protected_before!=protected_hashes(site):
                raise RuntimeError('A protected experience changed during deployment.')
            if verify_public:
                verify_public()
        except BaseException:
            for name,existed in reversed(installed):
                if existed:
                    shutil.copy2(undo/name,site/name)
                elif (site/name).exists():
                    (site/name).unlink()
            print('Verification failed. Previous files restored.',flush=True)
            raise
    print(f'Installed and verified {len(files)} files. Games, Geometry Lab calculation modules and fusion video are unchanged; the lab theme shell is updated.',flush=True)
    return backup

def http_smoke(commit, site):
    """Verify that the public site is serving the exact deployed bytes."""
    checks = (
        'site-theme.js', 'site-scenes.js', 'site-audio.js', 'site-sound-control.js',
        'site-scenes.css', 'geometric-lab/index.html', 'geometric-lab/app.js',
        'index.html', 'learn.html', 'expertise-experience.html', 'security-research.html', 'security-research.css', 'security-research.js', 'game-development.html',
        'lesson.html', 'knowledge.js', 'projects.html', 'portfolio-home.css',
        'quantum-cube.js', 'labs/qpe.js', 'labs/emergent.js', 'agent-workbench.js',
        'handheld-experience.js', 'science-experiments.js', 'learning-depth.js',
        'site-resilience.js'
    )
    for name in checks:
        request = Request(PUBLIC_URL+name+'?release='+commit,headers={'Cache-Control':'no-cache'})
        with urlopen(request,timeout=20) as response:
            content_type = response.headers.get('Content-Type','')
            public_bytes = response.read()
            expected_bytes = (site/name).read_bytes()
            if hashlib.sha256(public_bytes).digest() != hashlib.sha256(expected_bytes).digest():
                raise RuntimeError('Public URL returned bytes that differ from the deployed file: '+name)
            if name.endswith('.js') and 'javascript' not in content_type:
                raise RuntimeError('Server is not serving JavaScript correctly: '+name)
        print('Verified public URL:',name,flush=True)

def http_smoke_day_media():
    """Verify same-origin Day video and ambience are publicly reachable with valid container signatures."""
    for name in DAY_MEDIA_SOURCES:
        request = Request(PUBLIC_URL+name+'?day-media=1', headers={
            'Cache-Control':'no-cache',
            'Range':'bytes=0-63',
        })
        with urlopen(request, timeout=30) as response:
            content_type = response.headers.get('Content-Type','')
            prefix = response.read(64)
            if 'video/mp4' not in content_type and 'application/octet-stream' not in content_type:
                raise RuntimeError('Server is not serving Day media as MP4: '+name+' ('+content_type+')')
            if b'ftyp' not in prefix:
                raise RuntimeError('Public Day media does not look like MP4: '+name)
        print('Verified public Day video:', name, flush=True)

    for name in DAY_AUDIO_SOURCES:
        local = Path.home()/'public_html'/name
        if not _valid_ogg(local):
            print('Day ambience not cached locally; verified runtime will use remote fallback:', name, flush=True)
            continue
        request = Request(PUBLIC_URL+name+'?day-audio=1', headers={
            'Cache-Control':'no-cache',
            'Range':'bytes=0-63',
        })
        with urlopen(request, timeout=30) as response:
            content_type = response.headers.get('Content-Type','')
            prefix = response.read(64)
            if not any(token in content_type for token in ('audio', 'ogg', 'octet-stream')):
                raise RuntimeError('Server is not serving Day ambience correctly: '+name+' ('+content_type+')')
            if not prefix.startswith(b'OggS'):
                raise RuntimeError('Public Day ambience does not look like Ogg: '+name)
        print('Verified public Day ambience:', name, flush=True)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('commit', help='Full 40-character SHA of the tested GitHub commit')
    args = parser.parse_args()
    if not re.fullmatch(r'[0-9a-f]{40}', args.commit):
        parser.error('commit must be a full lowercase SHA, not a branch name.')
    site = Path.home()/'public_html'
    if not (site/'index.html').is_file():
        parser.error('Run in your authenticated OSU shell; public_html was not found.')
    with tempfile.TemporaryDirectory(prefix='portfolio-release-') as temporary:
        temp = Path(temporary)
        archive_path = temp/'release.zip'
        url = f'https://github.com/joshprandall/engineering-portfolio/archive/{args.commit}.zip'
        print('Downloading tested commit:',args.commit,flush=True)
        with urlopen(url,timeout=60) as response,archive_path.open('wb') as output:
            shutil.copyfileobj(response,output)
        with ZipFile(archive_path) as archive:
            safe_extract(archive,temp/'source')
        source = temp/'source'/('engineering-portfolio-'+args.commit)
        if not source.is_dir():
            raise RuntimeError('Archive does not contain the requested commit.')
        materialize_day_media(source, site)
        backup = deploy(source,site,lambda:(http_smoke(args.commit,site), http_smoke_day_media()))
    print('Website updated:',PUBLIC_URL)
    print('Commit:',args.commit)
    print('Backup:',backup)

if __name__=='__main__':
    main()
