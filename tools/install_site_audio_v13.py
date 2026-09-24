#!/usr/bin/env python3
from __future__ import annotations

import re
import shutil
import subprocess
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT=Path.cwd()
if not (ROOT/"site-scenes.js").is_file() or not (ROOT/"site-audio.js").is_file():
    raise SystemExit("Run this from ~/public_html. Missing site-scenes.js or site-audio.js")

stamp=datetime.now().strftime("%Y%m%d-%H%M%S")
backup=Path.home()/f"site-audio-v13-backup-{stamp}"
backup.mkdir(parents=True,exist_ok=False)

for name in ("site-audio.js","site-scenes.js","dark-music.js"):
    p=ROOT/name
    if p.exists():
        shutil.copy2(p,backup/name)

html_files=[]
for path in ROOT.rglob("*.html"):
    text=path.read_text(encoding="utf-8",errors="ignore")
    if "site-audio.js" in text or "site-scenes.js" in text:
        rel=path.relative_to(ROOT)
        dest=backup/rel
        dest.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(path,dest)
        html_files.append(path)

audio_dir=ROOT/"assets"/"audio"
audio_dir.mkdir(parents=True,exist_ok=True)
for name in ("dark-theme.mp3","river.mp3","waterfall.mp3","beach.mp3","beach-waves.mp3","beach-birds.mp3"):
    p=audio_dir/name
    if p.exists():
        shutil.copy2(p,backup/name)

def download(url:str,dest:Path,timeout:int=120):
    req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"})
    with urllib.request.urlopen(req,timeout=timeout) as r:
        dest.write_bytes(r.read())

# Install the one-player controller.
download(
    "https://raw.githubusercontent.com/joshprandall/engineering-portfolio/d18dc54d8e55d4871c21fe52f1bb9222e35a9f3e/site-audio.js",
    ROOT/"site-audio.js",30
)

# Ensure the four scene files are local.
sources={
    "dark-theme.mp3":"https://raw.githubusercontent.com/AdrianCCollier/asteroid-explorer/master/frontend/src/game/assets/sounds/interstellar-space.mp3",
    "river.mp3":"https://raw.githubusercontent.com/alibowbow/brainwave/main/public/audio/nature/creek-brook-cc0-v3.mp3",
    "waterfall.mp3":"https://raw.githubusercontent.com/alibowbow/brainwave/main/public/audio/nature/waterfall-caldeiroes-cc0-v2.mp3",
    "beach.mp3":"https://cdn.freesound.org/previews/518/518637_6089496-hq.mp3",
}
minimum={
    "dark-theme.mp3":5_000_000,
    "river.mp3":250_000,
    "waterfall.mp3":200_000,
    "beach.mp3":1_000_000,
}
for name,url in sources.items():
    dest=audio_dir/name
    download(url,dest,120)
    data=dest.read_bytes()
    if len(data)<minimum[name]:
        raise SystemExit(f"STOPPED safely: {name} too small ({len(data)} bytes). Backup: {backup}")
    if not (data[:3]==b"ID3" or (len(data)>1 and data[0]==0xFF)):
        raise SystemExit(f"STOPPED safely: {name} does not look like MP3. Backup: {backup}")

# Remove obsolete multi-player beach assets and old dark player file so they cannot be loaded accidentally.
for obsolete in (audio_dir/"beach-waves.mp3",audio_dir/"beach-birds.mp3",ROOT/"dark-music.js"):
    if obsolete.exists():
        obsolete.unlink()

version="20260924-site-audio-v13"
changed=0
for path in html_files:
    text=path.read_text(encoding="utf-8")

    # Remove any old dark-music includes.
    text=re.sub(r'\s*<script[^>]+src=["\'][^"\']*dark-music\.js(?:\?[^"\']*)?["\'][^>]*></script>\s*',"\n",text,flags=re.I)

    # Cache-bust the existing unified controller wherever it lives relative to the page.
    text=re.sub(r'(site-audio\.js)(?:\?v=[^"\'\s>]+)?',rf'\1?v={version}',text)

    path.write_text(text,encoding="utf-8")
    changed+=1

audiojs=(ROOT/"site-audio.js").read_text(encoding="utf-8")
checks={
    "single player":"ONE audio element for the entire site" in audiojs,
    "beach combined":"assets/audio/beach.mp3" in audiojs,
    "four sources":all(x in audiojs for x in ("dark-theme.mp3","river.mp3","waterfall.mp3","beach.mp3")),
    "hard cut":"Hard cut first" in audiojs,
    "mute":"jr-site-ambient-muted-v2" in audiojs,
    "scene mapping":"birds-water" in audiojs and "forest-waterfall" in audiojs,
}
failed=[k for k,v in checks.items() if not v]
if failed:
    raise SystemExit("Validation failed: "+", ".join(failed)+"\nBackup: "+str(backup))

for path in html_files:
    text=path.read_text(encoding="utf-8")
    if "site-audio.js" in text and f"site-audio.js?v={version}" not in text:
        raise SystemExit(f"site-audio cache-buster wrong in {path}. Backup: {backup}")
    if "dark-music.js" in text:
        raise SystemExit(f"old dark-music.js still referenced in {path}. Backup: {backup}")

node=shutil.which("node")
if node:
    result=subprocess.run([node,"--check",str(ROOT/"site-audio.js")],capture_output=True,text=True)
    if result.returncode:
        raise SystemExit("site-audio.js syntax failed:\n"+result.stderr+"\nBackup: "+str(backup))

print("Done: single-player site audio v13 installed.")
print("ONE audio element now handles every background.")
print("Dark -> space music.")
print("River -> river.")
print("Waterfall -> waterfall.")
print("Beach -> one combined recording containing waves + birds/gulls.")
print("Scene changes hard-stop the old source before loading the new one.")
print("Old dark-music.js and separate beach-waves/beach-birds files were removed.")
print("Updated",changed,"HTML pages.")
for name in sources:
    p=audio_dir/name
    print(name,p.stat().st_size,"bytes")
print("Backup:",backup)
print("On iPhone/Safari: one tap after a fresh page load may be required; after that the SAME audio element is reused for every scene.")
