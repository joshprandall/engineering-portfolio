"""Hash-verified restore into this checkout or a new LOCAL staging tree; never production.

Default restores canonical large runtime assets. --snapshot reconstructs the readable
audited tree under staging/live-20260926 without overwriting divergent files.
"""
import argparse,hashlib,json,subprocess,urllib.request
from pathlib import Path
from preservation_release import credentials
ROOT=Path(__file__).resolve().parents[1]
def read_bytes(storage,sha,assets,refresh=False):
    if storage['kind']=='git-blob':return subprocess.check_output(['git','cat-file','blob',storage['blob']],cwd=ROOT)
    if storage['kind']=='repository-file':return (ROOT/storage['path']).read_bytes()
    asset=next(x for x in assets if x['sha256']==sha);cache=ROOT/'.asset-cache'/asset['filename']
    if cache.exists() and not refresh:return cache.read_bytes()
    req=urllib.request.Request(asset['apiUrl'],headers={'Accept':'application/octet-stream','Authorization':'Bearer '+credentials(),'User-Agent':'website2-restore'})
    # Do not forward credentials to the signed asset download host.
    class Redirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self,req,fp,code,msg,headers,newurl):
            redirected=super().redirect_request(req,fp,code,msg,headers,newurl)
            redirected.remove_header('Authorization');return redirected
    with urllib.request.build_opener(Redirect()).open(req,timeout=300) as response:data=response.read()
    if hashlib.sha256(data).hexdigest()!=sha:raise RuntimeError('Downloaded asset checksum mismatch')
    cache.parent.mkdir(exist_ok=True);cache.write_bytes(data);return data
def materialize(destination,data,sha,size):
    destination=destination.resolve()
    if not destination.is_relative_to(ROOT) or destination.is_relative_to(ROOT/'.git'):raise RuntimeError('Restore must stay inside the local checkout, outside .git')
    if len(data)!=size or hashlib.sha256(data).hexdigest()!=sha:raise RuntimeError('Preserved bytes fail manifest: '+str(destination))
    if destination.exists():
        if hashlib.sha256(destination.read_bytes()).hexdigest()!=sha:raise RuntimeError('Refusing to overwrite divergent file: '+str(destination))
        return
    destination.parent.mkdir(parents=True,exist_ok=True);destination.write_bytes(data)
def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--snapshot',action='store_true');parser.add_argument('--runtime-imports',action='store_true');parser.add_argument('--refresh',action='store_true',help='Download release assets independently of the local cache');args=parser.parse_args()
    assets=json.loads((ROOT/'manifests/large-assets.json').read_text())['assets']
    live=json.loads((ROOT/'manifests/live-preservation.json').read_text())['files']
    if args.snapshot:
        rows=[r for r in live if r['storage']['kind']!='unresolved'];base=ROOT/'staging/live-20260926'
    elif args.runtime_imports:
        rows=[r for r in live if r['path'].startswith('games/evil-wizard/') or r['path'] in ['joshua-randall.jpg','osu-logo.png','Joshua_Randall_MASTER_RESUME_L.docx']];base=ROOT
    else:
        rows=[dict(path=a['canonicalPath'],size=a['size'],sha256=a['sha256'],storage={'kind':'release-asset'}) for a in assets];base=ROOT
    for row in rows:materialize(base/row['path'],read_bytes(row['storage'],row['sha256'],assets,args.refresh),row['sha256'],row['size'])
    print('Verified/restored',len(rows),'files to',base)
if __name__=='__main__':main()
