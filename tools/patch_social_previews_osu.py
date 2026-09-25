#!/usr/bin/env python3
"""Add Joshua Randall social-preview metadata to the existing OSU site in place.

This intentionally edits only HTML <head> metadata. It does not replace page
content, game bundles, JavaScript, CSS, or directories. A timestamped backup is
created before any file is changed.
"""
from __future__ import annotations

import html
import os
import re
import shutil
import tempfile
from datetime import datetime
from pathlib import Path

SITE = Path.home() / "public_html"
BASE_URL = "https://web.engr.oregonstate.edu/~randjosh/"
IMAGE_URL = BASE_URL + "assets/joshua-randall-headshot.jpg"
MAX_HTML_BYTES = 5_000_000

TITLE_RE = re.compile(r"<title\b[^>]*>(.*?)</title>", re.I | re.S)
DESC_TAG_RE = re.compile(r"<meta\b[^>]*\bname=[\"']description[\"'][^>]*>", re.I)
CONTENT_RE = re.compile(r"\bcontent=[\"'](.*?)[\"']", re.I | re.S)
OG_IMAGE_RE = re.compile(r"<meta\b[^>]*\bproperty=[\"']og:image[\"']", re.I)
HEAD_CLOSE_RE = re.compile(r"</head\s*>", re.I)


def attr(value: str) -> str:
    return html.escape(html.unescape(value.strip()), quote=True)


def page_url(path: Path) -> str:
    rel = path.relative_to(SITE).as_posix()
    if rel == "index.html":
        return BASE_URL
    if rel.endswith("/index.html"):
        return BASE_URL + rel[:-10]
    return BASE_URL + rel


def description_from(text: str, title: str) -> str:
    tag = DESC_TAG_RE.search(text)
    if tag:
        content = CONTENT_RE.search(tag.group(0))
        if content and content.group(1).strip():
            return html.unescape(content.group(1).strip())
    return f"{html.unescape(title)} — Joshua Randall's engineering portfolio."


def preview_block(title: str, description: str, url: str) -> str:
    t = attr(title)
    d = attr(description)
    u = attr(url)
    i = attr(IMAGE_URL)
    return (
        "\n<!-- Social preview metadata -->\n"
        f'<meta property="og:type" content="website"/>\n'
        f'<meta property="og:site_name" content="Joshua Randall Engineering Portfolio"/>\n'
        f'<meta property="og:title" content="{t}"/>\n'
        f'<meta property="og:description" content="{d}"/>\n'
        f'<meta property="og:url" content="{u}"/>\n'
        f'<meta property="og:image" content="{i}"/>\n'
        f'<meta property="og:image:secure_url" content="{i}"/>\n'
        f'<meta property="og:image:type" content="image/jpeg"/>\n'
        f'<meta property="og:image:alt" content="Joshua Randall"/>\n'
        f'<meta name="twitter:card" content="summary_large_image"/>\n'
        f'<meta name="twitter:title" content="{t}"/>\n'
        f'<meta name="twitter:description" content="{d}"/>\n'
        f'<meta name="twitter:image" content="{i}"/>\n'
        f'<link rel="canonical" href="{u}"/>\n'
    )


def atomic_write(path: Path, data: bytes) -> None:
    fd, tmp_name = tempfile.mkstemp(prefix=".social-preview-", dir=path.parent)
    tmp = Path(tmp_name)
    try:
        with os.fdopen(fd, "wb") as handle:
            handle.write(data)
        shutil.copymode(path, tmp)
        os.replace(tmp, path)
    finally:
        if tmp.exists():
            tmp.unlink()


def main() -> None:
    if not SITE.is_dir():
        raise SystemExit(f"STOP: OSU web root not found: {SITE}")
    headshot = SITE / "assets" / "joshua-randall-headshot.jpg"
    if not headshot.is_file():
        raise SystemExit(
            "STOP: assets/joshua-randall-headshot.jpg is not live yet. "
            "Deploy the portfolio first, then run this patch."
        )

    candidates = sorted(
        p for p in SITE.rglob("*.html")
        if p.is_file()
        and p.stat().st_size <= MAX_HTML_BYTES
        and not any(part.startswith(".") for part in p.relative_to(SITE).parts)
    )

    changes: list[tuple[Path, bytes]] = []
    skipped_existing = 0
    skipped_no_head = 0

    for path in candidates:
        raw = path.read_bytes()
        try:
            text = raw.decode("utf-8")
        except UnicodeDecodeError:
            continue
        if OG_IMAGE_RE.search(text):
            skipped_existing += 1
            continue
        title_match = TITLE_RE.search(text)
        head_close = HEAD_CLOSE_RE.search(text)
        if not title_match or not head_close:
            skipped_no_head += 1
            continue

        title = html.unescape(re.sub(r"\s+", " ", title_match.group(1)).strip())
        desc = description_from(text, title)
        block = preview_block(title, desc, page_url(path))
        updated = text[:head_close.start()] + block + text[head_close.start():]
        changes.append((path, updated.encode("utf-8")))

    if not changes:
        print("No social-preview changes were needed.")
        print(f"Already configured: {skipped_existing}")
        return

    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = Path.home() / f"social-preview-backup-{stamp}"
    backup.mkdir(mode=0o700)

    for path, _ in changes:
        rel = path.relative_to(SITE)
        dest = backup / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, dest)

    try:
        for path, data in changes:
            atomic_write(path, data)
            check = path.read_text(encoding="utf-8")
            if 'property="og:image"' not in check or IMAGE_URL not in check:
                raise OSError(f"Verification failed for {path}")
    except BaseException:
        for path, _ in changes:
            rel = path.relative_to(SITE)
            saved = backup / rel
            if saved.exists():
                shutil.copy2(saved, path)
        raise

    print("SOCIAL PREVIEWS UPDATED")
    print("Image:", IMAGE_URL)
    print("HTML pages changed:", len(changes))
    print("Already configured:", skipped_existing)
    print("Skipped (no normal HTML head/title):", skipped_no_head)
    print("Rollback backup:", backup)
    print()
    print("Important: iMessage caches link previews. To test immediately, share a URL")
    print("with a temporary query string such as ?preview=2.")


if __name__ == "__main__":
    main()
