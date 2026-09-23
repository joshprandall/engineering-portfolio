#!/usr/bin/env python3
"""Deploy Joshua Randall's merged vNext portfolio to OSU public_html.

Pinned source: GitHub merge commit 656151a6bdcd5498c2bcb4d3e85667d8fe5831f4.
The deployment is an overlay: repository-owned web files are refreshed while
OSU-only content (notably Evil Wizard and the fusion video) is preserved.
"""
from __future__ import annotations

from pathlib import Path, PurePosixPath
import datetime as dt
import hashlib
import os
import shutil
import sys
import tarfile
import tempfile
import time
import urllib.request

REPO = "joshprandall/engineering-portfolio"
SOURCE_COMMIT = "656151a6bdcd5498c2bcb4d3e85667d8fe5831f4"
ARCHIVE_URL = f"https://codeload.github.com/{REPO}/tar.gz/{SOURCE_COMMIT}"
LIVE_BASE = "https://web.engr.oregonstate.edu/~randjosh/"

EXCLUDED_PREFIXES = (
    ".github/",
    "release-upload/",
    "tests/",
    "tools/",
)
EXCLUDED_FILES = {
    ".gitignore",
    "DEPLOYMENT.md",
    "NEXT-RELEASE-NOTES.md",
    "README.md",
    "README_KNOWLEDGE_PLATFORM.txt",
    "RECONCILIATION_NOTES.md",
    "RELEASE_SYNC_STEPS.md",
    "SITE_IMPORT_REPORT.json",
    "package.json",
    "package-lock.json",
}
PROTECTED_HOST_PATHS = (
    "games/evil-wizard/",
    "assets/fusion-presentation.mp4",
)
CRITICAL_LOCAL = (
    "index.html",
    "projects.html",
    "learn.html",
    "learn-paths.html",
    "learn-capstones.html",
    "portfolio-next.css",
    "portfolio-next.js",
    "learning-next.css",
    "learning-next.js",
    "learning-capstones.css",
    "learning-capstones.js",
    "learning-capstones.json",
    "knowledge.js",
    "knowledge-data.js",
    "knowledge.css",
    "assets/portrait.jpg",
    "assets/osu-logo.png",
    "assets/quantum-lab-reference.jpg",
    "games/3d-battle-chess/index.html",
    "games/3d-battle-chess/engine.js",
    "games/3d-battle-chess/boot.js",
    "games/3d-battle-chess/fallback-board.js",
)
LIVE_CHECKS = (
    ("", "portfolio-next.css"),
    ("projects.html", "project-battle-chess.html"),
    ("learn-capstones.html", "Foundation capstone labs"),
    ("games/3d-battle-chess/", "3D Battle Chess"),
)

def die(message: str) -> None:
    print(f"STOP: {message}", file=sys.stderr)
    raise SystemExit(1)

def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def is_public(rel: str) -> bool:
    if rel in EXCLUDED_FILES:
        return False
    if any(rel.startswith(p) for p in EXCLUDED_PREFIXES):
        return False
    if any(rel == p.rstrip("/") or rel.startswith(p) for p in PROTECTED_HOST_PATHS):
        return False
    return True

def safe_members(tf: tarfile.TarFile):
    members = tf.getmembers()
    if not members:
        die("GitHub archive is empty")
    root = PurePosixPath(members[0].name).parts[0]
    for member in members:
        posix = PurePosixPath(member.name)
        parts = posix.parts
        if not parts or parts[0] != root:
            continue
        rel_parts = parts[1:]
        if not rel_parts:
            continue
        if any(p in ("", ".", "..") for p in rel_parts):
            die(f"Unsafe archive path: {member.name}")
        if member.issym() or member.islnk():
            die(f"Archive contains a link; refusing deployment: {member.name}")
        rel = PurePosixPath(*rel_parts).as_posix()
        yield member, rel

def fetch(url: str, dest: Path) -> None:
    req = urllib.request.Request(url, headers={"User-Agent": "Joshua-Randall-OSU-deployer/1.0"})
    with urllib.request.urlopen(req, timeout=90) as r, dest.open("wb") as out:
        shutil.copyfileobj(r, out, 1024 * 1024)

def live_get(path: str, marker: str, stamp: str) -> tuple[bool, str]:
    sep = "&" if "?" in path else "?"
    url = LIVE_BASE + path + sep + "deploy=" + stamp
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 deployment-verifier"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            data = r.read(2_000_000).decode("utf-8", "replace")
            ok = 200 <= getattr(r, "status", 200) < 300 and marker in data
            return ok, f"{getattr(r, 'status', 200)} {url}"
    except Exception as e:
        return False, f"{url}: {e}"

def main() -> None:
    home = Path.home().resolve()
    site = (home / "public_html").resolve()
    if not site.is_dir():
        die(f"Website root not found: {site}")
    if site.parent != home:
        die(f"Unexpected public_html location: {site}")
    for required in ("index.html", "projects.html"):
        if not (site / required).is_file():
            die(f"{required} missing from live site")

    host_hashes = {}
    for rel in ("games/evil-wizard/index.html", "assets/fusion-presentation.mp4"):
        p = site / rel
        if not p.is_file():
            die(f"Protected OSU-only file is missing before deployment: {rel}")
        host_hashes[rel] = sha256_file(p)
    print("Protected OSU-only files verified.")

    stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    site_bytes = sum(p.stat().st_size for p in site.rglob("*") if p.is_file() and not p.is_symlink())
    free = shutil.disk_usage(home).free
    if free < max(site_bytes // 2, 100 * 1024 * 1024):
        die("Not enough free space for a safe backup and staging area")

    backup = home / f"public_html-pre-vnext-{stamp}.tar.gz"
    backup_part = Path(str(backup) + ".part")
    print(f"Creating full backup: {backup}")
    try:
        with tarfile.open(backup_part, "w:gz") as tf:
            tf.add(site, arcname="public_html", recursive=True)
        if backup_part.stat().st_size < 1024:
            die("Backup archive is unexpectedly small")
        os.replace(backup_part, backup)
    finally:
        if backup_part.exists():
            backup_part.unlink(missing_ok=True)
    print(f"Backup complete: {backup}")

    with tempfile.TemporaryDirectory(prefix="jr-vnext-", dir=home) as td:
        work = Path(td)
        archive = work / "source.tar.gz"
        extracted = work / "source"
        extracted.mkdir()
        print(f"Downloading pinned GitHub source {SOURCE_COMMIT[:12]}…")
        fetch(ARCHIVE_URL, archive)
        if archive.stat().st_size < 100_000:
            die("Downloaded GitHub archive is unexpectedly small")

        print("Validating and staging repository web files…")
        copied = 0
        source_bytes = 0
        with tarfile.open(archive, "r:gz") as tf:
            entries = list(safe_members(tf))
            selected = [(m, rel) for m, rel in entries if is_public(rel)]
            selected_paths = {rel for _, rel in selected if _.isfile()}
            missing = [p for p in CRITICAL_LOCAL if p not in selected_paths]
            if missing:
                die("Pinned source is missing critical files: " + ", ".join(missing))
            for member, rel in selected:
                target = extracted / rel
                if member.isdir():
                    target.mkdir(parents=True, exist_ok=True)
                    continue
                if not member.isfile():
                    continue
                target.parent.mkdir(parents=True, exist_ok=True)
                src = tf.extractfile(member)
                if src is None:
                    die(f"Could not read archive member: {rel}")
                with src, target.open("wb") as out:
                    shutil.copyfileobj(src, out, 1024 * 1024)
                copied += 1
                source_bytes += target.stat().st_size

        if copied < 100:
            die(f"Only {copied} deployable files found; refusing incomplete deployment")
        print(f"Staged {copied} web files ({source_bytes / 1024 / 1024:.1f} MiB).")

        # Content-level assertions for the exact features requested.
        expectations = {
            "index.html": (
                "portfolio-next.css",
                "portfolio-next.js",
                "Massachusetts Institute of Technology",
                "Oregon State University",
            ),
            "projects.html": (
                "project-battle-chess.html",
                "project-qubit.html",
                "portfolio-next.js",
            ),
            "learn-capstones.html": (
                "Foundation capstone labs",
                "learning-capstones.js",
            ),
            "portfolio-next.js": (
                "Architect",
                "Build",
                "Secure",
                "Automate",
                "Evolve",
                "TWO-QUBIT BELL PAIR",
            ),
        }
        for rel, markers in expectations.items():
            data = (extracted / rel).read_text("utf-8")
            for marker in markers:
                if marker not in data:
                    die(f"Staged {rel} does not contain expected marker: {marker}")

        print("Installing repository-owned web files without deleting OSU-only content…")
        for src in sorted(extracted.rglob("*")):
            rel = src.relative_to(extracted)
            dst = site / rel
            if src.is_dir():
                dst.mkdir(parents=True, exist_ok=True)
                os.chmod(dst, 0o755)
                continue
            dst.parent.mkdir(parents=True, exist_ok=True)
            os.chmod(dst.parent, 0o755)
            tmp = dst.with_name("." + dst.name + f".deploy-{stamp}")
            shutil.copyfile(src, tmp)
            os.chmod(tmp, 0o644)
            os.replace(tmp, dst)
        os.chmod(site, 0o755)

    for rel in CRITICAL_LOCAL:
        p = site / rel
        if not p.is_file() or p.stat().st_size == 0:
            die(f"Post-deployment critical file missing or empty: {rel}")

    for rel, before in host_hashes.items():
        p = site / rel
        if not p.is_file() or sha256_file(p) != before:
            die(f"Protected OSU-only file changed unexpectedly: {rel}")
    print("Protected OSU-only files preserved byte-for-byte.")

    # Narrow permission checks on key public paths.
    os.chmod(site, 0o755)
    for rel in ("assets", "games", "games/3d-battle-chess", "deep-learning"):
        p = site / rel
        if p.is_dir():
            os.chmod(p, 0o755)

    print("Checking public OSU URLs…")
    failures = []
    for path, marker in LIVE_CHECKS:
        ok, detail = live_get(path, marker, stamp)
        print(("PASS " if ok else "WARN ") + detail)
        if not ok:
            failures.append(path or "/")

    print("")
    print("LIVE DEPLOYMENT COMPLETE")
    print(f"Source commit: {SOURCE_COMMIT}")
    print(f"Rollback backup: {backup}")
    if failures:
        print("Browser verification still needed for: " + ", ".join(failures))
        print("The files are deployed; do not delete the backup until phone testing is complete.")
    else:
        print("Core public URL checks passed. Keep the backup until phone testing is complete.")

if __name__ == "__main__":
    main()
