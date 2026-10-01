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
    def verified(data):
        if len(data)!=asset['size'] or hashlib.sha256(data).hexdigest()!=sha:
            raise RuntimeError('Preserved asset size/checksum mismatch: '+asset['canonicalPath'])
        return data
    if cache.exists() and not refresh:return verified(cache.read_bytes())
    if asset.get('kind')=='git-chunks':
        parts=[]
        for part in asset['chunks']:
            local=ROOT/part['path']
            data=local.read_bytes() if local.is_file() else subprocess.check_output(['git','cat-file','blob',part['blob']],cwd=ROOT)
            blob=hashlib.sha1(b'blob '+str(len(data)).encode()+b'\0'+data).hexdigest()
            if len(data)!=part['size'] or blob!=part['blob']:raise RuntimeError('Ambience source chunk mismatch: '+part['path'])
            parts.append(data)
        data=verified(b''.join(parts));cache.parent.mkdir(exist_ok=True);cache.write_bytes(data);return data

    headers={'Accept':'application/octet-stream','User-Agent':'website2-restore'}
    url=asset.get('sourceUrl')
    if asset.get('apiUrl'):
        try:token=credentials()
        except (subprocess.CalledProcessError,KeyError):token=None
        if token:
            url=asset['apiUrl'];headers['Authorization']='Bearer '+token
    # Public OSU bytes are an explicit, hash-pinned fallback, never an arbitrary
    # similarly named asset. A changed or missing source fails closed.
    if not url or not url.startswith('https://'):raise RuntimeError('No approved HTTPS asset source')
    req=urllib.request.Request(url,headers=headers)
    # Do not forward credentials to the signed asset download host.
    class Redirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self,req,fp,code,msg,headers,newurl):
            redirected=super().redirect_request(req,fp,code,msg,headers,newurl)
            redirected.remove_header('Authorization');return redirected
    with urllib.request.build_opener(Redirect()).open(req,timeout=300) as response:data=response.read()
    verified(data)
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
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--ambience',action='store_true',help='Restore all protected Day media from verified Git chunks, with no network dependency');parser.add_argument('--snapshot',action='store_true');parser.add_argument('--runtime-imports',action='store_true');parser.add_argument('--refresh',action='store_true',help='Download release assets independently of the local cache');args=parser.parse_args()
    assets=json.loads((ROOT/'manifests/large-assets.json').read_text())['assets']
    live=json.loads((ROOT/'manifests/live-preservation.json').read_text())['files']
    if args.snapshot:
        rows=[r for r in live if r['storage']['kind']!='unresolved'];base=ROOT/'staging/live-20260926'
    elif args.runtime_imports:
        rows=[r for r in live if r['path'].startswith('games/evil-wizard/') or r['path'] in ['joshua-randall.jpg','osu-logo.png','Joshua_Randall_MASTER_RESUME_L.docx']];base=ROOT
    else:
        rows=[dict(path=a['canonicalPath'],size=a['size'],sha256=a['sha256'],storage={'kind':'release-asset'}) for a in assets if not args.ambience or a['canonicalPath'].startswith(('assets/scenes/day/','assets/audio/day/'))];base=ROOT
    for row in rows:materialize(base/row['path'],read_bytes(row['storage'],row['sha256'],assets,args.refresh),row['sha256'],row['size'])
    print('Verified/restored',len(rows),'files to',base)
if __name__=='__main__':main()
