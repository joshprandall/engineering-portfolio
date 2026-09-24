#!/usr/bin/env python3
from __future__ import annotations

import re
import shutil
from datetime import datetime
from pathlib import Path

ROOT = Path.cwd()
FILES = ["index.html", "portfolio-home.css"]
missing = [name for name in FILES if not (ROOT / name).is_file()]
if missing:
    raise SystemExit("Run this from ~/public_html. Missing: " + ", ".join(missing))

stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
backup = Path.home() / f"homepage-swap-backup-{stamp}"
backup.mkdir(parents=True, exist_ok=False)
for name in FILES:
    shutil.copy2(ROOT / name, backup / name)

index_path = ROOT / "index.html"
html = index_path.read_text(encoding="utf-8")

solar = '<div class="system-visual"><p class="eyebrow">CONNECTED SYSTEMS</p><h2>Five ways to build better.</h2><p>Architect, build, secure, automate, and evolve.</p><a class="text-link" href="projects.html">Explore the systems behind the work →</a></div>'

hero_start = html.find('<section aria-labelledby="hero-title" class="hero wrap">')
hero_end = html.find('</section>', hero_start)
about_start = html.find('<section aria-labelledby="about-title" class="wrap home-section about-story" id="about">')
about_end = html.find('</section>', about_start)

if min(hero_start, hero_end, about_start, about_end) < 0:
    raise SystemExit("STOPPED safely: homepage hero/about section markers were not found.")

hero = html[hero_start:hero_end + len('</section>')]
about = html[about_start:about_end + len('</section>')]

# Idempotent: only perform the positional swap when the hero still contains
# the solar placeholder and the About section still contains the portrait unit.
hero_has_solar = solar in hero
about_image_start = about.find('<div class="about-imagery">')
about_copy_start = about.find('<div class="about-copy" id="experience">')

if hero_has_solar and about_image_start >= 0 and about_copy_start > about_image_start:
    imagery = about[about_image_start:about_copy_start].strip()

    card_start = imagery.find('<div class="portrait-card-copy">')
    if card_start < 0:
        raise SystemExit("STOPPED safely: portrait credential card was not found.")
    card_end = imagery.find('</div>', card_start)
    if card_end < 0:
        raise SystemExit("STOPPED safely: portrait credential card closing tag was not found.")
    card_end += len('</div>')

    new_card = '''<div class="portrait-card-copy">
  <strong class="portrait-name">Joshua Randall</strong>
  <div class="credential-row credential-row-osu">
    <span class="credential-logo credential-logo-osu"><img src="assets/osu-logo.png" alt="Oregon State University logo" width="74" height="28"></span>
    <span class="credential-text">Oregon State University · B.S. studies in Electrical &amp; Computer Engineering and Computer Science · In progress<br>Minors: Mathematics, Physics &amp; Data Science · Honors College participant</span>
  </div>
  <div class="credential-row credential-row-mit">
    <span class="credential-logo credential-logo-mit" aria-label="MIT logo">MIT</span>
    <span class="credential-text">MIT · Online Quantum Engineering Program · Tuition-based professional study · In progress</span>
  </div>
</div>'''

    imagery = imagery[:card_start] + new_card + imagery[card_end:]
    new_hero = hero.replace(solar, imagery, 1)
    new_about = about[:about_image_start] + solar + about[about_copy_start:]

    html = html[:hero_start] + new_hero + html[hero_end + len('</section>'):about_start] + new_about + html[about_end + len('</section>'):]
elif 'credential-row credential-row-osu' not in hero:
    raise SystemExit("STOPPED safely: homepage is not in the expected pre-swap or already-swapped state.")

# Correct any accumulated cache-buster text and force the new layout stylesheet.
html = re.sub(r'portfolio-next\.css\?v=[^"\'\s>]+', 'portfolio-next.css?v=20260924-solar-v11', html)
html = re.sub(r'portfolio-home\.css\?v=[^"\'\s>]+', 'portfolio-home.css?v=20260924-hero-swap-v1', html)
index_path.write_text(html, encoding="utf-8")

css_path = ROOT / "portfolio-home.css"
css = css_path.read_text(encoding="utf-8")
marker = "/* Hero/profile swap v1 — portrait at top, solar in About. */"
if marker not in css:
    css += r'''

/* Hero/profile swap v1 — portrait at top, solar in About. */
.home-page .hero>.about-imagery{
  width:100%;
  margin:0;
  align-self:center;
}
.home-page .about-story>.vnext-cosmos{
  width:100%;
  align-self:center;
}
.portrait-card-copy{
  max-width:54ch;
}
.portrait-card-copy .portrait-name{
  font-weight:900!important;
  font-size:1.14rem!important;
  letter-spacing:.01em!important;
}
.portrait-card-copy .credential-row{
  display:grid!important;
  grid-template-columns:82px minmax(0,1fr)!important;
  align-items:center!important;
  gap:12px!important;
  margin-top:10px!important;
  text-align:left!important;
}
.portrait-card-copy .credential-text{
  display:block!important;
  margin:0!important;
  color:var(--ink)!important;
  font-weight:800!important;
  font-size:.68rem!important;
  line-height:1.45!important;
}
.credential-logo{
  display:grid!important;
  place-items:center!important;
  width:82px!important;
  min-width:82px!important;
  height:42px!important;
  margin:0!important;
  border-radius:8px!important;
  opacity:1!important;
  -webkit-backdrop-filter:none!important;
  backdrop-filter:none!important;
  box-shadow:0 4px 14px rgba(0,0,0,.28)!important;
  overflow:hidden!important;
}
.credential-logo-osu{
  background:#fff!important;
  border:1px solid rgba(0,0,0,.12)!important;
}
.credential-logo-osu img{
  display:block!important;
  width:72px!important;
  height:auto!important;
  max-height:32px!important;
  object-fit:contain!important;
  opacity:1!important;
  filter:none!important;
}
.credential-logo-mit{
  background:#a31f34!important;
  color:#fff!important;
  border:1px solid rgba(0,0,0,.14)!important;
  font:900 1.18rem/1 Arial,Helvetica,sans-serif!important;
  letter-spacing:-.06em!important;
}
@media(max-width:600px){
  .home-page .hero>.about-imagery{
    min-height:470px!important;
  }
  .portrait-card-copy .credential-row{
    grid-template-columns:68px minmax(0,1fr)!important;
    gap:9px!important;
    margin-top:8px!important;
  }
  .credential-logo{
    width:68px!important;
    min-width:68px!important;
    height:38px!important;
  }
  .credential-logo-osu img{
    width:60px!important;
    max-height:28px!important;
  }
  .portrait-card-copy .credential-text{
    font-size:.62rem!important;
    line-height:1.42!important;
  }
}
@media(max-width:390px){
  .portrait-card-copy .credential-row{
    grid-template-columns:62px minmax(0,1fr)!important;
    gap:8px!important;
  }
  .credential-logo{
    width:62px!important;
    min-width:62px!important;
    height:36px!important;
  }
  .credential-logo-osu img{width:55px!important}
  .portrait-card-copy .credential-text{font-size:.585rem!important}
}
'''
css_path.write_text(css, encoding="utf-8")

check = index_path.read_text(encoding="utf-8")
positions = [
    check.find('<section aria-labelledby="hero-title" class="hero wrap">'),
    check.find('<section aria-labelledby="work-title" class="wrap home-section" id="selected-work">'),
    check.find('<section aria-labelledby="about-title" class="wrap home-section about-story" id="about">'),
]
if not (positions[0] < positions[1] < positions[2]):
    raise SystemExit("Validation failed: homepage section order changed. Restore from: " + str(backup))
if check.count('class="about-imagery"') != 1:
    raise SystemExit("Validation failed: expected exactly one portrait/background unit. Restore from: " + str(backup))
if check.count('class="system-visual"') != 1:
    raise SystemExit("Validation failed: expected exactly one solar placeholder. Restore from: " + str(backup))
if 'credential-row credential-row-osu' not in check or 'credential-row credential-row-mit' not in check:
    raise SystemExit("Validation failed: credential rows are missing. Restore from: " + str(backup))

print("Done: homepage portrait/solar swap installed.")
print("Your portrait + systems background + education card are now in the top hero.")
print("The Connected Systems solar animation now occupies the former portrait position.")
print("Credential text is bold and paired with opaque OSU/MIT school marks.")
print("Backup:", backup)
