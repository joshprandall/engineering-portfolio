#!/usr/bin/env python3
"""Backup-first deployment of the verified vNext portfolio from a pinned GitHub commit to OSU public_html."""
from pathlib import Path
from urllib.request import Request, urlopen
from zipfile import ZipFile
import datetime, io, os, shutil, sys, tarfile, tempfile

SITE_SHA = "656151a6bdcd5498c2bcb4d3e85667d8fe5831f4"
ARCHIVE = f"https://github.com/joshprandall/engineering-portfolio/archive/{SITE_SHA}.zip"
LIVE_URL = "https://web.engr.oregonstate.edu/~randjosh/"
SKIP_TOP = {".github", "release-upload", "tests", "tools", "site-repair"}
SKIP_ROOT_SUFFIXES = {".md", ".txt"}
SKIP_ROOT_FILES = {"package.json", "package-lock.json"}
PRESERVE_PREFIXES = {"games/evil-wizard/"}
PRESERVE_EXACT = {"assets/fusion-presentation.mp4"}

EXPECTED = {
    "index.html",
    "projects.html",
    "portfolio-next.js",
    "portfolio-next.css",
    "learn-paths.html",
    "learn-capstones.html",
    "learning-capstones.js",
    "learning-capstones.css",
    "learning-capstones.json",
    "project-battle-chess.html",
    "games/3d-battle-chess/index.html",
    "games/3d-battle-chess/boot.js",
    "games/3d-battle-chess/fallback-board.js",
}
HOST_ONLY = {
    "games/evil-wizard/index.html": "Evil Wizard browser export",
    "assets/fusion-presentation.mp4": "fusion presentation video",
}

def stop(msg):
    print("STOP:", msg, file=sys.stderr)
    sys.exit(1)

def safe_rel(member, root_name):
    p = Path(member)
    parts = p.parts
    if not parts or parts[0] != root_name:
        return None
    rel = Path(*parts[1:])
    if not rel.parts or rel.is_absolute() or ".." in rel.parts:
        return None
    return rel

def should_copy(rel):
    posix = rel.as_posix()
    if rel.parts[0] in SKIP_TOP:
        return False
    if posix in PRESERVE_EXACT or any(posix.startswith(p) for p in PRESERVE_PREFIXES):
        return False
    if len(rel.parts) == 1:
        if rel.name in SKIP_ROOT_FILES or rel.suffix.lower() in SKIP_ROOT_SUFFIXES:
            return False
        if rel.name.startswith("projects-before-"):
            return False
    return True

def fetch(url, timeout=90):
    req = Request(url, headers={"User-Agent": "Joshua-Randall-OSU-deployer/1.0"})
    with urlopen(req, timeout=timeout) as r:
        return r.read()

def main():
    site = (Path.home() / "public_html").resolve()
    if not site.is_dir():
        stop(f"website root missing: {site}")
    if not (site / "index.html").is_file():
        stop(f"{site} does not look like the website root")

    print("Target:", site)
    for rel, label in HOST_ONLY.items():
        p = site / rel
        print(("PRESERVE" if p.is_file() else "WARNING"), label + ":", p)

    print("Downloading pinned GitHub build:", SITE_SHA)
    try:
        data = fetch(ARCHIVE)
    except Exception as e:
        stop(f"could not download GitHub build: {e}")
    if len(data) < 100000:
        stop(f"downloaded archive is unexpectedly small ({len(data)} bytes)")

    try:
        z = ZipFile(io.BytesIO(data))
        bad = z.testzip()
        if bad:
            stop(f"archive CRC check failed at {bad}")
        roots = {Path(n).parts[0] for n in z.namelist() if Path(n).parts}
        if len(roots) != 1:
            stop("archive root is ambiguous")
        root_name = next(iter(roots))
        names = set()
        for n in z.namelist():
            rel = safe_rel(n, root_name)
            if rel and not n.endswith("/"):
                names.add(rel.as_posix())
        missing = sorted(EXPECTED - names)
        if missing:
            stop("pinned build is missing required files: " + ", ".join(missing))
    except Exception as e:
        if isinstance(e, SystemExit):
            raise
        stop(f"archive validation failed: {e}")

    stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = site.parent / f"public_html-pre-vnext-{stamp}.tar.gz"
    print("Creating full backup:", backup)
    part = Path(str(backup) + ".part")
    try:
        with tarfile.open(part, "w:gz") as t:
            t.add(site, arcname="public_html", recursive=True)
        if part.stat().st_size < 1000:
            stop("backup archive is unexpectedly small")
        os.replace(part, backup)
    finally:
        if part.exists():
            part.unlink()

    stage = Path(tempfile.mkdtemp(prefix="osu-vnext-", dir=site.parent))
    copied = []
    try:
        z.extractall(stage)
        src = stage / root_name

        # Content sanity checks before touching the live files.
        home = (src / "index.html").read_text("utf-8")
        projects = (src / "projects.html").read_text("utf-8")
        capstones = (src / "learn-capstones.html").read_text("utf-8")
        if "Quantum Engineering program" not in home or "Computer Science and Electrical &amp; Computer Engineering" not in home:
            stop("education wording check failed")
        if "3D Battle Chess" not in projects:
            stop("Battle Chess project card check failed")
        if "Foundation capstone labs" not in capstones:
            stop("capstone page check failed")

        for p in src.rglob("*"):
            if not p.is_file():
                continue
            rel = p.relative_to(src)
            if not should_copy(rel):
                continue
            dest = site / rel
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(p, dest)
            os.chmod(dest, 0o644)
            copied.append(rel.as_posix())
            # Only set traversal permissions on directories involved in this copy.
            parent = dest.parent
            while parent != site.parent:
                if parent.exists():
                    os.chmod(parent, 0o755)
                if parent == site:
                    break
                parent = parent.parent

        os.chmod(site, 0o755)

        # Host-only files must survive the overlay if they were present beforehand.
        for rel, label in HOST_ONLY.items():
            p = site / rel
            if p.exists():
                if p.is_file():
                    os.chmod(p, 0o644)
                parent = p.parent
                while parent != site.parent:
                    os.chmod(parent, 0o755)
                    if parent == site:
                        break
                    parent = parent.parent

        # Verify files that distinguish this release.
        for rel in EXPECTED:
            p = site / rel
            if not p.is_file() or p.stat().st_size == 0:
                stop(f"post-deploy verification failed: {rel}")

        print(f"DEPLOYED {len(copied)} repository web files")
        print("Backup:", backup)
        print("Pinned source:", SITE_SHA)

        checks = [
            ("", "Joshua Randall"),
            ("projects.html", "3D Battle Chess"),
            ("learn-capstones.html", "Foundation capstone labs"),
            ("games/3d-battle-chess/", "3D Battle Chess"),
        ]
        print("HTTP smoke checks:")
        for path, marker in checks:
            try:
                body = fetch(LIVE_URL + path, timeout=20).decode("utf-8", "replace")
                ok = marker in body
                print(("PASS" if ok else "CHECK"), LIVE_URL + path)
            except Exception as e:
                print("CHECK", LIVE_URL + path, "-", e)

        print("LIVE DEPLOYMENT COMPLETE")
    except Exception:
        print("Deployment failed after backup. Roll back from:", backup, file=sys.stderr)
        raise
    finally:
        shutil.rmtree(stage, ignore_errors=True)

if __name__ == "__main__":
    main()
