#!/usr/bin/env python3
"""Backup-first deployment of the validated science-site release while preserving games and Geometric AI."""

from pathlib import Path
from zipfile import ZipFile
import datetime
import os
import shutil
import sys
import tarfile
import tempfile
import urllib.request

# Exact website commit validated by CI and visual-QA before this deployment utility update.
WEB_COMMIT = "d27e885a93743c9214a5ca4718c428cef5caec56"
ARCHIVE_URL = f"https://github.com/joshprandall/engineering-portfolio/archive/{WEB_COMMIT}.zip"
PUBLIC_URL = "https://web.engr.oregonstate.edu/~randjosh/"

ROOT_EXTENSIONS = {".html", ".css", ".js", ".mjs"}
ROOT_JSON = {"verification-manifest.json", "learning-capstones.json"}

# Only these site trees are updated by this science release.
WEB_DIRS = (
    "assets",
    "deep-learning",
    "labs",
    "qubit-preview-20260921",
)

# These root pages and complete trees are deliberately left untouched on OSU.
PROTECTED_ROOT_FILES = set()
PROTECTED_REQUIRED = (
    "project-battle-chess.html",
    "project-geometric-ai.html",
    "play-evil-wizard.html",
    "games/3d-battle-chess/index.html",
    "games/evil-wizard/index.html",
    "geometric-lab/index.html",
)
PRESERVE_IF_PRESENT = (
    "assets/fusion-presentation.mp4",
)

def fail(message):
    print("STOP:", message, file=sys.stderr)
    raise SystemExit(1)

def safe_extract(zip_file, destination):
    destination = destination.resolve()
    for item in zip_file.infolist():
        target = (destination / item.filename).resolve()
        if target != destination and destination not in target.parents:
            fail(f"Unsafe archive member: {item.filename}")
    zip_file.extractall(destination)

def copy_file(source, target):
    target.parent.mkdir(parents=True, exist_ok=True)
    os.chmod(target.parent, 0o755)
    temp = target.with_name("." + target.name + ".deploying")
    if temp.exists():
        temp.unlink()
    shutil.copy2(source, temp)
    os.chmod(temp, 0o644)
    os.replace(temp, target)

def copy_tree(source, target):
    for source_path in source.rglob("*"):
        relative = source_path.relative_to(source)
        target_path = target / relative
        if source_path.is_dir():
            target_path.mkdir(parents=True, exist_ok=True)
            os.chmod(target_path, 0o755)
        elif source_path.is_file():
            copy_file(source_path, target_path)

def validate_site(site):
    required = [
        "index.html", "projects.html", "portfolio-next.js", "portfolio-next.css",
        "handheld-experience.js", "handheld-experience.css",
        "science-experiments.js", "science-experiments.css",
        "knowledge.js", "knowledge.css", "learn-labs.html",
        "labs/qpe.mjs", "labs/emergent.mjs",
        "qubit-preview-20260921/index.html",
        "qubit-preview-20260921/app.js",
        "qubit-preview-20260921/qubit.js",
    ]
    missing = [name for name in required if not (site / name).is_file()]
    if missing:
        raise RuntimeError("Missing required deployed files: " + ", ".join(missing))

    protected_missing = [name for name in PROTECTED_REQUIRED if not (site / name).is_file()]
    if protected_missing:
        raise RuntimeError("Protected live experience disappeared: " + ", ".join(protected_missing))

    projects = (site / "projects.html").read_text("utf-8")
    if projects.count("project-card") < 16:
        raise RuntimeError("Project catalog does not contain all 16 project cards.")
    if 'id="roadmap"' in projects:
        raise RuntimeError("Removed project roadmap unexpectedly returned.")

    portfolio = (site / "portfolio-next.js").read_text("utf-8")
    for name in ("Architect", "Build", "Secure", "Automate", "Evolve"):
        if f"name:'{name}'" not in portfolio:
            raise RuntimeError(f"Connected Systems capability missing: {name}")
    for marker in (
        "Interactive Connected Systems solar-system model",
        "vnext-cosmos-canvas",
        "vnext-cosmos-worlds",
        "enhanceProjectNavigation",
        "const coreGlow=ctx.createRadialGradient",
    ):
        if marker not in portfolio:
            raise RuntimeError(f"Current solar-system/project navigation marker missing: {marker}")

    science = (site / "science-experiments.js").read_text("utf-8")
    for marker in ("project-recovery.html", "project-qpe.html", "project-emergent.html", "project-mind.html"):
        if marker not in science:
            raise RuntimeError(f"Science experiment console missing route: {marker}")
    if "geometric-ai|battle-chess|play-evil-wizard" not in science:
        raise RuntimeError("Protected project exclusion is missing from science experiment layer.")

    qubit = (site / "qubit-preview-20260921/qubit.js").read_text("utf-8")
    if "stateFromAngles" not in qubit or "measurementProbabilities" not in qubit:
        raise RuntimeError("Expanded pure-state qubit math was not deployed.")

    knowledge = (site / "knowledge.js").read_text("utf-8")
    if "standaloneExperienceURL" not in knowledge or "handheld-experience.js" not in knowledge:
        raise RuntimeError("Learning platform standalone navigation or handheld layer was not deployed.")

def http_smoke():
    checks = (
        ("", "Complex systems."),
        ("projects.html", "3D Battle Chess"),
        ("learn.html", "Learn the system."),
        ("qubit-preview-20260921/index.html", "One qubit."),
        ("project-battle-chess.html", "3D Battle Chess"),
        ("games/3d-battle-chess/index.html", "3D Battle Chess"),
        ("geometric-lab/index.html", "Geometry & Physics Lab"),
    )
    results = []
    for path, marker in checks:
        try:
            req = urllib.request.Request(PUBLIC_URL + path, headers={"User-Agent": "Joshua-Randall-deploy-check/2.0"})
            with urllib.request.urlopen(req, timeout=12) as response:
                body = response.read(350000).decode("utf-8", "replace")
                results.append((path or "home", response.status, marker in body))
        except Exception as exc:
            results.append((path or "home", "WARN", str(exc)))
    return results

def main():
    home = Path.home()
    site = home / "public_html"
    if not site.is_dir() or not (site / "index.html").is_file():
        fail(f"Expected live site at {site}")

    protected_missing = [name for name in PROTECTED_REQUIRED if not (site / name).is_file()]
    if protected_missing:
        fail("Protected live experience is missing before deployment: " + ", ".join(protected_missing))

    preserve_before = {name: (site / name).exists() for name in PRESERVE_IF_PRESENT}
    stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = home / f"public_html-pre-science-{stamp}.tar.gz"
    partial = Path(str(backup) + ".part")

    print("Science website build:", WEB_COMMIT)
    print("Live root:", site)
    print("Protected trees: Battle Chess game, Evil Wizard game, Geometry & Physics Lab")
    print("Creating full backup:", backup)
    with tarfile.open(partial, "w:gz") as archive:
        archive.add(site, arcname="public_html", recursive=True)
    os.replace(partial, backup)
    if backup.stat().st_size < 1000:
        fail("Backup is unexpectedly small. No deployment attempted.")

    try:
        with tempfile.TemporaryDirectory(prefix="portfolio-science-", dir=home) as temp_name:
            temp = Path(temp_name)
            zip_path = temp / "site.zip"
            print("Downloading exact validated GitHub build...")
            with urllib.request.urlopen(ARCHIVE_URL, timeout=60) as response, zip_path.open("wb") as out:
                shutil.copyfileobj(response, out)

            unpack = temp / "unpack"
            unpack.mkdir()
            with ZipFile(zip_path) as archive:
                safe_extract(archive, unpack)
            roots = [p for p in unpack.iterdir() if p.is_dir()]
            if len(roots) != 1:
                raise RuntimeError("Unexpected GitHub archive layout.")
            source = roots[0]

            copied = 0
            for item in source.iterdir():
                if (
                    item.is_file()
                    and item.name not in PROTECTED_ROOT_FILES
                    and (item.suffix.lower() in ROOT_EXTENSIONS or item.name in ROOT_JSON)
                ):
                    copy_file(item, site / item.name)
                    copied += 1

            for relative in WEB_DIRS:
                src = source / relative
                if src.exists():
                    copy_tree(src, site / relative)

            os.chmod(site, 0o755)
            validate_site(site)

            for name in PROTECTED_REQUIRED:
                if not (site / name).is_file():
                    raise RuntimeError(f"Protected live file disappeared during deployment: {name}")
            for name, existed in preserve_before.items():
                if existed and not (site / name).exists():
                    raise RuntimeError(f"Host-only file disappeared during deployment: {name}")

            print(f"DEPLOYED {copied} root science-site files plus reviewed science/learning directories.")
            print("PROTECTED UNCHANGED:")
            for name in PROTECTED_REQUIRED:
                print("  PRESENT", name)
            for name in PRESERVE_IF_PRESENT:
                print(" ", "PRESENT" if (site / name).exists() else "NOT PRESENT BEFORE/AFTER", name)

    except Exception as exc:
        print("DEPLOYMENT VALIDATION FAILED:", exc, file=sys.stderr)
        print("Restoring full backup over the live tree...", file=sys.stderr)
        with tarfile.open(backup, "r:gz") as archive:
            archive.extractall(home)
        fail(f"Rollback completed from {backup}")

    print("Running public HTTP smoke checks...")
    for page, status, result in http_smoke():
        print(f"  {page}: HTTP {status} / marker={result}")

    print("SCIENCE-SITE DEPLOYMENT COMPLETE")
    print("Backup:", backup)
    print("Commit:", WEB_COMMIT)
    print("URL:", PUBLIC_URL)

if __name__ == "__main__":
    main()
