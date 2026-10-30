"""Thumbnail contracts, using isolated synthetic manifests and images only."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
TOOL = ROOT / 'tools/build-thumbs.py'


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def object_value(value: object) -> dict[str, object]:
    if not isinstance(value, dict) or not all(isinstance(key, str) for key in value):
        raise ValueError('expected a JSON object')
    return {key: item for key, item in value.items() if isinstance(key, str)}


class BuildThumbsTest(unittest.TestCase):
    def setUp(self) -> None:
        temporary = tempfile.TemporaryDirectory(prefix='.thumbs-test-', dir=ROOT)
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        self.public = self.root / 'docs/public'
        self.thumbs = self.public / 'site/thumbs'
        self.index_path = self.thumbs / 'index.json'
        self.sources: dict[str, Path] = {}
        fixtures = {
            'bunny': [('portrait', (1024, 1536), False),
                                ('wide', (1774, 887), False)],
            'origins': [('narrow', (120, 180), True)],
        }
        for character, images in fixtures.items():
            assets: list[dict[str, object]] = []
            for asset_id, size, alpha in images:
                asset_id += "-latest"
                key = f'{character}/{asset_id}'
                source_path = f'/characters/{key}.webp'
                source = self.public / source_path.lstrip('/')
                source.parent.mkdir(parents=True, exist_ok=True)
                image = Image.new('RGBA' if alpha else 'RGB', size,
                                  (20, 100, 220, 128) if alpha else (20, 100, 220))
                image.save(source, 'WEBP', lossless=True)
                image.close()
                self.sources[key] = source
                assets.append({
                    'id': asset_id, 'character': character,
                    'web': {'path': source_path, 'width': size[0], 'height': size[1],
                            'sha256': sha256(source)},
                })
            manifest = self.root / f'catalog/{character}/manifest.json'
            manifest.parent.mkdir(parents=True, exist_ok=True)
            manifest.write_text(json.dumps({
                'character_id': character,
                'assets': assets,
            }), encoding='utf-8')

    def run_builder(self, *arguments: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(TOOL), '--root', str(self.root), *arguments],
            cwd=self.root, capture_output=True, text=True, check=False)

    def build(self) -> None:
        result = self.run_builder()
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def read_index(self) -> dict[str, dict[str, object]]:
        value: object = json.loads(self.index_path.read_text(encoding='utf-8'))
        return {key: object_value(entry) for key, entry in object_value(value).items()}

    def write_index(self, index: dict[str, dict[str, object]]) -> None:
        self.index_path.write_text(json.dumps(index), encoding='utf-8')

    def check_failure_without_writes(self) -> None:
        before = {path.relative_to(self.root): path.read_bytes()
                  for path in self.root.rglob('*') if path.is_file()}
        result = self.run_builder('--check')
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        after = {path.relative_to(self.root): path.read_bytes()
                 for path in self.root.rglob('*') if path.is_file()}
        self.assertEqual(after, before, '--check must not modify the fixture')

    def test_resizes_portrait_and_wide_sources_to_480(self) -> None:
        self.build()
        for asset_id, expected in [('portrait', (480, 720)), ('wide', (480, 240))]:
            with self.subTest(asset_id=asset_id):
                with Image.open(self.thumbs / f'bunny/{asset_id}-latest.webp') as image:
                    self.assertEqual(image.size, expected)

    def test_narrow_source_is_not_upscaled_and_keeps_alpha(self) -> None:
        self.build()
        with Image.open(self.thumbs / 'origins/narrow-latest.webp') as image:
            self.assertEqual(image.size, (120, 180))
            self.assertIn('A', image.getbands())
            self.assertEqual(image.getchannel('A').getextrema(), (128, 128))

    def test_index_has_exact_paths_dimensions_and_hashes_for_both_manifests(self) -> None:
        self.build()
        expected: dict[str, dict[str, object]] = {}
        for key, source in self.sources.items():
            thumbnail = self.thumbs / f'{key}.webp'
            with Image.open(thumbnail) as image:
                width, height = image.size
            expected[key] = {
                'path': f'/site/thumbs/{key}.webp', 'width': width, 'height': height,
                'sha256': sha256(thumbnail),
                'sourcePath': '/' + source.relative_to(self.public).as_posix(),
                'sourceSha256': sha256(source),
            }
        self.assertEqual(self.read_index(), expected)
        result = self.run_builder('--check')
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_check_rejects_stale_index(self) -> None:
        self.build()
        original = self.read_index()
        key = 'bunny/portrait-latest'
        for field, value in [('width', 479), ('sourceSha256', '0' * 64),
                             ('sourcePath', '/characters/old.webp')]:
            with self.subTest(field=field):
                index = {name: dict(entry) for name, entry in original.items()}
                index[key][field] = value
                self.write_index(index)
                self.check_failure_without_writes()
        self.write_index(original)
        # A changed source makes an otherwise unchanged index stale too.
        with Image.new('RGB', (1024, 1536), (220, 100, 20)) as image:
            image.save(self.sources[key], 'WEBP', lossless=True)
        self.check_failure_without_writes()

    def test_check_rejects_modified_thumbnail(self) -> None:
        self.build()
        key = 'bunny/portrait-latest'
        thumbnail = self.thumbs / f'{key}.webp'
        with Image.new('RGB', (480, 720), (220, 100, 20)) as image:
            image.save(thumbnail, 'WEBP', quality=82, method=6)
        self.check_failure_without_writes()
        # Updating the index hash cannot disguise an edited thumbnail.
        index = self.read_index()
        index[key]['sha256'] = sha256(thumbnail)
        self.write_index(index)
        self.check_failure_without_writes()

    def test_check_rejects_missing_thumbnail(self) -> None:
        self.build()
        (self.thumbs / 'bunny/portrait-latest.webp').unlink()
        self.check_failure_without_writes()

    def test_check_rejects_extra_thumbnail(self) -> None:
        self.build()
        extra = self.thumbs / 'bunny/extra.webp'
        extra.write_bytes((self.thumbs / 'bunny/portrait-latest.webp').read_bytes())
        self.check_failure_without_writes()


if __name__ == '__main__':
    unittest.main()
