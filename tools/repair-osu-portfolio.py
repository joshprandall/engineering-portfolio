#!/usr/bin/env python3
"""Focused September 2026 OSU portfolio repair. Run with --root DIR (review) or --apply (OSU)."""
from pathlib import Path
import argparse, datetime, os, re, sys, tarfile, tempfile, urllib.request

REPO='https://raw.githubusercontent.com/joshprandall/engineering-portfolio/main/'
SHARED=('site-resilience.css','site-resilience.js')
GAME=('games/3d-battle-chess/boot.js','games/3d-battle-chess/fallback-board.js','games/3d-battle-chess/fallback.css','games/3d-battle-chess/index.html')

def replace_once(s,old,new,file):
    if old in s:return s.replace(old,new)
    if new in s:return s
    raise RuntimeError(f'{file}: expected existing markup not found: {old[:95]}')

def adapt(name,s):
    orig=s
    if name=='index.html':
        if 'href="games/3d-battle-chess/index.html"' not in s:
            s=replace_once(s,'<a class="button" href="resume.html">View résumé <span>↗</span></a>',
              '<a class="button" href="resume.html">View résumé <span>↗</span></a><a class="button" href="games/3d-battle-chess/index.html">Play 3D Battle Chess</a>',name)
        s=replace_once(s,'<span class="year">2019–25</span>','<span class="year">2019–now</span>',name)
        s=replace_once(s,'<h3>Owner / Senior IT Infrastructure Consultant</h3>','<h3>Independent IT Infrastructure Consultant</h3>',name)
        s=replace_once(s,'Phoenix Technology / Self-Employed','Joshua Randall · Independent consulting (Phoenix Technology client)',name)
        s=replace_once(s,'June 2019 – February 2025','June 2019 – present (independent practice)',name)
        s=replace_once(s,'An outsourced IT department and technical leadership partner for hundreds of businesses.',
          'Independent infrastructure consulting under my own name, established June 2019 and still active. Phoenix Technology was a client, not my company.',name)
    if name=='resume.html':
        s=replace_once(s,'Phoenix Technology / Self-Employed — Owner | Senior IT Infrastructure Consultant',
          'Joshua Randall — Independent IT Consultant (Phoenix Technology client)',name)
        s=replace_once(s,'Oregon | Jun 2019 – Feb 2025','Oregon | Independent practice established Jun 2019; ongoing',name)
    if name=='projects.html':
        s=replace_once(s,'A Godot 4 dark-fantasy action RPG featuring 15 playable champions, multidirectional combat, exploration, puzzles, tunnels, portals, bosses, class-specific movement, and a complete playable campaign.',
          'An independently developed dark-fantasy action RPG and browser prototype. Character choices, combat, exploration and campaign content are under active development; the deployed game is the source of truth for playable features.',name)
        s=replace_once(s,'<span class="status">Playable browser build · v2.0.2</span>',
          '<span class="status">Browser prototype · version shown in game</span>',name)
        s=replace_once(s,'>Play in browser ↗</a><a class="tile-secondary"',
          '>Play Evil Wizard</a><a class="tile-secondary"',name)
        s=replace_once(s,'>Source ↗</a>', '>Source code</a>',name)
        pat=r'<article class="project-card" data-category="completed interactive" id="battle-chess">.*?</article>'
        match=re.search(pat,s,flags=re.S)
        if not match:
            if 'Play 3D Battle Chess' not in s:raise RuntimeError('projects.html: chess card not found')
        else:
            card='''<article class="project-card" data-category="interactive" id="battle-chess"><span class="project-number">GAME DEVELOPMENT / BROWSER CHESS</span><h2>3D Battle Chess</h2><p>Five selectable procedural piece sets, standard chess rules, animated captures, and a local computer opponent. The graphics use WebGL; a playable 2D board is available when 3D cannot load.</p><div class="card-bottom"><span class="status">Playable browser build · locally simulated chess</span><a class="tile-open" href="games/3d-battle-chess/index.html">Play 3D Battle Chess</a><a class="tile-secondary" href="project-battle-chess.html">Project details</a><a class="tile-secondary" href="https://github.com/joshprandall/3d-battle-chess" rel="noopener noreferrer" target="_blank">Game source</a></div></article>'''
            s=s[:match.start()]+s[match.end():]
            qpat=r'(<article class="project-card"[^>]* id="quantum">.*?</article>)'
            qm=re.search(qpat,s,flags=re.S)
            if not qm:raise RuntimeError('projects.html: quantum card not found')
            s=s[:qm.end()]+card+s[qm.end():]
    if name=='project-battle-chess.html':
        s=replace_once(s,'Play the working game ↗','Open Battle Chess in a full page',name)
        s=replace_once(s,'<iframe class="demo-frame" src="games/3d-battle-chess/" title="3D Battle Chess"></iframe>',
          '<p class="demo-frame-note">On a phone or tablet, use the full-page game link above. If 3D graphics cannot load, select “Use 2D board” for playable chess.</p><iframe class="demo-frame" src="games/3d-battle-chess/" title="3D Battle Chess" loading="lazy"></iframe>',name)
        s=replace_once(s,'This local browser game supports two players or a compact computer opponent. It does not claim online matchmaking, accounts, or a backend. The 3D renderer loads pinned Three.js modules from jsDelivr and requires internet access.',
          'Local two-player and computer-opponent chess use the game’s own rules engine. The 3D mode requires WebGL and pinned Three.js modules from jsDelivr; when those cannot load, the 2D backup board remains playable. Online matchmaking and accounts are not included.',name)
    if name=='play-evil-wizard.html':
        s=replace_once(s,'Choose from 15 champions and fight through an interconnected dark-fantasy campaign. Click inside the game before using keyboard, mouse, or controller input.',
          'Open the currently deployed browser prototype. Character selection, combat and campaign features vary by build; click inside the game before using its available controls.',name)
    if name=='app.js':
        s=replace_once(s,'["Defeat the Evil Wizard", "Godot GDScript action RPG platformer game development 15 champions multidirectional combat exploration puzzles bosses portals", "play-evil-wizard.html"],',
          '["Defeat the Evil Wizard", "dark fantasy browser game playable prototype", "play-evil-wizard.html"],\n    ["3D Battle Chess", "interactive themed chess computer opponent WebGL 2D backup", "games/3d-battle-chess/index.html"],',name)
        s=replace_once(s,'const savedTheme = localStorage.getItem("portfolio-theme");',
          'let savedTheme = null; try { savedTheme = localStorage.getItem("portfolio-theme"); } catch (_) { /* Private-mode storage can be disabled. */ }',name)
        if 'try { localStorage.setItem("portfolio-theme", next); }' not in s:
            s=replace_once(s,'localStorage.setItem("portfolio-theme", next);',
              'try { localStorage.setItem("portfolio-theme", next); } catch (_) { /* Theme still works this session. */ }',name)
    if '/' not in name and name.endswith('.html') and 'id="primary-nav"' in s:
        if 'href="projects.html#battle-chess">Play Chess</a>' not in s:
            s=s.replace('</nav>','<a href="projects.html#battle-chess">Play Chess</a></nav>',1)
        if 'href="site-resilience.css"' not in s:
            s=s.replace('</head>','<link href="site-resilience.css" rel="stylesheet"/></head>',1)
        if 'src="site-resilience.js"' not in s:
            s=re.sub(r'(<script\s+defer(?:="")?\s+src="app\.js"></script>)',
                     r'<script defer src="site-resilience.js"></script>\1',s,count=1)
            if 'src="site-resilience.js"' not in s:
                raise RuntimeError(name+': app.js script tag not found')
    return s if s!=orig else orig

def run(root,apply):
    root=root.expanduser().resolve()
    if not root.is_dir():raise RuntimeError(f'Website folder missing: {root}')
    if not (root/'index.html').exists() or not (root/'projects.html').exists():raise RuntimeError('Not a website root')
    if not (root/'games/3d-battle-chess/engine.js').exists():raise RuntimeError('Game engine missing: stop, do not pretend chess is installed')
    changes={}
    for p in sorted(root.glob('*.html')):
        original=p.read_text('utf-8');new=adapt(p.name,original)
        if new!=original:changes[p.relative_to(root).as_posix()]=new.encode('utf-8')
    original=(root/'app.js').read_text('utf-8');new=adapt('app.js',original)
    if original!=new:changes['app.js']=new.encode('utf-8')
    if apply:
        for name in SHARED+GAME:
            try:
                with urllib.request.urlopen(REPO+name,timeout=25) as response:contents=response.read()
            except Exception as e:raise RuntimeError(f'Cannot fetch {name} from GitHub; stopping before changes: {e}') from e
            if name.endswith(('.html','.css','.js')):contents.decode('utf-8')
            old=(root/name).read_bytes() if (root/name).exists() else None
            if old!=contents:changes[name]=contents
    print('Website:',root)
    print('Planned changes:',len(changes),'files:', ', '.join(changes) or '(none)')
    if not apply:return
    stamp=datetime.datetime.now().strftime('%Y%m%d-%H%M%S')
    backup=root.parent/f'public_html-pre-repair-{stamp}.tar.gz'
    with tarfile.open(str(backup)+'.part','w:gz') as tar:tar.add(root,arcname='public_html',recursive=True)
    os.replace(str(backup)+'.part',backup)
    if backup.stat().st_size<1000:raise RuntimeError('Backup unusually small; no changes made')
    print('Backup:',backup)
    for name,contents in changes.items():
        p=root/name;p.parent.mkdir(parents=True,exist_ok=True)
        fd,tmp=tempfile.mkstemp(prefix='.site-repair-',dir=p.parent)
        try:
            with os.fdopen(fd,'wb') as out:out.write(contents)
            os.chmod(tmp,0o644);os.replace(tmp,p)
        finally:
            if os.path.exists(tmp):os.unlink(tmp)
    os.chmod(root,0o755)
    paths=('assets','games','games/3d-battle-chess','deep-learning','geometric-lab','labs','qubit-preview-20260921')
    for name in paths:
        p=root/name
        if p.exists() and p.is_dir() and not p.is_symlink():os.chmod(p,0o755)
    for name in ('assets/portrait.jpg','assets/osu-logo.png','assets/quantum2.jpg','assets/favicon.svg'):
        p=root/name
        if p.is_file() and not p.is_symlink():os.chmod(p,0o644)
        else:print('WARN: image missing:',name)
    for name in ('games/3d-battle-chess/index.html','games/3d-battle-chess/styles.css','games/3d-battle-chess/engine.js','games/3d-battle-chess/battle.js','games/3d-battle-chess/boot.js','games/3d-battle-chess/fallback-board.js','games/3d-battle-chess/fallback.css'):
        p=root/name
        if p.is_file() and not p.is_symlink():os.chmod(p,0o644)
    for name in changes:
        p=root/name
        if p.read_bytes()!=changes[name]:raise RuntimeError(f'Postwrite verification failed for {name}; restore backup {backup}')
    print('REPAIR APPLIED; verify live image URLs, menu, chess and qubit. Rollback archive:',backup)

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root',type=Path,help='Inspect/patch a local source checkout (requires --apply to write)')
    parser.add_argument('--apply',action='store_true',help='Create full backup and patch OSU public_html')
    args=parser.parse_args()
    try:run(args.root or Path.home()/'public_html',args.apply)
    except Exception as e:print('STOP:',e,file=sys.stderr);sys.exit(1)
