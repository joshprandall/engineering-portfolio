#!/usr/bin/env python3
from pathlib import Path
import urllib.request, shutil, subprocess

root=Path.cwd()
if not (root/"assets"/"audio").is_dir():
    raise SystemExit("Run this from ~/public_html; assets/audio is missing.")

url="https://raw.githubusercontent.com/joshprandall/engineering-portfolio/cc58f64c186f72ca1e3e9a2dd49ab9ac56eb2fb2/audio-diagnostic.html"
dest=root/"audio-diagnostic.html"
req=urllib.request.Request(url,headers={"User-Agent":"Mozilla/5.0"})
with urllib.request.urlopen(req,timeout=30) as r:
    dest.write_bytes(r.read())

files=["dark-theme.mp3","river.mp3","waterfall.mp3","beach.mp3"]
print("Local files:")
for name in files:
    p=root/"assets"/"audio"/name
    print(name, "exists="+str(p.exists()), "bytes="+str(p.stat().st_size if p.exists() else 0))
    if p.exists():
        result=subprocess.run(["file","-b",str(p)],capture_output=True,text=True)
        print("  file:",result.stdout.strip())

print("\nDiagnostic page installed:")
print("https://web.engr.oregonstate.edu/~randjosh/audio-diagnostic.html?fresh=1")
print("\nThis does NOT modify production audio behavior.")
