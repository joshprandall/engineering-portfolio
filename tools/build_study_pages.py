"""Publish authored companion sections without regenerating the existing shell."""
from pathlib import Path
import contextlib
import html
import importlib
import io
import json
import math
import re
import sys

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'project-sources'/'engineering-studies'
DOWNLOAD='assets/downloads/engineering-studies-3.2-3.6.zip'
sys.path.insert(0,str(SOURCE))
E=html.escape


def markdown(text):return {'cell_type':'markdown','metadata':{},'source':text.splitlines(True)}
def code(text):return {'cell_type':'code','metadata':{},'execution_count':None,'outputs':[],'source':text.splitlines(True)}


def main():
    units=json.loads((SOURCE/'units.json').read_text())
    results={};pages={}
    for u in units:
        ns={'m':importlib.import_module(u['module']),'math':math}
        with contextlib.redirect_stdout(io.StringIO()):exec(u['code'],ns)
        result=ns['result'];results[u['id']]=result
        table='| Element | Model | Interpretation |\n| --- | --- | --- |\n'+'\n'.join('| '+' | '.join(row)+' |' for row in u['model'])
        cells=[markdown('# '+u['title']+'\n\nPrerequisites: '+u['prerequisites']+'\n\n'+u['concept']),
               markdown('## Model structure\n\n'+table+'\n\n## Predict\n\n'+u['example']),
               code("from pathlib import Path\nimport sys, math\nbase=Path.cwd().parent if Path.cwd().name=='notebooks' else Path.cwd()\nsys.path.insert(0,str(base))\nimport "+u['module']+' as m'),
               code(u['code']),markdown('## Perturb and explain\n\n'+u['challenge']+'\n\nRecord the changed input, prediction, result and a limit of your conclusion. Restart the kernel to reset the experiment.'),
               markdown('## Check your reasoning\n\n'+u['question']+'\n\n'+'\n'.join(f'{i+1}. {o}' for i,o in enumerate(u['options']))+'\n\nAnswer and explanations: '+' '.join(f'{i+1}: {x}' for i,x in enumerate(u['reasons']))),
               markdown('## Primary evidence\n\n'+'\n'.join('- ['+a+']('+b+')' for a,b in u['references'])+'\n\nReview scope: this authored worked example and its stated assumptions; no hardware or production acceptance is implied.')]
        for i,c in enumerate(cells):c['id']=u['id']+'-'+str(i)
        nb={'nbformat':4,'nbformat_minor':5,'metadata':{'kernelspec':{'display_name':'Python 3','language':'python','name':'python3'},'language_info':{'name':'python','version':'3.12'}},'cells':cells}
        out=SOURCE/'notebooks'/f"{u['id']}.ipynb";out.parent.mkdir(exist_ok=True);out.write_text(json.dumps(nb,ensure_ascii=False,indent=2)+'\n')
        paragraphs=''.join('<p>'+E(t)+'</p>' for t in u['concept'].split('\n\n'))
        rows=''.join('<tr><th scope="row">'+E(row[0])+'</th><td>'+E(row[1])+'</td><td>'+E(row[2])+'</td></tr>' for row in u['model'])
        source_url='https://github.com/joshprandall/engineering-portfolio/tree/content/website-3-approved-upgrades/project-sources/engineering-studies'
        section=f'''<section class="section study-companion" id="study-{E(u['id'])}"><p class="eyebrow">AUTHORED STUDY COMPANION / {E(u['release'])}</p><h2>{E(u['title'])}</h2><p><strong>Prerequisites.</strong> {E(u['prerequisites'])}</p>{paragraphs}<div class="flagship-model"><table><caption>{E(u['title'])} — model structure</caption><thead><tr><th scope="col">Element</th><th scope="col">Model</th><th scope="col">Interpretation</th></tr></thead><tbody>{rows}</tbody></table></div><h3>Predict, run, compare</h3><p>{E(u['example'])}</p><p><a class="button primary" href="{DOWNLOAD}" download>Download executable notebooks and source</a> <a class="button" href="{source_url}" target="_blank" rel="noopener noreferrer">Inspect source ↗</a></p><p>Open <strong>{E(u['id'])}.ipynb</strong> in the package. Run cells in order, compare with the reference, then change the stated input. Restart the kernel to reset.</p><details><summary>Computed reference result — local CPU fixture</summary><pre>{E(json.dumps(result,ensure_ascii=False,indent=2))}</pre><p>This is the recorded result of the included code under the package environment. It is not a live service or device measurement.</p></details><h3>Extend the experiment</h3><p>{E(u['challenge'])}</p><details><summary>Check your reasoning: {E(u['question'])}</summary><ol>{''.join('<li><strong>'+E(o)+('</strong> — Correct. ' if i==u['answer'] else '</strong> — ')+E(u['reasons'][i])+'</li>' for i,o in enumerate(u['options']))}</ol><p>This is an explained self-check, not a certification of mastery.</p></details><h3>Claim-specific sources</h3><ul>{''.join('<li><a href="'+E(url)+'" target="_blank" rel="noopener noreferrer">'+E(title)+'</a></li>' for title,url in u['references'])}</ul><p class="muted">Reviewed {E(u['review_date'])}: this worked example and its explicit assumptions. Source links and notebook results do not establish production or hardware validation.</p></section>'''
        pages.setdefault(u['page'],[]).append(section)
    # Related existing AI routes reuse an explicit authored destination, without
    # presenting a duplicate as another independently reviewed unit.
    for page,id in [('ai-symbolic.html','constraint'),('ai-multi-agent.html','mind'),('agent-workbench.html','agent')]:
        u=next(x for x in units if x['id']==id)
        pages.setdefault(page,[]).append(f'<section class="section study-companion"><h2>Reproduce the execution contract</h2><p><a class="button" href="{u["page"]}#study-{id}">{E(u["title"])} →</a></p><p>Use the linked notebook, worked predictions, failure cases and source evidence alongside this page’s existing local demonstration.</p></section>')
    for page,sections in pages.items():
        p=ROOT/page;text=p.read_text()
        text=re.sub(r'<!-- STUDY COMPANIONS START -->.*?<!-- STUDY COMPANIONS END -->','',text,flags=re.S)
        main=re.search(r'<main\b[^>]*>',text).group()
        content=''.join(sections)
        if 'wrap' not in main and 'shell' not in main:content='<div class="wrap">'+content+'</div>'
        text=text.replace('</main>','<!-- STUDY COMPANIONS START -->'+content+'<!-- STUDY COMPANIONS END --></main>',1)
        if 'learning-experiments.css' not in text:text=text.replace('</head>','<link rel="stylesheet" href="learning-experiments.css?v=20261002-content"></head>',1)
        p.write_text(text)
    (SOURCE/'expected-results.json').write_text(json.dumps({'environment':{'python':'3.12','numpy':'2.3.5'},'results':results},ensure_ascii=False,indent=2)+'\n')
    refs={url:title for u in units for title,url in u['references']}
    (SOURCE/'references.bib').write_text('\n\n'.join('@misc{study'+str(i)+',\n  title = {'+title+'},\n  url = {'+url+'},\n  note = {Scope identified in companion; reviewed 2026-10-02}\n}' for i,(url,title) in enumerate(refs.items()))+'\n')
    # The first 32 units are a curated sequence inside the existing path page.
    foundations=json.loads((ROOT/'project-sources/engineering-foundations/lessons.json').read_text())
    links=[(x['title'],'lesson.html?lesson='+x['id']+'&view=lab') for x in foundations]+[(u['title'],u['page']+'#study-'+u['id']) for u in units[:24]]
    p=ROOT/'learn-paths.html';text=p.read_text();text=re.sub(r'<!-- AUTHORED SEQUENCE START -->.*?<!-- AUTHORED SEQUENCE END -->','',text,flags=re.S)
    block='<section class="shell section" id="authored-sequence"><h2>32-unit authored study sequence</h2><p>Start with eight foundation experiments, then progress through AI, quantum, and scientific or operational companions. Each linked unit states prerequisites, a worked prediction, executable code and its evidence boundary. The remaining seventeen extension notebooks deepen selected topics. This sequence does not change the 300 legacy path IDs or imply certified academic mastery.</p><ol>'+''.join('<li><a href="'+E(url)+'">'+E(title)+'</a></li>' for title,url in links)+'</ol><h3>Integration portfolio</h3><p>For each group, retain one prediction, a passing reference case, a deliberately failed or perturbed case, an interpretation and a primary-source locator. Review whether the calculation supports the claim before marking your existing learning plan complete.</p></section>'
    p.write_text(text.replace('</main>','<!-- AUTHORED SEQUENCE START -->'+block+'<!-- AUTHORED SEQUENCE END --></main>',1))
    print(f'Built {len(units)} notebooks and authored sections on {len(pages)} existing routes; 32-unit sequence linked.')


if __name__=='__main__':main()
