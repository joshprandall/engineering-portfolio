#!/usr/bin/env python3
"""Quality gate for Learn, AI Builder Academy, and the authorized Cyber Range."""

from __future__ import annotations

import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

ERRORS: list[str] = []


def fail(message: str) -> None:
    ERRORS.append(message)


def load_json(path: str):
    target = ROOT / path
    if not target.is_file():
        fail(f"Missing JSON file: {path}")
        return None
    try:
        return json.loads(target.read_text(encoding="utf-8"))
    except Exception as exc:
        fail(f"Invalid JSON {path}: {exc}")
        return None


def require_string(obj: dict, field: str, context: str) -> None:
    value = obj.get(field)
    if not isinstance(value, str) or not value.strip():
        fail(f"{context}: {field} must be a non-empty string")


def require_list(obj: dict, field: str, minimum: int, context: str) -> None:
    value = obj.get(field)
    if not isinstance(value, list) or len(value) < minimum:
        fail(f"{context}: {field} must contain at least {minimum} entries")
        return
    for index, item in enumerate(value):
        if not isinstance(item, str) or not item.strip():
            fail(f"{context}: {field}[{index}] must be a non-empty string")


def validate_deep_learning() -> tuple[int, int]:
    index = load_json("deep-learning/index.json")
    if not isinstance(index, dict) or not index:
        fail("deep-learning/index.json must be a non-empty object")
        return 0, 0

    lesson_count = 0
    pack_count = 0
    ids: set[str] = set()

    for label, rel in index.items():
        if not isinstance(rel, str) or not rel.endswith(".json"):
            fail(f"deep-learning index {label!r} has invalid path {rel!r}")
            continue

        pack_path = ROOT / "deep-learning" / rel
        if not pack_path.is_file():
            fail(f"Deep-learning pack does not exist: {rel}")
            continue

        try:
            pack = json.loads(pack_path.read_text(encoding="utf-8"))
        except Exception as exc:
            fail(f"Invalid deep-learning pack {rel}: {exc}")
            continue

        if not isinstance(pack, dict) or not pack:
            fail(f"Deep-learning pack is empty: {rel}")
            continue

        pack_count += 1
        for lesson_id, lesson in pack.items():
            lesson_count += 1
            context = f"{rel}:{lesson_id}"

            if lesson_id in ids:
                fail(f"Duplicate deep-learning lesson id: {lesson_id}")
            ids.add(lesson_id)

            if not isinstance(lesson, dict):
                fail(f"{context}: record must be an object")
                continue

            require_string(lesson, "essentialQuestion", context)
            require_string(lesson, "verifiedBoundary", context)
            require_string(lesson, "analogy", context)
            require_list(lesson, "reasoningSteps", 5, context)
            require_list(lesson, "memoryLadder", 5, context)
            require_list(lesson, "labPlan", 5, context)

            technical = lesson.get("technical")
            if not isinstance(technical, dict):
                fail(f"{context}: technical must be an object")
            else:
                require_string(technical, "scope", context + ".technical")
                require_string(technical, "versionCaution", context + ".technical")
                if not isinstance(technical.get("prerequisites", []), list):
                    fail(f"{context}: technical.prerequisites must be a list")
                if not isinstance(technical.get("connections", []), list):
                    fail(f"{context}: technical.connections must be a list")

            vocab = lesson.get("vocabulary")
            if not isinstance(vocab, list):
                fail(f"{context}: vocabulary must be a list")

    if pack_count < 60:
        fail(f"Expected at least 60 deep-learning packs; found {pack_count}")
    if lesson_count < 500:
        fail(f"Expected at least 500 deep-learning lesson records; found {lesson_count}")

    return pack_count, lesson_count


def validate_learning_academy() -> None:
    data = load_json("assets/learning-academy.json")
    if not isinstance(data, dict):
        return

    programs = data.get("programs")
    if not isinstance(programs, list) or len(programs) != 7:
        fail(f"Learning Academy must contain exactly 7 programs; found {len(programs) if isinstance(programs, list) else 'invalid'}")
        return

    ids = set()
    for program in programs:
        if not isinstance(program, dict):
            fail("Learning Academy program must be an object")
            continue
        pid = program.get("id")
        if pid in ids:
            fail(f"Duplicate Learning Academy program id: {pid}")
        ids.add(pid)

        context = f"learning program {pid}"
        for field in ("id", "page", "title", "level", "description", "capstone"):
            require_string(program, field, context)
        require_list(program, "prerequisites", 1, context)
        require_list(program, "outcomes", 4, context)
        require_list(program, "categories", 5, context)

        page = ROOT / str(program.get("page", ""))
        if not page.is_file():
            fail(f"{context}: page does not exist: {program.get('page')}")

    academy_js = (ROOT / "learning-academy.js").read_text(encoding="utf-8")
    for token in (
        "OPEN ENGINEERING ACADEMY / SELF-PACED",
        "PROGRAM SYLLABUS",
        "LESSON MASTERY CONTRACT",
        "waitForKnowledge",
        "Explain",
        "Troubleshoot",
        "Verify",
    ):
        if token not in academy_js:
            fail(f"learning-academy.js is missing required capability: {token}")


def validate_ai_builder() -> None:
    data = load_json("assets/ai-build-mastery.json")
    if not isinstance(data, dict):
        return

    systems = data.get("systems")
    if not isinstance(systems, list) or len(systems) != 19:
        fail(f"AI Builder Academy must contain exactly 19 systems; found {len(systems) if isinstance(systems, list) else 'invalid'}")
        return

    ids = set()
    for system in systems:
        if not isinstance(system, dict):
            fail("AI system entry must be an object")
            continue

        sid = system.get("id")
        if sid in ids:
            fail(f"Duplicate AI system id: {sid}")
        ids.add(sid)
        context = f"AI system {sid}"

        for field in ("id", "page", "title", "goal", "data", "baseline", "starter"):
            require_string(system, field, context)

        require_list(system, "prereq", 2, context)
        require_list(system, "stack", 1, context)
        require_list(system, "steps", 6, context)
        require_list(system, "metrics", 3, context)
        require_list(system, "failures", 3, context)
        require_list(system, "production", 3, context)

        page_path = ROOT / str(system.get("page", ""))
        if not page_path.is_file():
            fail(f"{context}: page does not exist: {system.get('page')}")
            continue

        page_text = page_path.read_text(encoding="utf-8")
        if f'data-ai-build="{sid}"' not in page_text:
            fail(f"{context}: page does not declare matching data-ai-build id")
        if "ai-build-lab.js" not in page_text:
            fail(f"{context}: page does not load ai-build-lab.js")

    lab_js = (ROOT / "ai-build-lab.js").read_text(encoding="utf-8")
    for sid in ids:
        if f"case '{sid}'" not in lab_js and f"{sid}:" not in lab_js and f"'{sid}':" not in lab_js:
            fail(f"ai-build-lab.js does not register a working lab branch for {sid}")

    mastery_js = (ROOT / "ai-mastery.js").read_text(encoding="utf-8")
    for token in (
        "AI BUILDER ACADEMY / WORKING SYSTEMS",
        "BUILD THIS AI / ENGINEERING PATH",
        "Evaluation contract",
        "FAILURE MODES",
        "PRODUCTION CHECKLIST",
        "Starter scaffold",
    ):
        if token not in mastery_js:
            fail(f"ai-mastery.js is missing required capability: {token}")


def validate_security_toolkit() -> None:
    data = load_json("assets/security-toolkit.json")
    if not isinstance(data, dict):
        return

    require_string(data, "authorization", "security toolkit")
    auth = str(data.get("authorization", "")).lower()
    for phrase in ("no remote scanning", "no", "synthetic"):
        if phrase not in auth:
            fail(f"Security toolkit authorization boundary is missing expected term: {phrase}")

    tools = data.get("tools")
    if not isinstance(tools, list) or len(tools) != 50:
        fail(f"Cyber Range must contain exactly 50 tools; found {len(tools) if isinstance(tools, list) else 'invalid'}")
        return

    ids = set()
    category_counts = Counter()
    engines = set()

    for tool in tools:
        if not isinstance(tool, dict):
            fail("Cyber tool entry must be an object")
            continue

        tid = tool.get("id")
        if tid in ids:
            fail(f"Duplicate cyber tool id: {tid}")
        ids.add(tid)

        context = f"cyber tool {tid}"
        for field in ("id", "title", "category", "engine", "description", "sample", "framework"):
            require_string(tool, field, context)

        category_counts[str(tool.get("category"))] += 1
        engines.add(str(tool.get("engine")))

    if len(category_counts) != 5:
        fail(f"Cyber Range must have exactly 5 categories; found {len(category_counts)}")
    for category, count in category_counts.items():
        if count != 10:
            fail(f"Cyber Range category {category!r} must contain 10 tools; found {count}")

    js = (ROOT / "security-toolkit.js").read_text(encoding="utf-8")
    for engine in engines:
        if f"g==='{engine}'" not in js:
            fail(f"security-toolkit.js is missing engine implementation: {engine}")

    # Enforce local-only behavior. The one permitted fetch loads the local JSON manifest.
    forbidden = (
        "XMLHttpRequest",
        "new WebSocket",
        "navigator.sendBeacon",
        "EventSource(",
        "RTCPeerConnection",
        "child_process",
        "exec(",
        "eval(",
    )
    for token in forbidden:
        if token in js:
            fail(f"security-toolkit.js contains prohibited runtime capability: {token}")

    fetch_calls = re.findall(r"\bfetch\s*\(", js)
    if len(fetch_calls) != 1 or "fetch('assets/security-toolkit.json" not in js:
        fail("security-toolkit.js may only fetch its local manifest")

    security_page = (ROOT / "security-research.html").read_text(encoding="utf-8")
    if "security-research.js" not in security_page:
        fail("security-research.html lost the original six-lab engine")


def validate_shared_loader() -> None:
    nav = (ROOT / "site-navigation.js").read_text(encoding="utf-8")
    required = (
        "platform-mastery-loader-v1",
        "learning-academy.js?v=20261109-v1",
        "ai-mastery.js?v=20261109-v1",
        "security-toolkit.css?v=20261109-v1",
        "security-toolkit.js?v=20261109-v1",
    )
    for token in required:
        if token not in nav:
            fail(f"site-navigation.js is missing platform loader token: {token}")


def main() -> int:
    packs, lessons = validate_deep_learning()
    validate_learning_academy()
    validate_ai_builder()
    validate_security_toolkit()
    validate_shared_loader()

    if ERRORS:
        print("PLATFORM QUALITY GATE: FAILED")
        for error in ERRORS:
            print(" - " + error)
        return 1

    print("PLATFORM QUALITY GATE: PASSED")
    print(f" - deep-learning packs: {packs}")
    print(f" - deep-learning records: {lessons}")
    print(" - learning programs: 7")
    print(" - AI build systems: 19")
    print(" - cybersecurity tools: 50")
    print(" - cybersecurity categories: 5 × 10")
    print(" - cybersecurity runtime: local/synthetic only")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
