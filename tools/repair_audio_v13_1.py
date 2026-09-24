#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
from urllib.parse import quote
import re, shutil, subprocess, urllib.request

ROOT=Path.cwd()
if not (ROOT/"site-audio.js").exists():
    raise SystemExit("Run this from ~/public_html")

stamp=datetime.now().strftime("%Y%m%d-%H%M%S")
backup=Path.home()/f"audio-v13_1-backup-{stamp}"
backup.mkdir(parents=True,exist_ok=False)

# Back up the only production pieces this repair touches.
for p in [ROOT/"site-audio.js", ROOT/"assets"/"audio"/"beach.mp3"]:
    if p.exists():
        dest=backup/p.name
        shutil.copy2(p,dest)

html_files=[]
for path in ROOT.rglob("*.html"):
    text=path.read_text(encoding="utf-8",errors="ignore")
    if "site-audio.js" in text:
        rel=path.relative_to(ROOT)
        dest=backup/rel
        dest.parent.mkdir(parents=True,exist_ok=True)
        shutil.copy2(path,dest)
        html_files.append(path)

def download(url,dest,timeout=120):
    req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"})
    with urllib.request.urlopen(req,timeout=timeout) as r:
        dest.write_bytes(r.read())

# Install the actual v13 one-player controller. The live file shown in the
# terminal was still the older 7031-byte controller, not this one.
download(
    "https://raw.githubusercontent.com/joshprandall/engineering-portfolio/d18dc54d8e55d4871c21fe52f1bb9222e35a9f3e/site-audio.js",
    ROOT/"site-audio.js",30
)

# Install the missing combined beach recording (waves + birds/gulls).
# This exact filename is a CC0 source recording used by the portfolio controller.
parts=[
    "課題-2023フォルダ","課題-2023フォルダ","assets","sound","bgm",
    "Gentle ocean waves birdsong and gull.mp3"
]
encoded="/".join(quote(part,safe="") for part in parts)
beach_url="https://raw.githubusercontent.com/kagayaphan/bullets/main/"+encoded
audio_dir=ROOT/"assets"/"audio"
audio_dir.mkdir(parents=True,exist_ok=True)
download(beach_url,audio_dir/"beach.mp3",120)

# Permissions: Apache must be able to traverse directories and read files.
for d in [ROOT, ROOT/"assets", audio_dir]:
    try: d.chmod(0o755)
    except PermissionError: pass

for p in [ROOT/"site-audio.js", audio_dir/"dark-theme.mp3", audio_dir/"river.mp3",
          audio_dir/"waterfall.mp3", audio_dir/"beach.mp3"]:
    if p.exists():
        p.chmod(0o644)

# Cache-bust every page already wired to site-audio.js.
version="20260924-site-audio-v13-1"
for path in html_files:
    text=path.read_text(encoding="utf-8")
    text=re.sub(r'(site-audio\.js)(?:\?v=[^"\'\s>]+)?',rf'\1?v={version}',text)
    path.write_text(text,encoding="utf-8")

# Local validation.
controller=(ROOT/"site-audio.js").read_text(encoding="utf-8")
if "ONE audio element for the entire site" not in controller:
    raise SystemExit("Wrong site-audio.js installed. Backup: "+str(backup))
if "assets/audio/beach.mp3" not in controller:
    raise SystemExit("Controller does not reference beach.mp3. Backup: "+str(backup))
if (audio_dir/"beach.mp3").stat().st_size < 2_000_000:
    raise SystemExit("beach.mp3 is too small. Backup: "+str(backup))

node=shutil.which("node")
if node:
    r=subprocess.run([node,"--check",str(ROOT/"site-audio.js")],capture_output=True,text=True)
    if r.returncode:
        raise SystemExit("site-audio.js syntax error:\n"+r.stderr+"\nBackup: "+str(backup))

# Verify live HTTP delivery from the actual public site.
base="https://web.engr.oregonstate.edu/~randjosh/"
targets=["site-audio.js","assets/audio/dark-theme.mp3","assets/audio/river.mp3",
         "assets/audio/waterfall.mp3","assets/audio/beach.mp3"]
print("=== LIVE WEB CHECK ===")
for target in targets:
    cmd=["curl","-L","-s","-o","/dev/null","-w","%{http_code} %{content_type}",
         base+target+"?v="+version]
    r=subprocess.run(cmd,capture_output=True,text=True)
    print(target, r.stdout.strip())
    if not r.stdout.startswith("200 "):
        raise SystemExit("Live web check failed for "+target+". Backup: "+str(backup))

print("\nDone: audio v13.1 repair installed.")
print("The live controller is now the one-player v13 build.")
print("The previously missing beach.mp3 now exists.")
print("All four audio files and site-audio.js return HTTP 200.")
print("Backup:",backup)
