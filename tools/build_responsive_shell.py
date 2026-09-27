"""Generate the shared header and education content. Runtime remains static-first."""
import re,json,html
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def main():
 nav=json.loads((ROOT/'manifests/site-routes.json').read_text(encoding='utf-8'))['navigation']
 education=json.loads((ROOT/'assets/site-education.json').read_text(encoding='utf-8'))
 for p in ROOT.glob('*.html'):
  s=p.read_text(encoding='utf-8')
  if 'site-navigation.js' not in s:continue
  learning='id="knowledge-search"' in s
  old=re.search(r'<header\b.*?</header>',s,re.S)
  if not old:continue
  local=''
  if learning and 'class="learning-local-controls"' not in s:
   buttons=re.findall(r'<button\b[^>]*id="(?:sound-mode|motion-mode)".*?</button>',old.group(),re.S)
   local='<div class="learning-local-controls">'+''.join(buttons)+'</div>'
  menu='mobile-menu' if learning else 'menu';theme='theme-mode' if learning else 'theme'
  header='<header class="site-global-header'+(' site-header' if learning else '')+'"><a class="brand" href="index.html" aria-label="Joshua Randall home"><strong>JR</strong><span>Joshua Randall<small>Systems. Software. Possibility.</small></span></a><nav id="primary-nav" aria-label="Primary">'+''.join('<a href="'+x['path']+'">'+html.escape(x['label'])+'</a>' for x in nav)+'</nav><div class="global-controls '+('header-tools' if learning else 'tools')+'"><button id="search-open" aria-label="Search '+('learning library' if learning else 'portfolio')+'"'+(' data-learning-search' if learning else '')+'>⌕ <span>Search</span><kbd>/</kbd></button><button id="'+theme+'" data-theme-toggle aria-label="Switch color theme">◐</button><button id="'+menu+'" aria-controls="primary-nav" aria-expanded="false" aria-label="Open navigation">☰</button></div></header>'
  s=s[:old.start()]+header+s[old.end():]
  if local:s=re.sub(r'(<main\b[^>]*>)',lambda m:m[0]+local,s,count=1)
  for resource,tag in [('site-responsive.css','<link rel="stylesheet" href="site-responsive.css">'),('site-audio.js','<script defer src="site-audio.js"></script>'),('site-sound-control.js','<script defer src="site-sound-control.js"></script>')]:
   if resource not in s:s=s.replace('</head>',tag+'</head>')
  s=re.sub(r'<script[^>]*src="site-sound-control.js[^"]*"[^>]*></script>','',s)
  s=s.replace('</head>','<script defer src="site-sound-control.js"></script></head>')
  if not learning:
   if 'site-search.js' not in s:
    s=s.replace('</head>','<script defer src="site-search.js"></script></head>')
   if 'id="search-dialog"' not in s:
    search_dialog='<dialog aria-labelledby="search-title" id="search-dialog"><div class="dialog-head"><h2 id="search-title">Explore the portfolio</h2><button aria-label="Close search" data-close>✕</button></div><label for="search-input">Search sections, projects and lessons</label><input autocomplete="off" id="search-input" placeholder="Try Azure, leadership, or fusion…" type="search"><div id="search-results"></div><p class="muted">Escape to close · Tab to navigate results</p></dialog>'
    s=s.replace('</body>',search_dialog+'</body>')
  # Ensure geometry owner loads after all legacy component styles.
  s=s.replace('<link rel="stylesheet" href="site-responsive.css">','');s=s.replace('</head>','<link rel="stylesheet" href="site-responsive.css"></head>')
  osu=education['osu'];mit_data=education['mit']
  minor_spans=''.join('<span>'+html.escape(x)+' minor</span>' for x in osu['minors'])
  osu_badge=html.escape(osu['institution'])+' · '+html.escape(osu['program'])+' · '+html.escape(osu['status'])+'<br>'+minor_spans+'<span>'+html.escape(osu['honors'])+'</span>'
  mit_badge='MIT · '+html.escape(mit_data['program'])+' · '+html.escape(mit_data['status'])
  s=re.sub(r'(<span class="credential-text">).*?(</span>\s*</div>)',lambda m:m[1]+(osu_badge if 'Oregon' in m[0] else mit_badge)+m[2],s,flags=re.S)
  osu_items=''.join('<li>'+html.escape(x)+' minor</li>' for x in osu['minors'])+'<li>'+html.escape(osu['honors'])+'</li>'
  s=re.sub(r'(<h3>Oregon State University</h3>).*?(?=</article>)',lambda m:m[1]+'<p>'+html.escape(osu['program'])+' · '+html.escape(osu['status'])+'</p><ul>'+osu_items+'</ul>',s,flags=re.S)
  mit_detail='MIT · '+html.escape(mit_data['program'])+' · '+html.escape(mit_data['status'])
  s=s.replace('MIT online Quantum Engineering studies/program — in progress',mit_detail)
  s=s.replace('Online, tuition-based Quantum Engineering program · in progress.',mit_detail)
  if p.name == 'resume.html':
   education_html=(
    '<h2>EDUCATION &amp; TECHNICAL DEVELOPMENT</h2>'
    '<div class="resume-education">'
    '<article><h3>'+html.escape(osu['institution'])+'</h3>'
    '<p>'+html.escape(osu['program'])+' · '+html.escape(osu['status'])+'</p>'
    '<ul>'+osu_items+'</ul></article>'
    '<article><h3>'+html.escape(mit_data['institution'])+'</h3>'
    '<p>'+html.escape(mit_data['program'])+' · '+html.escape(mit_data['status'])+'</p></article></div>'
   )
   s=re.sub(r'<h2>EDUCATION &amp; TECHNICAL DEVELOPMENT</h2>(?:<div class="resume-education">.*?</div>|<p>Oregon State University.*?)(?=<p>Pioneer Pacific College)',education_html,s,flags=re.S)
  p.write_text(s,encoding='utf-8',newline='\n')
if __name__=='__main__':main()
