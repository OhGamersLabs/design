"""Stable-image publishing tests use temporary bytes and a fake API; no credentials/network."""
from contextlib import redirect_stdout
from datetime import datetime, timezone
import hashlib
import io
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import urllib.parse

spec = importlib.util.spec_from_file_location('stable_deployment', Path(__file__).parents[1] / 'tools/cloudflare-local.py')
deployment = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deployment)

NOW = datetime(2026, 10, 31, 9, 8, 7, tzinfo=timezone.utc)


def make_asset(root, character='bunny', slug='body-front-latest', body=b'new final'):
    local = root / '.release' / character / f'{slug}.png'
    local.parent.mkdir(parents=True, exist_ok=True)
    local.write_bytes(body)
    asset = {'character': character, 'path': f'/media/{character}/{slug}.png',
             'key': f'x_ops/design/characters/{character}/latest/{slug}.png', 'contentType': 'image/png'}
    manifest_path = root / 'catalog' / character / 'manifest.json'
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {
        'schema_version': '2.0', 'character_id': character, 'assets': []}
    manifest['assets'].append({'id': slug, 'character': character, 'original': {
        'path': asset['path'], 'mime_type': 'image/png', 'width': 1, 'height': 1,
        'bytes': len(body), 'sha256': hashlib.sha256(body).hexdigest()}})
    manifest['asset_count'] = len(manifest['assets'])
    manifest_path.write_text(json.dumps(manifest))
    return asset


def catalog(*assets):
    return {'schemaVersion': 2, 'contentReady': False, 'assets': list(assets)}


def page(*assets, cursor=None):
    return {'result': list(assets), 'result_info': {'is_truncated': cursor is not None, 'cursor': cursor}}


class FakeR2:
    def __init__(self, pages=None, objects=None, corrupt_keys=None, fail_keys=None):
        self.pages = pages or {}
        self.objects = dict(objects or {})
        self.calls = []
        self.corrupt_keys = set(corrupt_keys or [])
        self.fail_keys = set(fail_keys or [])
        self.key = 'fake-key-never-print'
        self.email = 'fake@example.invalid'

    def call(self, path, method='GET', data=None, headers=None, binary=False):
        self.calls.append((path, method))
        url = urllib.parse.urlsplit(path)
        query = urllib.parse.parse_qs(url.query)
        if 'prefix' in query:
            prefix = query['prefix'][0]
            cursor = query.get('cursor', [''])[0]
            default = page(*({'key': key, 'etag': hashlib.md5(body).hexdigest()}
                             for key, body in self.objects.items() if key.startswith(prefix)))
            return self.pages.get((prefix, cursor), default)
        key = urllib.parse.unquote(url.path.split('/objects/', 1)[1])
        if method == 'PUT':
            if key in self.fail_keys:
                raise RuntimeError('Injected failure: ' + self.key)
            self.objects[key] = b'corrupt' if key in self.corrupt_keys else data
            return {'result': {'size': len(data)}}
        if binary:
            return self.objects[key]
        raise AssertionError('Unexpected API operation')

    def puts(self):
        return [urllib.parse.unquote(urllib.parse.urlsplit(path).path.split('/objects/', 1)[1])
                for path, method in self.calls if method == 'PUT']

    def downloads(self):
        return [path for path, method in self.calls if method == 'GET' and '/objects/' in path]


class StablePublishTest(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory(prefix='design-publish-test-')
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        self.output = io.StringIO()

    def publish(self, client, doc, **options):
        with redirect_stdout(self.output):
            return deployment.publish(client, doc, root=self.root, clock=lambda: NOW, **options)

    def results(self):
        return [json.loads(line) for line in self.output.getvalue().splitlines()]

    def history_key(self, slug='body-front'):
        return f'x_ops/design/characters/bunny/history/{slug}-20261031T090807Z.png'

    def test_missing_defaults_to_json_plan_without_writes_and_allows_review_content(self):
        asset = make_asset(self.root)
        client = FakeR2()
        self.publish(client, catalog(asset))
        self.assertEqual(client.puts(), [])
        self.assertEqual(self.results()[0]['status'], 'upload_planned')
        self.assertEqual(self.results()[0]['mode'], 'dry-run')
        self.assertEqual([op['operation'] for op in self.results()[0]['operations']], ['put_latest', 'verify_latest'])

    def test_missing_apply_uploads_and_verifies_each_character(self):
        bunny = make_asset(self.root)
        fox = make_asset(self.root, character='fox', body=b'fox')
        client = FakeR2()
        self.publish(client, catalog(bunny, fox), apply=True)
        prefixes = [urllib.parse.parse_qs(urllib.parse.urlsplit(path).query)['prefix'][0]
                    for path, _ in client.calls if '?' in path]
        self.assertEqual(prefixes, ['x_ops/design/characters/bunny/latest/', 'x_ops/design/characters/fox/latest/'])
        self.assertEqual(client.objects[bunny['key']], b'new final')
        self.assertEqual(client.objects[fox['key']], b'fox')
        self.assertEqual(len(client.downloads()), 2)
        self.assertEqual([item['status'] for item in self.results()], ['uploaded_and_verified'] * 2)

    def test_identical_plain_md5_skips_download_and_put(self):
        asset = make_asset(self.root)
        client = FakeR2(objects={asset['key']: b'new final'})
        self.publish(client, catalog(asset), apply=True)
        self.assertEqual(client.puts(), [])
        self.assertEqual(client.downloads(), [])
        self.assertEqual(self.results()[0]['status'], 'identical_skipped')

    def test_non_md5_or_quoted_etag_falls_back_to_download_sha256(self):
        asset = make_asset(self.root)
        prefix = 'x_ops/design/characters/bunny/latest/'
        for etag in [None, 'multipart-etag-2', '"' + hashlib.md5(b'new final').hexdigest() + '"']:
            with self.subTest(etag=etag):
                client = FakeR2(pages={(prefix, ''): page({'key': asset['key'], 'etag': etag})},
                                objects={asset['key']: b'new final'})
                self.publish(client, catalog(asset), apply=True)
                self.assertEqual(client.puts(), [])
                self.assertEqual(len(client.downloads()), 1)

    def test_all_listing_pages_precede_processing(self):
        asset = make_asset(self.root)
        prefix = 'x_ops/design/characters/bunny/latest/'
        client = FakeR2(pages={
            (prefix, ''): page(cursor='next-page'),
            (prefix, 'next-page'): page({'key': asset['key'], 'etag': 'not-md5'}),
        }, objects={asset['key']: b'new final'})
        self.publish(client, catalog(asset), apply=True)
        queries = [urllib.parse.parse_qs(urllib.parse.urlsplit(path).query)
                   for path, _ in client.calls if '?' in path]
        self.assertEqual([q['prefix'][0] for q in queries], [prefix, prefix])
        self.assertEqual(queries[1]['cursor'], ['next-page'])
        self.assertEqual(client.puts(), [])

    def test_different_object_backs_up_and_verifies_before_replacing(self):
        asset = make_asset(self.root)
        client = FakeR2(objects={asset['key']: b'old final'})
        self.publish(client, catalog(asset), apply=True)
        history = self.history_key()
        self.assertEqual(client.puts(), [history, asset['key']])
        self.assertEqual(client.objects[history], b'old final')
        self.assertEqual(client.objects[asset['key']], b'new final')
        self.assertEqual([(path.rsplit('/', 1)[1], method) for path, method in client.calls if '/objects/' in path], [
            ('body-front-latest.png', 'GET'), ('body-front-20261031T090807Z.png', 'PUT'),
            ('body-front-20261031T090807Z.png', 'GET'), ('body-front-latest.png', 'PUT'),
            ('body-front-latest.png', 'GET')])
        self.assertEqual(self.results()[0]['status'], 'replaced_and_verified')

    def test_different_dry_run_prints_backup_and_replace_plan_without_put(self):
        asset = make_asset(self.root)
        client = FakeR2(objects={asset['key']: b'old final'})
        self.publish(client, catalog(asset))
        self.assertEqual(client.puts(), [])
        self.assertEqual(self.results()[0]['status'], 'replace_planned')
        self.assertEqual([item['operation'] for item in self.results()[0]['operations']],
                         ['put_history', 'verify_history', 'put_latest', 'verify_latest'])

    def test_history_copy_failure_preserves_latest_and_reports_other_asset(self):
        old = make_asset(self.root)
        other = make_asset(self.root, slug='head-reference-latest', body=b'head')
        client = FakeR2(objects={old['key']: b'old final'}, fail_keys={self.history_key()})
        with self.assertRaisesRegex(RuntimeError, '1 of 2 assets'):
            self.publish(client, catalog(old, other), apply=True)
        self.assertEqual(client.objects[old['key']], b'old final')
        self.assertEqual(client.objects[other['key']], b'head')
        self.assertEqual([item['status'] for item in self.results()], ['failed', 'uploaded_and_verified'])
        self.assertNotIn(client.key, self.output.getvalue())

    def test_occupied_history_timestamp_is_not_overwritten(self):
        asset = make_asset(self.root)
        history = self.history_key()
        client = FakeR2(objects={asset['key']: b'old final', history: b'earlier saved final'})
        with self.assertRaisesRegex(RuntimeError, '1 of 1 assets'):
            self.publish(client, catalog(asset), apply=True)
        self.assertEqual(client.puts(), [])
        self.assertEqual(client.objects[history], b'earlier saved final')
        self.assertEqual(client.objects[asset['key']], b'old final')
        self.assertIn('History timestamp already exists', self.results()[0]['error'])

    def test_corrupt_history_readback_blocks_latest_replacement(self):
        asset = make_asset(self.root)
        client = FakeR2(objects={asset['key']: b'old final'}, corrupt_keys={self.history_key()})
        with self.assertRaisesRegex(RuntimeError, '1 of 1 assets'):
            self.publish(client, catalog(asset), apply=True)
        self.assertEqual(client.objects[asset['key']], b'old final')
        self.assertEqual(client.puts(), [self.history_key()])
        self.assertIn('readback hash or size mismatch', self.results()[0]['error'])

    def test_corrupt_latest_readback_fails_but_reports_next_asset(self):
        bad = make_asset(self.root)
        good = make_asset(self.root, slug='body-side-latest', body=b'side')
        client = FakeR2(corrupt_keys={bad['key']})
        with self.assertRaisesRegex(RuntimeError, '1 of 2 assets'):
            self.publish(client, catalog(bad, good), apply=True)
        self.assertEqual([item['status'] for item in self.results()], ['failed', 'uploaded_and_verified'])

    def test_local_missing_or_changed_bytes_report_all_without_remote_access(self):
        bad = make_asset(self.root)
        missing = make_asset(self.root, slug='body-side-latest')
        (self.root / '.release/bunny/body-front-latest.png').write_bytes(b'changed')
        (self.root / '.release/bunny/body-side-latest.png').unlink()
        client = FakeR2()
        with self.assertRaisesRegex(RuntimeError, '2 of 2 assets'):
            self.publish(client, catalog(bad, missing), apply=True)
        self.assertEqual(client.calls, [])
        self.assertEqual(len(self.results()), 2)
        self.assertEqual([item['status'] for item in self.results()], ['failed', 'failed'])

    def test_local_failure_does_not_hide_valid_asset_status(self):
        bad = make_asset(self.root)
        good = make_asset(self.root, slug='body-side-latest', body=b'side')
        (self.root / '.release/bunny/body-front-latest.png').write_bytes(b'changed')
        client = FakeR2()
        with self.assertRaisesRegex(RuntimeError, '1 of 2 assets'):
            self.publish(client, catalog(bad, good), apply=True)
        self.assertEqual([item['status'] for item in self.results()], ['failed', 'uploaded_and_verified'])
        self.assertEqual(client.puts(), [good['key']])

    def test_manifest_membership_must_match_catalog(self):
        asset = make_asset(self.root)
        make_asset(self.root, slug='body-side-latest')
        client = FakeR2()
        with self.assertRaisesRegex(RuntimeError, '1 of 1 assets'):
            self.publish(client, catalog(asset))
        self.assertEqual(client.calls, [])
        self.assertIn('membership differ', self.results()[0]['error'])

    def test_v1_duplicate_unsafe_and_integrity_metadata_catalogs_are_rejected(self):
        asset = make_asset(self.root)
        invalid = [dict(catalog(asset), schemaVersion=1), catalog(asset, asset),
                   catalog(dict(asset, path='/media/bunny/1.0.0/body-front-latest.png')),
                   catalog(dict(asset, key=asset['key'].replace('/latest/', '/history/'))),
                   catalog(dict(asset, path='/media/bunny/body-front.png')),
                   catalog(dict(asset, contentType='application/zip')),
                   catalog(dict(asset, size=9)), catalog(dict(asset, sha256='0' * 64)),
                   catalog(dict(asset, path='/media/bunny/a%2flatest.png'))]
        for doc in invalid:
            with self.subTest(doc=doc):
                client = FakeR2()
                with self.assertRaises(RuntimeError):
                    self.publish(client, doc)
                self.assertEqual(client.calls, [])

    def test_bad_pagination_reports_each_asset_without_put(self):
        first = make_asset(self.root)
        second = make_asset(self.root, slug='body-side-latest')
        prefix = 'x_ops/design/characters/bunny/latest/'
        cases = [
            {(prefix, ''): {'result': [], 'result_info': {'is_truncated': True}}},
            {(prefix, ''): page(cursor='repeat'), (prefix, 'repeat'): page(cursor='repeat')},
            {(prefix, ''): page({'key': 'x_ops/design/characters/bunny/history/wrong.png'})},
        ]
        for pages in cases:
            with self.subTest(pages=pages):
                self.output = io.StringIO()
                client = FakeR2(pages=pages)
                with self.assertRaisesRegex(RuntimeError, '2 of 2 assets'):
                    self.publish(client, catalog(first, second), apply=True)
                self.assertEqual(client.puts(), [])
                self.assertEqual(len(self.results()), 2)

    def test_large_latest_and_history_use_injected_remote_writer_and_readback(self):
        asset = make_asset(self.root, body=b'new large final')
        client = FakeR2(objects={asset['key']: b'old large final'})
        writes = []

        def large_put(path, key, content_type):
            writes.append((key, content_type))
            client.objects[key] = Path(path).read_bytes()

        with patch.object(deployment, 'LARGE_OBJECT_BYTES', 5):
            self.publish(client, catalog(asset), apply=True, large_put=large_put)
        self.assertEqual(writes, [(self.history_key(), 'image/png'), (asset['key'], 'image/png')])
        self.assertEqual(client.puts(), [])
        self.assertEqual(client.objects[asset['key']], b'new large final')
        self.assertEqual(len(client.downloads()), 3)

    def test_large_object_default_writer_uses_wrangler_remote_flag(self):
        client = FakeR2()
        captured = []

        def fake_wrangler(key, email, args):
            captured.append((key, email, args))
            self.assertEqual(Path(args[args.index('--file') + 1]).read_bytes(), b'large bytes')

        with patch.object(deployment, 'LARGE_OBJECT_BYTES', 1), patch.object(deployment, 'wrangler', fake_wrangler):
            deployment.put_bytes(client, 'prefix/image-latest.png', b'large bytes', 'image/png')
        self.assertEqual(captured[0][:2], (client.key, client.email))
        self.assertIn('--remote', captured[0][2])
        self.assertEqual(captured[0][2][:4], ['r2', 'object', 'put', 'ohgamers/prefix/image-latest.png'])
        self.assertEqual(client.calls, [])


if __name__ == '__main__':
    unittest.main()
