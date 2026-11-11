#!/usr/bin/env python3
"""Review-only, single-file academic data staging. Never deploys to OSU."""
import argparse
import hashlib
import json
import os
import re
import subprocess
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

ROOT = Path(__file__).resolve().parents[1]
CONTENT_PATH = "deep-learning/physics/magnetism.json"
MANIFEST = "MAGNETISM_STAGE_MANIFEST.json"
KIND = "ACADEMIC_ONE_FILE_REVIEW_ONLY_NOT_DEPLOYED"
# Read-only public OSU observation from November 11, 2026; NEVER treat as proof
# that public content remains identical at the later time of deployment.
OBSERVED_LIVE_SHA256 = "add6dd76fb79846f89c2b42c35e7f4109b32a564c768c94688f4471a2c29e635"
OBSERVED_LIVE_BYTES = 395017
EXPECTED_IDS = (
    "physics-faraday",
    "physics-magnetic-force",
    "physics-v06-magnetic-force-on-a-charge",
    "physics-v06-faraday-s-law",
    "physics-v08-deep-dive-magnetic-force-on-moving-charge",
    "physics-v08-evidence-lab-magnetic-force-on-moving-charge",
    "physics-v08-deep-dive-faraday-law",
    "physics-v08-evidence-lab-faraday-law",
    "physics-v09-teach-back-lab-faraday-law",
    "physics-v09-evidence-verification-la-faraday-law",
    "physics-v09-troubleshooting-lab-faraday-s-law",
    "physics-v09-practical-lab-faraday-s-law-changing-magnetic-flux-creates-emf",
)

def sha256(raw):
    return hashlib.sha256(raw).hexdigest()

def check_policy(path=CONTENT_PATH):
    if path != CONTENT_PATH or path.startswith("/") or ".." in Path(path).parts:
        raise ValueError("Only the reviewed magnetism JSON is allowed in this stage")
    protected = json.loads(
        (ROOT / "manifests" / "protected-baseline-git-blobs.json").read_text(encoding="utf-8")
    )["files"]
    if path in protected or path.endswith((".html", ".css", ".js")):
        raise ValueError("Protected runtime, site, audio or game asset not allowed")
    source = ROOT / path
    if not source.is_file() or source.is_symlink():
        raise ValueError("Expected regular non-symlink academic file is absent")
    return source

def check_curriculum(raw):
    lessons = json.loads(raw.decode("utf-8"))
    if len(lessons) != 97:
        raise ValueError("Magnetism record count changed unexpectedly")
    questions = set()
    for id_ in EXPECTED_IDS:
        lesson = lessons.get(id_)
        if not isinstance(lesson, dict):
            raise ValueError("Missing selected lesson: " + id_)
        q = lesson.get("essentialQuestion", "")
        steps, labs = lesson.get("reasoningSteps", []), lesson.get("labPlan", [])
        if not (q.endswith("?") and not q.startswith("What does ") and q not in questions):
            raise ValueError("Lesson has generic or repeated question: " + id_)
        questions.add(q)
        if len(steps) != 6 or len(labs) != 6:
            raise ValueError("Lesson is missing authored reasoning or exercises: " + id_)
        if not ("openstax.org/books/university-physics-volume-2/pages/" in steps[5]):
            raise ValueError("Lesson has no grounded teaching reference: " + id_)
    return len(lessons)

def build(output):
    source = check_policy()
    raw = source.read_bytes()
    count = check_curriculum(raw)
    commit = os.environ.get("GITHUB_SHA") or subprocess.run(
        ["git", "rev-parse", "HEAD"], cwd=ROOT, capture_output=True, text=True, check=True
    ).stdout.strip()
    metadata = {
        "kind": KIND,
        "scope": "Only magnetism lesson JSON; NOT the older 36-file release; no runtime, CSS, sound, games or user biography",
        "path": CONTENT_PATH,
        "sha256": sha256(raw),
        "bytes": len(raw),
        "records": count,
        "authored_lesson_ids": list(EXPECTED_IDS),
        "source_commit": commit,
        "observed_live_before_staging": {
            "sha256": OBSERVED_LIVE_SHA256,
            "bytes": OBSERVED_LIVE_BYTES,
            "observation_date": "2026-11-11",
        },
        "deployment_gate": (
            "This artifact is NOT DEPLOYED. Before any later OSU publication, recheck the "
            "live file against the expected baseline, verify current protected hashes and "
            "browser tests, back up the original on C: (never D:), record restore procedure "
            "and permissions, and obtain explicit approval for any protected visual change."
        ),
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(output, "w", ZIP_DEFLATED, compresslevel=9) as zip_:
        for name, contents in (
            (CONTENT_PATH, raw),
            (MANIFEST, (json.dumps(metadata, sort_keys=True, indent=2) + "\n").encode("utf-8")),
        ):
            info = ZipInfo(name, date_time=(2026, 11, 11, 0, 0, 0))
            info.compress_type = ZIP_DEFLATED
            zip_.writestr(info, contents)
    verify(output)
    print("STAGED ONLY:", output, "1 approved academic data file; 0 deployments")

def verify(archive):
    check_policy()
    with ZipFile(archive) as zip_:
        members = zip_.infolist()
        if len(members) != 2 or sorted(m.filename for m in members) != sorted((CONTENT_PATH, MANIFEST)):
            raise ValueError("Stage archive contains an unexpected or duplicate file")
        if any(m.is_dir() or m.external_attr >> 16 & 0o170000 == 0o120000 for m in members):
            raise ValueError("Stage archive contains directory or symlink")
        meta = json.loads(zip_.read(MANIFEST))
        raw = zip_.read(CONTENT_PATH)
        if meta.get("kind") != KIND or meta.get("path") != CONTENT_PATH:
            raise ValueError("Wrong manifest kind/path")
        if meta.get("sha256") != sha256(raw) or meta.get("bytes") != len(raw):
            raise ValueError("Artifact content SHA/length mismatch")
        if sha256(raw) != sha256((ROOT / CONTENT_PATH).read_bytes()):
            raise ValueError("Artifact does not match checked-out source")
        if meta.get("observed_live_before_staging", {}).get("sha256") != OBSERVED_LIVE_SHA256:
            raise ValueError("Expected pre-publication live baseline removed")
        if meta.get("records") != check_curriculum(raw) or meta.get("authored_lesson_ids") != list(EXPECTED_IDS):
            raise ValueError("Lesson scope differs from stage manifest")
    print("PASS: SHA verified; only reviewed academic JSON; review-only, NOT deployed")

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", default="dist/magnetism-academic-stage.zip")
    parser.add_argument("--verify", help="Verify stage ZIP against current checkout, no network calls")
    args = parser.parse_args()
    if args.verify:
        verify(Path(args.verify))
    else:
        build(ROOT / args.output)

if __name__ == "__main__":
    main()
