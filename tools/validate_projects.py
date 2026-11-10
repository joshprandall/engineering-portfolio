#!/usr/bin/env python3
"""Static quality gate for Joshua Randall's project portfolio."""

from __future__ import annotations

import html
import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
PROJECTS_PAGE = ROOT / "projects.html"
MANIFEST = ROOT / "assets" / "project-evaluation.json"

CARD_RE = re.compile(r'<article\b[^>]*class="[^"]*project-card[^"]*"[^>]*>(.*?)</article>', re.I | re.S)
HREF_RE = re.compile(r'href="([^"]+)"', re.I)
RESOURCE_RE = re.compile(r'(?:href|src)="([^"]+)"', re.I)
H1_RE = re.compile(r'<h1\b[^>]*>.*?</h1>', re.I | re.S)
TITLE_RE = re.compile(r'<title>.*?</title>', re.I | re.S)
DESCRIPTION_RE = re.compile(r'<meta\b[^>]*(?:name="description"[^>]*content="[^"]+"|content="[^"]+"[^>]*name="description")[^>]*>', re.I | re.S)

IGNORED_SCHEMES = {"http", "https", "mailto", "tel", "data", "javascript"}
EXPECTED_COUNT = 34


def fail(message: str, errors: list[str]) -> None:
    errors.append(message)


def project_cards(source: str) -> list[str]:
    pages: list[str] = []
    for block in CARD_RE.findall(source):
        candidates = [html.unescape(h) for h in HREF_RE.findall(block)]
        page = next(
            (
                h.split("#", 1)[0].split("?", 1)[0]
                for h in candidates
                if re.fullmatch(r"(?:project-[^/]+\.html|play-evil-wizard\.html)", h.split("#", 1)[0].split("?", 1)[0], re.I)
            ),
            None,
        )
        if page:
            pages.append(page)
    return pages


def local_target(page: Path, raw: str) -> Path | None:
    raw = html.unescape(raw.strip())
    if not raw or raw.startswith("#") or raw.startswith("//"):
        return None

    parsed = urlsplit(raw)
    if parsed.scheme.lower() in IGNORED_SCHEMES:
        return None
    if parsed.netloc:
        return None

    clean = unquote(parsed.path)
    if not clean:
        return None

    if clean.startswith("/"):
        target = ROOT / clean.lstrip("/")
    else:
        target = page.parent / clean

    if clean.endswith("/"):
        target = target / "index.html"

    return target.resolve()


def validate_page(page_rel: str, errors: list[str]) -> None:
    page = ROOT / page_rel
    if not page.is_file():
        fail(f"Missing project page: {page_rel}", errors)
        return

    source = page.read_text(encoding="utf-8")

    if not TITLE_RE.search(source):
        fail(f"{page_rel}: missing <title>", errors)
    if not H1_RE.search(source):
        fail(f"{page_rel}: missing <h1>", errors)
    if not DESCRIPTION_RE.search(source):
        fail(f"{page_rel}: missing meta description", errors)
    if "site-navigation.js" not in source:
        fail(f"{page_rel}: missing shared site-navigation.js", errors)
    if "engineering-labs/rust-flow-telemetry" in source:
        fail(f"{page_rel}: references locked legacy Rust namespace", errors)

    for raw in RESOURCE_RE.findall(source):
        target = local_target(page, raw)
        if target is None:
            continue

        try:
            target.relative_to(ROOT.resolve())
        except ValueError:
            fail(f"{page_rel}: local reference escapes repository root: {raw}", errors)
            continue

        if not target.exists():
            fail(f"{page_rel}: missing local resource {raw}", errors)


def main() -> int:
    errors: list[str] = []

    if not PROJECTS_PAGE.is_file():
        print("projects.html not found", file=sys.stderr)
        return 2
    if not MANIFEST.is_file():
        print("assets/project-evaluation.json not found", file=sys.stderr)
        return 2

    projects_source = PROJECTS_PAGE.read_text(encoding="utf-8")
    cards = project_cards(projects_source)

    if len(cards) != EXPECTED_COUNT:
        fail(f"Expected {EXPECTED_COUNT} project cards; found {len(cards)}", errors)
    if len(set(cards)) != len(cards):
        fail("Project card destinations are not unique", errors)

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    dossier = manifest.get("projects", {})
    if len(dossier) != EXPECTED_COUNT:
        fail(f"Expected {EXPECTED_COUNT} evaluation dossiers; found {len(dossier)}", errors)

    card_set = set(cards)
    dossier_set = set(dossier)
    missing_dossiers = sorted(card_set - dossier_set)
    orphan_dossiers = sorted(dossier_set - card_set)
    if missing_dossiers:
        fail("Cards without evaluation dossiers: " + ", ".join(missing_dossiers), errors)
    if orphan_dossiers:
        fail("Evaluation dossiers without cards: " + ", ".join(orphan_dossiers), errors)

    required_scalar = ("title", "family", "posture", "evidence", "problem", "limitations")
    required_lists = ("constraints", "architecture", "verification", "reproduce", "signals")
    for page_rel, meta in dossier.items():
        for field in required_scalar:
            if not isinstance(meta.get(field), str) or not meta[field].strip():
                fail(f"{page_rel}: dossier field {field!r} is empty", errors)
        for field in required_lists:
            value = meta.get(field)
            if not isinstance(value, list) or not value or not all(isinstance(item, str) and item.strip() for item in value):
                fail(f"{page_rel}: dossier list {field!r} is empty or invalid", errors)

    if "project-mastery.js" not in (ROOT / "site-navigation.js").read_text(encoding="utf-8"):
        fail("site-navigation.js does not load project-mastery.js", errors)

    for page_rel in cards:
        validate_page(page_rel, errors)

    required_shared = [
        "project-mastery.js",
        "project-mastery.css",
        "project-showcase.js",
        "software-showcase.js",
        "rust-flow-telemetry-v22/Cargo.toml",
        "rust-flow-telemetry-v22/src/main.rs",
        "rust-flow-telemetry-v22/sample_flows.csv",
    ]
    for rel in required_shared:
        if not (ROOT / rel).is_file():
            fail(f"Missing required shared project artifact: {rel}", errors)

    if errors:
        print("PROJECT QUALITY GATE: FAILED")
        for error in errors:
            print(" - " + error)
        return 1

    print("PROJECT QUALITY GATE: PASSED")
    print(f" - project cards: {len(cards)}")
    print(f" - evaluation dossiers: {len(dossier)}")
    print(" - project pages: all present")
    print(" - local project links/assets: resolved")
    print(" - shared evaluation loader: present")
    print(" - locked legacy Rust namespace: not referenced")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
