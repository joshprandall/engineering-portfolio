"""Refresh route inputs for review before committing; package builds still use Git."""
import hashlib,json
from pathlib import Path
from website2_routes import main as routes
ROOT=Path(__file__).resolve().parents[1]
def candidate(rel):
    f=ROOT/rel
    return {'path':rel,'size':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'source':{'kind':'candidate-worktree'},'owningComponent':'portfolio','deploymentClassification':'KEEP_PRODUCTION'}
def main():
    p=ROOT/'manifests/runtime-files.json';m=json.loads(p.read_text());files={r['path']:r for r in m['files']}
    # Runtime candidates come from what pages actually load (the route closure below) and from the
    # verified large assets. A fixed list of filename patterns used to add files here; it missed
    # files added later and re-added unreferenced ones on every run.
    large={}
    for asset in json.loads((ROOT/'manifests/large-assets.json').read_text())['assets']:
        rel=asset['canonicalPath'];large[rel]=asset
        if rel not in files:files[rel]={'path':rel,'size':asset['size'],'sha256':asset['sha256'],'source':{'kind':asset['kind']},'owningComponent':'site-scenes','deploymentClassification':'KEEP_PRODUCTION'}
    # Every file a route actually depends on must be a runtime candidate, including files that
    # scripts inject or fetch at run time. Repeat until the route set and the manifest agree.
    for _ in range(4):
        m['files']=list(files.values());p.write_text(json.dumps(m,indent=2)+'\n');routes()
        site=json.loads((ROOT/'manifests/site-routes.json').read_text())
        needed={dep for r in site['routes'] for dep in [r['path'],*r['runtimeDependencies']]}
        added=[rel for rel in sorted(needed) if rel not in files and rel not in large and (ROOT/rel).is_file()]
        if not added:break
        for rel in added:files[rel]=candidate(rel)
    else:
        raise SystemExit('Runtime metadata did not converge.')
if __name__=='__main__':main()
