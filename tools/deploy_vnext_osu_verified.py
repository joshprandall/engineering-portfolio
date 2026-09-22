#!/usr/bin/env python3
"""Deploy a pinned, reviewed website overlay to OSU; preserve hosted game and media."""
import argparse
from datetime import datetime
from hashlib import sha256
from io import BytesIO
import os
from pathlib import Path
import stat
import sys
import tarfile
import tempfile
from urllib.request import Request, urlopen
from zipfile import ZipFile

COMMIT = '656151a6bdcd5498c2bcb4d3e85667d8fe5831f4'
BASE = 'https://raw.githubusercontent.com/joshprandall/engineering-portfolio/' + COMMIT + '/'
ARCHIVE = 'release-upload/Joshua_Randall_Portfolio_vNext_Foundations_RC_20260922.zip'
EXPECTED = '23ea365a6a1cd446ac490ac5d1f129103d07e60878d12bcdbce5775c9b4deef7'
FILES = set('''NEXT-RELEASE-NOTES.md assets/quantum-lab-reference.jpg index.html knowledge.js learn-capstones.html learn-paths.html learning-capstones.css learning-capstones.js learning-capstones.json learning-next.css learning-next.js portfolio-next.css portfolio-next.js project-advanced-computing.html project-asset-inventory.html project-battle-chess.html project-dependency.html project-emergent.html project-fusion.html project-geometric-ai.html project-kubernetes-lab.html project-learning-library.html project-lifecycle.html project-mind.html project-portfolio.html project-qpe.html project-qubit.html project-recovery.html projects.html'''.split())
# Fill only a missing image; never replace an existing image.
IMAGES = {'assets/portrait.jpg':'7887b098ca27e1ec77238381526fe042dc8ef1efe0d7a1d8519cced93e9dc8aa',
          'assets/osu-logo.png':'c3fa4511073c80ddd4b10a567719b4860cacfd98a462080e6792b8050f47279f',
          'assets/quantum2.jpg':'eb592e766a3ee0bde46b83232feca76f7ee964dd4ef7d949df4ae5d2db8a7138'}
PRESERVE = ('games/evil-wizard/index.html', 'assets/fusion-presentation.mp4',
            'games/3d-battle-chess/index.html','games/3d-battle-chess/boot.js',
            'games/3d-battle-chess/engine.js','games/3d-battle-chess/fallback-board.js')
FOUNDATION = ('index.html','projects.html','styles.css','app.js','knowledge-data.js')

def get(url):
    with urlopen(Request(url, headers={'User-Agent':'JoshuaRandall-website-deployment/1.0'}), timeout=45) as response:
        return response.read()

def must(ok, message):
    if not ok: raise RuntimeError(message)

def write_atomic(target, data, mode=0o644):
    fd, temporary = tempfile.mkstemp(prefix='.vnext-', dir=str(target.parent))
    try:
        with os.fdopen(fd,'wb') as f:
            f.write(data); f.flush(); os.fsync(f.fileno())
        os.chmod(temporary, mode)
        os.replace(temporary, target)
    finally:
        if os.path.exists(temporary): os.unlink(temporary)

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root',type=Path,default=Path.home()/'public_html')
    parser.add_argument('--zip',type=Path,help='Use matching local ZIP for offline verification')
    parser.add_argument('--dry-run',action='store_true')
    args=parser.parse_args()
    root=args.root.expanduser()
    must(not root.is_symlink() and root.is_dir() and root.name=='public_html', 'Expected your existing real public_html directory')
    root=root.resolve()
    for name in PRESERVE+FOUNDATION:
        p=root/name
        must(p.is_file() and not p.is_symlink() and p.stat().st_size>0, 'Missing required live asset: '+name+'; nothing changed')
    must((root/'index.html').stat().st_size>1000,'Existing homepage is incomplete; nothing changed')
    for name in ('assets','games','games/evil-wizard','games/3d-battle-chess'):
        p=root/name
        must(p.is_dir() and not p.is_symlink(), 'Missing or linked live folder: '+name)
    print('PREFLIGHT OK: existing Evil Wizard, fusion video, chess and learning platform located.',flush=True)
    raw=args.zip.read_bytes() if args.zip else get(BASE+ARCHIVE)
    must(sha256(raw).hexdigest()==EXPECTED,'Release archive SHA-256 mismatch; nothing changed')
    with ZipFile(BytesIO(raw)) as zipfile:
        must(set(zipfile.namelist())==FILES and zipfile.testzip() is None,'Unexpected or corrupt release archive; nothing changed')
        updates={name:zipfile.read(name) for name in FILES}
    must(b'portfolio-next.js' in updates['index.html'] and b'learning-capstones.js' in updates['learn-capstones.html'], 'Release missing new features')
    for name, expected in IMAGES.items():
        p=root/name
        must(not p.is_symlink(),'Linked image not permitted: '+name)
        if not p.is_file() or p.stat().st_size==0:
            image=get(BASE+name)
            must(sha256(image).hexdigest()==expected,'Original image verification failed: '+name)
            updates[name]=image
    for name in updates:
        p=root/name
        must(not p.is_symlink() and not p.parent.is_symlink() and (not p.exists() or p.is_file()),'Unexpected file or link: '+name)
    changed={name:data for name,data in updates.items() if not (root/name).is_file() or (root/name).read_bytes()!=data}
    print('ZIP VERIFIED:',EXPECTED,'| files to update:',len(changed),flush=True)
    if args.dry_run:
        print('DRY RUN — no files changed.',flush=True); return
    if not changed:
        print('ALREADY CURRENT — no website files changed.',flush=True);return
    backup=root.parent/('public_html-before-vnext-'+datetime.now().strftime('%Y%m%d-%H%M%S')+'.tar.gz')
    part=Path(str(backup)+'.part')
    print('Creating full website backup; keep ShellFish open.',flush=True)
    try:
        with tarfile.open(part,'w:gz') as tar: tar.add(root,arcname='public_html',recursive=True)
        must(part.stat().st_size>1000,'Backup is unexpectedly small')
        with tarfile.open(part,'r:gz') as tar:
            names=set(tar.getnames())
            must(all('public_html/'+x in names for x in PRESERVE+FOUNDATION),'Backup missing a protected site file')
        os.replace(part,backup)
    finally:
        if part.exists():part.unlink()
    print('BACKUP VERIFIED:',backup,flush=True)
    old={name:((root/name).read_bytes(),stat.S_IMODE((root/name).stat().st_mode)) if (root/name).exists() else None for name in changed}
    written=[]
    try:
        for name in sorted(changed, key=lambda n:(n in ('index.html','projects.html'),n=='index.html',n)):
            p=root/name
            write_atomic(p,changed[name]);written.append(name)
        for name in written:
            must((root/name).read_bytes()==changed[name], 'Readback failed: '+name)
        for name in ('','assets','games','games/evil-wizard','games/3d-battle-chess'):
            os.chmod(root/name,0o755)
        for name in PRESERVE+tuple(IMAGES):
            os.chmod(root/name,0o644)
    except BaseException as exc:
        print('ERROR: restoring changed files from before this release.',flush=True)
        for name in reversed(written):
            p=root/name
            try:
                previous=old[name]
                if previous is None:p.unlink(missing_ok=True)
                else:write_atomic(p,previous[0],previous[1])
            except Exception as err:print('ROLLBACK WARNING:',name,err,flush=True)
        raise RuntimeError('Deploy failed; restore archive if necessary: '+str(backup)+'; '+str(exc)) from exc
    print('DEPLOYMENT APPLIED:',len(changed),'files, verified by readback.',flush=True)
    print('PRESERVED: Evil Wizard, fusion video, chess runtime and existing other files.',flush=True)
    print('ROLLBACK BACKUP:',backup,flush=True)
    print('CHECK ON PHONE: https://web.engr.oregonstate.edu/~randjosh/',flush=True)
    print('Note: live iPhone WebGL and every learning activity still need hands-on verification.',flush=True)

if __name__=='__main__':
    try:main()
    except Exception as exc:
        print('STOP:',exc,file=sys.stderr,flush=True)
        sys.exit(1)
