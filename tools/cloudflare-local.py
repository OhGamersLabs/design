#!/usr/bin/env python3
"""Local-only Cloudflare release operations. Never prints or persists credentials."""
import argparse
from contextlib import redirect_stdout
from datetime import datetime, timezone
import fnmatch
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile
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
        self.email = email
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


LARGE_OBJECT_BYTES = 50_000_000
IMAGE_TYPES = {'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'webp': 'image/webp'}


def catalog_groups(catalog):
    """Validate the public v2 allowlist, without imposing production approval."""
    if (not isinstance(catalog, dict) or set(catalog) != {'schemaVersion', 'contentReady', 'assets'} or
            type(catalog.get('schemaVersion')) is not int or
            catalog['schemaVersion'] != 2 or type(catalog.get('contentReady')) is not bool or
            not isinstance(catalog.get('assets'), list) or not catalog['assets']):
        raise RuntimeError('Expected a nonempty schemaVersion 2 image catalog')
    groups, paths, keys = {}, set(), set()
    for asset in catalog['assets']:
        if not isinstance(asset, dict) or set(asset) != {'character', 'path', 'key', 'contentType'}:
            raise RuntimeError('Invalid image catalog asset fields')
        character = asset['character']
        if (not isinstance(character, str) or len(character) > 64 or
                not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', character)):
            raise RuntimeError('Invalid image catalog character')
        path, key = asset['path'], asset['key']
        prefix = f'/media/{character}/'
        filename = path[len(prefix):] if isinstance(path, str) and path.startswith(prefix) else ''
        match = re.fullmatch(r'([a-z0-9]+(?:-[a-z0-9]+)*-latest)\.(png|jpg|jpeg|webp)', filename)
        if (not match or key != f'x_ops/design/characters/{character}/latest/{filename}' or
                path in paths or key in keys or asset['contentType'] != IMAGE_TYPES[match[2]]):
            raise RuntimeError('Invalid or duplicate image catalog path/key/type')
        groups.setdefault(character, []).append(asset)
        paths.add(path)
        keys.add(key)
    return groups


def local_files(catalog, root=ROOT):
    """Check every original before remote work; retain individual failures for reporting."""
    groups = catalog_groups(catalog)
    files, failures = {}, {}
    for character, assets in groups.items():
        try:
            manifest = json.loads((Path(root) / 'catalog' / character / 'manifest.json').read_text())
            if (not isinstance(manifest, dict) or manifest.get('schema_version') != '2.0' or
                    manifest.get('character_id') != character or
                    not isinstance(manifest.get('assets'), list)):
                raise RuntimeError('Invalid local character manifest: ' + character)
            originals = {}
            ids = set()
            for item in manifest['assets']:
                if not isinstance(item, dict) or not isinstance(item.get('original'), dict):
                    raise RuntimeError('Invalid local manifest asset: ' + character)
                original = item['original']
                if (item['character'] != character or item['id'] in ids or
                        original['path'] in originals or
                        original['path'] != f"/media/{character}/{item['id']}.png"):
                    raise RuntimeError('Invalid or duplicate local manifest asset: ' + character)
                originals[original['path']] = original
                ids.add(item['id'])
            if set(originals) != {asset['path'] for asset in assets}:
                raise RuntimeError('Local manifest and public catalog membership differ: ' + character)
        except (OSError, ValueError, TypeError, KeyError, RuntimeError) as error:
            reason = str(error) if isinstance(error, RuntimeError) else 'Missing or invalid local manifest: ' + character
            for asset in assets:
                failures[asset['path']] = reason
            continue
        for asset in assets:
            try:
                original = originals[asset['path']]
                size, sha = original.get('bytes'), original.get('sha256')
                if (type(size) is not int or size <= 0 or not isinstance(sha, str) or
                        not re.fullmatch(r'[a-fA-F0-9]{64}', sha) or
                        original.get('mime_type') != asset['contentType']):
                    raise RuntimeError('Invalid local original integrity metadata')
                path = Path(root) / '.release' / character / asset['path'].rsplit('/', 1)[1]
                body = path.read_bytes()
                if len(body) != size or hashlib.sha256(body).hexdigest() != sha.lower():
                    raise RuntimeError('Local original integrity mismatch')
                files[asset['path']] = (path, body, sha.lower())
            except (OSError, ValueError, TypeError, RuntimeError) as error:
                failures[asset['path']] = str(error) if isinstance(error, RuntimeError) else 'Missing or unreadable local original'
    return groups, files, failures


def list_objects(client, prefix):
    """Fetch every page for an explicit prefix and reject invalid pagination."""
    present, cursor, cursors = {}, None, set()
    while True:
        query = {'prefix': prefix, 'per_page': 1000}
        if cursor:
            query['cursor'] = cursor
        page = client.call(f'/accounts/{ACCOUNT}/r2/buckets/{BUCKET}/objects?' + urllib.parse.urlencode(query))
        for item in page.get('result') or []:
            key = item.get('key') if isinstance(item, dict) else None
            if not isinstance(key, str) or not key.startswith(prefix):
                raise RuntimeError('R2 listing returned an object outside the requested prefix')
            if key in present:
                raise RuntimeError('R2 listing returned a duplicate object')
            present[key] = item
        info = page.get('result_info') or {}
        if not info.get('is_truncated'):
            return present
        cursor = info.get('cursor')
        if not isinstance(cursor, str) or not cursor or cursor in cursors:
            raise RuntimeError('Incomplete or repeated R2 listing pagination cursor')
        cursors.add(cursor)


def list_latest_objects(client, character):
    return list_objects(client, f'x_ops/design/characters/{character}/latest/')


def object_endpoint(key):
    return f'/accounts/{ACCOUNT}/r2/buckets/{BUCKET}/objects/' + urllib.parse.quote(key, safe='/')


def safe_error(error, client):
    """Only our controlled RuntimeErrors are printable; redact the injected client's key too."""
    message = str(error) if isinstance(error, RuntimeError) else type(error).__name__
    key = getattr(client, 'key', None)
    return message.replace(key, '[REDACTED]') if isinstance(key, str) and key else message


def put_bytes(client, key, body, content_type, path=None, large_put=None):
    """Use Wrangler for objects above the REST threshold, including history copies."""
    if len(body) <= LARGE_OBJECT_BYTES:
        client.call(object_endpoint(key), method='PUT', data=body, headers={'Content-Type': content_type})
        return

    def send(local):
        if large_put:
            large_put(local, key, content_type)
        else:
            # Keep publish stdout machine-readable; wrangler still redacts its diagnostic output.
            with redirect_stdout(sys.stderr):
                wrangler(client.key, client.email, ['r2', 'object', 'put', f'{BUCKET}/{key}',
                                                 '--file', str(local), '--content-type', content_type, '--remote'])

    # A snapshot prevents the verified local source being changed between validation and upload.
    with tempfile.TemporaryDirectory(prefix='design-publish-') as temporary:
        snapshot = Path(temporary) / key.rsplit('/', 1)[1]
        snapshot.write_bytes(body)
        send(snapshot)


def verify_object(client, key, expected):
    actual = client.call(object_endpoint(key), binary=True)
    if len(actual) != len(expected) or hashlib.sha256(actual).digest() != hashlib.sha256(expected).digest():
        raise RuntimeError('Object readback hash or size mismatch: ' + key)


def publish(client, catalog=None, root=ROOT, apply=False, clock=None, large_put=None):
    """Plan by default; preserve replaced bytes in verified R2 history before applying updates.

    Inject a fake client, clock, and optional large_put in tests. Each asset gets one JSON
    result, and an aggregate error is raised only after every asset has been reported.
    Publishing to the same character must be serialized to preserve timestamped history.
    """
    if catalog is None:
        catalog = json.loads((Path(root) / 'catalog/releases.json').read_text())
    groups, files, failures = local_files(catalog, root)
    listings = {}
    for character, assets in groups.items():
        if not any(asset['path'] in files for asset in assets):
            continue
        try:
            listings[character] = list_latest_objects(client, character)
        except Exception as error:
            for asset in assets:
                failures.setdefault(asset['path'], safe_error(error, client))
    results = []
    for asset in catalog['assets']:
        result = {'object': asset['path'], 'key': asset['key'], 'mode': 'apply' if apply else 'dry-run'}
        try:
            if asset['path'] in failures:
                raise RuntimeError(failures[asset['path']])
            path, body, sha = files[asset['path']]
            existing = listings[asset['character']].get(asset['key'])
            previous = None
            if existing is not None:
                etag = existing.get('etag')
                # Only a plain object MD5 is safe to compare without downloading.
                if (isinstance(etag, str) and re.fullmatch(r'[a-fA-F0-9]{32}', etag) and
                        etag.lower() == hashlib.md5(body).hexdigest()):
                    result.update(status='identical_skipped', operations=[])
                else:
                    previous = client.call(object_endpoint(asset['key']), binary=True)
                    if hashlib.sha256(previous).hexdigest() == sha:
                        result.update(status='identical_skipped', operations=[])
            if 'status' not in result:
                operations = []
                if existing is not None:
                    now = clock() if clock else datetime.now(timezone.utc)
                    if now.tzinfo is None:
                        raise RuntimeError('History clock must be timezone-aware')
                    stamp = now.astimezone(timezone.utc).strftime('%Y%m%dT%H%M%SZ')
                    filename = asset['path'].rsplit('/', 1)[1]
                    stem, extension = filename.rsplit('.', 1)
                    history = f"x_ops/design/characters/{asset['character']}/history/{stem.removesuffix('-latest')}-{stamp}.{extension}"
                    operations.extend([{'operation': 'put_history', 'key': history},
                                       {'operation': 'verify_history', 'key': history}])
                    result['history'] = history
                    # A retry or another replacement in the same second must never erase history.
                    if history in list_objects(client, history):
                        raise RuntimeError('History timestamp already exists; retry with a new UTC timestamp')
                    if apply:
                        put_bytes(client, history, previous, asset['contentType'], large_put=large_put)
                        verify_object(client, history, previous)
                operations.extend([{'operation': 'put_latest', 'key': asset['key']},
                                   {'operation': 'verify_latest', 'key': asset['key']}])
                result['operations'] = operations
                if apply:
                    put_bytes(client, asset['key'], body, asset['contentType'], path, large_put)
                    verify_object(client, asset['key'], body)
                result['status'] = ('replaced_and_verified' if existing is not None else 'uploaded_and_verified') if apply else ('replace_planned' if existing is not None else 'upload_planned')
                result['bytes'] = len(body)
        except Exception as error:
            result.update(status='failed', error=safe_error(error, client))
        print(json.dumps(result, ensure_ascii=False), flush=True)
        results.append(result)
    count = sum(result['status'] == 'failed' for result in results)
    if count:
        raise RuntimeError(f'Publish failed for {count} of {len(results)} assets; all asset results were reported')
    return results


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
    parser.add_argument('action', choices=['preflight', 'publish', 'dry-run', 'deploy', 'status'])
    parser.add_argument('--credentials', required=True, help='Local env file; never copied')
    parser.add_argument('--email', required=True)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--dry-run', dest='apply', action='store_false', help='Plan publish operations without writes (default)')
    mode.add_argument('--apply', action='store_true', help='Apply publish operations and verify every uploaded object')
    parser.set_defaults(apply=False)
    args = parser.parse_args()
    if args.apply and args.action != 'publish':
        parser.error('--apply is only valid with publish')
    key = credential(args.credentials)
    client = Client(key, args.email)
    if args.action == 'preflight':
        preflight(client)
    elif args.action == 'publish':
        preflight(client)
        publish(client, apply=args.apply)
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
