"""Analyze captured evidence; never write to the live tree."""
import csv,json,re,posixpath,hashlib,subprocess
from pathlib import Path
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'docs/audit-evidence'
def read(n): return json.loads((OUT/(n+'.json')).read_text(encoding='utf-8'))
def save(n,v): (OUT/(n+'.json')).write_text(json.dumps(v,indent=2,ensure_ascii=False)+'\n',encoding='utf-8')
metadata=list(csv.DictReader((OUT/'live-metadata.csv').open(encoding='utf-8-sig')))
inventory=read('live-inventory'); known={x['path'] for x in inventory}
for m in metadata:
    if m['PSIsContainer']=='False' and m['Path'] not in known:
        inventory.append(dict(path=m['Path'],size=int(m['Length']),mtimeUtc=m['MtimeUtc'],sha256=None,readError='Access denied; metadata only'))
save('live-inventory',sorted(inventory,key=lambda x:x['path']))
for name in ('comparison','git-live-comparison'):
    comparison=read(name); present={x['path'] for x in comparison}
    for item in inventory:
        if item['path'] not in present:
            comparison.append(dict(path=item['path'],status='live-only',live=item,**{'repository' if name=='comparison' else 'git':None}))
    save(name,sorted(comparison,key=lambda x:x['path']))
sources=read('runtime-sources')
historical=re.compile(r'backup|_before|_safe|before-|Joshua_Randall_Knowledge|^tests/|^site-repair/')
edges=read('dependencies'); extra=[]; external=[]
for tree,files in sources.items():
    paths={x['path'] for x in read('live-inventory' if tree=='live' else 'repository-inventory')}
    for file,s in files.items():
        for m in re.finditer(r'''["']([^"'\n<>]{1,250}\.(?:html|js|mjs|css|json|png|jpg|jpeg|svg|webp|mp3|wav|ogg|mp4|wasm|pck|ttf|woff2)(?:[?#][^"'\n<>]*)?)["']''',s):
            ref=m[1];kind='string-literal';clean=ref.split('?')[0].split('#')[0]
            if '${' in ref or '\\' in ref: continue
            if ref.startswith('https://web.engr.oregonstate.edu/~randjosh/'):
                target=clean.split('/~randjosh/')[1];kind='absolute-osu-url'
            elif re.match(r'^(?:https?:|//|data:)',ref):
                external.append(dict(tree=tree,source=file,line=s[:m.start()].count('\n')+1,url=ref));continue
            else: target=posixpath.normpath(posixpath.join(posixpath.dirname(file),clean))
            extra.append(dict(tree=tree,source=file,line=s[:m.start()].count('\n')+1,reference=ref,target=target,exists=target in paths,kind=kind,resolutionCaveat='Literal candidate: verify document base, dynamic assembly and import maps'))
    # Godot executable concatenation does not appear as normal src attributes.
    for file,s in files.items():
        if 'const GODOT_CONFIG =' in s:
            for name in ['index.js','index.pck','index.wasm','index.audio.worklet.js','index.audio.position.worklet.js']:
                target=posixpath.join(posixpath.dirname(file),name)
                extra.append(dict(tree=tree,source=file,line=1,reference=name,target=target,exists=target in paths,kind='godot-export-config'))
edges+=extra
for e in edges:
    e['historicalSource']=bool(historical.search(e['source']))
    if '/three' in e['target'] and (e['reference']=='three' or e['reference'].startswith('three/')): e['assessment']='Import-map CDN specifier, not a missing local file'
    elif e['historicalSource']: e['assessment']='Historical/test reference; not proof of current runtime requirement'
    elif e['exists']: e['assessment']='Target present'
    else: e['assessment']='Review literal resolution; not automatically a broken request'
save('dependencies-expanded',edges);save('external-dependencies',external)
class Visible(HTMLParser):
    def __init__(self):super().__init__(convert_charrefs=True);self.skip=0;self.findings=[]
    def handle_starttag(self,t,a):
        if t in ('script','style'):self.skip+=1
    def handle_endtag(self,t):
        if t in ('script','style'):self.skip=max(0,self.skip-1)
    def handle_data(self,d):
        if not self.skip and '\\n' in d:self.findings.append(dict(line=self.getpos()[0],text=d[:300]))
visible=[]
for tree,files in sources.items():
    for p,s in files.items():
        if p.endswith('.html'):
            parser=Visible();parser.feed(s)
            visible.extend(dict(tree=tree,file=p,**x) for x in parser.findings)
save('visible-literal-newlines',visible)
summary=read('summary');summary.update(liveFiles=len(inventory),liveBytes=sum(x['size'] for x in inventory),liveHashedFiles=sum(bool(x['sha256']) for x in inventory),unhashedFiles=[x['path'] for x in inventory if not x['sha256']],directoryCount=sum(m['PSIsContainer']=='True' for m in metadata))
summary['counts']['live-only']=sum(x['status']=='live-only' for x in read('comparison'))
provenance=read('git-provenance');provenance['counts']['live-only']=sum(x['status']=='live-only' for x in read('git-live-comparison'));save('git-provenance',provenance)
save('summary',summary)
print(json.dumps(summary,indent=2));print('Visible literal newlines:',visible)
