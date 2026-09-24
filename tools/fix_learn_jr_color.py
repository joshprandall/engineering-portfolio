#!/usr/bin/env python3
"""Match the Learn header JR color to the homepage in both themes."""
from pathlib import Path
from datetime import datetime
import argparse, shutil, re
p=argparse.ArgumentParser();p.add_argument('--root',type=Path,default=Path.home()/'public_html');root=p.parse_args().root.resolve()
css=root/'header-cleanup.css'
if not css.is_file():raise SystemExit('Existing header stylesheet not found; no changes made.')
old=css.read_text()
needle='body[data-library-page] .site-header .brand strong,\nbody[data-library-page] .site-header .brand span {\n  color: var(--ink, var(--text)) !important;\n}'
replacement='body[data-library-page] .site-header .brand strong {\n  color: #f4a575 !important;\n}\n:root[data-theme="light"] body[data-library-page] .site-header .brand strong {\n  color: #06150d !important;\n}\nbody[data-library-page] .site-header .brand span {\n  color: var(--ink, var(--text)) !important;\n}'
if needle not in old and replacement not in old:raise SystemExit('Existing stylesheet differs; no changes made.')
changes={'header-cleanup.css':old.replace(needle,replacement)}
for path in root.glob('learn*.html'):
 text=path.read_text()
 if 'header-cleanup.css?v=20260924-1' in text or 'header-cleanup.css?v=20260924-peach-jr' in text:
  changes[path.name]=text.replace('header-cleanup.css?v=20260924-1','header-cleanup.css?v=20260924-peach-jr')
if len(changes)<2:raise SystemExit('Learning pages using the stylesheet were not found; no changes made.')
changes={name:text for name,text in changes.items() if (root/name).read_text()!=text}
if not changes:print('JR color already matches the homepage.');raise SystemExit(0)
backup=root.parent/('jr-color-backup-'+datetime.now().strftime('%Y%m%d-%H%M%S-%f'));backup.mkdir()
for name in changes:shutil.copy2(root/name,backup/name)
try:
 for name,text in changes.items():
  target=root/name;temp=target.with_name(target.name+'.jr-tmp');temp.write_text(text);temp.chmod(0o644);temp.replace(target)
except BaseException:
 for name in changes:shutil.copy2(backup/name,root/name)
 raise
print('Done: learning-page JR matches the homepage in dark and light mode.')
print('Backup: '+str(backup))
