#!/usr/bin/env python3
"""Deploy the exact reviewed vNext overlay to an existing OSU website, preserving host-only files."""
import argparse
import hashlib
import os
from pathlib import Path
import shutil
import stat
import sys
import tarfile
import tempfile
import urllib.request
import zipfile

COMMIT = '656151a6bdcd5498c2bcb4d3e85667d8fe5831f4'
REPO = 'https://raw.githubusercontent.com/joshprandall/engineering-portfolio/' + COMMIT + '/'
ARCHIVE = 'release-upload/Joshua_Randall_Portfolio_vNext_Foundations_RC_20260922.zip'
SHA256 = '23ea365a6a1cd446ac490ac5d1f129103d07e60878d12bcdbce5775c9b4deef7'
FILES = set('''NEXT-RELEASE-NOTES.md assets/quantum-lab-reference.jpg index.html knowledge.js learn-capstones.html learn-paths.html learning-capstones.css learning-capstones.js learning-capstones.json learning-next.css learning-next.js portfolio-next.css portfolio-next.js project-advanced-computing.html project-asset-inventory.html project-battle-chess.html project-dependency.html project-emergent.html project-fusion.html project-geometric-ai.html project-kubernetes-lab.html project-learning-library.html project-lifecycle.html project-mind.html project-portfolio.html project-qpe.html project-qubit.html project-recovery.html projects.html'''.split())
# Install genuinely missing shared images only. Never replace an existing portrait.
OPTIONAL_ASSETS = {
 'assets/portrait.jpg': '7887b098ca27e1ec77238381526fe042dc8ef1efe0d7a1d8519cced93e9dc8aa',
 'assets/osu-logo.png': 'c3fa4511073c80ddd4b10a567719b4860cacfd98a462080e6792b8050f47279f',
 'assets/quantum2.jpg': 'eb592e766a3ee0bde46b83232feca76f7ee964dd4ef7d949df4ae5d2db8a7138',
}
REQUIRED = ('index.html','projects.html','styles.css','app.js','knowledge-data.js',
            'games/3d-battle-chess/index.html','games/3d-battle-chess/boot.js',
            'games/evil-wizard/index.html','assets/fusion-presentation.mp4')

def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent':'OSU-portfolio-deploy/1'}), timeout=40) as r:
        return r.read()

def digest(data):
    return hashlib.sha256(data).hexdigest()

def atomic_write(path, data):
    path.parent.mkdir(parents=True,exist_ok=True)
    fd,tmp=tempfile.mkstemp(prefix='.portfolio-next-',dir=str(path.parent))
    try:
        with os.fdopen(fd,'wb') as f:
            f.write(data)
            f.flush()
            os.fsync(f.fileno())
        os.chmod(tmp,0o644)
        os.replace(tmp,path)
    finally:
        if os.path.exists(tmp): os.unlink(tmp)

def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--root',type=Path,default=Path.home()/'public_html')
    ap.add_argument('--archive',type=Path,help='Use the verified local ZIP for offline testing')
    ap.add_argument('--dry-run',action='store_true')
    args=ap.parse_args()
    root=args.root.expanduser().resolve()
    if not root.is_dir() or root.name!='public_html' or root.is_symlink():
        raise RuntimeError('STOP: Expected existing, non-symlink public_html directory')
    for name in REQUIRED:
        p=root/name
        if not p.is_file() or p.is_symlink() or p.stat().st_size==0:
            raise RuntimeError('STOP: Existing website asset missing: '+name+'; NOTHING CHANGED')
    if (root/'index.html').stat().st_size<1000:
        raise RuntimeError('STOP: Existing homepage looks incomplete')
    print('Preflight: live-only Evil Wizard and fusion media present; existing chess and library found.',flush=True)

    raw=args.archive.read_bytes() if args.archive else get(REPO+ARCHIVE)
    if digest(raw)!=SHA256:
        raise RuntimeError('STOP: Release ZIP SHA-256 mismatch; NOTHING CHANGED')
    import io
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        if set(z.namelist())!=FILES or z.testzip():
            raise RuntimeError('STOP: Release ZIP contents or CRC mismatch; NOTHING CHANGED')
        updates={name:z.read(name) for name in sorted(FILES)}
    if updates['index.html'].count(b'portfolio-next.js')<1 or updates['projects.html'].count(b'project-card')<16:
        raise RuntimeError('STOP: Required portfolio features missing from release')
    for name in ('learning-capstones.js','portfolio-next.js','learning-next.js'):
        if len(updates[name])<400:
            raise RuntimeError('STOP: Incomplete JavaScript '+name)
    for name,expected in OPTIONAL_ASSETS.items():
        p=root/name
        if p.is_symlink():raise RuntimeError('STOP: Symlink asset: '+name)
        if not p.is_file() or p.stat().st_size==0:
            if args.archive:
                raise RuntimeError('STOP: Missing test asset: '+name)
            data=get(REPO+name)
            if digest(data)!=expected:raise RuntimeError('STOP: Image verification failed: '+name)
            updates[name]=data
    for name in updates:
        target=root/name
        if target.is_symlink() or target.parent.is_symlink():
            raise RuntimeError('STOP: Symlink target encountered: '+name)
    changed={name:data for name,data in updates.items() if not (root/name).is_file() or (root/name).read_bytes()!=data}
    print('Verified exact vNext ZIP; '+str(len(changed))+' changed files. Existing game export and media will not be replaced.',flush=True)
    if args.dry_run:
        print('DRY RUN: No changes made. Files: '+', '.join(changed),flush=True)
        return
    backup=root.parent/('public_html-before-vnext-'+__import__('datetime').datetime.now().strftime('%Y%m%d-%H%M%S')+'.tar.gz')
    partial=Path(str(backup)+'.part')
    try:
        with tarfile.open(partial,'w:gz') as t:t.add(root,arcname='public_html',recursive=True)
        if partial.stat().st_size<1024:raise RuntimeError('Backup is unexpectedly small')
        os.replace(partial,backup)
    except BaseException:
        partial.unlink(missing_ok=True)
        raise
    print('FULL BACKUP: '+str(backup),flush=True)
    previous={name:((root/name).read_bytes(),stat.S_IMODE((root/name).stat().st_mode)) if (root/name).is_file() else None for name in changed}
    completed=[]
    try:
        for name,data in changed.items():
            atomic_write(root/name,data)
            completed.append(name)
        # Only these known web directory permissions; NEVER recursively chmod user files.
        os.chmod(root,0o755)
        os.chmod(root/'assets',0o755)
        for name,data in changed.items():
            if (root/name).read_bytes()!=data:raise RuntimeError('Readback mismatch: '+name)
    except BaseException as exc:
        restored=[]
        for name in reversed(completed):
            old=previous[name]
            try:
                if old is None:(root/name).unlink(missing_ok=True)
                else:
                    atomic_write(root/name,old[0]);os.chmod(root/name,old[1])
                restored.append(name)
            except Exception as rollback_exc:
                print('ROLLBACK WARNING',name,rollback_exc,flush=True)
        raise RuntimeError('Installation failed, restored '+str(len(restored))+' files. Full backup: '+str(backup)+'; '+str(exc)) from exc
    print('DEPLOYMENT APPLIED: '+str(len(changed))+' files, SHA-256 verified and re-read.',flush=True)
    print('UNCHANGED: existing Evil Wizard export, fusion video, chess engine/renderer/2D fallback, user assets and other files.',flush=True)
    print('BACKUP: '+str(backup),flush=True)
    print('CHECK ON PHONE: https://web.engr.oregonstate.edu/~randjosh/ and /projects.html and /learn-capstones.html',flush=True)
    print('NOTE: This does not certify all games, 300 curricula, or 8,000 learning objects.',flush=True)

if __name__=='__main__':
    try: main()
    except Exception as e:
        print('STOP:',e,file=sys.stderr,flush=True)
        sys.exit(1)
