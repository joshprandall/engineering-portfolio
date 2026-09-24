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

stamp=datetime.now().strftime("%Y%m%d-%H%M%S")
backup=Path.home()/f"dark-audio-v11-backup-{stamp}"
backup.mkdir(parents=True, exist_ok=False)

for name in ("site-scenes.js","site-theme.js"):
    shutil.copy2(ROOT/name, backup/name)

html_files=[]
for path in ROOT.rglob("*.html"):
    text=path.read_text(encoding="utf-8",errors="ignore")
    if "site-theme.js" in text or "site-scenes.js" in text:
        rel=path.relative_to(ROOT)
        dest=backup/rel
        dest.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(path,dest)
        html_files.append(path)

audio_dir=ROOT/"assets"/"audio"
audio_dir.mkdir(parents=True,exist_ok=True)
audio_path=audio_dir/"dark-theme.mp3"
if audio_path.exists():
    shutil.copy2(audio_path, backup/"dark-theme.mp3")

def download(url:str,dest:Path,timeout:int=120):
    req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"})
    with urllib.request.urlopen(req,timeout=timeout) as r:
        dest.write_bytes(r.read())

download("https://raw.githubusercontent.com/joshprandall/engineering-portfolio/8e0284100c0bccd9f766e4951254221b237a7506/dark-music.js", ROOT/"dark-music.js", 30)
download("https://raw.githubusercontent.com/joshprandall/engineering-portfolio/adef49b5d99461dcc958fa26be5bc8d6958e2ce7/site-scenes.js", ROOT/"site-scenes.js", 30)
download("https://raw.githubusercontent.com/AdrianCCollier/asteroid-explorer/master/frontend/src/game/assets/sounds/interstellar-space.mp3", audio_path, 120)

if (ROOT/"dark-music.js").stat().st_size < 3000:
    raise SystemExit("dark-music.js download failed. Backup: "+str(backup))
if (ROOT/"site-scenes.js").stat().st_size < 10000:
    raise SystemExit("site-scenes.js download failed. Backup: "+str(backup))
data=audio_path.read_bytes()
if len(data)<5_000_000 or not (data[:3]==b"ID3" or (len(data)>1 and data[0]==0xFF)):
    raise SystemExit("dark-theme.mp3 validation failed. Backup: "+str(backup))

version="20260924-dark-audio-v11"
changed=0
for path in html_files:
    text=path.read_text(encoding="utf-8")

    # Ensure standalone dark player loads exactly once.
    text=re.sub(r'<script[^>]+src=["\']dark-music\.js(?:\?[^"\']*)?["\'][^>]*></script>\s*',"",text)
    theme_match=re.search(r'(<script[^>]+src=["\']site-theme\.js(?:\?[^"\']*)?["\'][^>]*></script>)',text)
    if theme_match:
        injection=theme_match.group(1)+f'\n<script defer src="dark-music.js?v={version}"></script>'
        text=text[:theme_match.start()]+injection+text[theme_match.end():]
    else:
        # If this page has scenes but no theme script for some reason, still load the player.
        head_end=text.find("</head>")
        if head_end>=0:
            text=text[:head_end]+f'<script defer src="dark-music.js?v={version}"></script>\n'+text[head_end:]

    text=re.sub(r'(site-scenes\.js)(?:\?v=[^"\'\s>]+)?',rf'\1?v={version}',text)
    path.write_text(text,encoding="utf-8")
    changed+=1

# Validation
darkjs=(ROOT/"dark-music.js").read_text(encoding="utf-8")
scenes=(ROOT/"site-scenes.js").read_text(encoding="utf-8")
checks={
    "standalone player":"jr-dark-theme-music" in darkjs,
    "immediate autoplay attempt":"audio.autoplay = true" in darkjs,
    "gesture playback":"document.addEventListener('pointerdown', gesture" in darkjs,
    "looping":"audio.loop = true" in darkjs,
    "mute integration":"jr-site-ambient-muted-v2" in darkjs,
    "light-mode isolation":"theme() === 'dark'" in darkjs,
    "scene engine no longer owns dark music":"Dark music is owned by dark-music.js" in scenes,
}
failed=[k for k,v in checks.items() if not v]
if failed:
    raise SystemExit("Validation failed: "+", ".join(failed)+"\nBackup: "+str(backup))

for path in html_files:
    txt=path.read_text(encoding="utf-8")
    if txt.count("dark-music.js")!=1:
        raise SystemExit(f"dark-music.js include count wrong in {path}. Backup: {backup}")
    if "site-scenes.js" in txt and f"site-scenes.js?v={version}" not in txt:
        raise SystemExit(f"site-scenes cache-buster wrong in {path}. Backup: {backup}")

node=shutil.which("node")
if node:
    for name in ("dark-music.js","site-scenes.js"):
        result=subprocess.run([node,"--check",str(ROOT/name)],capture_output=True,text=True)
        if result.returncode:
            raise SystemExit(f"{name} syntax failed:\n{result.stderr}\nBackup: {backup}")

print("Done: dark-mode audio v11 installed.")
print("Dark mode now has ONE independent native audio player.")
print("Track file verified:", audio_path, audio_path.stat().st_size, "bytes")
print("Light-mode nature audio is untouched.")
print("Mute/Unmute still controls the active theme audio.")
print("Updated", changed, "HTML pages.")
print("Backup:", backup)
print("IMPORTANT: iPhone Safari blocks audible autoplay on a brand-new page until a user gesture. One tap anywhere starts the dark music; after that it loops continuously on that page.")
