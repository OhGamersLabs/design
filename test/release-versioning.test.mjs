import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { verifyRelease } from '../tools/verify-release.mjs'

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex')
const write = async (root, relative, value) => {
  const path = join(root, relative)
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, typeof value === 'object' && !Buffer.isBuffer(value) ? JSON.stringify(value) : value)
}
const readJSON = async (root, relative) => JSON.parse(await readFile(join(root, relative), 'utf8'))
const verify = (root) => verifyRelease(root, { verifyOriginals: true })
const originalBytes = (character, index) => Buffer.from(`original ${character} ${index}`)

async function fixture(t, characters = [{ character: 'bunny', count: 2 }]) {
  const root = await mkdtemp(join(tmpdir(), 'design-latest-test-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const catalog = { schemaVersion: 2, contentReady: true, assets: [] }
  const manifests = []
  for (const { character, count } of characters) {
    const manifest = { schema_version: '2.0', character_id: character, asset_count: count, assets: [] }
    for (let i = 0; i < count; i++) {
      const id = `image-${i}-latest`
      const original = originalBytes(character, i)
      const web = Buffer.from(`web ${character} ${i}`)
      const path = `/media/${character}/${id}.png`
      const key = `x_ops/design/characters/${character}/latest/${id}.png`
      catalog.assets.push({ character, path, key, contentType: 'image/png' })
      const asset = {
        id, character,
        original: { path, mime_type: 'image/png', width: 400, height: 600, bytes: original.length, sha256: digest(original) },
        web: { path: `/characters/${character}/${id}.webp`, mime_type: 'image/webp', width: 200, height: 300, bytes: web.length, sha256: digest(web) },
      }
      manifest.assets.push(asset)
      await write(root, 'docs/public' + asset.web.path, web)
      await write(root, `.release/${character}/${id}.png`, original)
    }
    await write(root, `catalog/${character}/manifest.json`, manifest)
    await write(root, `docs/public/catalog/${character}/manifest.json`, manifest)
    await write(root, `docs/characters/${character}/index.md`, '---\ntitle: Overview\nreleaseReady: true\n---\n# Final content\n')
    manifests.push(manifest)
  }
  await write(root, 'catalog/releases.json', catalog)
  return { root, catalog, manifests, async updateManifest(index = 0, publicCopy = true) {
    const character = characters[index].character
    await write(root, `catalog/${character}/manifest.json`, manifests[index])
    if (publicCopy) await write(root, `docs/public/catalog/${character}/manifest.json`, manifests[index])
  } }
}

test('current manifests verify stable original/web paths without a version contract', async (t) => {
  const { root } = await fixture(t)
  const result = await verify(root)
  assert.equal(result.webImages, 2)
  assert.equal(result.r2Urls, 2)
  assert.deepEqual(result.releases, [{ character: 'bunny', webImages: 2, r2Urls: 2 }])
})

test('characters have independent manifests and asset counts', async (t) => {
  const { root } = await fixture(t, [{ character: 'bunny', count: 3 }, { character: 'fox', count: 1 }])
  const result = await verify(root)
  assert.equal(result.releases.length, 2)
  assert.equal(result.webImages, 4)
})

for (const [label, change] of [
  ['asset_count mismatch', (m) => { m.asset_count = 9 }],
  ['wrong manifest character', (m) => { m.character_id = 'fox' }],
  ['obsolete manifest version', (m) => { m.release_version = '1.0.0' }],
  ['obsolete downloads section', (m) => { m.downloads = [] }],
  ['obsolete asset version', (m) => { m.assets[0].version = '1.0.0' }],
  ['wrong asset character', (m) => { m.assets[0].character = 'fox' }],
  ['unstable id', (m) => { m.assets[0].id = 'image-0' }],
  ['duplicate id', (m) => { m.assets[1].id = m.assets[0].id }],
  ['original hash mismatch', (m) => { m.assets[0].original.sha256 = '0'.repeat(64) }],
  ['original size mismatch', (m) => { m.assets[0].original.bytes += 1 }],
  ['invalid original hash', (m) => { m.assets[0].original.sha256 = 'g'.repeat(64) }],
  ['original MIME mismatch', (m) => { m.assets[0].original.mime_type = 'image/jpeg' }],
  ['original version path', (m) => { m.assets[0].original.path = '/media/bunny/1.0.0/image-0-latest.png' }],
  ['original identity mismatch', (m) => { m.assets[0].original.path = m.assets[1].original.path }],
  ['invalid original dimensions', (m) => { m.assets[0].original.width = 0 }],
  ['missing original dimensions', (m) => { delete m.assets[0].original.height }],
  ['web version path', (m) => { m.assets[0].web.path = '/characters/bunny/1.0.0/image-0-latest.webp' }],
  ['web traversal', (m) => { m.assets[0].web.path = '/characters/bunny/../../../private.webp' }],
  ['web identity mismatch', (m) => { m.assets[0].web.path = m.assets[1].web.path }],
  ['web MIME mismatch', (m) => { m.assets[0].web.mime_type = 'text/html' }],
  ['invalid web bytes', (m) => { m.assets[0].web.bytes = -1 }],
  ['invalid web dimensions', (m) => { m.assets[0].web.height = 1.5 }],
]) {
  test(`image verification rejects ${label}`, async (t) => {
    const f = await fixture(t)
    change(f.manifests[0])
    await f.updateManifest()
    await assert.rejects(() => verify(f.root))
  })
}

test('an allowlist entry absent from the manifest is refused', async (t) => {
  const { root, catalog } = await fixture(t)
  catalog.assets.push({ ...catalog.assets[0], path: '/media/bunny/unlisted-latest.png', key: 'x_ops/design/characters/bunny/latest/unlisted-latest.png' })
  await write(root, 'catalog/releases.json', catalog)
  await assert.rejects(() => verify(root), /manifest/i)
})

test('a manifest image absent from the allowlist is refused', async (t) => {
  const { root, catalog } = await fixture(t)
  catalog.assets.pop()
  await write(root, 'catalog/releases.json', catalog)
  await assert.rejects(() => verify(root), /original/i)
})

test('modified web bytes fail hash verification', async (t) => {
  const { root } = await fixture(t)
  await write(root, 'docs/public/characters/bunny/image-0-latest.webp', Buffer.from('tampered'))
  await assert.rejects(() => verify(root), /Web asset integrity/i)
})

test('public manifest must match the source manifest', async (t) => {
  const { root } = await fixture(t)
  const publicPath = 'docs/public/catalog/bunny/manifest.json'
  const manifest = await readJSON(root, publicPath)
  manifest.title = 'different copy'
  await write(root, publicPath, manifest)
  await assert.rejects(() => verify(root), /public manifest/i)
})

test('contentReady false continues to stop production verification', async (t) => {
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

test('local verification permits review content and checks originals against manifest integrity', async (t) => {
  const f = await fixture(t)
  f.catalog.contentReady = false
  await write(f.root, 'catalog/releases.json', f.catalog)
  const options = { production: false, verifyOriginals: true }
  assert.equal((await verifyRelease(f.root, options)).webImages, 2)
  await rm(join(f.root, '.release/bunny/image-0-latest.png'))
  await assert.rejects(() => verifyRelease(f.root, options), /ENOENT/)
  await write(f.root, '.release/bunny/image-0-latest.png', Buffer.from('tampered original'))
  await assert.rejects(() => verifyRelease(f.root, options), /original integrity/)
  await write(f.root, '.release/bunny/image-0-latest.png', originalBytes('bunny', 0))
  assert.equal((await verifyRelease(f.root, options)).webImages, 2)
})

test('replacement requires manifest refresh but no Worker catalog change', async (t) => {
  const f = await fixture(t)
  const before = await readFile(join(f.root, 'catalog/releases.json'), 'utf8')
  const bytes = Buffer.from('a different larger original')
  f.manifests[0].assets[0].original.bytes = bytes.length
  f.manifests[0].assets[0].original.sha256 = digest(bytes)
  await write(f.root, '.release/bunny/image-0-latest.png', bytes)
  await f.updateManifest()
  assert.equal((await verify(f.root)).r2Urls, 2)
  assert.equal(await readFile(join(f.root, 'catalog/releases.json'), 'utf8'), before)
})
