import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual } from 'node:util'
import { validateCatalog } from '../worker/catalog.js'

const defaultRoot = resolve(import.meta.dirname, '..')
const slugPattern = /^[a-z0-9][a-z0-9-]*-latest$/
const shaPattern = /^[a-fA-F0-9]{64}$/
const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const matches = (pattern, value) => typeof value === 'string' && pattern.exec(value)?.[0] === value

/** Only catalog entries select current character manifests. */
export function collectReleaseGroups(catalog, { production = true } = {}) {
  const allowed = validateCatalog(catalog, { production })
  const groups = new Map()
  for (const asset of allowed.values()) {
    if (!groups.has(asset.character)) groups.set(asset.character, { character: asset.character, assets: [] })
    groups.get(asset.character).assets.push(asset)
  }
  return { allowed, groups: [...groups.values()] }
}

function validImage(item, path, mime) {
  return isRecord(item) && item.path === path && item.mime_type === mime &&
    Number.isSafeInteger(item.bytes) && item.bytes > 0 && matches(shaPattern, item.sha256) &&
    Number.isSafeInteger(item.width) && item.width > 0 &&
    Number.isSafeInteger(item.height) && item.height > 0
}

/** Integrity belongs to the local manifest; replaceable R2 objects keep only stable identities. */
export function validateReleaseManifest(manifest, group, allowed) {
  if (!isRecord(manifest) || manifest.character_id !== group.character ||
      'release_version' in manifest || 'downloads' in manifest || !Array.isArray(manifest.assets) ||
      !Number.isSafeInteger(manifest.asset_count) || manifest.asset_count !== manifest.assets.length) {
    throw new Error(`Invalid image manifest: ${group.character}`)
  }
  const referenced = new Set()
  const imageIds = new Set()
  for (const asset of manifest.assets) {
    if (!isRecord(asset) || !matches(slugPattern, asset.id) || imageIds.has(asset.id) ||
        asset.character !== group.character || 'version' in asset) {
      throw new Error(`Invalid image metadata in manifest: ${group.character}`)
    }
    imageIds.add(asset.id)
    const originalPath = `/media/${group.character}/${asset.id}.png`
    const entry = allowed.get(originalPath)
    if (!entry || entry.character !== group.character || entry.contentType !== 'image/png' ||
        !validImage(asset.original, originalPath, 'image/png') || referenced.has(originalPath)) {
      throw new Error(`Manifest contains an unmatched or invalid original: ${group.character}`)
    }
    referenced.add(originalPath)
    if (!validImage(asset.web, `/characters/${group.character}/${asset.id}.webp`, 'image/webp')) {
      throw new Error(`Invalid web asset in manifest: ${group.character}`)
    }
  }
  if (referenced.size !== group.assets.length || group.assets.some((asset) => !referenced.has(asset.path))) {
    throw new Error(`Current allowlist and image manifest differ: ${group.character}`)
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

async function verifyFile(path, asset, label) {
  const bytes = await readFile(path)
  if (bytes.length !== asset.bytes || createHash('sha256').update(bytes).digest('hex') !== asset.sha256.toLowerCase()) {
    throw new Error(`${label} integrity mismatch: ${asset.path}`)
  }
}

/** Verify the current manifests using a supplied checkout root (also useful for isolated fixtures). */
export async function verifyRelease(root = defaultRoot, { production = true, verifyOriginals = false } = {}) {
  const json = async (relative) => JSON.parse(await readFile(resolve(root, relative), 'utf8'))
  const { allowed, groups } = collectReleaseGroups(await json('catalog/releases.json'), { production })
  const releases = []
  for (const group of groups) {
    const manifestPath = `catalog/${group.character}/manifest.json`
    const manifest = await json(manifestPath)
    const webAssets = validateReleaseManifest(manifest, group, allowed)
    const publicManifest = await json(`docs/public/${manifestPath}`)
    if (!isDeepStrictEqual(manifest, publicManifest)) {
      throw new Error(`Public manifest differs from image manifest: ${group.character}`)
    }
    for (const asset of webAssets) {
      await verifyFile(resolve(root, 'docs/public' + asset.path), asset, 'Web asset')
    }
    if (production) {
      const overview = await readFile(resolve(root, `docs/characters/${group.character}/index.md`), 'utf8')
      requireReadyFrontmatter(overview, group.character)
    }
    if (verifyOriginals) {
      for (const asset of manifest.assets) {
        await verifyFile(resolve(root, '.release', group.character, `${asset.id}.png`), asset.original, 'Local original')
      }
    }
    releases.push({ character: group.character, webImages: webAssets.length, r2Urls: group.assets.length })
  }
  return { webImages: releases.reduce((sum, release) => sum + release.webImages, 0), r2Urls: allowed.size, releases }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const local = process.argv.includes('--local')
    const result = await verifyRelease(defaultRoot, { production: !local, verifyOriginals: local })
    console.log(`${local ? 'Local reference verified' : 'Release ready'}: ${result.webImages} verified web images; ${result.r2Urls} exact media URLs; ${result.releases.length} characters`)
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
