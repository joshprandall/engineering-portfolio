"""Refresh route inputs for review before committing; package builds still use Git."""
import hashlib,json
from pathlib import Path
from website2_routes import main as routes
ROOT=Path(__file__).resolve().parents[1]
def main():
    p=ROOT/'manifests/runtime-files.json';m=json.loads(p.read_text());files={r['path']:r for r in m['files']}
    # New standard-page components and generated metadata are explicit runtime candidates.
    for glob in ('*.html','site-*.js','site-*.css','assets/site-*.json'):
        for f in ROOT.glob(glob):
            rel=f.relative_to(ROOT).as_posix()
            if rel not in files:files[rel]={'path':rel,'size':f.stat().st_size,'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'source':{'kind':'candidate-worktree'},'owningComponent':'portfolio','deploymentClassification':'KEEP_PRODUCTION'}
    m['files']=list(files.values());p.write_text(json.dumps(m,indent=2)+'\n');routes()
if __name__=='__main__':main()
