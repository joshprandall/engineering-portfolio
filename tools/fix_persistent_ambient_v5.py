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
backup = Path.home() / f"ambient-loop-backup-{stamp}"
backup.mkdir(parents=True, exist_ok=False)
shutil.copy2(TARGET, backup / "site-scenes.js")

html_files = list(ROOT.rglob("*.html"))
edited = []
for path in html_files:
    text = path.read_text(encoding="utf-8", errors="ignore")
    if "site-scenes.js" in text:
        rel = path.relative_to(ROOT)
        dest = backup / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, dest)
        edited.append(path)

url = "https://raw.githubusercontent.com/joshprandall/engineering-portfolio/561fe8ab2222ceb230b5377fe3dce62130fc9ff0/site-scenes.js"
with urllib.request.urlopen(url, timeout=25) as response:
    data = response.read()
if len(data) < 5000:
    raise SystemExit("STOPPED safely: downloaded site-scenes.js is unexpectedly small. Backup: " + str(backup))
TARGET.write_bytes(data)

version = "20260924-audio-v5"
changed = 0
for path in edited:
    text = path.read_text(encoding="utf-8")
    new = re.sub(r'(site-scenes\.js)(?:\?v=[^"\'\s>]+)?', rf'\1?v={version}', text)
    if new != text:
        path.write_text(new, encoding="utf-8")
        changed += 1

scenes = TARGET.read_text(encoding="utf-8")
checks = {
    "mute label": "ambientMuted ? 'Unmute' : 'Mute'" in scenes,
    "persistent loop watchdog": "ambientWatchdog = setInterval" in scenes,
    "no restart on every tap": "ordinary taps no longer restart the loop" in scenes,
    "cross-page immediate attempt": "Try to continue ambience immediately" in scenes,
    "looped nature video": "video.loop = true" in scenes,
    "looped synthesized ambience": "source.loop = true" in scenes,
    "project/lesson suppression": "ambientLockedByPage" in scenes and "lessonIsOpen()" in scenes,
}
failed = [name for name, ok in checks.items() if not ok]
if failed:
    raise SystemExit("Validation failed: " + ", ".join(failed) + "\nBackup: " + str(backup))

node = shutil.which("node")
if node:
    result = subprocess.run([node, "--check", str(TARGET)], capture_output=True, text=True)
    if result.returncode != 0:
        raise SystemExit("JavaScript syntax validation failed:\n" + result.stderr + "\nBackup: " + str(backup))

for path in edited:
    text = path.read_text(encoding="utf-8")
    if f"site-scenes.js?v={version}" not in text:
        raise SystemExit(f"Cache-buster validation failed in {path}. Backup: {backup}")

print("Done: persistent ambience v5 installed.")
print("Mute now stops all site ambience immediately; Unmute resumes it.")
print("When unmuted, dark and light ambience loops continuously instead of restarting on every tap.")
print("A watchdog restores the loop if the browser interrupts it while the page remains active.")
print("The site tries to resume ambience automatically on each page; iPhone/Safari may still require one tap after navigation.")
print("Projects and open lessons remain intentionally silent for background site ambience.")
print(f"Updated {changed} HTML cache references.")
print("Backup:", backup)
