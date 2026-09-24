#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re, shutil, subprocess, urllib.request

ROOT=Path.cwd()
TARGET=ROOT/"site-audio.js"
if not TARGET.exists():
    raise SystemExit("Run this from ~/public_html. Missing site-audio.js")

stamp=datetime.now().strftime("%Y%m%d-%H%M%S")
backup=Path.home()/f"audio-cap-15-backup-{stamp}"
backup.mkdir(parents=True,exist_ok=False)
shutil.copy2(TARGET,backup/"site-audio.js")

html_files=[]
for path in ROOT.rglob("*.html"):
    text=path.read_text(encoding="utf-8",errors="ignore")
    if "site-audio.js" in text:
        rel=path.relative_to(ROOT)
        dest=backup/rel
        dest.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(path,dest)
        html_files.append(path)

url="https://raw.githubusercontent.com/joshprandall/engineering-portfolio/af049677dfb32395e846f7d757b8fe27b3f5e27b/site-audio.js"
req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"})
with urllib.request.urlopen(req,timeout=30) as r:
    TARGET.write_bytes(r.read())

version="20260924-audio-cap15-v1"
for path in html_files:
    text=path.read_text(encoding="utf-8")
    text=re.sub(r'(site-audio\.js)(?:\?v=[^"\'\s>]+)?',rf'\1?v={version}',text)
    path.write_text(text,encoding="utf-8")

code=TARGET.read_text(encoding="utf-8")
checks={
    "15% constant":"MAX_BACKGROUND_VOLUME = .15" in code,
    "all source levels at or below 15%":all(x in code for x in ("dark: .15","river: .15","waterfall: .15","beach: .15")),
    "hard clamp":"audio.volume > MAX_BACKGROUND_VOLUME" in code,
    "capped assignments":"cappedVolume(nextKey)" in code and "cappedVolume(key)" in code,
}
failed=[k for k,v in checks.items() if not v]
if failed:
    raise SystemExit("Validation failed: "+", ".join(failed)+"\nBackup: "+str(backup))

node=shutil.which("node")
if node:
    r=subprocess.run([node,"--check",str(TARGET)],capture_output=True,text=True)
    if r.returncode:
        raise SystemExit("site-audio.js syntax failed:\n"+r.stderr+"\nBackup: "+str(backup))

TARGET.chmod(0o644)

print("Done: 15% background-audio ceiling installed.")
print("All dark-mode music and light-mode ambience are capped at 0.15 media volume.")
print("A volumechange guard forces the player back to 0.15 if any script tries to raise it.")
print("This is an app-side media cap; device/system volume still controls the final speaker output.")
print("Backup:",backup)
