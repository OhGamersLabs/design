import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { validateCatalog } from '../worker/catalog.js'

const root = resolve(import.meta.dirname, '..')
const catalog = JSON.parse(await readFile(resolve(root, 'catalog/releases.json'), 'utf8'))
const allowed = validateCatalog(catalog, { production: true })
const manifest = JSON.parse(await readFile(resolve(root, 'catalog/bunny/1.0.0/manifest.json'), 'utf8'))
if (manifest.asset_count !== 19 || manifest.assets.length !== 19) throw new Error('Expected 19 approved Bunny final images')
for (const asset of manifest.assets) {
  const bytes = await readFile(resolve(root, 'docs/public' + asset.web.path))
  if (bytes.length !== asset.web.bytes || createHash('sha256').update(bytes).digest('hex') !== asset.web.sha256) {
    throw new Error(`Web asset integrity mismatch: ${asset.id}`)
  }
  if (!allowed.has(asset.original.path)) throw new Error(`Unlisted original: ${asset.id}`)
}
for (const item of manifest.downloads) {
  if (!allowed.has(item.path)) throw new Error(`Unlisted download: ${item.id}`)
}
const overview = await readFile(resolve(root, 'docs/characters/bunny/index.md'), 'utf8')
if (!/^releaseReady:\s*true\s*$/m.test(overview)) throw new Error('Bunny final content is not ready')
console.log(`Release ready: ${manifest.assets.length} verified web images; ${allowed.size} exact R2 URLs`)
