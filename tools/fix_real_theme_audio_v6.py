#!/usr/bin/env python3
from __future__ import annotations

import re
import shutil
import subprocess
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path.cwd()
TARGET = ROOT / "site-scenes.js"
if not TARGET.is_file():
    raise SystemExit("Run this from ~/public_html. Missing site-scenes.js")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = Path.home() / f"real-audio-backup-{stamp}"
backup.mkdir(parents=True, exist_ok=False)
shutil.copy2(TARGET, backup / "site-scenes.js")

html_files = []
for path in ROOT.rglob("*.html"):
    text = path.read_text(encoding="utf-8", errors="ignore")
    if "site-scenes.js" in text:
        rel = path.relative_to(ROOT)
        dest = backup / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, dest)
        html_files.append(path)

url = "https://raw.githubusercontent.com/joshprandall/engineering-portfolio/a03484622feb8bc38fcaf36ca5e101b913d84cb6/site-scenes.js"
with urllib.request.urlopen(url, timeout=25) as response:
    data = response.read()
if len(data) < 5000:
    raise SystemExit("STOPPED safely: downloaded site-scenes.js is unexpectedly small. Backup: " + str(backup))
TARGET.write_bytes(data)

audio_dir = ROOT / "assets" / "audio"
audio_dir.mkdir(parents=True, exist_ok=True)
readme = audio_dir / "README.txt"
if not readme.exists():
    readme.write_text(
        "Dark-theme music hook:\n"
        "Place a legally licensed site-playback copy at assets/audio/dark-theme.mp3.\n"
        "The site will loop it in dark mode and mute it automatically inside projects and open lessons.\n",
        encoding="utf-8"
    )

version = "20260924-real-audio-v6"
changed = 0
for path in html_files:
    text = path.read_text(encoding="utf-8")
    new = re.sub(r'(site-scenes\.js)(?:\?v=[^"\'\s>]+)?', rf'\1?v={version}', text)
    if new != text:
        path.write_text(new, encoding="utf-8")
        changed += 1

scenes = TARGET.read_text(encoding="utf-8")
checks = {
    "real river": "Sanna%20river%20rapids.ogg" in scenes,
    "real beach": "Ocean%20Waves%20on%20a%20Tropical%20Beach.ogg" in scenes,
    "real waterfall": "Water%20fall.ogg" in scenes,
    "real shorebirds": "Cape%20May%20Shorebirds%20closer.ogg" in scenes,
    "dark licensed hook": "assets/audio/dark-theme.mp3" in scenes,
    "dark position persistence": "DARK_TRACK_TIME_KEY" in scenes and "saveDarkTrackTime" in scenes,
    "mute persistence": "AMBIENT_AUDIO_KEY" in scenes,
    "project lesson suppression": "ambientLockedByPage" in scenes and "lessonIsOpen()" in scenes,
}
failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit("Validation failed: " + ", ".join(failed) + "\nBackup: " + str(backup))

node = shutil.which("node")
if node:
    result = subprocess.run([node, "--check", str(TARGET)], capture_output=True, text=True)
    if result.returncode != 0:
        raise SystemExit("JavaScript syntax validation failed:\n" + result.stderr + "\nBackup: " + str(backup))

for path in html_files:
    if f"site-scenes.js?v={version}" not in path.read_text(encoding="utf-8"):
        raise SystemExit(f"Cache-buster validation failed in {path}. Backup: {backup}")

print("Done: real scene-matched ambience v6 installed.")
print("River scene -> real river recording, looped.")
print("Waterfall scene -> real waterfall recording, looped.")
print("Beach scene -> real ocean waves + intermittent real shorebird calls.")
print("Mute / Unmute remains persistent sitewide.")
print("Projects and open lessons still suppress background ambience.")
print("Dark mode now looks for: assets/audio/dark-theme.mp3")
print("If that licensed file exists, it loops persistently in dark mode.")
print(f"Updated {changed} HTML cache references.")
print("Backup:", backup)
