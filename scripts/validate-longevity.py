#!/usr/bin/env python3
"""Compare public Longevity pages/assets with the inspected local source tree."""
import argparse
import concurrent.futures
import hashlib
from pathlib import Path
from urllib.request import Request, urlopen


def public_path(relative):
    path = relative.as_posix()
    if path.endswith('index.html'):
        return path[:-len('index.html')]
    return path + '?v=20261017'


def validate(root, base_url):
    root = Path(root)
    files = sorted(p for p in (root / 'longevity').rglob('*') if p.is_file())
    if not files:
        raise ValueError('Longevity payload is missing')
    def check(path):
        relative = path.relative_to(root)
        url = base_url.rstrip('/') + '/' + public_path(relative)
        request = Request(url, headers={'User-Agent': '4Seas-release-validation'})
        with urlopen(request, timeout=20) as response:
            content = response.read()
            if response.status != 200:
                raise ValueError('HTTP failure: ' + str(relative))
        if hashlib.sha256(content).digest() != hashlib.sha256(path.read_bytes()).digest():
            raise ValueError('Content hash mismatch: ' + str(relative))
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        list(pool.map(check, files))
    return len(files)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parent.parent)
    parser.add_argument('--base-url', default='https://4seas.xyz/')
    args = parser.parse_args()
    print('Verified %d Longevity pages/assets by HTTP status and SHA-256.' % validate(args.root, args.base_url))
