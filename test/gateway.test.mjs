import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const fixture = (overrides = {}) => ({
  character: 'bunny',
  version: '1.0.0',
  path: '/media/bunny/1.0.0/final.webp',
  key: 'x_ops/design/characters/bunny/releases/1.0.0/final.webp',
  sha256: 'a'.repeat(64),
  size: 7,
  contentType: 'image/webp',
  ...overrides,
});
const catalog = (assets = [fixture()], contentReady = true) => ({ schemaVersion: 1, contentReady, assets });
const validator = async () => (await import('../worker/catalog.js')).validateCatalog;
const handler = async (doc = catalog()) => (await import('../worker/handler.js')).createHandler(doc);
const request = (path, options) => new Request(`https://design.ohgamers.org${path}`, options);

function bindings({ object, fail = false } = {}) {
  const calls = [];
  const result = object === undefined
    ? { size: 7, body: new Blob(['content']).stream(), httpMetadata: { contentType: 'text/html' } }
    : object;
  return {
    calls,
    env: {
      PUBLIC_RELEASES: {
        async get(key) { calls.push(['get', key]); if (fail) throw new Error('secret bucket diagnostic'); return result; },
        async head(key) { calls.push(['head', key]); if (fail) throw new Error('secret bucket diagnostic'); return result; },
        async list() { throw new Error('must never list'); },
        async put() { throw new Error('must never write'); },
        async delete() { throw new Error('must never delete'); },
      },
      ASSETS: { async fetch(req) { calls.push(['static', req.url]); return new Response('static asset', { status: 200 }); } },
    },
  };
}

test('valid catalog produces an exact public-path map', async () => {
  const validateCatalog = await validator();
  const map = validateCatalog(catalog());
  assert.equal(map.size, 1);
  assert.equal(map.get('/media/bunny/1.0.0/final.webp').key, 'x_ops/design/characters/bunny/releases/1.0.0/final.webp');
  assert.equal(map.has('x_ops/design/characters/bunny/releases/1.0.0/final.webp'), false);
});

test('production rejects incomplete or empty releases while development permits an empty catalog', async () => {
  const validateCatalog = await validator();
  assert.equal(validateCatalog(catalog([], false)).size, 0);
  assert.throws(() => validateCatalog(catalog([], false), { production: true }));
  assert.throws(() => validateCatalog(catalog([], true), { production: true }));
  assert.throws(() => validateCatalog(catalog([fixture()], false), { production: true }));
  assert.equal(validateCatalog(catalog(), { production: true }).size, 1);
});

test('catalog accepts a semantic version with a lowercase prerelease', async () => {
  const validateCatalog = await validator();
  assert.equal(validateCatalog(catalog([fixture({
    version: '1.0.0-rc-1',
    path: '/media/bunny/1.0.0-rc-1/final.webp',
    key: 'x_ops/design/characters/bunny/releases/1.0.0-rc-1/final.webp',
  })])).size, 1);
});

const invalidDocuments = [
  ['missing schema', { contentReady: true, assets: [] }],
  ['unknown schema', { schemaVersion: 2, contentReady: true, assets: [] }],
  ['nonboolean readiness', { schemaVersion: 1, contentReady: 'true', assets: [] }],
  ['nonarray assets', { schemaVersion: 1, contentReady: true, assets: {} }],
  ['null document', null],
  ['array document', []],
  ['null asset', catalog([null])],
];
for (const [label, doc] of invalidDocuments) {
  test(`catalog rejects ${label}`, async () => {
    const validateCatalog = await validator();
    assert.throws(() => validateCatalog(doc));
  });
}

const invalidAssets = [
  ['uppercase character', { character: 'Bunny' }],
  ['slash character', { character: 'bunny/private' }],
  ['long character', { character: 'b'.repeat(65) }],
  ['empty version', { version: '' }],
  ['nonspecific version', { version: 'latest' }],
  ['unsafe version', { version: '1.0.0/other' }],
  ['uppercase prerelease', { version: '1.0.0-RC' }],
  ['path outside media', { path: '/private/final.webp' }],
  ['different path character', { path: '/media/other/1.0.0/final.webp' }],
  ['different path version', { path: '/media/bunny/2/final.webp' }],
  ['nested filename', { path: '/media/bunny/1.0.0/sub/final.webp' }],
  ['dotdot filename', { path: '/media/bunny/1.0.0/final..webp' }],
  ['unicode filename', { path: '/media/bunny/1.0.0/终稿.webp' }],
  ['percent filename', { path: '/media/bunny/1.0.0/final%2ewebp' }],
  ['query in path', { path: '/media/bunny/1.0.0/final.webp?key=private' }],
  ['backslash path', { path: '/media/bunny/1.0.0/final\\.webp' }],
  ['key outside release', { key: 'private/final.webp' }],
  ['wrong key version', { key: 'x_ops/design/characters/bunny/releases/2/final.webp' }],
  ['different key filename', { key: 'x_ops/design/characters/bunny/releases/1.0.0/other.webp' }],
  ['short digest', { sha256: 'a'.repeat(63) }],
  ['invalid digest', { sha256: 'g'.repeat(64) }],
  ['zero size', { size: 0 }],
  ['negative size', { size: -1 }],
  ['fractional size', { size: 1.5 }],
  ['unsafe size', { size: Number.MAX_SAFE_INTEGER + 1 }],
  ['string size', { size: '7' }],
  ['html MIME', { contentType: 'text/html' }],
  ['SVG MIME', { contentType: 'image/svg+xml' }],
  ['MIME parameters', { contentType: 'image/webp; charset=utf-8' }],
  ['header-injection download name', { downloadName: 'final.pdf\r\nX-Secret: value' }],
  ['unsafe download name', { downloadName: '../final.pdf' }],
  ['line-ending character', {
    character: 'bunny\n',
    path: '/media/bunny\n/1.0.0/final.webp',
    key: 'x_ops/design/characters/bunny\n/releases/1.0.0/final.webp',
  }],
  ['line-ending version', {
    version: '1.0.0\n',
    path: '/media/bunny/1.0.0\n/final.webp',
    key: 'x_ops/design/characters/bunny/releases/1.0.0\n/final.webp',
  }],
  ['line-ending filename', {
    path: '/media/bunny/1.0.0/final.webp\n',
    key: 'x_ops/design/characters/bunny/releases/1.0.0/final.webp\n',
  }],
  ['line-ending digest', { sha256: 'a'.repeat(64) + '\n' }],
  ['line-ending download name', { downloadName: 'final.webp\n' }],
];
for (const [label, patch] of invalidAssets) {
  test(`catalog rejects ${label}`, async () => {
    const validateCatalog = await validator();
    assert.throws(() => validateCatalog(catalog([fixture(patch)])));
  });
}

test('catalog rejects duplicate paths and duplicate keys', async () => {
  const validateCatalog = await validator();
  assert.throws(() => validateCatalog(catalog([fixture(), fixture()])));
  assert.throws(() => validateCatalog(catalog([fixture(), fixture({ path: '/media/bunny/1.0.0/other.webp' })])));
});

for (const mime of ['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'application/zip']) {
  test(`catalog accepts explicitly approved MIME ${mime}`, async () => {
    assert.equal((await validator())(catalog([fixture({ contentType: mime })])).size, 1);
  });
}

test('GET reads only the mapped R2 key and derives safe headers from the release manifest', async () => {
  const { env, calls } = bindings();
  const response = await (await handler()).fetch(request('/media/bunny/1.0.0/final.webp'), env);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'content');
  assert.deepEqual(calls, [['get', 'x_ops/design/characters/bunny/releases/1.0.0/final.webp']]);
  assert.equal(response.headers.get('content-type'), 'image/webp');
  assert.equal(response.headers.get('content-length'), '7');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('cache-control'), 'public, max-age=31536000, immutable');
  assert.equal(response.headers.get('content-disposition'), 'inline; filename="final.webp"');
});

test('HEAD uses metadata lookup and never returns an object body', async () => {
  const { env, calls } = bindings();
  const response = await (await handler()).fetch(request('/media/bunny/1.0.0/final.webp', { method: 'HEAD' }), env);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), '');
  assert.equal(response.headers.get('content-length'), '7');
  assert.deepEqual(calls, [['head', 'x_ops/design/characters/bunny/releases/1.0.0/final.webp']]);
});

const blockedPaths = [
  '/media', '/media/', '/media/private-object',
  '/media/bunny/1.0.0/other.webp',
  '/media/bunny/1.0.0/final.webp?key=private',
  '/media/bunny/1.0.0/final.webp?',
  '/media/bunny/1.0.0/%66inal.webp',
  '/media/bunny/1.0.0/final%2Ewebp',
  '/media/bunny/1.0.0/%2e%2e/secret',
  '/media/bunny/1.0.0/final.webp#fragment',
  '/media/bunny/1.0.0/final\\.webp',
];
for (const path of blockedPaths) {
  test(`unlisted or ambiguous path cannot read R2: ${path}`, async () => {
    const { env, calls } = bindings();
    // Raw URL intentionally preserves ambiguous paths that Request may normalize.
    const response = await (await handler()).fetch({ url: `https://design.ohgamers.org${path}`, method: 'GET' }, env);
    assert.equal(response.status, 404);
    assert.deepEqual(calls, []);
  });
}

for (const method of ['POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']) {
  test(`media rejects ${method} without touching R2`, async () => {
    const { env, calls } = bindings();
    const response = await (await handler()).fetch(request('/media/bunny/1.0.0/final.webp', { method }), env);
    assert.equal(response.status, 405);
    assert.equal(response.headers.get('allow'), 'GET, HEAD');
    assert.deepEqual(calls, []);
  });
}

test('non-media requests are served by the static binding', async () => {
  const { env, calls } = bindings();
  const response = await (await handler()).fetch(request('/characters/bunny/shape'), env);
  assert.equal(await response.text(), 'static asset');
  assert.deepEqual(calls, [['static', 'https://design.ohgamers.org/characters/bunny/shape']]);
});

test('media-like static names do not enter the R2 gateway', async () => {
  const { env, calls } = bindings();
  assert.equal((await (await handler()).fetch(request('/media-kit'), env)).status, 200);
  assert.equal(calls[0][0], 'static');
});

for (const method of ['GET', 'HEAD']) {
  test(`missing R2 object returns 404 for ${method}`, async () => {
    const { env } = bindings({ object: null });
    const response = await (await handler()).fetch(request('/media/bunny/1.0.0/final.webp', { method }), env);
    assert.equal(response.status, 404);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    if (method === 'HEAD') assert.equal(await response.text(), '');
  });
  test(`upstream ${method} error returns 503 without diagnostics`, async () => {
    const { env } = bindings({ fail: true });
    const response = await (await handler()).fetch(request('/media/bunny/1.0.0/final.webp', { method }), env);
    assert.equal(response.status, 503);
    assert.equal((await response.text()).includes('secret'), false);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  });
  test(`wrong R2 object size returns 503 for ${method}`, async () => {
    const { env } = bindings({ object: { size: 8, body: 'wrong object' } });
    const response = await (await handler()).fetch(request('/media/bunny/1.0.0/final.webp', { method }), env);
    assert.equal(response.status, 503);
    assert.equal((await response.text()).includes('wrong object'), false);
  });
}

test('PDF displays inline with an explicit safe download filename', async () => {
  const { env } = bindings();
  const response = await (await handler(catalog([fixture({ contentType: 'application/pdf', downloadName: 'bunny-whitepaper.pdf' })]))).fetch(request('/media/bunny/1.0.0/final.webp'), env);
  assert.equal(response.headers.get('content-disposition'), 'inline; filename="bunny-whitepaper.pdf"');
});

test('ZIP is always an attachment', async () => {
  const { env } = bindings();
  const response = await (await handler(catalog([fixture({ contentType: 'application/zip' })]))).fetch(request('/media/bunny/1.0.0/final.webp'), env);
  assert.equal(response.headers.get('content-disposition'), 'attachment; filename="final.webp"');
});

test('Range requests return a complete 200 response without fabricated range headers', async () => {
  const { env, calls } = bindings();
  const response = await (await handler()).fetch(request('/media/bunny/1.0.0/final.webp', { headers: { Range: 'bytes=0-2' } }), env);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'content');
  assert.equal(response.headers.get('content-range'), null);
  assert.equal(response.headers.get('accept-ranges'), null);
  assert.deepEqual(calls, [['get', 'x_ops/design/characters/bunny/releases/1.0.0/final.webp']]);
});

test('invalid catalog prevents gateway construction', async () => {
  const createHandler = (await import('../worker/handler.js')).createHandler;
  assert.throws(() => createHandler(catalog([fixture({ key: 'private/key' })])));
});

test('mutating the source manifest after construction cannot redirect the R2 read', async () => {
  const doc = catalog();
  const gateway = await handler(doc);
  doc.assets[0].key = 'private/secret';
  const { env, calls } = bindings();
  assert.equal((await gateway.fetch(request('/media/bunny/1.0.0/final.webp'), env)).status, 200);
  assert.deepEqual(calls, [['get', 'x_ops/design/characters/bunny/releases/1.0.0/final.webp']]);
});

test('release catalog CLI succeeds for valid JSON and rejects invalid and incomplete production releases', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'design-catalog-test-'));
  try {
    const file = join(dir, 'release.json');
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
