"""Validate isolated package bytes, exact-case HTML closure and learning corpus."""
import hashlib,json,re,posixpath
from pathlib import Path
from urllib.parse import urlsplit,unquote
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parents[1]
class Page(HTMLParser):
    def __init__(self):super().__init__();self.refs=[];self.ids=[];self.visible=[];self.hidden=0
    def handle_starttag(self,tag,attrs):
        if tag in ('script','style'):self.hidden+=1
        for k,v in attrs:
            if k=='id':self.ids.append(v)
            if k in ('src','href','poster') and v:self.refs.append(v)
    def handle_endtag(self,tag):
        if tag in ('script','style'):self.hidden=max(0,self.hidden-1)
    def handle_data(self,text):
        if not self.hidden:self.visible.append(text)
def validate():
    package=ROOT/'staging/website-2.0-runtime';m=json.loads((ROOT/'staging/website-2.0-runtime-manifest.json').read_text())
    files={r['path']:r for r in m['files']};actual={p.relative_to(package).as_posix() for p in package.rglob('*') if p.is_file()}
    assert actual==set(files),'Package contains unexpected/missing files'
    issues=[];pages=0
    for p,r in files.items():
        data=(package/p).read_bytes();assert len(data)==r['size'] and hashlib.sha256(data).hexdigest()==r['sha256'],p
        if not p.endswith('.html'):continue
        pages+=1;parser=Page();parser.feed(data.decode('utf-8'))
        if len(parser.ids)!=len(set(parser.ids)):issues.append((p,'duplicate IDs'))
        visible=''.join(parser.visible)
        if '\\n' in visible or any(x in visible for x in ('Â','â†','â€','�')):issues.append((p,'rendered encoding/newline defect'))
        for ref in parser.refs:
            u=urlsplit(ref)
            if u.scheme or ref.startswith('//') or not u.path:continue
            path=posixpath.normpath(posixpath.join(posixpath.dirname(p),unquote(u.path)))
            if ref.startswith('/'):path=u.path.lstrip('/')
            if path not in files and path.rstrip('/')+'/index.html' in files:path=path.rstrip('/')+'/index.html'
            if path not in files:issues.append((p,ref))
    data=json.loads((package/'knowledge-data.js').read_text(encoding='utf-8').split('=',1)[1].strip().rstrip(';'))
    lessons=data['lessons'];assert len(lessons)==8000 and len({l['id'] for l in lessons})==8000
    chunk_index=json.loads((package/'deep-learning/index.json').read_text(encoding='utf-8'))
    chunks=['deep-learning/'+p for p in sorted(set(chunk_index.values()))]
    assert len(chunks)==76,len(chunks)
    ids=set()
    for p in chunks:ids.update(json.loads((package/p).read_text(encoding='utf-8')))
    assert ids=={l['id'] for l in lessons},'Lazy chunk IDs do not match corpus'
    result={'sourceCommit':m['sourceCommit'],'files':len(files),'bytes':m['byteSize'],'pages':pages,'learningRecords':len(lessons),'deepChunks':len(chunks),'issues':issues,'physicalDeviceTesting':False}
    dest=ROOT/'docs/phase3-evidence';dest.mkdir(exist_ok=True);(dest/'runtime-validation.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result));assert not issues,issues
if __name__=='__main__':validate()
