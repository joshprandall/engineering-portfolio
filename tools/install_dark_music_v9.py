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
backup = Path.home() / f"dark-music-v9-backup-{stamp}"
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

scene_url = "https://raw.githubusercontent.com/joshprandall/engineering-portfolio/4ea59bd73d2e124d76da19e48837ea402e07a4ed/site-scenes.js"
audio_url = "https://raw.githubusercontent.com/AdrianCCollier/asteroid-explorer/master/frontend/src/game/assets/sounds/interstellar-space.mp3"

def download(url: str, dest: Path, timeout: int) -> None:
    request = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        data = response.read()
    dest.write_bytes(data)

download(scene_url, SCENES, 30)
if SCENES.stat().st_size < 10_000:
    raise SystemExit("STOPPED safely: site-scenes.js download is unexpectedly small. Backup: " + str(backup))

download(audio_url, audio_path, 90)
audio_data = audio_path.read_bytes()
if len(audio_data) < 5_000_000:
    raise SystemExit("STOPPED safely: dark soundtrack MP3 is unexpectedly small. Backup: " + str(backup))
if not (audio_data[:3] == b"ID3" or (len(audio_data) > 1 and audio_data[0] == 0xFF)):
    raise SystemExit("STOPPED safely: dark soundtrack does not look like an MP3. Backup: " + str(backup))

version = "20260924-dark-music-v9"
changed = 0
for path in html_files:
    text = path.read_text(encoding="utf-8")
    new = re.sub(r'(site-scenes\.js)(?:\?v=[^"\'\s>]+)?', rf'\1?v={version}', text)
    if new != text:
        path.write_text(new, encoding="utf-8")
        changed += 1

scenes = SCENES.read_text(encoding="utf-8")
checks = {
    "Interstellar Space credit": "Interstellar Space" in scenes and "John Bartmann" in scenes,
    "local MP3": "assets/audio/dark-theme.mp3" in scenes,
    "persistent dark element": "ensureDarkTrackElement" in scenes and "site-dark-theme-audio" in scenes,
    "dark loop": "audio.loop = true" in scenes,
    "dark volume": "audio.volume = .24" in scenes,
    "new unmuted default namespace": "jr-site-ambient-muted-v2" in scenes,
    "light nature isolation": "Nature recordings are strictly light-mode only" in scenes,
    "mute control": "ambientMuted ? 'Unmute' : 'Mute'" in scenes,
    "project/lesson suppression": "ambientLockedByPage" in scenes and "lessonIsOpen()" in scenes,
}
failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit("Validation failed: " + ", ".join(failed) + "\nBackup: " + str(backup))

node = shutil.which("node")
if node:
    result = subprocess.run([node, "--check", str(SCENES)], capture_output=True, text=True)
    if result.returncode != 0:
        raise SystemExit("JavaScript syntax validation failed:\n" + result.stderr + "\nBackup: " + str(backup))

for path in html_files:
    if f"site-scenes.js?v={version}" not in path.read_text(encoding="utf-8"):
        raise SystemExit(f"Cache-buster validation failed in {path}. Backup: {backup}")

print("Done: dark-mode space music v9 installed.")
print("Dark mode now uses John Bartmann — Interstellar Space, stored locally as MP3.")
print("It loops continuously and remembers its approximate position between pages.")
print("Light mode nature audio was not changed.")
print("Mute / Unmute remains persistent sitewide.")
print("Projects and open lessons still suppress background music.")
print("On iPhone/Safari, one user tap may still be required after a fresh page load before audible playback is permitted.")
print(f"Updated {changed} HTML cache references.")
print("Dark soundtrack:", audio_path)
print("Backup:", backup)
