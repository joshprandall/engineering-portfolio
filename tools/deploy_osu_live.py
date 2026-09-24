#!/usr/bin/env python3
"""Deploy one exact tested commit with a full backup, byte checks and rollback."""
import argparse, datetime, hashlib, os, re, shutil, stat, tarfile, tempfile
from pathlib import Path
from urllib.request import Request, urlopen
from zipfile import ZipFile

PUBLIC_URL = 'https://web.engr.oregonstate.edu/~randjosh/'
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
    'site-theme.js', 'site-scenes.js', 'site-scenes.css',
    'assets/scenes/webb-cosmic-cliffs.webp', 'assets/scenes/mountain-valley.svg',
    'index.html', 'projects.html', 'app.js', 'styles.css', 'site-resilience.js',
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
    backup = site.parent/('public_html-before-'+stamp+'.tar.gz')
    partial = Path(str(backup)+'.part')
    print('Creating full backup:', backup, flush=True)
    with tarfile.open(partial,'w:gz') as archive:
        archive.add(site,arcname=site.name)
    os.replace(partial,backup)
    installed = []
    with tempfile.TemporaryDirectory(prefix='portfolio-rollback-',dir=site.parent) as undo_name:
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

def http_smoke(commit):
    checks = [('site-theme.js','jr-site-theme'),('site-scenes.js','Cosmic Cliffs'),
              ('site-scenes.css','mountain-valley.svg'),('geometric-lab/index.html','site-theme.js'),
              ('geometric-lab/app.js','PortfolioTheme'),('index.html','quantum-cube.js'),('projects.html','3D Battle Chess'),
              ('portfolio-home.css','.home-page'),('quantum-cube.js','Bell-state'),
              ('labs/qpe.js','function distribution'),('labs/emergent.js','function create'),
              ('agent-workbench.js','requiresApproval'),('handheld-experience.js','removeLegacyFloatingNavigation'),
              ('science-experiments.js','project-qpe.html'),
              ('learning-depth.js','Doctoral / Research'),('site-resilience.js','Game Development')]
    for name,marker in checks:
        request = Request(PUBLIC_URL+name+'?release='+commit,headers={'Cache-Control':'no-cache'})
        with urlopen(request,timeout=20) as response:
            content_type = response.headers.get('Content-Type','')
            text = response.read().decode('utf-8')
            if marker not in text:
                raise RuntimeError('Public URL returned an older or incomplete file: '+name)
            if name.endswith('.js') and 'javascript' not in content_type:
                raise RuntimeError('Server is not serving JavaScript correctly: '+name)
        print('Verified public URL:',name,flush=True)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--commit',required=True,help='Full 40-character SHA of the tested GitHub commit')
    args = parser.parse_args()
    if not re.fullmatch(r'[0-9a-f]{40}',args.commit):
        parser.error('--commit must be a full lowercase SHA, not a branch name.')
    site = Path.home()/'public_html'
    if not (site/'index.html').is_file():
        parser.error('Run in your authenticated OSU shell; public_html was not found.')
    with tempfile.TemporaryDirectory(prefix='portfolio-release-',dir=site.parent) as temporary:
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
        backup = deploy(source,site,lambda:http_smoke(args.commit))
    print('Website updated:',PUBLIC_URL)
    print('Commit:',args.commit)
    print('Backup:',backup)

if __name__=='__main__':
    main()
