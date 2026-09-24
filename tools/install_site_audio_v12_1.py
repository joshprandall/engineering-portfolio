#!/usr/bin/env python3
from __future__ import annotations

import re
import shutil
import subprocess
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path.cwd()
if not (ROOT/"site-scenes.js").is_file():
    raise SystemExit("Run this from ~/public_html. Missing site-scenes.js")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = Path.home()/f"site-audio-v12_1-backup-{stamp}"
backup.mkdir(parents=True, exist_ok=False)

for name in ("site-scenes.js","site-theme.js","site-audio.js"):
    p=ROOT/name
    if p.exists():
        shutil.copy2(p, backup/name)

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
        dest.write_bytes(r.read())

# Install validated controller and scene dispatcher.
download(
    "https://raw.githubusercontent.com/joshprandall/engineering-portfolio/b1889da101fff79f1a288d4f09736c3fe89a409d/site-audio.js",
    ROOT/"site-audio.js", 30
)
download(
    "https://raw.githubusercontent.com/joshprandall/engineering-portfolio/2162a832784796340a7c2d4e1125c244db7e2279/site-scenes.js",
    ROOT/"site-scenes.js", 30
)

# Store every source locally so scene changes never depend on remote runtime audio.
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

version="20260924-site-audio-v12-1"

# Match site-scenes.js regardless of whether the page is root, ../, ../../, etc.
scene_tag_re=re.compile(
    r'<script(?P<attrs>[^>]*?)src=(?P<q>["\'])(?P<src>[^"\']*site-scenes\.js(?:\?[^"\']*)?)(?P=q)(?P<tail>[^>]*)></script>',
    re.I
)
old_audio_re=re.compile(
    r'\s*<script[^>]+src=["\'][^"\']*(?:dark-music|site-audio)\.js(?:\?[^"\']*)?["\'][^>]*></script>\s*',
    re.I
)

changed=0
for path in html_files:
    text=path.read_text(encoding="utf-8")

    # Remove old dedicated audio script tags first.
    text=old_audio_re.sub("\n",text)

    m=scene_tag_re.search(text)
    if not m:
        raise SystemExit(f"Could not locate a site-scenes.js script tag in {path}. Backup: {backup}")

    old_src=m.group("src")
    prefix=old_src.split("site-scenes.js",1)[0]
    scene_src=prefix + "site-scenes.js?v=" + version
    audio_src=prefix + "site-audio.js?v=" + version

    scene_tag=f'<script defer src="{scene_src}"></script>'
    audio_tag=f'<script defer src="{audio_src}"></script>'

    # Replace the actual scene tag, preserving the correct ../ prefix for this page.
    text=text[:m.start()] + scene_tag + "\n" + audio_tag + text[m.end():]
    path.write_text(text,encoding="utf-8")
    changed+=1

# Validate every page gets exactly one correct controller include.
for path in html_files:
    text=path.read_text(encoding="utf-8")
    if len(re.findall(r'(?:dark-music|site-audio)\.js',text,re.I)) != 1:
        raise SystemExit(f"Audio controller include count is wrong in {path}. Backup: {backup}")

    m=scene_tag_re.search(text)
    if not m:
        raise SystemExit(f"site-scenes.js tag missing after patch in {path}. Backup: {backup}")
    scene_src=m.group("src")
    prefix=scene_src.split("site-scenes.js",1)[0]
    expected_audio=prefix+"site-audio.js?v="+version
    if expected_audio not in text:
        raise SystemExit(f"Wrong relative site-audio.js path in {path}. Expected {expected_audio}. Backup: {backup}")

audiojs=(ROOT/"site-audio.js").read_text(encoding="utf-8")
scenes=(ROOT/"site-scenes.js").read_text(encoding="utf-8")
checks={
    "one unified controller":"__JR_SITE_AUDIO_V12__" in audiojs,
    "hard scene stop":"stop every source BEFORE starting the new scene" in audiojs,
    "beach birds":"keys:['beach','birds']" in audiojs,
    "river":"light:river" in audiojs,
    "waterfall":"light:waterfall" in audiojs,
    "dark":"signature:'dark'" in audiojs,
    "legacy engine disabled":"all actual playback is owned by site-audio.js" in scenes,
    "scene events":"portfolio:scene" in scenes,
}
failed=[k for k,v in checks.items() if not v]
if failed:
    raise SystemExit("Validation failed: "+", ".join(failed)+"\nBackup: "+str(backup))

node=shutil.which("node")
if node:
    for name in ("site-audio.js","site-scenes.js"):
        result=subprocess.run([node,"--check",str(ROOT/name)],capture_output=True,text=True)
        if result.returncode:
            raise SystemExit(f"{name} syntax failed:\n{result.stderr}\nBackup: {backup}")

print("Done: unified site audio v12.1 installed.")
print("Fixed nested-page paths such as geometric-lab/index.html.")
print("Dark: space music only.")
print("River: river/creek only.")
print("Waterfall: waterfall only.")
print("Beach: ocean waves + real seagulls only.")
print("Every scene change hard-stops all prior audio before starting the next scene.")
print("Old dark-music.js is no longer loaded.")
print("Updated",changed,"HTML pages.")
for name in sources:
    p=audio_dir/name
    print(name,p.stat().st_size,"bytes")
print("Backup:",backup)
