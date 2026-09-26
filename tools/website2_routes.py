"""Generate conservative page dependency units and remote provenance; never deploy."""
import hashlib, json, posixpath, re
from pathlib import Path
from urllib.parse import unquote, urlsplit
from html.parser import HTMLParser

ROOT=Path(__file__).resolve().parents[1]
M=ROOT/'manifests'
def save(name,value):
    (M/name).write_text(json.dumps(value,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')

class References(HTMLParser):
    def __init__(self):super().__init__();self.refs=[]
    def handle_starttag(self,tag,attrs):
        for key,value in attrs:
            if value and key in ('src','href','poster','data-src'):
                self.refs.append((value,'navigation' if tag=='a' else 'runtime'))

def main():
    runtime=json.loads((M/'runtime-files.json').read_text())['files']
    files={r['path']:r for r in runtime}
    edges={p:set() for p in files};links={p:set() for p in files}
    missing=[];external={};texts={}
    def remote(url,source,origin):
        if '${' in url:return
        row=external.setdefault(url,{'url':url,'consumers':[]})
        consumer={'source':source,'evidence':origin}
        if consumer not in row['consumers']:row['consumers'].append(consumer)
    def resolve(source,value,kind,strict=False):
        value=value.strip();u=urlsplit(value)
        if u.scheme in ('http','https') or value.startswith('//'):
            remote(value,source,'current-runtime');return
        if u.scheme or not u.path or '${' in value:return
        target=posixpath.normpath(posixpath.join(posixpath.dirname(source),unquote(u.path)))
        if value.startswith('/'):target=unquote(u.path).lstrip('/')
        if target not in files and target.rstrip('/')+'/index.html' in files:target=target.rstrip('/')+'/index.html'
        if target in files:
            (links if kind=='navigation' else edges)[source].add(target)
            if kind=='navigation' and not target.endswith('.html'):edges[source].add(target)
        elif strict and not value.startswith('#'):missing.append({'source':source,'reference':value,'resolved':target})
    for p in files:
        if Path(p).suffix not in ('.html','.css','.js','.json'):continue
        text=(ROOT/p).read_text(encoding='utf-8',errors='replace');texts[p]=text
        if p.endswith('.html'):
            parser=References();parser.feed(text)
            for value,kind in parser.refs:resolve(p,value,kind,True)
        for value in re.findall(r'https?://[^\s"\'<>`\\)]+',text):remote(value,p,'current-runtime')
        for match in re.finditer(r'''["']([^"'\r\n]+\.(?:js|css|json|html|svg|png|jpg|jpeg|webp|mp3|wav|ogg|mp4|wasm|pck)(?:\?[^"'\r\n]*)?)["']''',text):
            value=match.group(1)
            if text[match.end():match.end()+32].lstrip().startswith(':'):continue # Filename dictionary keys are not loads.
            resolve(p,value,'runtime')
        for value in re.findall(r'url\(\s*["\']?([^\)"\']+)',text):resolve(p,value,'runtime')
    linked_docs={target for values in list(edges.values())+list(links.values()) for target in values if target.endswith(('.md','.txt'))}
    routes=[]
    for p in sorted(x for x in files if x.endswith('.html')):
        closure={p};todo=[p]
        while todo:
            for dep in edges[todo.pop()]:
                if dep not in closure:closure.add(dep);todo.append(dep)
        boundary='portfolio'
        for prefix in ('games/evil-wizard/','games/3d-battle-chess/','geometric-lab/','qubit-preview-20260921/'):
            if p.startswith(prefix):boundary=prefix.rstrip('/');closure.update(x for x in files if x.startswith(prefix) and (not x.endswith(('.md','.txt')) or x in linked_docs))
        if p.startswith('learn') or p=='lesson.html':
            boundary='learning';closure.update(x for x in files if x.startswith(('deep-learning/','data/')))
        navigation=set(links[p])
        for dep in closure:navigation.update(links.get(dep,()))
        title=re.search(r'<title>(.*?)</title>',texts[p],re.S)
        routes.append({'path':p,'title':title.group(1).strip() if title else p,'boundary':boundary,
            'runtimeDependencies':sorted(closure-{p}),'linkedRoutes':sorted(x for x in navigation if x.endswith('.html')),
            'externalDependencies':sorted(url for url,row in external.items() if any(c['source'] in closure for c in row['consumers'])),
            'deploymentPolicy':'Ship with dependency closure and all linked routes in one verified runtime package.'})
    # Retain audit-only remote consumers with an explicit historical/live label.
    for row in json.loads((ROOT/'docs/audit-evidence/external-dependencies.json').read_text()):
        remote(row['url'],row['source'],'audit-'+row['tree'])
    for url,row in external.items():
        host=urlsplit(url).hostname or ''
        group=('pexels' if 'pexels.com' in host else 'wikimedia' if 'wikimedia.org' in host else 'three-cdn' if 'three' in url and ('jsdelivr' in host or 'unpkg' in host) else 'osu' if 'oregonstate.edu' in host else 'other')
        row.update(provider=group,sha256=None,license='Not independently verified; retain source credits and verify terms before mirroring.',preservation='Remote reference only unless a local counterpart is explicitly recorded.')
        row['fallbackContract']={
            'pexels':'Video error retains poster; if remote poster also fails, site content and local CSS background must remain usable. Do not gate navigation on media.',
            'wikimedia':'Ambient failure must not block content, controls or navigation; silence is acceptable. No verified equivalence to similarly named local MP3 is inferred.',
            'three-cdn':'Pinned module loading failure activates the local shared-state 2D board; retry must retain match state. Keep version pins until tested migration.',
            'osu':'Resolve same-site absolute media to preserved local bytes when available. Preserve existing URL until route migration and consumer checks pass.',
            'other':'External links are not bundled. Embedded media must remain supplementary; each provider-specific outage contract needs acceptance before release.'}[group]
        if group=='osu' and '/~randjosh/' in urlsplit(url).path:
            counterpart=unquote(urlsplit(url).path.split('/~randjosh/',1)[1])
            if counterpart in files:row['localCounterpart']=files[counterpart]
    save('site-routes.json',{'navigation':json.loads((M/'site-routes.json').read_text(encoding='utf-8')).get('navigation',[]),'schemaVersion':1,'status':'candidate-not-deployed','deploymentMode':'atomic-complete-runtime-allowlist','runtimeManifest':'manifests/runtime-files.json','method':'HTML attributes plus static code/CSS references and conservative whole game/lab/learning units. Computed paths require package browser acceptance; this is not proof of dynamic closure.','unresolvedReferences':missing,'routes':routes})
    save('external-dependencies.json',{'schemaVersion':1,'inventoryOnly':True,'networkFetched':False,'dependencies':[external[u] for u in sorted(external)]})
    units=[]
    preserved=json.loads((M/'live-preservation.json').read_text())
    folders=sorted({str(Path(r['path']).parent).replace('\\','/') for r in preserved['files'] if r['path'].endswith('/index.pck') and 'evil-wizard' in r['path']})
    for folder in folders:
        members=[r for r in preserved['files'] if r['path'].startswith(folder+'/')]
        units.append({'id':folder,'canonical':folder=='games/evil-wizard','buildIdentity':'Deployed-byte snapshot 2026-09-26; source-to-export reproducibility unproven','restorePath':folder,'members':[{'path':r['path'],'sha256':r['sha256'],'size':r['size'],'storage':r['storage']} for r in members]})
    save('evil-wizard-builds.json',{'schemaVersion':1,'sourceReproductionVerified':False,'restoreCommand':'python tools/restore_website2_assets.py --snapshot','units':units})
    print(f'Generated {len(routes)} routes, {len(external)} external references, {len(units)} distinct export units; {len(missing)} unresolved HTML references.')

if __name__=='__main__':main()
