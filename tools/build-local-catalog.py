#!/usr/bin/env python3
"""Build stable image manifests and the exact Worker allowlist, without network access."""
import argparse
import hashlib
from io import BytesIO
import json
from pathlib import Path
import re
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SLUG = re.compile(r'[a-z0-9]+(?:-[a-z0-9]+)*-latest')
WEB_LONG_EDGE = 2048
FORBIDDEN = re.compile(r'(?:^|-)(?:v\d+|layer\d+|fresh|cel|base-aligned|highlow|only|construction)(?:-|$)')


def metadata(path, url, mime):
    with Image.open(path) as image:
        return dict(path=url, mime_type=mime, width=image.width, height=image.height,
                    bytes=path.stat().st_size, sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                    alpha='A' in image.getbands())


def refresh_web_images(root, selections):
    """Losslessly rebuild only explicitly selected existing web assets, long edge capped at WEB_LONG_EDGE."""
    pending = {}
    for selection in selections:
        parts = selection.split('/')
        if (len(parts) != 2 or not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', parts[0])
                or not SLUG.fullmatch(parts[1]) or FORBIDDEN.search(parts[1])):
            raise ValueError(f'Invalid web asset selection: {selection}')
        character, slug = parts
        web = root/'docs/public/characters'/character/(slug+'.webp')
        original = root/'.release'/character/(slug+'.png')
        if not original.is_file():
            raise ValueError(f'Missing original: {selection}')
        if not web.is_file():
            raise ValueError(f'Missing existing web asset: {selection}')
        with Image.open(original) as image:
            mode = 'RGBA' if 'A' in image.getbands() or 'transparency' in image.info else 'RGB'
            with image.convert(mode) as pixels:
                if max(pixels.size) > WEB_LONG_EDGE:
                    scale = WEB_LONG_EDGE / max(pixels.size)
                    size = tuple(max(1, round(side * scale)) for side in pixels.size)
                    pixels = pixels.resize(size, Image.LANCZOS)
                output = BytesIO()
                pixels.save(output, 'WEBP', lossless=True, method=6, exact=True)
                pending[web] = output.getvalue()
    # Preflight every selection before changing any web asset; originals are read-only.
    for path, data in pending.items():
        path.write_bytes(data)
    if pending:
        print(f'Web images: {len(pending)} selected lossless conversions')


def build(root=ROOT, refresh_web=None):
    root = Path(root)
    if refresh_web:
        refresh_web_images(root, refresh_web)
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
    parser.add_argument('--refresh-web', nargs='+', metavar='CHARACTER/SLUG',
                        help='Losslessly rebuild only these existing WebPs from their PNG originals (long edge at most 2048 px)')
    args = parser.parse_args()
    build(args.root, refresh_web=args.refresh_web)


if __name__ == '__main__':
    main()
