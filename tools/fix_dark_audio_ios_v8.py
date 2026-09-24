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
backup = Path.home() / f"dark-audio-ios-backup-{stamp}"
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
audio_path = audio_dir / "dark-theme.mp3"
if audio_path.exists():
    shutil.copy2(audio_path, backup / "dark-theme.mp3")

scene_url = "https://raw.githubusercontent.com/joshprandall/engineering-portfolio/3d7e10c676cb79f49f38552556ecc39fbd42e2b5/site-scenes.js"
audio_url = "https://raw.githubusercontent.com/cwilliams5/matrix-music-visualizer/main/music/04-kevin-macleod-alien-spaceship-atmosphere.mp3"

with urllib.request.urlopen(scene_url, timeout=30) as response:
    scene_data = response.read()
if len(scene_data) < 5000:
    raise SystemExit("STOPPED safely: site-scenes.js download is unexpectedly small. Backup: " + str(backup))
SCENES.write_bytes(scene_data)

with urllib.request.urlopen(audio_url, timeout=60) as response:
    audio_data = response.read()
if len(audio_data) < 2_000_000:
    raise SystemExit("STOPPED safely: MP3 download is unexpectedly small. Backup: " + str(backup))
audio_path.write_bytes(audio_data)

version = "20260924-dark-audio-v8"
changed = 0
for path in html_files:
    text = path.read_text(encoding="utf-8")
    new = re.sub(r'(site-scenes\.js)(?:\?v=[^"\'\s>]+)?', rf'\1?v={version}', text)
    if new != text:
        path.write_text(new, encoding="utf-8")
        changed += 1

scenes = SCENES.read_text(encoding="utf-8")
checks = {
    "local MP3 dark track": "assets/audio/dark-theme.mp3" in scenes,
    "direct audio path": "Direct <audio> playback is the primary path" in scenes,
    "dark mode kills nature audio": "if (theme === 'dark') stopNatureAmbience();" in scenes,
    "nature restricted to light": "Nature recordings are strictly light-mode only" in scenes,
    "persistent mute": "ambientMuted ? 'Unmute' : 'Mute'" in scenes,
    "position persistence": "DARK_TRACK_TIME_KEY" in scenes,
}
failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit("Validation failed: " + ", ".join(failed) + "\nBackup: " + str(backup))

if audio_path.stat().st_size < 2_000_000:
    raise SystemExit("MP3 validation failed. Backup: " + str(backup))

node = shutil.which("node")
if node:
    result = subprocess.run([node, "--check", str(SCENES)], capture_output=True, text=True)
    if result.returncode != 0:
        raise SystemExit("JavaScript syntax validation failed:\n" + result.stderr + "\nBackup: " + str(backup))

for path in html_files:
    if f"site-scenes.js?v={version}" not in path.read_text(encoding="utf-8"):
        raise SystemExit(f"Cache-buster validation failed in {path}. Backup: {backup}")

print("Done: dark-mode audio v8 installed.")
print("Dark mode -> local MP3 space ambience, looped.")
print("Light mode -> nature ambience only.")
print("Switching to dark mode force-stops river / waterfall / beach / bird audio.")
print("Switching to light mode force-stops dark-mode music.")
print("Mute / Unmute remains persistent sitewide.")
print("On iPhone/Safari, tap once after page load to authorize audible playback.")
print(f"Updated {changed} HTML cache references.")
print("Dark track:", audio_path)
print("Backup:", backup)
