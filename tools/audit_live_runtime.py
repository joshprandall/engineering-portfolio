#!/usr/bin/env python3
"""Read-only live-byte inventory. Never deploys or updates reviewed baselines."""
import argparse
import concurrent.futures
import datetime
import hashlib
import json
from pathlib import Path, PurePosixPath
import subprocess
from urllib.error import HTTPError
from urllib.parse import quote, urlsplit
from urllib.request import Request, urlopen

TEXT_SUFFIXES = {'.html', '.css', '.js', '.mjs'}


def manifest_paths(manifest):
    paths = set()
    for row in manifest['files']:
        name = row['path']
        if not isinstance(name, str) or not name:
            raise ValueError('Unsafe manifest path: ' + repr(name))
        path = PurePosixPath(name)
        if (path.is_absolute()
                or '..' in path.parts or '\\' in name or ':' in name
                or str(path) != name):
            raise ValueError('Unsafe manifest path: ' + repr(name))
        if path.suffix in TEXT_SUFFIXES:
            paths.add(name)
    return sorted(paths)


def compare_file(name, source, base_url, *, timeout=20, max_bytes=128*1024*1024, opener=None):
    """Hash a bounded response incrementally; source is the exact committed Git blob."""
    row = {'path': name, 'sourceSha256': hashlib.sha256(source).hexdigest()}
    url = base_url.rstrip('/') + '/' + quote(name, safe='/')
    try:
        request = Request(url, headers={'Cache-Control': 'no-cache'})
        with (opener or urlopen)(request, timeout=timeout) as response:
            row.update(status=response.status, finalUrl=response.url,
                       contentType=response.headers.get('Content-Type'))
            if urlsplit(response.url).netloc != urlsplit(base_url).netloc:
                raise ValueError('Response redirected to a different host')
            digest, size = hashlib.sha256(), 0
            while True:
                chunk = response.read(min(1024*1024, max_bytes-size+1))
                if not chunk:
                    break
                size += len(chunk)
                if size > max_bytes:
                    raise ValueError('Response exceeds audit byte limit')
                digest.update(chunk)
            row.update(liveBytes=size, liveSha256=digest.hexdigest(),
                       matches=digest.hexdigest() == row['sourceSha256'])
    except HTTPError as error:
        row.update(status=error.code, error=str(error))
    except (OSError, ValueError) as error:
        row['error'] = str(error)
    return row


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repo', type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument('--ref', default='HEAD')
    parser.add_argument('--base-url', default='https://web.engr.oregonstate.edu/~randjosh/')
    parser.add_argument('--output', type=Path)
    parser.add_argument('--workers', type=int, choices=range(1, 5), default=3)
    args = parser.parse_args()
    if urlsplit(args.base_url).scheme not in ('https', 'http'):
        parser.error('--base-url must be an HTTP(S) URL')
    def git(*parts):
        return subprocess.check_output(['git', *parts], cwd=args.repo)
    commit = git('rev-parse', '--verify', args.ref + '^{commit}').decode().strip()
    paths = manifest_paths(json.loads(git('show', commit + ':manifests/runtime-files.json')))
    started = datetime.datetime.now(datetime.timezone.utc).isoformat()
    def inspect(name):
        try:
            return compare_file(name, git('show', commit + ':' + name), args.base_url)
        except subprocess.CalledProcessError:
            return {'path': name, 'error': 'Source Git blob unavailable at pinned commit'}
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        rows = list(pool.map(inspect, paths))
    report = {
        'schemaVersion': 1, 'commit': commit, 'baseUrl': args.base_url,
        'startedAtUtc': started,
        'completedAtUtc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'readOnly': True,
        'scope': 'Manifest HTML/CSS/JS/MJS only; excludes binary media, JSON curriculum and host-only files. Not full production parity or deployment approval.',
        'counts': {'checked': len(rows), 'matches': sum(r.get('matches') is True for r in rows),
                   'different': sum(r.get('matches') is False for r in rows),
                   'errors': sum('error' in r for r in rows)},
        'files': rows,
    }
    rendered = json.dumps(report, indent=2) + '\n'
    if args.output:
        # Fail rather than overwrite a prior evidence file or any user file.
        with args.output.open('x', encoding='utf-8') as output:
            output.write(rendered)
    else:
        print(rendered, end='')


if __name__ == '__main__':
    main()
