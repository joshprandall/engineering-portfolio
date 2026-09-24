#!/usr/bin/env python3
"""Apply the reviewed appearance repair to the existing OSU site, in place.

No repository-wide deployment: game engines, lessons and science modules stay
in place. The legacy chess renderer receives three hooks into its own state.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from urllib.request import urlopen
import datetime, hashlib, json, os, re, shutil, sys, tempfile

VERSION = '20260924-reconciled'
SOURCE_FILES = ('site-theme.js', 'site-scenes.js', 'site-scenes.css',
                'portfolio-home.css', 'portfolio-next.css', 'assets/mit-logo.svg',
                'assets/scenes/CREDITS.md', 'assets/ACADEMIC_MARKS.md',
                'index.html', 'knowledge.js', 'learning-depth.js',
                'repairs/chess-views.js', 'repairs/chess-boot.js', 'repairs/game-surfaces.css',
                'repairs/vendor/three.module.min.js', 'repairs/vendor/three.core.min.js',
                'repairs/vendor/OrbitControls.js', 'repairs/vendor/LICENSE')
ASSETS = SOURCE_FILES[:8]
PUBLIC = 'https://web.engr.oregonstate.edu/~randjosh/'

def replace_section(text, source, start, end):
    if text.count(start) != 1 or source.count(start) != 1:
        raise RuntimeError('Unrecognized source; no files changed: '+start)
    a, b = text.index(start), text.index(end, text.index(start))
    c, d = source.index(start), source.index(end, source.index(start))
    return text[:a]+source[c:d]+text[b:]

def add_head(text, markup, marker):
    if marker in text:
        return text
    if '</head>' not in text:
        raise RuntimeError('Page has no head; no files changed.')
    return text.replace('</head>', markup+'\n</head>', 1)

def plan_changes(root, source):
    changes = {}
    def read(name):
        return (root/name).read_text(encoding='utf-8')
    def src(name):
        return (source/name).read_text(encoding='utf-8')
    def put(name, text):
        changes[name] = text.encode('utf-8')
    for name in ASSETS:
        changes[name] = (source/name).read_bytes()
    # Refresh references in existing pages. Do not replace their contents.
    pages = list(root.glob('*.html'))
    pages += [root/'geometric-lab/index.html',root/'qubit-preview-20260921/index.html']
    for page in pages:
        if not page.is_file():
            continue
        text = page.read_text(encoding='utf-8')
        text = re.sub(r'((?:site-theme|site-scenes|portfolio-home|portfolio-next|knowledge|learning-depth)\.(?:js|css))\?[^"\s>]+',r'\1?v='+VERSION,text)
        # These known patch blocks are superseded by the single shared stylesheet.
        text = re.sub(r'<style>\s*/\* JR-(?:BATTLE-|TRUE-BATTLE-|WIZARD-|TRUE-WIZARD-|LEARN-MOBILE-).*?</style>', '', text, flags=re.S)
        if page.name=='index.html' and page.parent==root and '<div class="about-imagery">' in text:
            desired = src('index.html')
            fragment = desired[desired.index('<figure class="about-imagery">'):desired.index('<div class="about-copy"')]
            old = text[text.index('<div class="about-imagery">'):text.index('<div class="about-copy"')]
            photo = re.search(r'data:image/[^"\s]+',old)
            if not photo:
                raise RuntimeError('Current portrait could not be preserved; no files changed.')
            fragment = re.sub(r'data:image/[^"\s]+',lambda _:photo.group(),fragment)
            text = text.replace(old,fragment,1)
        put(page.relative_to(root).as_posix(),text)
    put('knowledge.js',replace_section(read('knowledge.js'),src('knowledge.js'),
                                      '  function applyLibraryPage(){','  function randomLesson(){'))
    put('learning-depth.js',replace_section(read('learning-depth.js'),src('learning-depth.js'),
                                           '  function homeSection(){','  function contextBar(){'))
    # This is the actual older renderer used on OSU, not the different GitHub game.
    game = 'games/3d-battle-chess/'
    html, battle = read(game+'index.html'), read(game+'battle.js')
    if 'id="boardMode"' in html:
        marker = '/* JR-SHARED-VIEW-ADAPTER */'
        if marker not in battle:
            for anchor in ['function highlight(){','function renderStatus(){','\ninit();']:
                if battle.count(anchor)!=1:
                    raise RuntimeError('Chess version differs from the reviewed live game; no files changed.')
            battle = "import {installViews} from './jr-chess-views.js?v="+VERSION+"';\n"+marker+'\nlet refreshSharedView=()=>{};\n'+battle
            battle = battle.replace('function highlight(){','function highlight(){refreshSharedView();',1)
            battle = battle.replace('function renderStatus(){','function renderStatus(){refreshSharedView();',1)
            battle += "\nif(renderer?.domElement?.isConnected){refreshSharedView=installViews({scene:sceneEl,game,chooseSquare,selection:()=>selected,legalMoves:()=>legal});}\n"
        put(game+'battle.js',battle)
        changes[game+'jr-chess-views.js']=(source/'repairs/chess-views.js').read_bytes()
        changes[game+'boot.js']=(source/'repairs/chess-boot.js').read_bytes()
        for name in ('three.module.min.js','three.core.min.js','OrbitControls.js','LICENSE'):
            changes[game+'vendor/'+name]=(source/'repairs/vendor'/name).read_bytes()
        importmap={'imports':{'three':'./vendor/three.module.min.js','three/addons/controls/OrbitControls.js':'./vendor/OrbitControls.js'}}
        html=re.sub(r'<script type="importmap">.*?</script>','<script type="importmap">'+json.dumps(importmap)+'</script>',html,flags=re.S)
        html = re.sub(r'<script>\s*/\* JR-BATTLE-VIEW-TOGGLE-.*?</script>','',html,flags=re.S)
        html = re.sub(r'src="boot\.js(?:\?[^\"]*)?"','src="boot.js?v='+VERSION+'"',html)
        html = add_head(html,'<script src="../../site-theme.js?v='+VERSION+'"></script>','../../site-theme.js')
        html = add_head(html,'<link rel="stylesheet" href="../../site-scenes.css?v='+VERSION+'"><script defer src="../../site-scenes.js?v='+VERSION+'"></script>','../../site-scenes.css')
    elif 'id="viewToggle"' in html and 'function setView(' in battle:
        # Modern shell: fix the handheld operator-precedence regression only.
        old="e.currentTarget.dataset.targetView||viewMode==='3d'?'2d':'3d'"
        battle=battle.replace(old,"e.currentTarget.dataset.targetView||(viewMode==='3d'?'2d':'3d')")
        put(game+'battle.js',battle)
    else:
        raise RuntimeError('Unrecognized chess shell; no files changed.')
    html=add_head(html,'<link rel="stylesheet" href="../../jr-game-surfaces.css?v='+VERSION+'">','jr-game-surfaces.css')
    put(game+'index.html',html)
    changes['jr-game-surfaces.css']=(source/'repairs/game-surfaces.css').read_bytes()
    wizard='games/evil-wizard/play.html'
    if (root/wizard).is_file():
        html=read(wizard)
        html=add_head(html,'<script src="../../site-theme.js?v='+VERSION+'"></script>','../../site-theme.js')
        html=add_head(html,'<link rel="stylesheet" href="../../jr-game-surfaces.css?v='+VERSION+'">','jr-game-surfaces.css')
        put(wizard,html)
    return {name:data for name,data in changes.items() if not (root/name).exists() or (root/name).read_bytes()!=data}

def apply_changes(root, changes, verify=None):
    stamp=datetime.datetime.now().strftime('%Y%m%d-%H%M%S-%f')
    backup=root.parent/('portfolio-repair-before-'+stamp)
    backup.mkdir(mode=0o700)
    before={name:(root/name).read_bytes() if (root/name).exists() else None for name in changes}
    for name,data in before.items():
        if data is not None:
            dest=backup/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
    (backup/'repair-manifest.json').write_text(json.dumps({'files':list(changes),'new':[n for n,b in before.items() if b is None]},indent=2))
    def write(name,data):
        dest=root/name;dest.parent.mkdir(parents=True,exist_ok=True)
        fd,temp=tempfile.mkstemp(prefix='.repair-',dir=dest.parent)
        try:
            with os.fdopen(fd,'wb') as f:f.write(data)
            os.chmod(temp,0o644);os.replace(temp,dest)
        finally:
            if os.path.exists(temp):os.unlink(temp)
    changed=[]
    try:
        for name,data in changes.items():
            current=(root/name).read_bytes() if (root/name).exists() else None
            if current!=before[name]:raise RuntimeError('File changed during repair: '+name)
            write(name,data);changed.append(name)
        for name,data in changes.items():
            if (root/name).read_bytes()!=data:raise RuntimeError('Verification failed: '+name)
        if verify:verify(changes)
    except BaseException:
        for name in reversed(changed):
            if before[name] is None:(root/name).unlink(missing_ok=True)
            else:write(name,before[name])
        raise
    return backup

def main(commit):
    if not re.fullmatch('[a-f0-9]{40}',commit or ''):raise RuntimeError('An exact reviewed commit is required.')
    root=Path.home()/'public_html'
    if not (root/'index.html').is_file():raise RuntimeError('Run this in your OSU SSH terminal; public_html was not found.')
    with tempfile.TemporaryDirectory(prefix='portfolio-reviewed-') as directory:
        source=Path(directory)
        def download(name):
            data=urlopen('https://raw.githubusercontent.com/joshprandall/engineering-portfolio/'+commit+'/'+name,timeout=40).read()
            dest=source/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
        with ThreadPoolExecutor(max_workers=4) as pool:list(pool.map(download,SOURCE_FILES))
        changes=plan_changes(root,source)
        if not changes:print('This reviewed repair is already installed.');return
        print('Applying',len(changes),'reviewed files and in-place edits. Existing game engines and science calculations are preserved.')
        def verify(changes):
            def check(item):
                name,data=item
                actual=urlopen(PUBLIC+name+'?repair='+commit,timeout=40).read()
                if actual!=data:raise RuntimeError('Public verification failed: '+name)
            with ThreadPoolExecutor(max_workers=4) as pool:list(pool.map(check,changes.items()))
        backup=apply_changes(root,changes,verify)
        print('REPAIR INSTALLED AND VERIFIED:',PUBLIC)
        print('Reviewed commit:',commit)
        print('Rollback files:',backup)

if __name__=='__main__':
    try:main(globals().get('REPAIR_COMMIT') or (sys.argv[1] if len(sys.argv)>1 else ''))
    except Exception as error:print('Repair stopped:',error,file=sys.stderr);sys.exit(1)
