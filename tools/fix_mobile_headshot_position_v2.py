#!/usr/bin/env python3
from __future__ import annotations

import re
import shutil
from datetime import datetime
from pathlib import Path

ROOT = Path.cwd()
CSS = ROOT / "portfolio-home.css"
HTML = ROOT / "index.html"

if not CSS.is_file() or not HTML.is_file():
    raise SystemExit("Run this from ~/public_html. Missing portfolio-home.css or index.html.")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = Path.home() / f"portrait-position-backup-{stamp}"
backup.mkdir(parents=True, exist_ok=False)
shutil.copy2(CSS, backup / CSS.name)
shutil.copy2(HTML, backup / HTML.name)

css = CSS.read_text(encoding="utf-8")
marker = "/* Hero portrait vertical alignment v2 — raise headshot on phones. */"
rule = r'''

/* Hero portrait vertical alignment v2 — raise headshot on phones. */
@media(max-width:600px){
  .home-page .hero>.about-imagery .portrait-photo{
    bottom:206px!important;
  }
}
'''
if marker not in css:
    css += rule
else:
    css = re.sub(
        r'/\* Hero portrait vertical alignment v2 — raise headshot on phones\. \*/\s*@media\(max-width:600px\)\{\s*\.home-page \.hero>\.about-imagery \.portrait-photo\{\s*bottom:\d+px!important;\s*\}\s*\}',
        rule.strip(),
        css,
        count=1,
        flags=re.S,
    )
CSS.write_text(css, encoding="utf-8")

html = HTML.read_text(encoding="utf-8")
html = re.sub(
    r'portfolio-home\.css\?v=[^"\'\s>]+',
    'portfolio-home.css?v=20260924-hero-swap-v2',
    html,
)
HTML.write_text(html, encoding="utf-8")

check = CSS.read_text(encoding="utf-8")
if "bottom:206px!important" not in check or marker not in check:
    raise SystemExit("Validation failed. Restore from: " + str(backup))

print("Done: mobile headshot moved upward.")
print("The portrait bottom anchor is now 206px instead of 126px on phones.")
print("This moves the entire headshot up by 80 CSS pixels without changing its size.")
print("Homepage cache version updated to hero-swap-v2.")
print("Backup:", backup)
