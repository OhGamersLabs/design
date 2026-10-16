#!/usr/bin/env python3
"""Local-only Cloudflare release operations. Never prints or persists credentials."""
import argparse
import fnmatch
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
ACCOUNT = '9ef45508273746d6ed19ac93e11b76b1'
ZONE = '208f8fa50b0ae7567573e051844156f2'
HOST = 'design.ohgamers.org'
BUCKET = 'ohgamers'
SERVICE = 'ohgamers-design'


def credential(path):
    for line in Path(path).expanduser().read_text(encoding='utf-8-sig').splitlines():
        match = re.fullmatch(r'\s*(?:export\s+)?CLOUDFLARE_GLOBAL_API_KEY\s*=\s*(.*?)\s*', line)
        if match:
            value = match.group(1)
            if len(value) >= 2 and value[0] == value[-1] and value[0] in "'\"":
                value = value[1:-1]
            if value and not re.search(r'\$\(|`|\$\{|[\r\n]', value):
                return value
    raise RuntimeError('Missing literal Global API Key field')


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


class Client:
    def __init__(self, key, email):
        self.key = key
        self.headers = {'X-Auth-Key': key, 'X-Auth-Email': email,
                        'cf-r2-jurisdiction': 'default', 'Accept': 'application/json'}
        self.opener = urllib.request.build_opener(NoRedirect())

    def call(self, path, method='GET', data=None, headers=None, binary=False):
        req = urllib.request.Request('https://api.cloudflare.com/client/v4' + path,
                                     headers={**self.headers, **(headers or {})}, data=data, method=method)
        try:
            with self.opener.open(req, timeout=60) as response:
                status, body = response.status, response.read()
        except urllib.error.HTTPError as error:
            status, body = error.code, error.read()
        if binary and status == 200:
            return body
        try:
            doc = json.loads(body)
        except Exception:
            raise RuntimeError(f'Cloudflare HTTP {status}: non-JSON response') from None
        if not doc.get('success'):
            codes = [item.get('code') for item in (doc.get('errors') or []) if isinstance(item, dict)]
            raise RuntimeError(f'Cloudflare HTTP {status}; error codes {codes}')
        return doc


def route_targets_host(pattern, hostname):
    authority = pattern.split('://', 1)[-1].split('/', 1)[0].lower()
    return fnmatch.fnmatchcase(hostname.lower(), authority)


def preflight(client):
    dns = client.call(f'/zones/{ZONE}/dns_records?name.exact={HOST}&per_page=100')['result']
    domains = client.call(f'/accounts/{ACCOUNT}/workers/domains')['result'] or []
    matching = [item for item in domains if item.get('hostname') == HOST]
    scripts = client.call(f'/accounts/{ACCOUNT}/workers/scripts')['result'] or []
    service_exists = any(item.get('id') == SERVICE for item in scripts)
    routes = client.call(f'/zones/{ZONE}/workers/routes')['result'] or []
    matching_routes = [item for item in routes if route_targets_host(item.get('pattern', ''), HOST)]
    if dns and not matching:
        raise RuntimeError('Target DNS exists without our verified Worker domain; refuse overwrite')
    if any(item.get('service') != SERVICE for item in matching):
        raise RuntimeError('Target hostname belongs to another Worker; refuse overwrite')
    if service_exists and not matching:
        raise RuntimeError('Worker name already exists without our verified domain; inspect ownership before deploying')
    if any(item.get('service') == SERVICE and item.get('hostname') != HOST for item in domains):
        raise RuntimeError('Worker name also serves another hostname; refuse to affect it')
    if any(item.get('script') and item.get('script') != SERVICE for item in matching_routes):
        raise RuntimeError('A Worker route intercepts the target hostname; refuse overwrite')
    managed = client.call(f'/accounts/{ACCOUNT}/r2/buckets/{BUCKET}/domains/managed')['result']
    custom = client.call(f'/accounts/{ACCOUNT}/r2/buckets/{BUCKET}/domains/custom')['result']
    if managed.get('enabled') or any(item.get('enabled') for item in custom.get('domains', [])):
        raise RuntimeError('Bucket has a direct public entry point; refuse to claim private storage')
    print(json.dumps({'preflight': 'passed', 'hostname': HOST, 'existing_own_domain': bool(matching),
                      'worker_already_exists': service_exists,
                      'intercepting_routes': len(matching_routes), 'bucket_direct_public_access': False}))


def upload(client):
    subprocess.run(['npm', 'run', 'check:release'], cwd=ROOT, check=True)
    catalog = json.loads((ROOT / 'catalog/releases.json').read_text())
    assets = catalog['assets']
    for asset in assets:
        path = ROOT / '.release' / asset['character'] / asset['version'] / asset['downloadName']
        body = path.read_bytes()
        if len(body) != asset['size'] or hashlib.sha256(body).hexdigest() != asset['sha256']:
            raise RuntimeError('Local release integrity mismatch: ' + asset['path'])
    prefix = 'x_ops/design/characters/bunny/releases/1.0.0/'
    cursor = None
    present = {}
    while True:
        query = {'prefix': prefix, 'per_page': 1000}
        if cursor:
            query['cursor'] = cursor
        page = client.call(f'/accounts/{ACCOUNT}/r2/buckets/{BUCKET}/objects?' + urllib.parse.urlencode(query))
        present.update({item['key']: item for item in page.get('result') or []})
        info = page.get('result_info') or {}
        cursor = info.get('cursor') if info.get('is_truncated') else None
        if not cursor:
            break
    for asset in assets:
        path = ROOT / '.release' / asset['character'] / asset['version'] / asset['downloadName']
        endpoint = f'/accounts/{ACCOUNT}/r2/buckets/{BUCKET}/objects/' + urllib.parse.quote(asset['key'], safe='/')
        if asset['key'] in present:
            body = client.call(endpoint, binary=True)
            if len(body) != asset['size'] or hashlib.sha256(body).hexdigest() != asset['sha256']:
                raise RuntimeError('Existing release object differs; refuse overwrite: ' + asset['path'])
            print(json.dumps({'object': asset['path'], 'status': 'existing_identical_skipped'}), flush=True)
            continue
        result = client.call(endpoint, method='PUT', data=path.read_bytes(),
                             headers={'Content-Type': asset['contentType'], 'If-None-Match': '*'})
        metadata = result.get('result') or {}
        if int(metadata.get('size', -1)) != asset['size']:
            raise RuntimeError('Uploaded size mismatch: ' + asset['path'])
        body = client.call(endpoint, binary=True)
        if hashlib.sha256(body).hexdigest() != asset['sha256']:
            raise RuntimeError('Uploaded hash mismatch: ' + asset['path'])
        print(json.dumps({'object': asset['path'], 'status': 'uploaded_and_verified', 'bytes': len(body)}), flush=True)


def wrangler(key, email, args):
    env = os.environ.copy()
    for name in ['CLOUDFLARE_API_TOKEN', 'CF_API_TOKEN', 'CF_API_BASE_URL']:
        env.pop(name, None)
    env.update({'CLOUDFLARE_API_KEY': key, 'CLOUDFLARE_EMAIL': email, 'CLOUDFLARE_ACCOUNT_ID': ACCOUNT,
                'CLOUDFLARE_API_BASE_URL': 'https://api.cloudflare.com/client/v4',
                'WRANGLER_SEND_METRICS': 'false', 'WRANGLER_WRITE_LOGS': 'false',
                'WRANGLER_LOG_SANITIZE': 'true', 'WRANGLER_LOG': 'info', 'CI': 'true'})
    result = subprocess.run([str(ROOT / 'node_modules/.bin/wrangler'), *args], cwd=ROOT,
                            env=env, capture_output=True, text=True)
    for output in [result.stdout, result.stderr]:
        if output:
            print(output.replace(key, '[REDACTED]'), end='', flush=True)
    if result.returncode:
        raise RuntimeError(f'Wrangler exited {result.returncode}; inspect remote state before mutation retry')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['preflight', 'upload', 'dry-run', 'deploy', 'status'])
    parser.add_argument('--credentials', required=True, help='Local env file; never copied')
    parser.add_argument('--email', required=True)
    args = parser.parse_args()
    key = credential(args.credentials)
    client = Client(key, args.email)
    if args.action == 'preflight':
        preflight(client)
    elif args.action == 'upload':
        preflight(client)
        upload(client)
    elif args.action == 'dry-run':
        wrangler(key, args.email, ['deploy', '--dry-run', '--outdir', '.wrangler/dry-run'])
    elif args.action == 'deploy':
        subprocess.run(['npm', 'run', 'check:release'], cwd=ROOT, check=True)
        subprocess.run(['npm', 'run', 'build'], cwd=ROOT, check=True)
        preflight(client)
        wrangler(key, args.email, ['deploy'])
    else:
        versions = client.call(f'/accounts/{ACCOUNT}/workers/scripts/{SERVICE}/deployments')
        print(json.dumps({'deployments': versions.get('result')}, ensure_ascii=False))


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # Never print HTTP request objects, headers or credential-bearing exception details.
        text = str(error) if isinstance(error, RuntimeError) else type(error).__name__
        print('Release stopped: ' + text, file=sys.stderr)
        sys.exit(1)
