import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual } from 'node:util'
import { validateCatalog } from '../worker/catalog.js'

const defaultRoot = resolve(import.meta.dirname, '..')
const filenamePattern = /^[A-Za-z0-9._-]+$/
const imageTypes = new Set(['image/png', 'image/jpeg', 'image/webp'])
const shaPattern = /^[a-fA-F0-9]{64}$/
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const isFilename = (value) => typeof value === 'string' && filenamePattern.test(value) && !value.includes('..')

/** Only catalog entries select active releases; retained directories never expand the allowlist. */
export function collectReleaseGroups(catalog) {
  const allowed = validateCatalog(catalog, { production: true })
  const versions = new Map()
  const groups = new Map()
  for (const asset of allowed.values()) {
    if (versions.has(asset.character) && versions.get(asset.character) !== asset.version) {
      throw new Error(`Each character must have one active version: ${asset.character}`)
    }
    versions.set(asset.character, asset.version)
    const id = `${asset.character}/${asset.version}`
    if (!groups.has(id)) groups.set(id, { character: asset.character, version: asset.version, assets: [] })
    groups.get(id).assets.push(asset)
  }
  return { allowed, groups: [...groups.values()] }
}

/** Validate metadata independently of disk reads; all R2 references must match the exact approved entry. */
export function validateReleaseManifest(manifest, group, allowed) {
  if (!isRecord(manifest) || manifest.character_id !== group.character || manifest.release_version !== group.version ||
      !Array.isArray(manifest.assets) || !Array.isArray(manifest.downloads) ||
      !Number.isSafeInteger(manifest.asset_count) || manifest.asset_count !== manifest.assets.length) {
    throw new Error(`Invalid release manifest: ${group.character}/${group.version}`)
  }
  if (group.character === 'bunny' && manifest.asset_count !== 19) {
    throw new Error('Expected 19 approved Bunny final images')
  }
  const referenced = new Set()
  const imageIds = new Set()
  const webPaths = new Set()
  function validatePublicFile(item) {
    const entry = isRecord(item) ? allowed.get(item.path) : undefined
    if (!entry || entry.character !== group.character || entry.version !== group.version ||
        item.bytes !== entry.size || item.sha256 !== entry.sha256 || item.mime_type !== entry.contentType ||
        referenced.has(item.path)) {
      throw new Error(`Release manifest contains an unmatched or duplicate public asset: ${group.character}/${group.version}`)
    }
    referenced.add(item.path)
  }
  for (const asset of manifest.assets) {
    if (!isRecord(asset) || typeof asset.id !== 'string' || !asset.id || imageIds.has(asset.id) ||
        asset.character !== group.character || asset.version !== group.version || !isRecord(asset.web)) {
      throw new Error(`Invalid image metadata in release manifest: ${group.character}/${group.version}`)
    }
    imageIds.add(asset.id)
    validatePublicFile(asset.original)
    if (!imageTypes.has(asset.original.mime_type)) throw new Error('Original artwork must use an approved image MIME')
    const prefix = `/characters/${group.character}/${group.version}/`
    const web = asset.web
    if (typeof web.path !== 'string' || !web.path.startsWith(prefix) ||
        !isFilename(web.path.slice(prefix.length)) || webPaths.has(web.path) ||
        !Number.isSafeInteger(web.bytes) || web.bytes <= 0 || typeof web.sha256 !== 'string' ||
        !shaPattern.test(web.sha256) || !imageTypes.has(web.mime_type)) {
      throw new Error(`Invalid web asset in release manifest: ${group.character}/${group.version}`)
    }
    webPaths.add(web.path)
  }
  for (const download of manifest.downloads) validatePublicFile(download)
  if (referenced.size !== group.assets.length || group.assets.some((asset) => !referenced.has(asset.path))) {
    throw new Error(`Active allowlist and release manifest differ: ${group.character}/${group.version}`)
  }
  return manifest.assets.map((asset) => asset.web)
}

function requireReadyFrontmatter(markdown, character) {
  const frontmatter = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(markdown)?.[1]
  const declarations = frontmatter?.split(/\r?\n/).filter((line) => /^releaseReady\s*:/.test(line)) || []
  if (declarations.length !== 1 || !/^releaseReady:[ \t]*true[ \t]*$/.test(declarations[0])) {
    throw new Error(`Character final content is not ready: ${character}`)
  }
}

/** Verify one active version per character using a supplied checkout root (also useful for isolated fixtures). */
export async function verifyRelease(root = defaultRoot) {
  const json = async (relative) => JSON.parse(await readFile(resolve(root, relative), 'utf8'))
  const { allowed, groups } = collectReleaseGroups(await json('catalog/releases.json'))
  const releases = []
  for (const group of groups) {
    const manifestPath = `catalog/${group.character}/${group.version}/manifest.json`
    const manifest = await json(manifestPath)
    const webAssets = validateReleaseManifest(manifest, group, allowed)
    const publicManifest = await json(`docs/public/${manifestPath}`)
    if (!isDeepStrictEqual(manifest, publicManifest)) {
      throw new Error(`Public manifest differs from release manifest: ${group.character}/${group.version}`)
    }
    for (const asset of webAssets) {
      const bytes = await readFile(resolve(root, 'docs/public' + asset.path))
      if (bytes.length !== asset.bytes || createHash('sha256').update(bytes).digest('hex') !== asset.sha256.toLowerCase()) {
        throw new Error(`Web asset integrity mismatch: ${asset.path}`)
      }
    }
    const overview = await readFile(resolve(root, `docs/characters/${group.character}/index.md`), 'utf8')
    requireReadyFrontmatter(overview, group.character)
    releases.push({ character: group.character, version: group.version, webImages: webAssets.length, r2Urls: group.assets.length })
  }
  return { webImages: releases.reduce((sum, release) => sum + release.webImages, 0), r2Urls: allowed.size, releases }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await verifyRelease()
    console.log(`Release ready: ${result.webImages} verified web images; ${result.r2Urls} exact R2 URLs; ${result.releases.length} active releases`)
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
