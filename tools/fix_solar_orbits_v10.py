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

marker = "Solar orbit v10"
if marker not in js:
    new_orbit = r'''    // Solar orbit v10: all five lanes are concentric, homothetic ellipses.
    // Lane spacing is computed from the largest rendered planet so a planet
    // stays inside its own orbital lane instead of crossing a neighboring path.
    function planetDiameterLimit(){
      if(width<350)return 24;
      if(width<420)return 32;
      if(width<640)return 40;
      return 58;
    }

    function orbitRadius(o){
      const i=orbit.indexOf(o);
      const compact=width<640;
      const tiny=width<350;
      const planetRadius=planetDiameterLimit()*.54; // 1.08 selected scale / 2
      const measuredCore=coreEl.getBoundingClientRect().width/2||0;
      const coreRadius=Math.max(tiny?26:compact?30:33,measuredCore);
      const edgeReserve=tiny?22:compact?24:36;
      const maxRx=Math.max(86,width*.5-edgeReserve);
      const minRy=coreRadius+planetRadius+(compact?8:12);
      const laneClearance=planetRadius+(compact?7:9);
      const neededMaxRy=minRy+laneClearance*(orbit.length-1);
      const baseAspect=compact?.72:.58;
      const aspect=Math.min(1,Math.max(baseAspect,neededMaxRy/maxRx));
      const maxRy=maxRx*aspect;
      const stepRy=(maxRy-minRy)/(orbit.length-1);
      const ry=minRy+stepRy*i;
      return {rx:ry/aspect,ry};
    }

    function worldPosition'''
    js, n = re.subn(
        r"    function orbitRadius\(o\)\{.*?\n    \}\n\n    function worldPosition",
        new_orbit,
        js,
        count=1,
        flags=re.S,
    )
    if n != 1:
        raise SystemExit("STOPPED safely: could not locate the existing orbitRadius block.")

    replacements = [
        ("const cy=height*.45+parallaxY*6;", "const cy=height*.5+parallaxY*6;"),
        (
            "return {x:cx+Math.cos(a)*width*r.rx,y:cy+Math.sin(a)*height*r.ry,depth,scale:.72+depth*.38};",
            "return {x:cx+Math.cos(a)*r.rx,y:cy+Math.sin(a)*r.ry,depth,scale:.72+depth*.38};",
        ),
        (
            "ctx.beginPath();ctx.ellipse(cx,cy,width*r.rx,height*r.ry,0,0,Math.PI*2);ctx.stroke();ctx.restore();",
            "ctx.beginPath();ctx.ellipse(cx,cy,r.rx,r.ry,0,0,Math.PI*2);ctx.stroke();ctx.restore();",
        ),
        (
            "const p=positions[i],o=orbit[i],base=Math.min(o.size,width<480?44:o.size);",
            "const p=positions[i],o=orbit[i],base=Math.min(o.size,planetDiameterLimit());",
        ),
    ]
    for old, new in replacements:
        if old not in js:
            raise SystemExit("STOPPED safely: expected solar code was not found: " + old[:72])
        js = js.replace(old, new)

js_path.write_text(js, encoding="utf-8")

css_path = ROOT / "portfolio-next.css"
css = css_path.read_text(encoding="utf-8")
css_marker = "/* Solar orbit v10 — synchronized geometry and lane clearance. */"
if css_marker not in css:
    css += r'''

/* Solar orbit v10 — synchronized geometry and lane clearance. */
.home-page .vnext-cosmos-scene,
body[data-library-page="home"] .knowledge-solar-slot .vnext-cosmos-scene{
  height:clamp(500px,52vw,560px)!important;
  min-height:500px!important;
}
.home-page .vnext-cosmos-core,
body[data-library-page="home"] .knowledge-solar-slot .vnext-cosmos-core{
  width:66px!important;
  height:66px!important;
  top:50%!important;
}
.home-page .vnext-world,
body[data-library-page="home"] .knowledge-solar-slot .vnext-world{
  width:104px!important;
  min-height:108px!important;
}
.home-page .vnext-world strong,
body[data-library-page="home"] .knowledge-solar-slot .vnext-world strong{
  display:block!important;
}
.vnext-world.selected .vnext-planet{transform:scale(1.08)!important}
.vnext-world:hover .vnext-planet{transform:scale(1.06)}
@media(max-width:600px){
  .home-page .vnext-cosmos-scene,
  body[data-library-page="home"] .knowledge-solar-slot .vnext-cosmos-scene{
    height:380px!important;
    min-height:380px!important;
  }
  .home-page .vnext-cosmos-core,
  body[data-library-page="home"] .knowledge-solar-slot .vnext-cosmos-core{
    width:60px!important;
    height:60px!important;
  }
  .home-page .vnext-world,
  body[data-library-page="home"] .knowledge-solar-slot .vnext-world{
    width:72px!important;
    min-height:78px!important;
  }
  .home-page .vnext-world strong,
  body[data-library-page="home"] .knowledge-solar-slot .vnext-world strong{
    font-size:.58rem!important;
  }
}
@media(max-width:349px){
  .home-page .vnext-cosmos-scene,
  body[data-library-page="home"] .knowledge-solar-slot .vnext-cosmos-scene{
    height:360px!important;
    min-height:360px!important;
  }
  .home-page .vnext-cosmos-core,
  body[data-library-page="home"] .knowledge-solar-slot .vnext-cosmos-core{
    width:52px!important;
    height:52px!important;
  }
  .home-page .vnext-world,
  body[data-library-page="home"] .knowledge-solar-slot .vnext-world{
    width:64px!important;
    min-height:70px!important;
  }
}
'''
css_path.write_text(css, encoding="utf-8")

for name in ("index.html", "learn.html"):
    p = ROOT / name
    text = p.read_text(encoding="utf-8")
    text = re.sub(r'portfolio-next\.css\?v=[^"\'\s>]+', 'portfolio-next.css?v=20260924-solar-v10', text)
    text = re.sub(r'portfolio-next\.js\?v=[^"\'\s>]+', 'portfolio-next.js?v=20260924-solar-v10', text)
    p.write_text(text, encoding="utf-8")

checks = [
    marker in js_path.read_text(encoding="utf-8"),
    "height*.5+parallaxY*6" in js_path.read_text(encoding="utf-8"),
    "ctx.ellipse(cx,cy,r.rx,r.ry" in js_path.read_text(encoding="utf-8"),
    css_marker in css_path.read_text(encoding="utf-8"),
]
if not all(checks):
    raise SystemExit("Validation failed. Restore from: " + str(backup))

node = shutil.which("node")
if node:
    result = subprocess.run([node, "--check", str(js_path)], capture_output=True, text=True)
    if result.returncode != 0:
        raise SystemExit("JavaScript syntax validation failed:\n" + result.stderr + "\nBackup: " + str(backup))

print("Done: solar orbit v10 installed.")
print("Both solar elements now use the same geometry and sizing rules.")
print("Orbital paths are concentric and never intersect.")
print("Lane spacing expands around the sun so planets stay in their own orbital lanes.")
print("Backup:", backup)
