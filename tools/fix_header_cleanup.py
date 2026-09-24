#!/usr/bin/env python3
"""Apply the three requested header/lesson/project cleanup changes."""
from pathlib import Path
import datetime,shutil,argparse
ASSETS={'header-cleanup.css': '/* Keep the learning brand aligned with its adjacent header text. */\nbody[data-library-page] .site-header .brand strong,\nbody[data-library-page] .site-header .brand span {\n  color: var(--ink, var(--text)) !important;\n}\n/* Lesson preferences belong with lesson controls, not the site header. */\n.site-header .header-tools #sound-mode,\n.site-header .header-tools #motion-mode { display: none !important; }\n/* The project collection is shown in full, without the floating filter bar. */\n#project-list > .filter-bar { display: none !important; }\n', 'lesson-header-controls.js': '(() => {\n  const sound = document.getElementById(\'sound-mode\');\n  const motion = document.getElementById(\'motion-mode\');\n  if (!sound || !motion) return;\n  function sync() {\n    const host = document.querySelector(\'.lesson-actions\');\n    if (!host) return;\n    for (const [source, key] of [[sound, \'sound\'], [motion, \'motion\']]) {\n      let button = host.querySelector(\'[data-lesson-preference="\' + key + \'"]\');\n      if (!button) {\n        button = document.createElement(\'button\');\n        button.type = \'button\';\n        button.className = \'button\';\n        button.dataset.lessonPreference = key;\n        button.onclick = () => { source.click(); sync(); };\n        host.appendChild(button);\n      }\n      const label = source.getAttribute(\'aria-label\') || source.title;\n      if (button.textContent !== label) button.textContent = label;\n    }\n  }\n  new MutationObserver(sync).observe(document.body, { childList: true, subtree: true });\n  for (const source of [sound, motion])\n    new MutationObserver(sync).observe(source, { attributes: true, attributeFilter: [\'aria-label\'] });\n  sync();\n})();\n'}
CSS='<link rel="stylesheet" href="header-cleanup.css?v=20260924-1">'
JS='<script defer src="lesson-header-controls.js?v=20260924-1"></script>'
def main():
 p=argparse.ArgumentParser();p.add_argument('--root',type=Path,default=Path.home()/'public_html');root=p.parse_args().root.resolve()
 changes=dict(ASSETS)
 for name in ('learn.html','projects.html'):
  text=(root/name).read_text()
  if '</head>' not in text:raise SystemExit('Stopped: unexpected '+name+'; no files changed.')
  extra=[]
  if 'header-cleanup.css?v=20260924-1' not in text:extra.append(CSS)
  if name=='learn.html' and 'lesson-header-controls.js?v=20260924-1' not in text:extra.append(JS)
  if extra:text=text.replace('</head>','\n'.join(extra)+'\n</head>')
  changes[name]=text
 changes={n:t for n,t in changes.items() if not (root/n).exists() or (root/n).read_bytes()!=t.encode()}
 if not changes:print('All three cleanup changes are already installed.');return
 backup=root.parent/('header-cleanup-backup-'+datetime.datetime.now().strftime('%Y%m%d-%H%M%S-%f'));backup.mkdir()
 old=[];new=[]
 for name in changes:
  if (root/name).exists():shutil.copy2(root/name,backup/name);old.append(name)
  else:new.append(name)
 try:
  for name,text in changes.items():
   target=root/name;temp=target.with_name(target.name+'.cleanup-tmp');temp.write_text(text);temp.chmod(0o644);temp.replace(target)
 except BaseException:
  for name in old:shutil.copy2(backup/name,root/name)
  for name in new:(root/name).unlink(missing_ok=True)
  raise
 print('Done: JR color matched; header audio/motion controls moved into lessons; floating project filters removed.')
 print('Backup: '+str(backup))
if __name__=='__main__':main()
