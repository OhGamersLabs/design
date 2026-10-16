import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex')
const write = async (root, relative, value) => {
  const path = join(root, relative)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, typeof value === 'object' && !Buffer.isBuffer(value) ? JSON.stringify(value) : value)
}
const readJSON = async (root, relative) => JSON.parse(await readFile(join(root, relative), 'utf8'))
const verify = async (root) => (await import('../tools/verify-release.mjs')).verifyRelease(root)

async function fixture(t, releases = [{ character: 'bunny', version: '1.1.0', count: 19 }]) {
  const root = await mkdtemp(join(tmpdir(), 'design-version-test-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const catalog = { schemaVersion: 1, contentReady: true, assets: [] }
  const manifests = []
  for (const { character, version, count } of releases) {
    const manifest = { schema_version: '1.0', character_id: character, release_version: version, asset_count: count, assets: [], downloads: [] }
    for (let i = 0; i < count; i++) {
      const original = Buffer.from(`original ${character} ${version} ${i}`)
      const web = Buffer.from(`web ${character} ${version} ${i}`)
      const path = `/media/${character}/${version}/image-${i}.png`
      const key = `x_ops/design/characters/${character}/releases/${version}/image-${i}.png`
      catalog.assets.push({ character, version, path, key, sha256: digest(original), size: original.length, contentType: 'image/png' })
      const asset = {
        id: `image-${i}`, character, version,
        original: { path, mime_type: 'image/png', bytes: original.length, sha256: digest(original) },
        web: { path: `/characters/${character}/${version}/image-${i}.webp`, mime_type: 'image/webp', bytes: web.length, sha256: digest(web) },
      }
      manifest.assets.push(asset)
      await write(root, 'docs/public' + asset.web.path, web)
    }
    const pdf = Buffer.from(`PDF ${character} ${version}`)
    const path = `/media/${character}/${version}/whitepaper.pdf`
    catalog.assets.push({ character, version, path, key: `x_ops/design/characters/${character}/releases/${version}/whitepaper.pdf`, sha256: digest(pdf), size: pdf.length, contentType: 'application/pdf' })
    manifest.downloads.push({ id: 'whitepaper', path, mime_type: 'application/pdf', bytes: pdf.length, sha256: digest(pdf) })
    await write(root, `catalog/${character}/${version}/manifest.json`, manifest)
    await write(root, `docs/public/catalog/${character}/${version}/manifest.json`, manifest)
    await write(root, `docs/characters/${character}/index.md`, '---\ntitle: Overview\nreleaseReady: true\n---\n# Final content\n')
    manifests.push(manifest)
  }
  await write(root, 'catalog/releases.json', catalog)
  return { root, catalog, manifests, async updateManifest(index = 0, publicCopy = true) {
    const manifest = manifests[index]
    await write(root, `catalog/${manifest.character_id}/${manifest.release_version}/manifest.json`, manifest)
    if (publicCopy) await write(root, `docs/public/catalog/${manifest.character_id}/${manifest.release_version}/manifest.json`, manifest)
  } }
}

test('1.1.0 verifies only its active manifest and ignores retained old release files', async (t) => {
  const { root } = await fixture(t)
  await write(root, 'catalog/bunny/1.0.0/manifest.json', { obsolete: true })
  const result = await verify(root)
  assert.equal(result.webImages, 19)
  assert.equal(result.r2Urls, 20)
  assert.deepEqual(result.releases, [{ character: 'bunny', version: '1.1.0', webImages: 19, r2Urls: 20 }])
})

test('ready 1.0.0 input remains compatible', async (t) => {
  const { root } = await fixture(t, [{ character: 'bunny', version: '1.0.0', count: 19 }])
  assert.equal((await verify(root)).webImages, 19)
})

test('a future character can have a different approved image count', async (t) => {
  const { root } = await fixture(t, [{ character: 'fox', version: '2.0.0', count: 2 }])
  assert.equal((await verify(root)).webImages, 2)
})

test('different characters can publish independent active versions', async (t) => {
  const { root } = await fixture(t, [{ character: 'bunny', version: '1.1.0', count: 19 }, { character: 'fox', version: '2.0.0', count: 2 }])
  assert.equal((await verify(root)).releases.length, 2)
})

test('the active allowlist refuses two versions of one character', async (t) => {
  const { root } = await fixture(t, [{ character: 'fox', version: '1.0.0', count: 1 }, { character: 'fox', version: '1.1.0', count: 1 }])
  await assert.rejects(() => verify(root), /one active version/i)
})

for (const [label, change] of [
  ['asset_count mismatch', (m) => { m.asset_count = 18 }],
  ['wrong manifest character', (m) => { m.character_id = 'fox' }],
  ['wrong manifest version', (m) => { m.release_version = '1.0.0' }],
  ['original hash mismatch', (m) => { m.assets[0].original.sha256 = '0'.repeat(64) }],
  ['original size mismatch', (m) => { m.assets[0].original.bytes += 1 }],
  ['original MIME mismatch', (m) => { m.assets[0].original.mime_type = 'image/jpeg' }],
  ['original from an old version', (m) => { m.assets[0].original.path = '/media/bunny/1.0.0/image-0.png' }],
  ['download from an old version', (m) => { m.downloads[0].path = '/media/bunny/1.0.0/whitepaper.pdf' }],
  ['download hash mismatch', (m) => { m.downloads[0].sha256 = '0'.repeat(64) }],
  ['download size mismatch', (m) => { m.downloads[0].bytes += 1 }],
  ['download MIME mismatch', (m) => { m.downloads[0].mime_type = 'application/zip' }],
  ['web file outside current version', (m) => { m.assets[0].web.path = '/characters/bunny/1.0.0/image-0.webp' }],
  ['web file traversal', (m) => { m.assets[0].web.path = '/characters/bunny/1.1.0/../../../private.webp' }],
  ['duplicate original', (m) => { m.assets[1].original = m.assets[0].original }],
]) {
  test(`release verification rejects ${label}`, async (t) => {
    const f = await fixture(t)
    const actualPath = 'catalog/bunny/1.1.0/manifest.json'
    change(f.manifests[0])
    // Keep identity-mismatch fixtures in the active release path.
    await write(f.root, actualPath, f.manifests[0])
    await write(f.root, 'docs/public/' + actualPath, f.manifests[0])
    await assert.rejects(() => verify(f.root))
  })
}

test('Bunny still requires exactly 19 approved images', async (t) => {
  const { root } = await fixture(t, [{ character: 'bunny', version: '1.1.0', count: 18 }])
  await assert.rejects(() => verify(root), /19/)
})

test('an active R2 allowlist object absent from the manifest is refused', async (t) => {
  const { root, catalog } = await fixture(t)
  catalog.assets.push({ ...catalog.assets[0], path: '/media/bunny/1.1.0/unlisted.png', key: 'x_ops/design/characters/bunny/releases/1.1.0/unlisted.png' })
  await write(root, 'catalog/releases.json', catalog)
  await assert.rejects(() => verify(root), /manifest/i)
})

test('modified web bytes fail hash verification', async (t) => {
  const { root } = await fixture(t)
  await write(root, 'docs/public/characters/bunny/1.1.0/image-0.webp', Buffer.from('tampered'))
  await assert.rejects(() => verify(root), /integrity/i)
})

test('the public JSON manifest must match the validated source manifest', async (t) => {
  const { root } = await fixture(t)
  const publicPath = 'docs/public/catalog/bunny/1.1.0/manifest.json'
  const publicManifest = await readJSON(root, publicPath)
  publicManifest.downloads[0].path = '/media/bunny/1.0.0/whitepaper.pdf'
  await write(root, publicPath, publicManifest)
  await assert.rejects(() => verify(root), /public manifest/i)
})

test('contentReady false continues to stop release verification', async (t) => {
  const { root, catalog } = await fixture(t)
  catalog.contentReady = false
  await write(root, 'catalog/releases.json', catalog)
  await assert.rejects(() => verify(root), /approved content/i)
})

test('frontmatter false cannot be bypassed by releaseReady true in Markdown body', async (t) => {
  const { root } = await fixture(t)
  await write(root, 'docs/characters/bunny/index.md', '---\nreleaseReady: false\n---\nreleaseReady: true\n')
  await assert.rejects(() => verify(root), /not ready/i)
})
