"""Inventory responsive hazards in every production CSS rule, including inline styles."""
import re,json,collections
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
records=[]
manifest=json.loads((ROOT/'manifests/runtime-files.json').read_text())
for row in manifest['files']:
 p=ROOT/row['path']
 if not p.exists() or p.suffix not in ('.css','.html'):continue
 text=p.read_text(encoding='utf-8')
 sources=[text] if p.suffix=='.css' else re.findall(r'<style[^>]*>(.*?)</style>',text,re.S)
 for source in sources:
  for match in re.finditer(r'([^{}]+)\{([^{}]*)\}',source):
   selector=re.sub(r'/\*.*?\*/','',match[1],flags=re.S).strip()
   for decl in match[2].split(';'):
    if ':' not in decl:continue
    prop,value=map(str.strip,decl.split(':',1))
    flags=[]
    if prop in ('width','height','min-width','min-height','max-width','max-height') and re.search(r'\d+(?:px|rem|vw|vh)',value):flags.append('dimension')
    if '100vw' in value or '100vh' in value:flags.append('viewport-unit')
    if prop=='position' and value in ('absolute','fixed'):flags.append('positioned')
    if prop.startswith(('padding','gap','margin')) and re.search(r'\d+(?:px|rem)',value):flags.append('spacing')
    if prop=='white-space' and 'nowrap' in value:flags.append('nowrap')
    if prop.startswith('overflow') and any(x in value for x in ('hidden','clip')):flags.append('clipping')
    if prop=='grid-template-columns':flags.append('grid')
    if re.search(r'(?:translate[XY]|-\d+(?:px|rem|%))',value):flags.append('offset')
    if flags:
     component='isolated game/lab' if '/' in row['path'] else 'shared UI'
     if any(x in selector for x in ['scene-backdrop','scene-image','scene-video','scene-night','scene-day','scene-atmosphere','scene-veil']):component='environmental background'
     records.append({'file':row['path'],'selector':selector,'property':prop,'value':value,'flags':flags,'component':component})
report={'scope':'All allowlisted runtime CSS and inline style rules; preserved historical/source copies excluded from runtime changes.','review':'See docs/WEBSITE-2.0-RESPONSIVE-IMPLEMENTATION.md for component dispositions. Inventory flags are review candidates, not automatic defects.','records':records}
(ROOT/'manifests/responsive-css-audit.json').write_text(json.dumps(report,indent=2)+'\n',encoding='utf-8')
print(json.dumps({'rules':len(records),'files':dict(collections.Counter(x['file'] for x in records)),'flags':dict(collections.Counter(f for x in records for f in x['flags']))},indent=2))
