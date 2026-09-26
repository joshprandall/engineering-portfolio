"""Capture audited live bytes without changing live or overwriting divergent source."""
import hashlib,json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
LIVE=Path('Z:/public_html')
BASE='35f9db9e25285ff4b4828a1089e862f1c05ede8e'
def digest(b):return hashlib.sha256(b).hexdigest()
def main():
    inventory=json.loads((ROOT/'docs/audit-evidence/live-inventory.json').read_text())
    committed=json.loads((ROOT/'docs/audit-evidence/git-head-inventory.json').read_text())
    by_hash={x['sha256']:dict(kind='git-blob',commit=BASE,path=x['path'],blob=x['blob']) for x in committed}
    records=[];imports=[];binaries=[]
    for item in inventory:
        p=item['path'];sha=item['sha256'];row={**item,'source':'Z:/public_html/'+p,'capture':'2026-09-26','baselineCommit':BASE}
        if not sha:
            row['storage']={'kind':'unresolved','reason':'Live content read denied during audit'};records.append(row);continue
        if sha in by_hash: row['storage']=by_hash[sha];records.append(row);continue
        data=(LIVE/p).read_bytes()
        if len(data)!=item['size'] or digest(data)!=sha:raise RuntimeError('Live changed since audit: '+p)
        runtime=(p.startswith('games/evil-wizard/') or p.startswith('assets/') or p in ['ASIMOV.jpg','joshua-randall.jpg','osu-logo.png','Joshua_Randall_MASTER_RESUME_L.docx','Joshua_Randall_Resume(2).pdf','games/3d-battle-chess/shared-game.js'])
        if p.endswith('.wasm') or p.endswith('.mp4'):
            canonical='assets/fusion-presentation.mp4' if p.endswith('.mp4') else 'games/evil-wizard/index.wasm'
            name=('fusion-presentation-' if p.endswith('.mp4') else 'evil-wizard-engine-')+sha+Path(p).suffix
            dest=ROOT/'.asset-cache'/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
            storage={'kind':'release-asset','filename':name,'sha256':sha,'size':len(data),'canonicalPath':canonical,'releaseTag':'website-2.0-preservation-20260926','state':'pending-upload'}
            binaries.append({**storage,'canonicalFilename':Path(canonical).name,'expectedDeployedPath':canonical,'provenance':row['source'],'ownership':'Fusion: Joshua Randall / OSU team; redistribution terms not independently documented' if p.endswith('.mp4') else 'Godot engine web export; preserve Godot and bundled third-party notices; project content separately owned','sourceUrl':'https://web.engr.oregonstate.edu/~randjosh/'+canonical})
        else:
            dest=ROOT/p if runtime and not (ROOT/p).exists() else ROOT/'preservation/live-20260926'/p
            if dest.exists() and digest(dest.read_bytes())!=sha:raise RuntimeError('Refusing overwrite: '+str(dest))
            dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(data)
            storage={'kind':'repository-file','path':dest.relative_to(ROOT).as_posix()}
            if dest==ROOT/p:imports.append(p)
        by_hash[sha]=storage;row['storage']=storage;records.append(row)
    m=ROOT/'manifests';m.mkdir(exist_ok=True)
    (m/'live-preservation.json').write_text(json.dumps({'schemaVersion':1,'baselineCommit':BASE,'readOnlySource':'Z:/public_html','files':records,'unresolvedDirectories':['.codex']},indent=2)+'\n')
    (m/'large-assets.json').write_text(json.dumps({'schemaVersion':1,'assets':binaries},indent=2)+'\n')
    (m/'live-imports.json').write_text(json.dumps({'schemaVersion':1,'directRuntimeImports':imports},indent=2)+'\n')
    print(json.dumps({'liveFiles':len(records),'directImports':imports,'uniqueLargeAssets':len(binaries),'unresolved':[r['path'] for r in records if r['storage']['kind']=='unresolved']},indent=2))
if __name__=='__main__':main()
