"""Stable catalog builder: isolated real image fixtures, no production originals."""
import importlib.util
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from PIL import Image

TOOL = Path(__file__).resolve().parents[1] / 'tools/build-local-catalog.py'
spec = importlib.util.spec_from_file_location('build_local_catalog', TOOL)
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)

class CatalogBuilderTest(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.root = Path(temp.name)
        for character, slug in [('bunny', 'body-front-latest'), ('origins', 'bunny-original-latest')]:
            for base, suffix in [('docs/public/characters', '.webp'), ('.release', '.png')]:
                path = self.root/base/character/(slug+suffix)
                path.parent.mkdir(parents=True, exist_ok=True)
                with Image.new('RGB', (20, 30), 'orange') as image:
                    image.save(path)

    def test_catalog_only_contains_stable_routes_and_manifest_keeps_integrity(self):
        catalog = builder.build(self.root)
        self.assertEqual(catalog['schemaVersion'], 2)
        self.assertFalse(catalog['contentReady'])
        self.assertEqual(len(catalog['assets']), 2)
        for item in catalog['assets']:
            self.assertEqual(set(item), {'character', 'path', 'key', 'contentType'})
            slug = Path(item['path']).stem
            self.assertEqual(item['key'], f"x_ops/design/characters/{item['character']}/latest/{slug}.png")
            manifest_file = self.root/'catalog'/item['character']/'manifest.json'
            self.assertEqual(manifest_file.read_bytes(), (self.root/'docs/public/catalog'/item['character']/'manifest.json').read_bytes())
            manifest = json.loads(manifest_file.read_text())
            self.assertNotIn('downloads', manifest)
            asset = manifest['assets'][0]
            self.assertEqual(asset['original']['width'], 20)
            self.assertEqual(asset['web']['height'], 30)
            original = self.root/'.release'/item['character']/(slug+'.png')
            self.assertEqual(asset['original']['sha256'], hashlib.sha256(original.read_bytes()).hexdigest())
            self.assertEqual(asset['original']['bytes'], original.stat().st_size)
        self.assertFalse(list(self.root.rglob('*.zip')))

    def test_missing_original_does_not_partially_write_manifests(self):
        (self.root/'.release/origins/bunny-original-latest.png').unlink()
        with self.assertRaisesRegex(ValueError, 'Missing original'):
            builder.build(self.root)
        self.assertFalse((self.root/'catalog/releases.json').exists())
        self.assertFalse((self.root/'catalog/bunny/manifest.json').exists())

    def test_replacing_same_filename_refreshes_manifest_without_changing_route(self):
        first = builder.build(self.root)
        path = self.root/'.release/bunny/body-front-latest.png'
        previous = json.loads((self.root/'catalog/bunny/manifest.json').read_text())['assets'][0]['original']['sha256']
        with Image.new('RGB', (40, 60), 'blue') as image: image.save(path)
        self.assertEqual(first, builder.build(self.root))
        current = json.loads((self.root/'catalog/bunny/manifest.json').read_text())['assets'][0]['original']
        self.assertNotEqual(previous, current['sha256'])
        self.assertEqual(current['width'], 40)

    def test_old_version_directory_and_process_slug_are_rejected(self):
        for name in ['3.1.0/old.webp', 'body-v2-latest.webp', 'body-cel-latest.webp', 'body.webp']:
            with self.subTest(name=name):
                path = self.root/'docs/public/characters/bunny'/name
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(b'unused')
                with self.assertRaisesRegex(ValueError, 'Invalid stable image path'):
                    builder.build(self.root)
                path.unlink()

if __name__ == '__main__': unittest.main()
