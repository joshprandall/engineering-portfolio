#!/usr/bin/env python3
from __future__ import annotations

import re
import shutil
import subprocess
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path.cwd()
for required in ("site-scenes.js","site-theme.js"):
    if not (ROOT/required).is_file():
        raise SystemExit("Run this from ~/public_html. Missing: " + required)

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = Path.home()/f"site-audio-v12-backup-{stamp}"
backup.mkdir(parents=True, exist_ok=False)

for name in ("site-scenes.js","site-theme.js"):
    shutil.copy2(ROOT/name, backup/name)

html_files=[]
for path in ROOT.rglob("*.html"):
    text=path.read_text(encoding="utf-8",errors="ignore")
    if "site-scenes.js" in text:
        rel=path.relative_to(ROOT)
        dest=backup/rel
        dest.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(path,dest)
        html_files.append(path)

audio_dir=ROOT/"assets"/"audio"
audio_dir.mkdir(parents=True,exist_ok=True)
for name in ("dark-theme.mp3","river.mp3","waterfall.mp3","beach-waves.mp3","beach-birds.mp3"):
    p=audio_dir/name
    if p.exists():
        shutil.copy2(p, backup/name)

def download(url:str,dest:Path,timeout:int=120):
    req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"})
    with urllib.request.urlopen(req,timeout=timeout) as r:
        data=r.read()
    dest.write_bytes(data)

# Exact validated controller + scene dispatcher.
download(
    "https://raw.githubusercontent.com/joshprandall/engineering-portfolio/b1889da101fff79f1a288d4f09736c3fe89a409d/site-audio.js",
    ROOT/"site-audio.js", 30
)
download(
    "https://raw.githubusercontent.com/joshprandall/engineering-portfolio/2162a832784796340a7c2d4e1125c244db7e2279/site-scenes.js",
    ROOT/"site-scenes.js", 30
)

# Local MP3 sources. No runtime streaming from third-party hosts.
sources={
    "dark-theme.mp3":
        "https://raw.githubusercontent.com/AdrianCCollier/asteroid-explorer/master/frontend/src/game/assets/sounds/interstellar-space.mp3",
    "river.mp3":
        "https://raw.githubusercontent.com/alibowbow/brainwave/main/public/audio/nature/creek-brook-cc0-v3.mp3",
    "waterfall.mp3":
        "https://raw.githubusercontent.com/alibowbow/brainwave/main/public/audio/nature/waterfall-caldeiroes-cc0-v2.mp3",
    "beach-waves.mp3":
        "https://raw.githubusercontent.com/DenisDaraganGarden/ddg-garden-site-2026/main/public/audio/soundscape/calm-ocean-waves.cc0.hq.mp3",
    "beach-birds.mp3":
        "https://raw.githubusercontent.com/DenisDaraganGarden/ddg-garden-site-2026/main/public/audio/soundscape/cliff-seagulls.cc0.hq.mp3",
}
minimum={
    "dark-theme.mp3":5_000_000,
    "river.mp3":250_000,
    "waterfall.mp3":200_000,
    "beach-waves.mp3":3_000_000,
    "beach-birds.mp3":1_000_000,
}
for name,url in sources.items():
    dest=audio_dir/name
    download(url,dest,120)
    data=dest.read_bytes()
    if len(data)<minimum[name]:
        raise SystemExit(f"STOPPED safely: {name} is unexpectedly small ({len(data)} bytes). Backup: {backup}")
    if not (data[:3]==b"ID3" or (len(data)>1 and data[0]==0xFF)):
        raise SystemExit(f"STOPPED safely: {name} does not look like MP3. Backup: {backup}")

version="20260924-site-audio-v12"
changed=0
for path in html_files:
    text=path.read_text(encoding="utf-8")

    # Remove every older standalone dark-player include.
    text=re.sub(r'\s*<script[^>]+src=["\']dark-music\.js(?:\?[^"\']*)?["\'][^>]*></script>\s*',"\n",text)

    # Remove any previous unified audio include before reinserting exactly once.
    text=re.sub(r'\s*<script[^>]+src=["\']site-audio\.js(?:\?[^"\']*)?["\'][^>]*></script>\s*',"\n",text)

    # Cache-bust site-scenes.
    text=re.sub(r'(site-scenes\.js)(?:\?v=[^"\'\s>]+)?',rf'\1?v={version}',text)

    # Insert controller immediately after site-scenes so defer order is deterministic.
    m=re.search(r'(<script[^>]+src=["\']site-scenes\.js\?v=[^"\']+["\'][^>]*></script>)',text)
    if not m:
        raise SystemExit(f"Could not locate site-scenes.js tag in {path}. Backup: {backup}")
    injection=m.group(1)+f'\n<script defer src="site-audio.js?v={version}"></script>'
    text=text[:m.start()]+injection+text[m.end():]

    path.write_text(text,encoding="utf-8")
    changed+=1

# Validation
audiojs=(ROOT/"site-audio.js").read_text(encoding="utf-8")
scenes=(ROOT/"site-scenes.js").read_text(encoding="utf-8")
checks={
    "one controller":"__JR_SITE_AUDIO_V12__" in audiojs,
    "hard stop invariant":"stop every source BEFORE starting the new scene" in audiojs,
    "beach birds":"keys:['beach','birds']" in audiojs,
    "river mapping":"light:river" in audiojs and "river.mp3" in audiojs,
    "waterfall mapping":"light:waterfall" in audiojs and "waterfall.mp3" in audiojs,
    "dark mapping":"signature:'dark'" in audiojs and "dark-theme.mp3" in audiojs,
    "legacy audio disabled":"all actual playback is owned by site-audio.js" in scenes,
    "scene event":"portfolio:scene" in scenes,
}
failed=[k for k,v in checks.items() if not v]
if failed:
    raise SystemExit("Validation failed: "+", ".join(failed)+"\nBackup: "+str(backup))

for path in html_files:
    text=path.read_text(encoding="utf-8")
    if text.count("site-audio.js")!=1:
        raise SystemExit(f"site-audio.js include count wrong in {path}. Backup: {backup}")
    if "dark-music.js" in text:
        raise SystemExit(f"old dark-music.js still loaded in {path}. Backup: {backup}")
    if f"site-scenes.js?v={version}" not in text:
        raise SystemExit(f"site-scenes cache-buster wrong in {path}. Backup: {backup}")

node=shutil.which("node")
if node:
    for name in ("site-audio.js","site-scenes.js"):
        result=subprocess.run([node,"--check",str(ROOT/name)],capture_output=True,text=True)
        if result.returncode:
            raise SystemExit(f"{name} syntax failed:\n{result.stderr}\nBackup: {backup}")

print("Done: unified site audio v12 installed.")
print("There is now ONE audio controller for dark + light themes.")
print("Dark mode: space music only.")
print("River scene: river/creek water only.")
print("Waterfall scene: waterfall only.")
print("Beach scene: ocean waves + real seagulls only.")
print("Every scene change hard-stops ALL previous audio before starting the new scene.")
print("All five audio files are local MP3 files on your OSU server.")
print("Old dark-music.js is no longer loaded.")
print("Mute/Unmute uses the same sitewide setting.")
print(f"Updated {changed} HTML pages.")
for name in sources:
    p=audio_dir/name
    print(name, p.stat().st_size, "bytes")
print("Backup:", backup)
print("iPhone/Safari may require one tap after a fresh page load before audible playback is allowed.")
