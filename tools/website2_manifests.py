"""Build review-only cleanup and runtime manifests. This tool never deletes/deploys."""
import hashlib,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
M=ROOT/'manifests'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
def save(n,data):(M/n).write_text(json.dumps(data,indent=2)+'\n')
def main():
    preserved=json.loads((M/'live-preservation.json').read_text())
    baseline=set(subprocess.check_output(['git','ls-tree','-r','--name-only',preserved['baselineCommit']],cwd=ROOT,text=True).splitlines())
    rows=[];imports=[]
    historical=re.compile(r'(^|/)(?:_before|_safe|backup)|\.bak(?:$|\.)|\.before|before-|projects-qubit-backup|^Joshua_Randall_Knowledge_Platform_|^games/evil-wizard-|^games/3d-battle-chess-v8/|^site-repair/|^project-sources/|^games/battle-chess/')
    for r in preserved['files']:
        p=r['path'];storage=r['storage']
        if storage['kind']=='unresolved':category='UNRESOLVED';reason='Content unreadable; retain live untouched.'
        elif p in ['fusion-presentation.mp4','Thumbs.db']:category='DELETE_AFTER_VERIFICATION';reason='Duplicate video or generated OS cache; archival and URL gates still required.'
        elif historical.search(p) or (p.endswith(('.zip','.py','.mjs','.txt')) and not p.startswith('assets/')) or p in ['audio-diagnostic.html','header-cleanup.css','learn-brand.css','lesson-header-controls.js']:
            category='ARCHIVE';reason='Preserved historical/source/diagnostic material; exclude from future runtime after consumer review.'
        elif p not in baseline:category='IMPORT_TO_GITHUB';reason='Live-only asset preserved in branch or checksum-verified draft assets; keep live until release verification.'
        else:category='KEEP_PRODUCTION';reason='Current runtime or linked attribution; preserve existing live behavior until validated replacement.'
        row={'path':p,'category':category,'sha256':r['sha256'],'size':r['size'],'reason':reason,'preservedStorage':storage,'deleteAuthorized':False}
        if category in ['ARCHIVE','DELETE_AFTER_VERIFICATION']:
            row['verificationRequired']=['Rehash live immediately before any future operation','Verify remote preservation and reconstruct bytes independently','Resolve runtime and external URL consumers','Approve a separate deterministic cleanup operation']
        rows.append(row)
        if p not in baseline and (ROOT/p).is_file() and p not in ['fusion-presentation.mp4']:
            imports.append({'path':p,'sha256':sha(ROOT/p),'size':(ROOT/p).stat().st_size,'storage':'external-restored' if p.endswith(('.mp4','.wasm')) else 'git-file','source':'Z:/public_html/'+p})
    rows.append({'path':'.codex/','category':'UNRESOLVED','sha256':None,'size':None,'reason':'Directory enumeration denied; no cleanup authorized.','deleteAuthorized':False})
    save('production-cleanup.json',{'schemaVersion':1,'scope':'captured-live-tree','executionAllowed':False,'source':'Z:/public_html','categories':['KEEP_PRODUCTION','IMPORT_TO_GITHUB','ARCHIVE','DELETE_AFTER_VERIFICATION','UNRESOLVED'],'files':rows})
    save('live-imports.json',{'schemaVersion':1,'files':imports})
    runtime=[]
    for p in ROOT.rglob('*'):
        if not p.is_file():continue
        rel=p.relative_to(ROOT).as_posix();parts=rel.split('/')
        if parts[0] in ['.git','.asset-cache','staging','preservation','docs','tools','tests','node_modules','.github','project-sources','site-repair','release-upload','manifests']:continue
        if (rel.startswith('games/battle-chess/') and rel!='games/battle-chess/index.html') or p.suffix=='.pyc':continue
        if len(parts)==1 and p.suffix not in ['.html','.css','.js','.json','.jpg','.png','.pdf','.docx']:continue
        runtime.append({'path':rel,'sha256':sha(p),'size':p.stat().st_size,'storage':'release-asset' if rel in ['assets/fusion-presentation.mp4','games/evil-wizard/index.wasm'] else 'git-file'})
    save('runtime-files.json',{'schemaVersion':1,'status':'candidate-only-not-deployed','sourceBranch':'website-2.0-reconciliation','files':runtime})
    # A readable derivative fixes the historical mojibake without corrupting provenance.
    source=ROOT/'preservation/live-20260926/projects-qubit-backup-20260921-224301.html'
    if source.exists():
        text=source.read_text(encoding='utf-8')
        for bad,good in [('Â·','·'),('â†—','↗'),('â†’','→'),('â€”','—'),('â€“','–'),('â€™','’')]:text=text.replace(bad,good)
        dest=ROOT/'preservation/normalized/projects-qubit-backup-20260921-224301.html';dest.parent.mkdir(exist_ok=True);dest.write_text(text,encoding='utf-8')
        save('normalized-history.json',{'original':source.relative_to(ROOT).as_posix(),'originalSha256':sha(source),'normalized':dest.relative_to(ROOT).as_posix(),'normalizedSha256':sha(dest),'runtime':False,'reason':'Readable derivative only; original preserved byte-for-byte.'})
    print('Review-only cleanup entries:',len(rows),'runtime imports:',len(imports),'candidate runtime files:',len(runtime))
if __name__=='__main__':main()
