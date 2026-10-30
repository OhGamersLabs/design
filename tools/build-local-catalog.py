#!/usr/bin/env python3
"""Build stable image manifests and the exact Worker allowlist, without network access."""
import argparse
import hashlib
import json
from pathlib import Path
import re
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SLUG = re.compile(r'[a-z0-9]+(?:-[a-z0-9]+)*-latest')
FORBIDDEN = re.compile(r'(?:^|-)(?:v\d+|layer\d+|fresh|cel|base-aligned|highlow|only|construction)(?:-|$)')


def metadata(path, url, mime):
    with Image.open(path) as image:
        return dict(path=url, mime_type=mime, width=image.width, height=image.height,
                    bytes=path.stat().st_size, sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                    alpha='A' in image.getbands())


def build(root=ROOT):
    root = Path(root)
    catalog = dict(schemaVersion=2, contentReady=False, assets=[])
    outputs = {}
    for directory in sorted((root/'docs/public/characters').iterdir()):
        if not directory.is_dir():
            continue
        character = directory.name
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', character):
            raise ValueError(f'Invalid character: {character}')
        files = sorted(directory.rglob('*.webp'))
        if not files:
            continue
        manifest = dict(schema_version='2.0', character_id=character, language='zh-CN',
                        title='Bunny 设计参考' if character == 'bunny' else '角色原始手稿',
                        status='local-review', asset_count=len(files), assets=[])
        for web in files:
            slug = web.stem
            if web.parent != directory or not SLUG.fullmatch(slug) or FORBIDDEN.search(slug):
                raise ValueError(f'Invalid stable image path: {web.relative_to(root)}')
            original = root/'.release'/character/(slug+'.png')
            if not original.is_file():
                raise ValueError(f'Missing original: {original}')
            png = metadata(original, f'/media/{character}/{slug}.png', 'image/png')
            derived = metadata(web, f'/characters/{character}/{slug}.webp', 'image/webp')
            manifest['assets'].append(dict(id=slug, character=character, title=slug, original=png, web=derived))
            catalog['assets'].append(dict(character=character, path=png['path'],
                key=f'x_ops/design/characters/{character}/latest/{slug}.png', contentType='image/png'))
        for base in ['catalog', 'docs/public/catalog']:
            outputs[root/base/character/'manifest.json'] = manifest
    if not catalog['assets']:
        raise ValueError('No current images found')
    outputs[root/'catalog/releases.json'] = catalog
    # Finish validation before writing any manifest.
    for path, document in outputs.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(document, ensure_ascii=False, indent=2)+'\n')
    print(f"Catalog: {len(catalog['assets'])} exact files")
    return catalog


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT)
    args = parser.parse_args()
    build(args.root)


if __name__ == '__main__':
    main()
