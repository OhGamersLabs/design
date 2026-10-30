import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { validateCatalog } from '../worker/catalog.js';
import { createHandler } from '../worker/handler.js';

const fixture = (overrides = {}) => ({
  character: 'bunny',
  path: '/media/bunny/body-front-latest.png',
  key: 'x_ops/design/characters/bunny/latest/body-front-latest.png',
  contentType: 'image/png',
  ...overrides,
});
const catalog = (assets = [fixture()], contentReady = true) => ({ schemaVersion: 2, contentReady, assets });
const path = fixture().path;
const key = fixture().key;
const request = (suffix = path, options) => new Request(`https://design.ohgamers.org${suffix}`, options);
const uploaded = new Date('2026-10-31T05:06:07.000Z');
const metadata = { size: 7, httpEtag: '"current-etag"', uploaded };

function bindings({ object, fail = false } = {}) {
  const calls = [];
  const result = object === undefined
    ? { ...metadata, body: new Blob(['content']).stream(), httpMetadata: { contentType: 'text/html' } }
    : object;
  return {
    calls,
    env: {
      PUBLIC_RELEASES: {
        async get(key, options) { calls.push(['get', key, options]); if (fail) throw new Error('secret bucket diagnostic'); return result; },
        async head(key) { calls.push(['head', key]); if (fail) throw new Error('secret bucket diagnostic'); return result; },
        async list() { throw new Error('must never list'); },
        async put() { throw new Error('must never write'); },
        async delete() { throw new Error('must never delete'); },
      },
      ASSETS: { async fetch(req) { calls.push(['static', req.url]); return new Response('static asset', { status: 200 }); } },
    },
  };
}

test('v2 catalog produces an exact path map without freezing object metadata', () => {
  const map = validateCatalog(catalog());
  assert.equal(map.size, 1);
  assert.deepEqual(map.get(path), fixture());
  assert.equal(map.has(key), false);
});

test('production approval remains separate from local review', () => {
  assert.equal(validateCatalog(catalog([], false)).size, 0);
  for (const doc of [catalog([], false), catalog([], true), catalog([fixture()], false)]) {
    assert.throws(() => validateCatalog(doc, { production: true }));
  }
  assert.equal(validateCatalog(catalog(), { production: true }).size, 1);
});

for (const [label, doc] of [
  ['missing schema', { contentReady: true, assets: [] }],
  ['old schema', { schemaVersion: 1, contentReady: true, assets: [] }],
  ['nonboolean readiness', { schemaVersion: 2, contentReady: 'true', assets: [] }],
  ['nonarray assets', { schemaVersion: 2, contentReady: true, assets: {} }],
  ['null document', null], ['array document', []], ['null asset', catalog([null])],
]) {
  test(`catalog rejects ${label}`, () => assert.throws(() => validateCatalog(doc)));
}

for (const [label, patch] of [
  ['uppercase character', { character: 'Bunny' }],
  ['slash character', { character: 'bunny/private' }],
  ['long character', { character: 'b'.repeat(65) }],
  ['empty character', { character: '' }],
  ['old version metadata', { version: '1.0.0' }],
  ['frozen size metadata', { size: 7 }],
  ['frozen hash metadata', { sha256: 'a'.repeat(64) }],
  ['path outside media', { path: '/private/body-front-latest.png' }],
  ['different path character', { path: '/media/other/body-front-latest.png' }],
  ['version directory', { path: '/media/bunny/3.1.0/body-front-latest.png' }],
  ['missing latest', { path: '/media/bunny/body-front.png' }],
  ['nested filename', { path: '/media/bunny/sub/body-front-latest.png' }],
  ['dot filename', { path: '/media/bunny/body.front-latest.png' }],
  ['uppercase filename', { path: '/media/bunny/Body-front-latest.png' }],
  ['underscore filename', { path: '/media/bunny/body_front-latest.png' }],
  ['unicode filename', { path: '/media/bunny/终稿-latest.png' }],
  ['percent filename', { path: '/media/bunny/body%2dfront-latest.png' }],
  ['query in path', { path: `${path}?key=private` }],
  ['backslash path', { path: '/media/bunny/body\\front-latest.png' }],
  ['key outside latest', { key: 'private/body-front-latest.png' }],
  ['version key', { key: 'x_ops/design/characters/bunny/releases/3.1.0/body-front-latest.png' }],
  ['different key filename', { key: 'x_ops/design/characters/bunny/latest/other-latest.png' }],
  ['html MIME', { contentType: 'text/html' }],
  ['SVG MIME', { contentType: 'image/svg+xml' }],
  ['PDF MIME', { contentType: 'application/pdf' }],
  ['ZIP MIME', { contentType: 'application/zip' }],
  ['MIME parameters', { contentType: 'image/png; charset=utf-8' }],
  ['MIME extension mismatch', { contentType: 'image/jpeg' }],
  ['download filename override', { downloadName: 'other.png' }],
  ['line-ending character', { character: 'bunny\n', path: '/media/bunny\n/body-front-latest.png', key: 'x_ops/design/characters/bunny\n/latest/body-front-latest.png' }],
  ['line-ending filename', { path: path + '\n', key: key + '\n' }],
]) {
  test(`catalog rejects ${label}`, () => assert.throws(() => validateCatalog(catalog([fixture(patch)]))));
}

test('catalog rejects duplicate public identities', () => {
  assert.throws(() => validateCatalog(catalog([fixture(), fixture()])));
});
for (const [extension, contentType] of [['png', 'image/png'], ['jpg', 'image/jpeg'], ['jpeg', 'image/jpeg'], ['webp', 'image/webp']]) {
  test(`catalog accepts stable ${extension} images`, () => {
    assert.equal(validateCatalog(catalog([fixture({
      path: `/media/bunny/image-latest.${extension}`,
      key: `x_ops/design/characters/bunny/latest/image-latest.${extension}`,
      contentType,
    })])).size, 1);
  });
}

test('GET forwards conditions and serves current object metadata with a short cache', async () => {
  const { env, calls } = bindings();
  const req = request();
  const response = await createHandler(catalog()).fetch(req, env);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'content');
  assert.deepEqual(calls, [['get', key, { onlyIf: req.headers }]]);
  assert.equal(response.headers.get('content-type'), 'image/png');
  assert.equal(response.headers.get('content-length'), '7');
  assert.equal(response.headers.get('etag'), '"current-etag"');
  assert.equal(response.headers.get('last-modified'), uploaded.toUTCString());
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('cache-control'), 'public, max-age=60, must-revalidate');
  assert.equal(response.headers.get('content-disposition'), 'inline; filename="body-front-latest.png"');
});

test('HEAD uses metadata lookup and never returns an object body', async () => {
  const { env, calls } = bindings({ object: metadata });
  const response = await createHandler(catalog()).fetch(request(path, { method: 'HEAD' }), env);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '');
  assert.equal(response.headers.get('content-length'), '7');
  assert.deepEqual(calls, [['head', key]]);
});

for (const method of ['GET', 'HEAD']) {
  for (const condition of ['"current-etag"', 'W/"current-etag"', '"old-etag", "current-etag"', '*']) {
    test(`${method} matching If-None-Match ${condition} returns metadata-only 304`, async () => {
      const { env } = bindings({ object: metadata });
      const response = await createHandler(catalog()).fetch(request(path, { method, headers: { 'If-None-Match': condition } }), env);
      assert.equal(response.status, 304);
      assert.equal(await response.text(), '');
      assert.equal(response.headers.get('etag'), metadata.httpEtag);
      assert.equal(response.headers.get('last-modified'), uploaded.toUTCString());
      assert.equal(response.headers.get('cache-control'), 'public, max-age=60, must-revalidate');
    });
  }
  test(`${method} serves replaced objects with changed size instead of 503`, async () => {
    const { env } = bindings({ object: { ...metadata, size: 12, body: 'new contents', httpEtag: '"new-etag"' } });
    const response = await createHandler(catalog()).fetch(request(path, { method, headers: { 'If-None-Match': '"old-etag"' } }), env);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-length'), '12');
    assert.equal(response.headers.get('etag'), '"new-etag"');
    assert.equal(await response.text(), method === 'HEAD' ? '' : 'new contents');
  });
  test(`missing R2 object returns 404 for ${method}`, async () => {
    const { env } = bindings({ object: null });
    const response = await createHandler(catalog()).fetch(request(path, { method }), env);
    assert.equal(response.status, 404);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    if (method === 'HEAD') assert.equal(await response.text(), '');
  });
  test(`upstream ${method} error returns 503 without diagnostics`, async () => {
    const { env } = bindings({ fail: true });
    const response = await createHandler(catalog()).fetch(request(path, { method }), env);
    assert.equal(response.status, 503);
    assert.equal((await response.text()).includes('secret'), false);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  });
}

test('metadata-only conditional R2 responses honor modification dates and failed preconditions', async () => {
  for (const [headers, status] of [
    [{ 'If-Modified-Since': uploaded.toUTCString() }, 304],
    [{ 'If-Match': '"old-etag"' }, 412],
    [{ 'If-Unmodified-Since': 'Wed, 01 Jan 2020 00:00:00 GMT' }, 412],
  ]) {
    const { env } = bindings({ object: metadata });
    const response = await createHandler(catalog()).fetch(request(path, { headers }), env);
    assert.equal(response.status, status);
  }
});

test('If-None-Match takes precedence over If-Modified-Since', async () => {
  const { env } = bindings();
  const response = await createHandler(catalog()).fetch(request(path, { headers: { 'If-None-Match': '"old-etag"', 'If-Modified-Since': uploaded.toUTCString() } }), env);
  assert.equal(response.status, 200);
});

for (const blocked of [
  '/media', '/media/', '/media/private-object', '/media/bunny/other-latest.png',
  '/media/bunny/3.1.0/body-front-latest.png', `${path}?key=private`, `${path}?`,
  '/media/bunny/%62ody-front-latest.png', '/media/bunny/body-front-latest%2Epng',
  '/media/bunny/%2e%2e/secret', '/media/bunny/../body-front-latest.png', `${path}#fragment`,
  '/media/bunny/body\\front-latest.png', '/media\\bunny\\body-front-latest.png',
]) {
  test(`unlisted or ambiguous path cannot read R2: ${blocked}`, async () => {
    const { env, calls } = bindings();
    const response = await createHandler(catalog()).fetch({ url: `https://design.ohgamers.org${blocked}`, method: 'GET' }, env);
    assert.equal(response.status, 404);
    assert.deepEqual(calls, []);
  });
}
for (const method of ['POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']) {
  test(`media rejects ${method} without touching R2`, async () => {
    const { env, calls } = bindings();
    const response = await createHandler(catalog()).fetch(request(path, { method }), env);
    assert.equal(response.status, 405);
    assert.equal(response.headers.get('allow'), 'GET, HEAD');
    assert.deepEqual(calls, []);
  });
}

test('non-media and media-like static names use the static binding', async () => {
  for (const staticPath of ['/characters/bunny/shape', '/media-kit']) {
    const { env, calls } = bindings();
    assert.equal(await (await createHandler(catalog()).fetch(request(staticPath), env)).text(), 'static asset');
    assert.deepEqual(calls, [['static', `https://design.ohgamers.org${staticPath}`]]);
  }
});

test('Range requests return a complete 200 response without fabricated range headers', async () => {
  const { env, calls } = bindings();
  const req = request(path, { headers: { Range: 'bytes=0-2' } });
  const response = await createHandler(catalog()).fetch(req, env);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'content');
  assert.equal(response.headers.get('content-range'), null);
  assert.equal(response.headers.get('accept-ranges'), null);
  assert.deepEqual(calls, [['get', key, { onlyIf: req.headers }]]);
});

test('invalid catalog prevents gateway construction', () => {
  assert.throws(() => createHandler(catalog([fixture({ key: 'private/key' })])));
});

test('mutating source catalog cannot redirect reads', async () => {
  const doc = catalog();
  const gateway = createHandler(doc);
  doc.assets[0].key = 'private/secret';
  const { env, calls } = bindings();
  const req = request();
  assert.equal((await gateway.fetch(req, env)).status, 200);
  assert.deepEqual(calls, [['get', key, { onlyIf: req.headers }]]);
});

test('catalog CLI succeeds for v2 JSON and rejects invalid or unapproved production inputs', () => {
  const dir = mkdtempSync(join(tmpdir(), 'design-catalog-test-'));
  try {
    const file = join(dir, 'catalog.json');
    writeFileSync(file, JSON.stringify(catalog()));
    const valid = spawnSync(process.execPath, ['tools/release-catalog.mjs', file, '--production'], { encoding: 'utf8' });
    assert.equal(valid.status, 0, valid.stderr);
    assert.match(valid.stdout, /1/);
    writeFileSync(file, JSON.stringify(catalog([], false)));
    assert.equal(spawnSync(process.execPath, ['tools/release-catalog.mjs', file, '--production'], { encoding: 'utf8' }).status, 1);
    writeFileSync(file, '{invalid json');
    const invalid = spawnSync(process.execPath, ['tools/release-catalog.mjs', file], { encoding: 'utf8' });
    assert.equal(invalid.status, 1);
    assert.equal(invalid.stderr.includes('{invalid json'), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
