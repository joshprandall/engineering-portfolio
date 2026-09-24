#!/usr/bin/env python3
from __future__ import annotations

import re
import shutil
import subprocess
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path.cwd()
SCENES = ROOT / "site-scenes.js"
if not SCENES.is_file():
    raise SystemExit("Run this from ~/public_html. Missing site-scenes.js")

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = Path.home() / f"dark-space-audio-backup-{stamp}"
backup.mkdir(parents=True, exist_ok=False)
shutil.copy2(SCENES, backup / "site-scenes.js")

html_files = []
for path in ROOT.rglob("*.html"):
    text = path.read_text(encoding="utf-8", errors="ignore")
    if "site-scenes.js" in text:
        rel = path.relative_to(ROOT)
        dest = backup / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, dest)
        html_files.append(path)

audio_dir = ROOT / "assets" / "audio"
audio_dir.mkdir(parents=True, exist_ok=True)
audio_path = audio_dir / "dark-theme.ogg"
if audio_path.exists():
    shutil.copy2(audio_path, backup / "dark-theme.ogg")

scene_url = "https://raw.githubusercontent.com/joshprandall/engineering-portfolio/d727f180b10231002db71b342dfc12b2c160f7b1/site-scenes.js"
audio_url = "https://commons.wikimedia.org/wiki/Special:Redirect/file/Kevin%20MacLeod%20-%20Alien%20Spaceship%20Atmosphere%20%28cc0%29.ogg"

with urllib.request.urlopen(scene_url, timeout=25) as response:
    scene_data = response.read()
if len(scene_data) < 5000:
    raise SystemExit("STOPPED safely: site-scenes.js download is unexpectedly small. Backup: " + str(backup))
SCENES.write_bytes(scene_data)

with urllib.request.urlopen(audio_url, timeout=45) as response:
    audio_data = response.read()
if len(audio_data) < 500_000:
    raise SystemExit("STOPPED safely: dark-mode audio download is unexpectedly small. Backup: " + str(backup))
audio_path.write_bytes(audio_data)

version = "20260924-space-audio-v7"
changed = 0
for path in html_files:
    text = path.read_text(encoding="utf-8")
    new = re.sub(r'(site-scenes\.js)(?:\?v=[^"\'\s>]+)?', rf'\1?v={version}', text)
    if new != text:
        path.write_text(new, encoding="utf-8")
        changed += 1

scenes = SCENES.read_text(encoding="utf-8")
checks = {
    "dark track path": "assets/audio/dark-theme.ogg" in scenes,
    "dark credit": "Alien Spaceship Atmosphere" in scenes,
    "looping audio": "loop:true" in scenes,
    "mute support": "ambientMuted ? 'Unmute' : 'Mute'" in scenes,
    "page-position persistence": "DARK_TRACK_TIME_KEY" in scenes,
}
failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit("Validation failed: " + ", ".join(failed) + "\nBackup: " + str(backup))

if audio_path.stat().st_size < 500_000:
    raise SystemExit("Audio validation failed. Backup: " + str(backup))

node = shutil.which("node")
if node:
    result = subprocess.run([node, "--check", str(SCENES)], capture_output=True, text=True)
    if result.returncode != 0:
        raise SystemExit("JavaScript syntax validation failed:\n" + result.stderr + "\nBackup: " + str(backup))

for path in html_files:
    if f"site-scenes.js?v={version}" not in path.read_text(encoding="utf-8"):
        raise SystemExit(f"Cache-buster validation failed in {path}. Backup: {backup}")

print("Done: CC0 dark-mode space music installed.")
print("Track: Alien Spaceship Atmosphere — Kevin MacLeod.")
print("License: CC0 1.0 public-domain dedication.")
print("Stored locally at: assets/audio/dark-theme.ogg")
print("Dark mode loops the track, remembers playback position across pages, and obeys Mute/Unmute.")
print("Projects and open lessons still suppress background audio.")
print(f"Updated {changed} HTML cache references.")
print("Backup:", backup)
