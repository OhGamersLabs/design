"""Release version tests use temporary bytes and a fake API; no credentials or network."""
from contextlib import redirect_stdout
import hashlib
import io
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import urllib.parse

spec = importlib.util.spec_from_file_location('versioned_deployment', Path(__file__).parents[1] / 'tools/cloudflare-local.py')
deployment = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deployment)


def make_asset(root, character='bunny', version='1.1.0', filename='final.png', body=b'new final'):
    local = root / '.release' / character / version / filename
    local.parent.mkdir(parents=True, exist_ok=True)
    local.write_bytes(body)
    return {'character': character, 'version': version,
            'path': f'/media/{character}/{version}/{filename}',
            'key': f'x_ops/design/characters/{character}/releases/{version}/{filename}',
            'sha256': hashlib.sha256(body).hexdigest(), 'size': len(body), 'contentType': 'image/png'}


def catalog(*assets):
    return {'schemaVersion': 1, 'contentReady': True, 'assets': list(assets)}


class FakeR2:
    def __init__(self, pages=None, objects=None, corrupt_upload=False):
        self.pages = pages or {}
        self.objects = objects or {}
        self.calls = []
        self.corrupt_upload = corrupt_upload

    def call(self, path, method='GET', data=None, headers=None, binary=False):
        self.calls.append((path, method))
        url = urllib.parse.urlsplit(path)
        query = urllib.parse.parse_qs(url.query)
        if 'prefix' in query:
            prefix = query['prefix'][0]
            cursor = query.get('cursor', [''])[0]
            return self.pages.get((prefix, cursor), {'result': [], 'result_info': {'is_truncated': False}})
        key = urllib.parse.unquote(url.path.split('/objects/', 1)[1])
        if method == 'PUT':
            self.objects[key] = b'corrupt' if self.corrupt_upload else data
            return {'result': {'size': len(data)}}
        if binary:
            return self.objects[key]
        raise AssertionError('Unexpected API operation')


class VersionedUploadTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(prefix='design-upload-test-')
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)

    def upload(self, client, doc):
        with redirect_stdout(io.StringIO()):
            deployment.upload_release_objects(client, doc, self.root)

    def test_new_version_lists_its_own_prefix_and_all_pages_before_existing_hash_skip(self):
        asset = make_asset(self.root)
        prefix = 'x_ops/design/characters/bunny/releases/1.1.0/'
        client = FakeR2(pages={
            (prefix, ''): {'result': [], 'result_info': {'is_truncated': True, 'cursor': 'next-page'}},
            (prefix, 'next-page'): {'result': [{'key': asset['key']}], 'result_info': {'is_truncated': False}},
        }, objects={asset['key']: b'new final'})
        self.upload(client, catalog(asset))
        listing_queries = [urllib.parse.parse_qs(urllib.parse.urlsplit(path).query) for path, _ in client.calls if '?' in path]
        self.assertEqual([q['prefix'][0] for q in listing_queries], [prefix, prefix])
        self.assertEqual(listing_queries[1]['cursor'], ['next-page'])
        self.assertFalse(any(method == 'PUT' for _, method in client.calls))

    def test_each_character_group_gets_its_own_listing_and_verified_upload(self):
        bunny = make_asset(self.root)
        fox = make_asset(self.root, character='fox', version='2.0.0', body=b'fox')
        client = FakeR2()
        self.upload(client, catalog(bunny, fox))
        prefixes = [urllib.parse.parse_qs(urllib.parse.urlsplit(path).query)['prefix'][0] for path, _ in client.calls if '?' in path]
        self.assertEqual(prefixes, ['x_ops/design/characters/bunny/releases/1.1.0/', 'x_ops/design/characters/fox/releases/2.0.0/'])
        self.assertEqual(client.objects[bunny['key']], b'new final')
        self.assertEqual(client.objects[fox['key']], b'fox')
        self.assertEqual(sum(method == 'PUT' for _, method in client.calls), 2)

    def test_different_existing_bytes_stop_without_overwrite(self):
        asset = make_asset(self.root)
        prefix = 'x_ops/design/characters/bunny/releases/1.1.0/'
        client = FakeR2(pages={(prefix, ''): {'result': [{'key': asset['key']}]}}, objects={asset['key']: b'older final'})
        with self.assertRaisesRegex(RuntimeError, 'refuse overwrite'):
            self.upload(client, catalog(asset))
        self.assertFalse(any(method == 'PUT' for _, method in client.calls))

    def test_corrupt_upload_readback_stops_release(self):
        asset = make_asset(self.root)
        client = FakeR2(corrupt_upload=True)
        with self.assertRaisesRegex(RuntimeError, 'Uploaded .* mismatch'):
            self.upload(client, catalog(asset))

    def test_local_integrity_failure_occurs_before_any_api_request(self):
        asset = make_asset(self.root)
        asset['sha256'] = '0' * 64
        client = FakeR2()
        with self.assertRaisesRegex(RuntimeError, 'Local release integrity mismatch'):
            self.upload(client, catalog(asset))
        self.assertEqual(client.calls, [])

    def test_two_versions_of_one_character_cannot_enter_active_upload(self):
        old = make_asset(self.root, version='1.0.0')
        new = make_asset(self.root, version='1.1.0')
        client = FakeR2()
        with self.assertRaisesRegex(RuntimeError, 'one active version'):
            self.upload(client, catalog(old, new))
        self.assertEqual(client.calls, [])

    def test_truncated_listing_without_cursor_stops_before_upload(self):
        asset = make_asset(self.root)
        prefix = 'x_ops/design/characters/bunny/releases/1.1.0/'
        client = FakeR2(pages={(prefix, ''): {'result': [], 'result_info': {'is_truncated': True}}})
        with self.assertRaisesRegex(RuntimeError, 'pagination'):
            self.upload(client, catalog(asset))
        self.assertFalse(any(method == 'PUT' for _, method in client.calls))

    def test_repeated_pagination_cursor_stops_before_upload(self):
        asset = make_asset(self.root)
        prefix = 'x_ops/design/characters/bunny/releases/1.1.0/'
        page = {'result': [], 'result_info': {'is_truncated': True, 'cursor': 'repeat'}}
        client = FakeR2(pages={(prefix, ''): page, (prefix, 'repeat'): page})
        with self.assertRaisesRegex(RuntimeError, 'pagination'):
            self.upload(client, catalog(asset))
        self.assertFalse(any(method == 'PUT' for _, method in client.calls))


if __name__ == '__main__':
    unittest.main()
