#!/usr/bin/env python3
"""Loopback-only built-site preview with exact local release-file mappings."""
import argparse
import http.server
import json
import mimetypes
from pathlib import Path
import urllib.parse

ROOT = Path(__file__).resolve().parents[1]
STATIC = ROOT / 'docs/.vitepress/dist'
def local_media():
    # Rebuilt catalogs can add new review images while this preview stays open.
    catalog = json.loads((ROOT / 'catalog/releases.json').read_text())
    return {item['path']: ROOT / '.release' / item['character'] / item['key'].rsplit('/', 1)[1]
            for item in catalog['assets']}



class Handler(http.server.BaseHTTPRequestHandler):
    def do_HEAD(self):
        self.serve(head=True)

    def do_GET(self):
        self.serve(head=False)

    def serve(self, head):
        url = urllib.parse.urlsplit(self.path)
        if url.path == '/media' or url.path.startswith('/media/'):
            path = local_media().get(url.path) if not any(char in self.path for char in '?%\\#') else None
            if path is None or not path.is_file():
                return self.send_error(404)
        else:
            relative = urllib.parse.unquote(url.path).lstrip('/')
            if '..' in Path(relative).parts or '\\' in relative:
                return self.send_error(404)
            path = STATIC / relative
            if url.path.endswith('/'):
                path = path / 'index.html'
            elif not path.is_file():
                path = Path(str(path) + '.html')
            if not path.resolve().is_relative_to(STATIC.resolve()) or not path.is_file():
                return self.send_error(404)
        self.send_response(200)
        self.send_header('Content-Type', mimetypes.guess_type(path.name)[0] or 'application/octet-stream')
        self.send_header('Content-Length', str(path.stat().st_size))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.end_headers()
        if not head:
            with path.open('rb') as source:
                while chunk := source.read(1024 * 1024):
                    self.wfile.write(chunk)

    def log_message(self, *_):
        pass


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=4173)
    args = parser.parse_args()
    print(f'Local layout preview: http://127.0.0.1:{args.port}/characters/bunny/', flush=True)
    http.server.ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()
