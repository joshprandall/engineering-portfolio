#!/usr/bin/env python3
"""Build or verify a content-only OSU overlay; never deploy protected pages/assets."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
from zipfile import ZipFile, ZIP_DEFLATED, ZipInfo

ROOT = Path(__file__).resolve().parents[1]
SOURCE_PAGES = (
    "ai-agentic.html", "ai-build-your-own.html", "ai-computer-vision.html",
    "ai-deep-learning.html", "ai-embodied.html", "ai-game.html",
    "ai-generative.html", "ai-geometric.html", "ai-graph-neural-networks.html",
    "ai-llm.html", "ai-machine-learning.html", "ai-memory.html",
    "ai-multi-agent.html", "ai-multimodal.html", "ai-neuro-symbolic.html",
    "ai-personal-agent.html", "ai-project-mind.html", "ai-reinforcement-learning.html",
    "ai-symbolic.html", "engine-development.html", "learn-advanced.html",
    "learn-capstones.html", "learn-cloud.html", "learn-cyber.html",
    "learn-leadership.html", "learn-math.html", "learn-physics.html", "learn-software.html",
)
CONTENT_FILES = tuple(sorted((
    *SOURCE_PAGES, "game-development.html", "knowledge.js", "learning-academy.js",
    "project-mastery.js", "assets/project-evaluation.json",
    "deep-learning/math/algebra.json", "deep-learning/math/linear-algebra.json",
    "deep-learning/software/testing.json",
)))
MANIFEST = "CONTENT_ONLY_MANIFEST.json"
FORBIDDEN_PREFIXES = ("games/", "geometric-lab/", "assets/audio/", "assets/scenes/", "assets/fonts/")
FORBIDDEN_NAMES = {"index.html", "learn.html", "ai-development.html",
                   "solar-navigation.js", "about.html", "resume.html",
                   "expertise-experience.html"}
def digest(raw):
    return hashlib.sha256(raw).hexdigest()

def verify_policy():
    baseline = json.loads((ROOT / "manifests/protected-baseline-git-blobs.json").read_text())
    protected = set(baseline["files"])
    for name in CONTENT_FILES:
        assert name not in FORBIDDEN_NAMES, f"Forbidden runtime path: {name}"
        assert name not in protected, f"Protected baseline path in release: {name}"
        assert not name.startswith(FORBIDDEN_PREFIXES), f"Protected directory: {name}"
        assert not name.endswith(".css"), "Stylesheets must not be included"
        assert not name.startswith("/") and ".." not in Path(name).parts, "Path traversal"
        p = ROOT / name
        assert p.is_file() and not p.is_symlink(), f"Missing or symlinked file: {name}"
    assert len(CONTENT_FILES) == 36, "Unexpected content-only file set"
    return baseline

def verify(archive):
    with ZipFile(archive) as z:
        info = z.namelist()
        assert sorted(info) == sorted([*CONTENT_FILES, MANIFEST]), "Unexpected archive paths"
        data = json.loads(z.read(MANIFEST))
        assert data["kind"] == "CONTENT_ONLY_NOT_DEPLOYED", "Invalid package type"
        assert sorted(data["files"]) == list(CONTENT_FILES), "Missing manifest entries"
        for name in CONTENT_FILES:
            assert digest(z.read(name)) == data["files"][name]["sha256"], "Checksum mismatch: "+name
            assert not name.startswith(FORBIDDEN_PREFIXES), "Protected file in archive"
    print("PASS: content-only overlay manifest and checksums verified; no solar, sound or games included.")

def build(output):
    baseline = verify_policy()
    commit = os.environ.get("GITHUB_SHA") or subprocess.run(
        ["git", "rev-parse", "HEAD"], cwd=ROOT, capture_output=True, text=True
    ).stdout.strip()
    payload={}
    for name in CONTENT_FILES:
        raw=(ROOT/name).read_bytes()
        payload[name]={"sha256":digest(raw),"bytes":len(raw)}
    manifest={
      "kind":"CONTENT_ONLY_NOT_DEPLOYED",
      "source_commit":commit,
      "source_protected_baseline":baseline["baseline"],
      "protected_path_count":len(baseline["files"]),
      "scope":"Only reviewed content; exclude working solar pages, all CSS, sounds, games, credentials and job history",
      "deployment_note":"Before updating OSU, compare live hashes and take verified backups. This ZIP is not an automatic installer.",
      "files":payload,
    }
    output.parent.mkdir(parents=True,exist_ok=True)
    with ZipFile(output,"w",ZIP_DEFLATED,compresslevel=9) as z:
        for name in CONTENT_FILES:
            zi=ZipInfo(name,(2026,11,10,0,0,0));zi.compress_type=ZIP_DEFLATED
            z.writestr(zi,(ROOT/name).read_bytes())
        zi=ZipInfo(MANIFEST,(2026,11,10,0,0,0));zi.compress_type=ZIP_DEFLATED
        z.writestr(zi,(json.dumps(manifest,indent=2,sort_keys=True)+"\n").encode())
    verify(output)
    print("Built",output,"with",len(CONTENT_FILES),"reviewed content files. Not installed.")

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--output",default="dist/portfolio-content-only.zip")
    parser.add_argument("--verify",help="Verify an existing ZIP instead of building a new one")
    args=parser.parse_args()
    if args.verify:verify(Path(args.verify))
    else:build(ROOT/args.output)
