"""Derive compact navigation/search payloads from the reviewed route owner."""
import json,re,html
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def main():
    routes=json.loads((ROOT/'manifests/site-routes.json').read_text(encoding='utf-8'))
    nav=routes['navigation'];parents={}
    for r in routes['routes']:
        p=r['path']
        if p.startswith('project-'):parents[p]='projects.html'
        if p.startswith('learn') or p=='lesson.html':parents[p]='learn.html'
        if p in ('project-battle-chess.html','play-evil-wizard.html'):parents[p]='game-development.html'
    (ROOT/'assets/site-navigation.json').write_text(json.dumps({'items':nav,'parents':parents},indent=2)+'\n')
    entries=[]
    for r in routes['routes']:
        if '/' in r['path']:continue
        text=(ROOT/r['path']).read_text(encoding='utf-8')
        text=re.sub(r'<(script|style)\b[^>]*>.*?</\1>','',text,flags=re.S)
        text=html.unescape(re.sub(r'<[^>]+>',' ',text));text=' '.join(text.split())
        entries.append({'title':html.unescape(r['title']),'path':r['path'],'text':text[:2500]})
    data=json.loads((ROOT/'knowledge-data.js').read_text(encoding='utf-8').split('=',1)[1].strip().rstrip(';'))
    for d in data['domains']:entries.append({'title':d['name'],'path':'learn-browse.html?domain='+d['id'],'text':d['short']})
    for l in data['lessons']:entries.append({'title':l['title'],'path':'lesson.html?lesson='+l['id'],'text':l['domain']+' '+l['category']+' '+l['summary'][:220]})
    (ROOT/'assets/site-search.json').write_text(json.dumps({'source':'manifests/site-routes.json and JR_KNOWLEDGE corpus; no game internals','entries':entries},ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    for filename,kind,items,title in [('index.html','portfolio',nav,'Explore my world'),('learn.html','learning',[{'path':'learn-'+d['id']+'.html','label':d['name']} for d in data['domains']],'Choose a learning orbit')]:
        p=ROOT/filename;text=p.read_text(encoding='utf-8')
        section='<section class="wrap solar-navigation" data-solar="'+kind+'" aria-labelledby="'+kind+'-solar-title"><h2 id="'+kind+'-solar-title">'+title+'</h2><nav class="solar-orbits" aria-label="'+kind+' solar navigation">'+''.join('<a class="solar-link" href="'+html.escape(i['path'])+'">'+html.escape(i['label'])+'</a>' for i in items)+'</nav></section>'
        text=re.sub(r'<section class="wrap solar-navigation".*?</section>','',text,flags=re.S)
        text=text.replace('</main>',section+'</main>')
        if 'site-sections.css' not in text:text=text.replace('</head>','<link rel="stylesheet" href="site-sections.css"></head>')
        if filename=='index.html':text=text.replace('href="#about"','href="about.html"')
        p.write_text(text,encoding='utf-8')
if __name__=='__main__':main()
