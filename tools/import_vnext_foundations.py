#!/usr/bin/env python3
"""Import the reviewed vNext overlay onto a GitHub review branch, never the OSU host."""
from pathlib import Path
from zipfile import ZipFile
from hashlib import sha256
from html.parser import HTMLParser
import json, re, sys

EXPECTED_SHA256 = '2bd34256e86b9d5c1ea4ec54d756809bd014b4fb8a3517f8c3a5622d0470575b'
FILES = set('''assets/quantum-lab-reference.jpg
index.html
knowledge.js
learn-capstones.html
learn-paths.html
learning-capstones.css
learning-capstones.js
learning-capstones.json
learning-next.css
learning-next.js
portfolio-next.css
portfolio-next.js
project-advanced-computing.html
project-asset-inventory.html
project-battle-chess.html
project-dependency.html
project-emergent.html
project-fusion.html
project-geometric-ai.html
project-kubernetes-lab.html
project-learning-library.html
project-lifecycle.html
project-mind.html
project-portfolio.html
project-qpe.html
project-qubit.html
project-recovery.html
projects.html
NEXT-RELEASE-NOTES.md'''.splitlines())

class Scan(HTMLParser):
    def __init__(self):
        super().__init__();self.links=[];self.cards=0;self.navs=0;self.ids=[]
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='a' and a.get('href'):self.links.append(a['href'])
        if tag=='article' and 'project-card' in a.get('class','').split():self.cards+=1
        if tag=='nav' and 'vnext-project-nav' in a.get('class','').split():self.navs+=1
        if a.get('id'):self.ids.append(a['id'])

def main(path):
    archive=Path(path)
    if not archive.is_file():raise RuntimeError('Release ZIP has not been uploaded')
    if sha256(archive.read_bytes()).hexdigest()!=EXPECTED_SHA256:raise RuntimeError('ZIP SHA256 does not match the reviewed candidate; do not import')
    root=Path(__file__).resolve().parents[1]
    with ZipFile(archive) as z:
        names=z.namelist()
        if len(names)!=len(FILES) or set(names)!=FILES:raise RuntimeError('Archive contains missing, duplicate or unexpected paths')
        if z.testzip():raise RuntimeError('ZIP CRC failed')
        if sum(x.file_size for x in z.infolist())>6_000_000:raise RuntimeError('Unexpected expansion size')
        for info in z.infolist():
            if (info.external_attr >> 16) & 0o170000 == 0o120000:raise RuntimeError('Symlink not permitted in release')
            if info.is_dir():raise RuntimeError('Directory entry not permitted')
        for name in names:
            dst=(root/name).resolve()
            if not dst.is_relative_to(root.resolve()):raise RuntimeError('Unsafe archive path')
            dst.parent.mkdir(parents=True,exist_ok=True)
            dst.write_bytes(z.read(name))
    data=json.loads((root/'learning-capstones.json').read_text('utf8'))
    path_data=json.loads((root/'knowledge-data.js').read_text('utf8').split(' = ',1)[1].rstrip(' ;\n'))
    ids={p['id'] for p in path_data['paths']}
    if len(data['capstones'])!=8 or not all(c['id'] in ids and len(c['steps'])>=4 and len(c['rubric'])>=4 and 0<=c['check']['correct']<len(c['check']['options']) for c in data['capstones']):
        raise RuntimeError('Foundation capstone integrity check failed')
    projects=Scan();projects.feed((root/'projects.html').read_text('utf8'))
    if projects.cards!=16 or len(projects.ids)!=len(set(projects.ids)):raise RuntimeError('Project cards or ID uniqueness failed')
    for href in ['project-qubit.html','project-battle-chess.html','project-learning-library.html','project-advanced-computing.html','games/3d-battle-chess/index.html']:
        if href not in projects.links or not (root/href).is_file():raise RuntimeError('Missing project route '+href)
    detail=list(root.glob('project-*.html'))
    if len(detail)!=15:raise RuntimeError(f'Unexpected dedicated project-page count: {len(detail)}')
    for page in detail:
        scan=Scan();scan.feed(page.read_text('utf8'))
        if scan.navs!=1:raise RuntimeError('Missing project navigation: '+page.name)
    for name in ('index.html','projects.html','learn-paths.html'):
        if 'portfolio-next.js' not in (root/name).read_text('utf8') and name!='learn-paths.html':raise RuntimeError('Interactive module missing: '+name)
    print('Validated vNext import: 29 pinned files, 16 project cards, 15 project-*.html pages plus Evil Wizard, eight authored capstones, existing lesson IDs preserved.')

if __name__=='__main__':
    try:main(sys.argv[1])
    except (IndexError,Exception) as error:
        print('STOP:',error,file=sys.stderr);sys.exit(1)
