"""Build only committed runtime bytes plus verified artifacts into local staging.

No worktree fallback, production access, deployment, or shell deletion is used.
"""
import argparse, hashlib, io, json, shutil, subprocess, tarfile, posixpath
from urllib.parse import urlsplit,unquote
from website2_routes import References
from pathlib import Path, PurePosixPath
from restore_website2_assets import read_bytes
ROOT=Path(__file__).resolve().parents[1]
TARGET=ROOT/'staging/website-2.0-runtime'
def digest(data):return hashlib.sha256(data).hexdigest()
def owner(path):
    for prefix in ('games/','geometric-lab/','qubit-preview-20260921/','deep-learning/'):
        if path.startswith(prefix):return '/'.join(path.split('/')[:2]) if prefix=='games/' else prefix.rstrip('/')
    if path.startswith(('learn','lesson','knowledge')):return 'learning'
    if path.startswith('site-'):return path.split('.')[0]
    return 'portfolio'
def build(commit,refresh=False):
    commit=subprocess.check_output(['git','rev-parse','--verify',commit+'^{commit}'],cwd=ROOT,text=True).strip()
    archive=subprocess.check_output(['git','archive','--format=tar',commit],cwd=ROOT)
    with tarfile.open(fileobj=io.BytesIO(archive)) as tar:
        blobs={m.name:tar.extractfile(m).read() for m in tar.getmembers() if m.isfile()}
    def manifest(name):return json.loads(blobs['manifests/'+name])
    routes=manifest('site-routes.json');old={r['path']:r for r in manifest('runtime-files.json')['files']}
    assets=manifest('large-assets.json')['assets'];asset_by_path={a['canonicalPath']:a for a in assets}
    imports={r['path']:r for r in manifest('live-imports.json')['files']}
    # Read every provenance input from the selected commit, never the mutable checkout.
    manifest('live-preservation.json');external=manifest('external-dependencies.json');manifest('evil-wizard-builds.json')
    paths=set()
    for route in routes['routes']:paths.add(route['path']);paths.update(route['runtimeDependencies'])
    paths.update(p for p in old if p.startswith('deep-learning/'))
    paths.update(asset_by_path)
    paths.update(r['localCounterpart']['path'] for r in external['dependencies'] if 'localCounterpart' in r)
    # Server configuration belongs to its exported runtime unit.
    paths.update(p for p in blobs if p.startswith('games/evil-wizard/') and p.endswith('.htaccess'))
    for path in list(paths):
        if not path.endswith('.html') or path not in blobs:continue
        parser=References();parser.feed(blobs[path].decode('utf-8'))
        for ref,kind in parser.refs:
            u=urlsplit(ref)
            if u.scheme or ref.startswith('//') or not u.path:continue
            target=posixpath.normpath(posixpath.join(posixpath.dirname(path),unquote(u.path)))
            if ref.startswith('/'):target=unquote(u.path).lstrip('/')
            if target not in blobs and target.rstrip('/')+'/index.html' in blobs:target=target.rstrip('/')+'/index.html'
            if target not in blobs and target not in asset_by_path:raise ValueError('Missing exact-case HTML dependency: '+path+' -> '+ref)
            paths.add(target)
    files=[];payload={}
    for path in sorted(paths):
        pp=PurePosixPath(path)
        if pp.is_absolute() or '..' in pp.parts or pp.parts[0] in {'.git','.github','preservation','tests','tools','project-sources','.asset-cache','staging'} or '.bak' in path or 'before-' in path:
            raise ValueError('Disallowed runtime path: '+path)
        if path in asset_by_path:
            asset=asset_by_path[path];data=read_bytes({'kind':'release-asset'},asset['sha256'],assets)
            if digest(data)!=asset['sha256'] or len(data)!=asset['size']:raise ValueError('Artifact checksum: '+path)
            source={'kind':'release-asset','assetId':asset['assetId'],'sha256':asset['sha256'],'provenance':asset['provenance']}
        else:
            if path not in blobs:raise ValueError('Missing exact-case committed file: '+path)
            data=blobs[path];source={'kind':'git-blob','blob':hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()}
            if path in imports:source['provenance']=imports[path]['source']
        if not refresh:
            expected=old.get(path)
            if expected is None:raise ValueError('Not in runtime allowlist: '+path)
            if digest(data)!=expected['sha256'] or len(data)!=expected['size']:
                # Phase 2's explicit Windows-working-tree hash convention only.
                legacy=manifest('runtime-files.json').get('schemaVersion')==1
                crlf=data.replace(b'\r\n',b'\n').replace(b'\n',b'\r\n')
                if not legacy or digest(crlf)!=expected['sha256']:raise ValueError('Unexpected hash: '+path)
        payload[path]=data
        files.append({'path':path,'size':len(data),'sha256':digest(data),'source':source,'owningComponent':owner(path),'deploymentClassification':'KEEP_PRODUCTION'})
    result={'schemaVersion':2,'sourceCommit':commit,'bytePolicy':'Exact Git blobs; artifacts verified against committed SHA-256 and size.','files':files,'fileCount':len(files),'byteSize':sum(f['size'] for f in files)}
    # Build/verify first. Replace only this explicitly named local staging directory.
    resolved=TARGET.resolve();allowed=(ROOT/'staging').resolve()
    if resolved.parent!=allowed or resolved.name!='website-2.0-runtime':raise ValueError('Unsafe output')
    if TARGET.is_symlink():raise ValueError('Symlink output forbidden')
    if TARGET.exists():
        if any(p.is_symlink() for p in TARGET.rglob('*')):raise ValueError('Symlink in previous output')
        shutil.rmtree(TARGET)
    for path,data in payload.items():
        target=TARGET/path;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
        if digest(target.read_bytes())!=digest(data):raise ValueError('Output verification failed: '+path)
    report=ROOT/'staging/website-2.0-runtime-manifest.json';report.write_text(json.dumps(result,indent=2)+'\n')
    if refresh:(ROOT/'manifests/runtime-files.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps({'commit':commit,'files':result['fileCount'],'bytes':result['byteSize'],'output':str(TARGET)}))
    return result
if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--commit',required=True);parser.add_argument('--refresh-manifest',action='store_true',help='Explicitly regenerate hashes from exact committed Git blobs; never accept worktree bytes.');args=parser.parse_args();build(args.commit,args.refresh_manifest)
