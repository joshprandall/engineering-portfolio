#!/usr/bin/env bash
# One-pass ShellFish rollout; full site backup and protected media before writes.
set -euo pipefail
cd "$HOME"
base='https://raw.githubusercontent.com/joshprandall/engineering-portfolio/a406cc45a246f34493e860618513e5957d34b3c6'
site="$HOME/public_html"
loader="$HOME/deploy_vnext_osu.py"
echo 'Downloading pinned OSU installer...'
curl --fail --location --silent --show-error --retry 2 "$base/tools/deploy_vnext_osu.py" --output "$loader"
python3 -m py_compile "$loader"
python3 "$loader"
echo 'Installing verified mobile layout and whole-card navigation...'
for item in \
  'site-resilience.css 53b125404374a9ea16acc82d5d8d8ff525e2f623' \
  'site-resilience.js 897c814bd965c0d06c392789040e3ccce4402b0d'; do
  set -- $item
  name="$1"
  expected="$2"
  temp="$(mktemp "$site/.$name.XXXXXX")"
  if ! curl --fail --location --silent --show-error --retry 2 "$base/$name" --output "$temp"; then
    rm -f "$temp"
    echo "STOP: could not download $name; prior website backup is safe"
    exit 1
  fi
  if ! python3 - "$temp" "$expected" <<'PY'
import hashlib, pathlib, sys
b=pathlib.Path(sys.argv[1]).read_bytes()
gitsha=hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()
if gitsha != sys.argv[2]:
    print('GitHub blob verification failed:',gitsha,'expected',sys.argv[2]);sys.exit(1)
PY
  then
    rm -f "$temp"
    echo "STOP: downloaded $name did not match reviewed GitHub source"
    exit 1
  fi
  if [ -f "$site/$name" ]; then
    cp -p "$site/$name" "$HOME/$name-before-vnext-$(date +%Y%m%d-%H%M%S)"
  fi
  chmod 644 "$temp"
  mv -f "$temp" "$site/$name"
  echo "INSTALLED $name"
done
echo 'Checking OSU public URLs (HTTP 200 required):'
errors=0
for page in index.html projects.html learn-paths.html learn-capstones.html portfolio-next.js site-resilience.css site-resilience.js games/3d-battle-chess/index.html games/evil-wizard/index.html assets/quantum-lab-reference.jpg; do
  code="$(curl --location --silent --show-error --max-time 15 --output /dev/null --write-out '%{http_code}' "https://web.engr.oregonstate.edu/~randjosh/$page?check=a406cc45" || true)"
  printf '%s %s\n' "$code" "$page"
  if [ "$code" != 200 ]; then errors=1; fi
done
if [ "$errors" != 0 ]; then
  echo 'DEPLOYED; some live URLs failed. Keep the backups and send this output before further changes.'
  exit 2
fi
echo 'OSU CORE PAGES SERVING. Test animations, game controls and learning content in Chrome.'
