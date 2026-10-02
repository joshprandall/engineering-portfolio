"""Build deterministic source ZIPs and checksum lists; do not invent results.

Notebook execution is a separate gate (tools/check_content_notebooks.py).
"""
from pathlib import Path
import hashlib
import json
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PACKAGES = {'engineering-foundations': '3.1', 'engineering-studies': '3.2-3.6'}


def package(name, version):
    source = ROOT / 'project-sources' / name
    paths = sorted(p for p in source.rglob('*') if p.is_file()
                   and '__pycache__' not in p.parts and p.name != 'SHA256SUMS'
                   and '.ipynb_checkpoints' not in p.parts)
    checks = ''.join(f'{hashlib.sha256(p.read_bytes()).hexdigest()}  {p.relative_to(source).as_posix()}\n' for p in paths)
    (source/'SHA256SUMS').write_text(checks)
    paths.append(source/'SHA256SUMS')
    output = ROOT/'assets'/'downloads'/f'{name}-{version}.zip'
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for path in sorted(paths):
            info = zipfile.ZipInfo(f'{name}/{path.relative_to(source).as_posix()}', (2026, 10, 2, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            z.writestr(info, path.read_bytes())
    return {'file': output.relative_to(ROOT).as_posix(), 'sha256': hashlib.sha256(output.read_bytes()).hexdigest(), 'bytes': output.stat().st_size}


if __name__ == '__main__':
    print(json.dumps([package(name, version) for name, version in PACKAGES.items()], indent=2))
