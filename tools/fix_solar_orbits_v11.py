#!/usr/bin/env python3
from __future__ import annotations

import re
import shutil
import subprocess
from datetime import datetime
from pathlib import Path

ROOT = Path.cwd()
FILES = ["portfolio-next.js", "portfolio-next.css", "index.html", "learn.html"]
missing = [name for name in FILES if not (ROOT / name).is_file()]
if missing:
    raise SystemExit("Run this from ~/public_html. Missing: " + ", ".join(missing))

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = Path.home() / f"solar-orbit-backup-{stamp}"
backup.mkdir(parents=True, exist_ok=False)
for name in FILES:
    shutil.copy2(ROOT / name, backup / name)

js_path = ROOT / "portfolio-next.js"
js = js_path.read_text(encoding="utf-8")

orbit_block = r'''    // Solar orbit v11: restore the original cinematic angle and motion.
    // The old desktop clamp made the outer tracks share the same horizontal
    // endpoints. These radii preserve the original perspective while widening
    // every lane so the drawn orbit paths remain distinct.
    function orbitRadius(o){
      const i=orbit.indexOf(o);
      if(width<520){
        const mobileRx=[.24,.31,.38,.45,.52];
        const mobileRy=[.105,.145,.185,.225,.265];
        return {rx:mobileRx[i]??o.rx,ry:mobileRy[i]??o.ry};
      }
      return {rx:o.rx,ry:o.ry};
    }

    function worldPosition'''

js, n = re.subn(
    r"    (?:// Solar orbit v\d+:[^\n]*\n(?:    //[^\n]*\n)*)?    function planetDiameterLimit\(\)\{.*?\n    \}\n\n    function orbitRadius\(o\)\{.*?\n    \}\n\n    function worldPosition",
    orbit_block,
    js,
    count=1,
    flags=re.S,
)
if n == 0:
    js, n = re.subn(
        r"    function orbitRadius\(o\)\{.*?\n    \}\n\n    function worldPosition",
        orbit_block,
        js,
        count=1,
        flags=re.S,
    )
if n != 1:
    raise SystemExit("STOPPED safely: could not locate the solar orbit geometry block.")

js = js.replace("const cy=height*.5+parallaxY*6;", "const cy=height*.45+parallaxY*6;")
js = js.replace(
    "return {x:cx+Math.cos(a)*r.rx,y:cy+Math.sin(a)*r.ry,depth,scale:.72+depth*.38};",
    "return {x:cx+Math.cos(a)*width*r.rx,y:cy+Math.sin(a)*height*r.ry,depth,scale:.72+depth*.38};",
)
js = js.replace(
    "ctx.beginPath();ctx.ellipse(cx,cy,r.rx,r.ry,0,0,Math.PI*2);ctx.stroke();ctx.restore();",
    "ctx.beginPath();ctx.ellipse(cx,cy,width*r.rx,height*r.ry,0,0,Math.PI*2);ctx.stroke();ctx.restore();",
)
js = re.sub(
    r"const p=positions\[i\],o=orbit\[i\],base=Math\.min\(o\.size,(?:planetDiameterLimit\(\)|width<480\?44:o\.size)\);",
    "const p=positions[i],o=orbit[i],base=Math.min(o.size,width<480?44:o.size);",
    js,
    count=1,
)

js_path.write_text(js, encoding="utf-8")

css_path = ROOT / "portfolio-next.css"
css = css_path.read_text(encoding="utf-8")
marker = "/* Solar orbit v11 — original perspective, wider separated tracks. */"
if marker not in css:
    css += r'''

/* Solar orbit v11 — original perspective, wider separated tracks. */
.home-page .vnext-cosmos-scene,
body[data-library-page="home"] .knowledge-solar-slot .vnext-cosmos-scene{
  height:350px!important;
  min-height:350px!important;
}
.home-page .vnext-cosmos-core,
body[data-library-page="home"] .knowledge-solar-slot .vnext-cosmos-core{
  width:66px!important;
  height:66px!important;
  top:45%!important;
}
.home-page .vnext-world,
body[data-library-page="home"] .knowledge-solar-slot .vnext-world{
  width:104px!important;
  min-height:108px!important;
}
.vnext-world.selected .vnext-planet{transform:scale(1.15)!important}
.vnext-world:hover .vnext-planet{transform:scale(1.12)!important}
@media(max-width:600px){
  .home-page .vnext-cosmos-scene,
  body[data-library-page="home"] .knowledge-solar-slot .vnext-cosmos-scene{
    height:300px!important;
    min-height:300px!important;
  }
  .home-page .vnext-cosmos-core,
  body[data-library-page="home"] .knowledge-solar-slot .vnext-cosmos-core{
    width:54px!important;
    height:54px!important;
    top:45%!important;
  }
}
'''
css_path.write_text(css, encoding="utf-8")

for name in ("index.html", "learn.html"):
    p = ROOT / name
    text = p.read_text(encoding="utf-8")
    text = re.sub(r'portfolio-next\.css\?v=[^"\'\s>]+', 'portfolio-next.css?v=20260924-solar-v11', text)
    text = re.sub(r'portfolio-next\.js\?v=[^"\'\s>]+', 'portfolio-next.js?v=20260924-solar-v11', text)
    p.write_text(text, encoding="utf-8")

checks = [
    "Solar orbit v11" in js_path.read_text(encoding="utf-8"),
    "height*.45+parallaxY*6" in js_path.read_text(encoding="utf-8"),
    "width*r.rx" in js_path.read_text(encoding="utf-8"),
    "height*r.ry" in js_path.read_text(encoding="utf-8"),
    marker in css_path.read_text(encoding="utf-8"),
]
if not all(checks):
    raise SystemExit("Validation failed. Restore from: " + str(backup))

node = shutil.which("node")
if node:
    result = subprocess.run([node, "--check", str(js_path)], capture_output=True, text=True)
    if result.returncode != 0:
        raise SystemExit("JavaScript syntax validation failed:\n" + result.stderr + "\nBackup: " + str(backup))

print("Done: solar orbit v11 installed.")
print("Restored the earlier orbital angle, center point, motion, depth and planet scale.")
print("Removed the old outer-orbit clamp so the tracks no longer share crossing endpoints.")
print("Widened mobile orbit lanes while preserving the earlier cinematic perspective.")
print("Homepage and Learn solar elements use the same geometry.")
print("Backup:", backup)
