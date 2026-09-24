#!/usr/bin/env python3
from __future__ import annotations

import re
import shutil
import subprocess
import urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path.cwd()
CORE = {
    "site-scenes.js": "https://raw.githubusercontent.com/joshprandall/engineering-portfolio/47e92456fe10ddd14ddcd46a40cb4f9477eadc42/site-scenes.js",
    "site-theme.js": "https://raw.githubusercontent.com/joshprandall/engineering-portfolio/6c95ad170593588fa08bf7eb7ba9bf89d052bfae/site-theme.js",
    "knowledge.js": "https://raw.githubusercontent.com/joshprandall/engineering-portfolio/ef6ad94e5e698a9698156ffde488ccc22f347a0a/knowledge.js",
}

missing = [name for name in CORE if not (ROOT / name).is_file()]
if missing:
    raise SystemExit("Run this from ~/public_html. Missing: " + ", ".join(missing))

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = Path.home() / f"audio-motion-backup-{stamp}"
backup.mkdir(parents=True, exist_ok=False)

# Back up shared JS and every HTML page whose cache-buster will be touched.
for name in CORE:
    shutil.copy2(ROOT / name, backup / name)

html_files = list(ROOT.rglob("*.html"))
html_to_edit = []
for path in html_files:
    text = path.read_text(encoding="utf-8", errors="ignore")
    if any(token in text for token in ("site-theme.js", "site-scenes.js", "knowledge.js")):
        rel = path.relative_to(ROOT)
        dest = backup / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, dest)
        html_to_edit.append(path)

# Install the exact validated shared files.
for name, url in CORE.items():
    with urllib.request.urlopen(url, timeout=25) as response:
        data = response.read()
    if len(data) < 500:
        raise SystemExit(f"STOPPED safely: downloaded {name} is unexpectedly small. Backup: {backup}")
    (ROOT / name).write_bytes(data)

version = "20260924-audio-v4"
changed = 0
for path in html_to_edit:
    text = path.read_text(encoding="utf-8")
    new = re.sub(r'(site-theme\.js)(?:\?v=[^"\'\s>]+)?', rf'\1?v={version}', text)
    new = re.sub(r'(site-scenes\.js)(?:\?v=[^"\'\s>]+)?', rf'\1?v={version}', new)
    new = re.sub(r'(knowledge\.js)(?:\?v=[^"\'\s>]+)?', rf'\1?v={version}', new)
    if new != text:
        path.write_text(new, encoding="utf-8")
        changed += 1

# Validate the important behavior before declaring success.
scenes = (ROOT / "site-scenes.js").read_text(encoding="utf-8")
theme = (ROOT / "site-theme.js").read_text(encoding="utf-8")
knowledge = (ROOT / "knowledge.js").read_text(encoding="utf-8")

checks = {
    "footer mute": "audioButton.textContent = ambientMuted ? 'Unmute' : 'Mute';" in scenes,
    "motion always on": "const motionAllowed = () => true;" in scenes and "const isPaused = () => false;" in theme,
    "fast background preload": "rel = 'preload'" in scenes and "fetchPriority = 'high'" in scenes,
    "stronger dark ambience": "i === 0 ? .0115 : .0082" in scenes,
    "stronger nature ambience": "gain:.028" in scenes and "gain:.0205" in scenes,
    "lesson ambience suppression": "portfolio:ambient-suppression" in knowledge,
    "natural narration preference": "Prefer modern, natural-sounding system voices" in knowledge,
}
failed = [label for label, ok in checks.items() if not ok]
if failed:
    raise SystemExit("Validation failed: " + ", ".join(failed) + "\nRestore from: " + str(backup))

node = shutil.which("node")
if node:
    for name in CORE:
        result = subprocess.run([node, "--check", str(ROOT / name)], capture_output=True, text=True)
        if result.returncode != 0:
            raise SystemExit(f"JavaScript syntax check failed for {name}:\n{result.stderr}\nBackup: {backup}")

scene_pages = 0
for path in html_files:
    try:
        text = path.read_text(encoding="utf-8")
    except Exception:
        continue
    if "site-scenes.js" in text:
        scene_pages += 1
        if f"site-scenes.js?v={version}" not in text:
            raise SystemExit(f"Cache-buster validation failed in {path}. Backup: {backup}")

print("Done: global ambience + motion v4 installed.")
print("Bottom Pause motion control is now the functional Mute / Unmute button.")
print("Motion is locked ON sitewide; legacy pause controls are removed.")
print("Dark mode: louder original cinematic organ-like ambience.")
print("Light mode: louder scene-matched river / waterfall / surf + bird ambience.")
print("Projects and open lessons suppress background ambience automatically.")
print("Background media is preconnected/preloaded for faster first paint.")
print(f"Updated cache references in {changed} HTML files; {scene_pages} pages load the living scene system.")
print("Backup:", backup)
print("Note: iPhone/Safari requires one user interaction before audible background audio can begin.")
