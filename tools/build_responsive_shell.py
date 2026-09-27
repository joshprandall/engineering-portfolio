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
  for resource,tag in [('site-responsive.css','<link rel="stylesheet" href="site-responsive.css">'),('site-sound-control.js','<script defer src="site-sound-control.js"></script>'),('site-audio.js','<script defer src="site-audio.js"></script>')]:
   if resource not in s:s=s.replace('</head>',tag+'</head>')
  # Ensure geometry owner loads after all legacy component styles.
  s=s.replace('<link rel="stylesheet" href="site-responsive.css">','');s=s.replace('</head>','<link rel="stylesheet" href="site-responsive.css"></head>')
  osu=html.escape(education['osu']['degree'])+'<br>'+html.escape(education['osu']['direction'])+'<span>Mathematics minor</span><span>Physics minor</span>'
  mit=html.escape(education['mit']['study'])
  s=re.sub(r'(<span class="credential-text">).*?(</span>)',lambda m:m[1]+('Oregon State University · '+osu if 'Oregon' in m[0] else mit)+m[2],s,flags=re.S)
  s=re.sub(r'(<h3>Oregon State University</h3>).*?(?=</article>)',lambda m:m[1]+'<p>'+html.escape(education['osu']['degree'])+'</p><p>'+html.escape(education['osu']['direction'])+'</p><ul><li>Mathematics minor</li><li>Physics minor</li></ul>',s,flags=re.S)
  s=s.replace('Online, tuition-based Quantum Engineering program · in progress.',mit)
  p.write_text(s,encoding='utf-8',newline='\n')
if __name__=='__main__':main()
