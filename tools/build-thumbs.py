#!/usr/bin/env python3
"""Build or verify stable thumbnails from the current character manifests."""
from __future__ import annotations

import argparse
from dataclasses import dataclass
import hashlib
from io import BytesIO
import json
from pathlib import Path, PurePosixPath
import re
import sys
from typing import TypedDict

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]


class Thumbnail(TypedDict):
    path: str
    width: int
    height: int
    sha256: str
    sourcePath: str
    sourceSha256: str


@dataclass(frozen=True)
class Asset:
    key: str
    source_path: str
    source_file: Path
    source_sha256: str
    width: int
    height: int


def object_value(value: object, label: str) -> dict[str, object]:
    if not isinstance(value, dict) or not all(isinstance(key, str) for key in value):
        raise ValueError(f'{label}: expected a JSON object')
    return {key: item for key, item in value.items() if isinstance(key, str)}


def string_value(value: object, label: str) -> str:
    if not isinstance(value, str) or not value:
        raise ValueError(f'{label}: expected a nonempty string')
    return value


def positive_integer(value: object, label: str) -> int:
    if not isinstance(value, int) or isinstance(value, bool) or value < 1:
        raise ValueError(f'{label}: expected a positive integer')
    return value


def read_json(path: Path) -> object:
    value: object = json.loads(path.read_text(encoding='utf-8'))
    return value


def public_file(public: Path, url: str) -> Path:
    parts = PurePosixPath(url)
    if not url.startswith('/') or url.startswith('//') or '..' in parts.parts:
        raise ValueError(f'Invalid public asset path: {url}')
    path = public.joinpath(*parts.parts[1:])
    if not path.resolve().is_relative_to(public.resolve()):
        raise ValueError(f'Public asset path escapes the root: {url}')
    return path


def load_assets(root: Path) -> list[Asset]:
    public = root / 'docs/public'
    result: list[Asset] = []
    seen: set[str] = set()
    for manifest_path in sorted((root / 'catalog').glob('*/manifest.json')):
        character = manifest_path.parent.name
        manifest = object_value(read_json(manifest_path), str(manifest_path))
        entries = manifest.get('assets')
        if not isinstance(entries, list):
            raise ValueError(f'{manifest_path}: expected an assets array')
        checked_entries: list[object] = list(entries)
        for raw in checked_entries:
            asset = object_value(raw, str(manifest_path))
            asset_id = string_value(asset.get('id'), 'asset.id')
            if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*-latest', asset_id):
                raise ValueError(f'Invalid asset id: {asset_id}')
            key = f'{character}/{asset_id}'
            if key in seen:
                raise ValueError(f'Duplicate asset: {key}')
            seen.add(key)
            if asset.get('character') != character:
                raise ValueError(f'{key}: asset collection does not match its manifest')
            web = object_value(asset.get('web'), f'{key}.web')
            source_path = string_value(web.get('path'), f'{key}.web.path')
            result.append(Asset(
                key=key, source_path=source_path,
                source_file=public_file(public, source_path),
                source_sha256=string_value(web.get('sha256'), f'{key}.web.sha256'),
                width=positive_integer(web.get('width'), f'{key}.web.width'),
                height=positive_integer(web.get('height'), f'{key}.web.height'),
            ))
    return sorted(result, key=lambda asset: asset.key)


def render_thumbnail(asset: Asset) -> tuple[Thumbnail, bytes]:
    source_bytes = asset.source_file.read_bytes()
    source_sha256 = hashlib.sha256(source_bytes).hexdigest()
    if source_sha256 != asset.source_sha256:
        raise ValueError(f'{asset.key}: source sha256 differs from the manifest')
    with Image.open(BytesIO(source_bytes)) as source:
        if source.size != (asset.width, asset.height):
            raise ValueError(f'{asset.key}: source dimensions differ from the manifest')
        width = min(source.width, 480)
        height = round(source.height * width / source.width)
        mode = 'RGBA' if 'A' in source.getbands() or 'transparency' in source.info else 'RGB'
        with source.convert(mode) as converted:
            with converted.resize((width, height), Image.Resampling.LANCZOS) as thumbnail:
                output = BytesIO()
                thumbnail.save(output, 'WEBP', quality=82, method=6)
                data = output.getvalue()
    entry: Thumbnail = {
        'path': f'/site/thumbs/{asset.key}.webp',
        'width': width,
        'height': height,
        'sha256': hashlib.sha256(data).hexdigest(),
        'sourcePath': asset.source_path,
        'sourceSha256': source_sha256,
    }
    return entry, data


def build(root: Path, check: bool) -> int:
    public = root / 'docs/public'
    thumbs = public / 'site/thumbs'
    index_path = thumbs / 'index.json'
    index: dict[str, Thumbnail] = {}
    outputs: dict[Path, bytes] = {}
    # Render before writing, so a bad manifest/source cannot leave partial output.
    # Verification uses the same in-memory bytes without touching the filesystem.
    for asset in load_assets(root):
        entry, data = render_thumbnail(asset)
        index[asset.key] = entry
        outputs[public_file(public, entry['path'])] = data

    if check:
        errors: list[str] = []
        try:
            if read_json(index_path) != index:
                errors.append('stale thumbnail index')
        except (OSError, ValueError) as error:
            errors.append(f'missing or invalid thumbnail index: {error}')
        actual = {path for path in thumbs.rglob('*')
                  if path.is_file() and path != index_path}
        expected = set(outputs)
        for path in sorted(expected - actual):
            errors.append(f'missing thumbnail: {path.relative_to(public)}')
        for path in sorted(actual - expected):
            errors.append(f'extra thumbnail: {path.relative_to(public)}')
        for path in sorted(expected & actual):
            if path.read_bytes() != outputs[path]:
                errors.append(f'edited thumbnail: {path.relative_to(public)}')
        if errors:
            for error in errors:
                print(f'Thumbnails: {error}', file=sys.stderr)
            return 1
        print(f'Thumbnails valid: {len(index)} files.')
        return 0

    for path, data in outputs.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        if not path.exists() or path.read_bytes() != data:
            path.write_bytes(data)
    for stale in thumbs.rglob('*.webp'):
        if stale not in outputs:
            stale.unlink()
    for directory in sorted(thumbs.rglob('*'), reverse=True):
        if directory.is_dir() and not any(directory.iterdir()):
            directory.rmdir()
    thumbs.mkdir(parents=True, exist_ok=True)
    index_text = json.dumps(index, ensure_ascii=False, indent=2) + '\n'
    if not index_path.exists() or index_path.read_text(encoding='utf-8') != index_text:
        index_path.write_text(index_text, encoding='utf-8')
    print(f'Thumbnails: {len(index)} files.')
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT,
                        help='repository or fixture root (default: this repository)')
    parser.add_argument('--check', action='store_true',
                        help='verify the index and all thumbnails without writing')
    args = parser.parse_args(argv)
    root: Path = args.root
    root = root.resolve()
    check: bool = args.check
    try:
        return build(root, check)
    except (OSError, ValueError) as error:
        print(f'Thumbnails: {error}', file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
