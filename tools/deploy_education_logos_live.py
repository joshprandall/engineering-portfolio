#!/usr/bin/env python3
"""Surgically update the live OSU education-card marks without replacing the rest of the site."""
from pathlib import Path
from urllib.request import Request, urlopen
import datetime
import os
import re
import shutil
import tarfile

SITE = Path.home() / "public_html"
INDEX = SITE / "index.html"
CSS = SITE / "portfolio-home.css"
OSU_LOGO = SITE / "assets" / "osu-logo.png"
PUBLIC = "https://web.engr.oregonstate.edu/~randjosh/"
OSU_LOGO_URL = "https://raw.githubusercontent.com/joshprandall/engineering-portfolio/main/assets/osu-logo.png"

OLD_OSU = '<span class="school-monogram osu-mark">OSU</span>'
NEW_OSU = '<span class="school-monogram school-logo osu-mark"><img src="assets/osu-logo.png" alt="Oregon State University logo" width="74" height="28" decoding="async"></span>'
OLD_MIT = '<span class="school-monogram mit-mark">MIT</span>'
NEW_MIT = '<span class="school-monogram school-logo mit-mark"><img src="https://groups.csail.mit.edu/gdpgroup/assets/mitlogo/MIT-logo-black-red-72x38.svg" alt="MIT logo" width="72" height="38" decoding="async"></span>'

CSS_MARKER = "/* education-university-logos-live */"
CSS_RULES = """
/* education-university-logos-live */
.education-cards .school-monogram.school-logo{
  width:72px;
  min-width:72px;
  height:54px;
  padding:8px;
  background:rgba(255,255,255,.96);
  overflow:hidden;
}
.education-cards .school-monogram.school-logo img{
  display:block;
  width:100%;
  height:100%;
  object-fit:contain;
}
.education-cards .osu-mark.school-logo,
.education-cards .mit-mark.school-logo{
  background:rgba(255,255,255,.96);
}
"""

def fetch(url):
    request = Request(url, headers={"Cache-Control": "no-cache", "User-Agent": "portfolio-live-patch"})
    with urlopen(request, timeout=30) as response:
        return response.read()

def atomic_write(path, data):
    temp = path.with_name("." + path.name + ".education-logos")
    if isinstance(data, str):
        temp.write_text(data, encoding="utf-8")
    else:
        temp.write_bytes(data)
    temp.chmod(0o644)
    os.replace(temp, path)

def main():
    if not INDEX.is_file() or not CSS.is_file():
        raise SystemExit("Run this from the authenticated OSU account that owns ~/public_html.")

    stamp = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = SITE.parent / f"education-logos-before-{stamp}.tar.gz"
    with tarfile.open(backup, "w:gz") as archive:
        archive.add(INDEX, arcname="index.html")
        archive.add(CSS, arcname="portfolio-home.css")
        if OSU_LOGO.is_file():
            archive.add(OSU_LOGO, arcname="assets/osu-logo.png")

    index = INDEX.read_text(encoding="utf-8")
    index = index.replace(OLD_OSU, NEW_OSU).replace(OLD_MIT, NEW_MIT)
    index = re.sub(
        r'portfolio-home\.css\?v=[^"\']+',
        'portfolio-home.css?v=20260924-education-logos-live1',
        index,
        count=1,
    )
    if NEW_OSU not in index or NEW_MIT not in index:
        raise RuntimeError("Education cards were not found in the expected homepage markup.")

    css = CSS.read_text(encoding="utf-8")
    if CSS_MARKER not in css and ".school-monogram.school-logo{" not in css:
        css = css.rstrip() + "\n\n" + CSS_RULES.strip() + "\n"

    if not OSU_LOGO.is_file():
        OSU_LOGO.parent.mkdir(parents=True, exist_ok=True)
        atomic_write(OSU_LOGO, fetch(OSU_LOGO_URL))

    atomic_write(CSS, css)
    atomic_write(INDEX, index)

    live_index = fetch(PUBLIC + "index.html?education-logos=" + stamp).decode("utf-8", errors="replace")
    live_css = fetch(PUBLIC + "portfolio-home.css?education-logos=" + stamp).decode("utf-8", errors="replace")
    if 'class="school-monogram school-logo osu-mark"' not in live_index:
        raise RuntimeError("Live homepage verification failed for the OSU logo.")
    if 'class="school-monogram school-logo mit-mark"' not in live_index:
        raise RuntimeError("Live homepage verification failed for the MIT logo.")
    if ".school-monogram.school-logo" not in live_css:
        raise RuntimeError("Live stylesheet verification failed for university-logo sizing.")

    print("LIVE: university logos updated and verified.")
    print("Backup:", backup)
    print("URL:", PUBLIC)

if __name__ == "__main__":
    main()
