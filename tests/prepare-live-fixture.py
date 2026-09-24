"""Build a browser fixture by running the real installer against the live game."""
from pathlib import Path
import shutil
from test_reviewed_repair import ROOT, repair, make_site

dest=ROOT/'tests/run-live-site'
if dest.exists():shutil.rmtree(dest)
make_site(dest)
shutil.copytree(ROOT/'assets',dest/'assets')
changes=repair.plan_changes(dest,ROOT)
for name,data in changes.items():
    path=dest/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_bytes(data)
print('Browser fixture prepared from the actual OSU game and reviewed installer.')
