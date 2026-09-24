#!/usr/bin/env python3
"""Deploy the complete Geometry Lab from one exact tested GitHub commit.

This intentionally touches only ~/public_html/geometric-lab. It creates a full
backup, copies the repository version without deleting host-only extras,
verifies installed bytes, performs public HTTP checks, and rolls back on error.
"""
import argparse
import datetime
import hashlib
import os
import re
import shutil
import tarfile
import tempfile
from pathlib import Path
from urllib.request import Request, urlopen
from zipfile import ZipFile

REPO = "joshprandall/engineering-portfolio"
PUBLIC_URL = "https://web.engr.oregonstate.edu/~randjosh/geometric-lab/"
CORE_REQUIRED = (
    "index.html",
    "styles.css",
    "app.js",
    "math.js",
    "worker.js",
    "benchmarks.js",
    "METHODS.md",
    "CREDITS.md",
    "assets/favicon.svg",
)

def digest(path):
    h = hashlib.sha256()
    with path.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def fetch(url, target):
    req = Request(url, headers={"User-Agent": "Joshua-Randall-Geometry-Lab-Deploy/2.0"})
    with urlopen(req, timeout=60) as response, target.open("wb") as out:
        shutil.copyfileobj(response, out)

def public_check(relative, expected_fragment=None):
    url = PUBLIC_URL + relative
    req = Request(url, headers={
        "User-Agent": "Joshua-Randall-Geometry-Lab-Deploy/2.0",
        "Cache-Control": "no-cache",
    })
    with urlopen(req, timeout=20) as response:
        body = response.read()
        status = getattr(response, "status", 200)
        ctype = response.headers.get("Content-Type", "")
    if status != 200:
        raise RuntimeError(f"{url} returned HTTP {status}")
    if relative.endswith(".js") and "javascript" not in ctype.lower() and "text/plain" not in ctype.lower():
        raise RuntimeError(f"{url} has unexpected JavaScript content type: {ctype!r}")
    if expected_fragment and expected_fragment.encode() not in body:
        raise RuntimeError(f"{url} did not contain expected marker {expected_fragment!r}")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--commit", required=True, help="Exact 40-character tested Git commit SHA")
    parser.add_argument("--web-root", default=str(Path.home() / "public_html"))
    args = parser.parse_args()

    sha = args.commit.strip().lower()
    if not re.fullmatch(r"[0-9a-f]{40}", sha):
        raise SystemExit("--commit must be one exact 40-character Git SHA; branch names are rejected")

    web_root = Path(args.web_root).expanduser().resolve()
    target = web_root / "geometric-lab"
    if web_root.name != "public_html" and not os.environ.get("ALLOW_NONSTANDARD_WEB_ROOT"):
        raise SystemExit(f"Refusing nonstandard web root {web_root}; set ALLOW_NONSTANDARD_WEB_ROOT=1 for testing")

    stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_dir = Path.home() / ".portfolio-backups"
    backup_dir.mkdir(parents=True, exist_ok=True)
    backup = backup_dir / f"geometry-lab-{stamp}.tar.gz"

    with tempfile.TemporaryDirectory(prefix="geometry-lab-deploy-") as td:
        tmp = Path(td)
        archive = tmp / "source.zip"
        fetch(f"https://github.com/{REPO}/archive/{sha}.zip", archive)

        source_root = tmp / "source"
        source_root.mkdir()
        with ZipFile(archive) as zf:
            bad = [n for n in zf.namelist() if n.startswith("/") or ".." in Path(n).parts]
            if bad:
                raise RuntimeError("Archive contains unsafe paths")
            zf.extractall(source_root)

        roots = [p for p in source_root.iterdir() if p.is_dir()]
        if len(roots) != 1:
            raise RuntimeError("Unexpected GitHub archive layout")
        source = roots[0] / "geometric-lab"

        for rel in CORE_REQUIRED:
            if not (source / rel).is_file():
                raise RuntimeError(f"Tested commit is missing required Geometry Lab file: {rel}")

        if target.exists():
            with tarfile.open(backup, "w:gz") as tf:
                tf.add(target, arcname="geometric-lab")
            print(f"Backup: {backup}")
        else:
            backup = None

        installed = []
        created_target = not target.exists()
        try:
            target.mkdir(parents=True, exist_ok=True)
            for src in sorted(p for p in source.rglob("*") if p.is_file()):
                rel = src.relative_to(source)
                dst = target / rel
                dst.parent.mkdir(parents=True, exist_ok=True)
                temp_dst = dst.with_name(dst.name + ".deploy-new")
                shutil.copy2(src, temp_dst)
                temp_dst.replace(dst)
                installed.append((src, dst))

            mismatches = [
                str(dst.relative_to(target))
                for src, dst in installed
                if digest(src) != digest(dst)
            ]
            if mismatches:
                raise RuntimeError("Installed byte verification failed: " + ", ".join(mismatches))

            public_check("index.html", "Geometry & Scientific ML Lab")
            public_check("app.js", "Gauss–Bonnet laboratory")
            public_check("math.js", "gaussBonnet")
            public_check("worker.js", "estimateGeometry")

        except Exception:
            if backup:
                if target.exists():
                    shutil.rmtree(target)
                target.mkdir(parents=True, exist_ok=True)
                with tarfile.open(backup, "r:gz") as tf:
                    tf.extractall(web_root)
                print(f"ROLLBACK: restored {backup}")
            elif created_target and target.exists():
                shutil.rmtree(target)
                print("ROLLBACK: removed newly created Geometry Lab directory")
            raise

    print(f"Geometry Lab deployed from tested commit {sha}")
    print(f"Verified: {PUBLIC_URL}")

if __name__ == "__main__":
    main()
