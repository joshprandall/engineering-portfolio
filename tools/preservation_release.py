"""Store preservation binaries in a draft GitHub release; never deploy the site.

Uses the repository's existing Git credential helper in memory, never logs credentials.
"""
import hashlib,json,subprocess,urllib.request,urllib.error,urllib.parse
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
API='https://api.github.com/repos/joshprandall/engineering-portfolio'
TAG='website-2.0-preservation-20260926'
def credentials():
    r=subprocess.run(['git','credential','fill'],input='protocol=https\nhost=github.com\n\n',text=True,capture_output=True,check=True)
    values=dict(line.split('=',1) for line in r.stdout.splitlines() if '=' in line)
    return values['password']
def main():
    token=credentials()
    def request(url,data=None):
        req=urllib.request.Request(url,data=json.dumps(data).encode() if data is not None else None,headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2026-03-10','User-Agent':'website2-preservation','Content-Type':'application/json'})
        with urllib.request.urlopen(req,timeout=60) as response:return json.load(response)
    repo=request(API)
    if not repo.get('permissions',{}).get('push'):raise RuntimeError('Repository write support not verified')
    releases=request(API+'/releases?per_page=100');release=next((r for r in releases if r['tag_name']==TAG),None)
    if not release:
        release=request(API+'/releases',{'tag_name':TAG,'target_commitish':'35f9db9e25285ff4b4828a1089e862f1c05ede8e','name':'WEBSITE 2.0 preservation assets — not deployed','body':'Read-only preservation of the audited OSU assets. Draft storage only; no production deployment or main merge. Canonical paths, provenance and SHA-256 checks are recorded on website-2.0-reconciliation in manifests/large-assets.json. Retain this draft and its assets until a verified durable successor exists.','draft':True,'prerelease':True,'make_latest':'false'})
    if not release['draft']:raise RuntimeError('Expected unpublished preservation draft')
    manifest=json.loads((ROOT/'manifests/large-assets.json').read_text())
    existing={a['name']:a for a in request(release['assets_url'])}
    for item in manifest['assets']:
        file=ROOT/'.asset-cache'/item['filename']
        if file.stat().st_size!=item['size'] or hashlib.sha256(file.read_bytes()).hexdigest()!=item['sha256']:raise RuntimeError('Local asset integrity failure')
        asset=existing.get(item['filename'])
        if not asset:
            url=release['upload_url'].split('{')[0]+'?name='+urllib.parse.quote(item['filename'])
            with file.open('rb') as data:
                req=urllib.request.Request(url,data=data,method='POST',headers={'Authorization':'Bearer '+token,'User-Agent':'website2-preservation','Content-Type':'application/octet-stream','Content-Length':str(item['size'])})
                with urllib.request.urlopen(req,timeout=600) as response:asset=json.load(response)
        if asset['size']!=item['size'] or asset.get('digest')!='sha256:'+item['sha256']:raise RuntimeError('Remote asset digest does not match')
        item.update(state='uploaded-and-server-digest-verified',releaseId=release['id'],assetId=asset['id'],apiUrl=asset['url'],downloadUrl=asset['browser_download_url'],releaseUrl=release['html_url'],requiresRepositoryReadAccess=True)
        (ROOT/'manifests/large-assets.json').write_text(json.dumps(manifest,indent=2)+'\n')
        print('Verified remote asset:',item['filename'],flush=True)
    preservation=json.loads((ROOT/'manifests/live-preservation.json').read_text())
    for row in preservation['files']:
        if row['storage']['kind']=='release-asset':
            item=next(a for a in manifest['assets'] if a['sha256']==row['sha256'])
            row['storage'].update(state=item['state'],assetId=item['assetId'],apiUrl=item['apiUrl'],releaseId=release['id'])
    (ROOT/'manifests/live-preservation.json').write_text(json.dumps(preservation,indent=2)+'\n')
    print('Draft asset storage verified; production unchanged.')
if __name__=='__main__':main()
