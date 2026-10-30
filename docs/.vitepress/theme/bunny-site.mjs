import { READING_ORDER } from '../bunny-navigation.mjs'

/** @typedef {import('./bunny-site-types').AssetRecord} AssetRecord */
/** @typedef {import('./bunny-site-types').ChangeRecord} ChangeRecord */
/** @typedef {import('./bunny-site-types').AnchorMap} AnchorMap */
/** @typedef {{path: string, width: number, height: number, bytes: number}} ImageFile */
/** @typedef {{character_id: string, release_version: string, assets: Array<{id: string, source?: {review_status?: string}, web: ImageFile, original: ImageFile}>}} Manifest */
/** @typedef {Record<string, {path: string, width: number, height: number}>} Thumbnails */

/**
 * Join only named, indexed assets; never turn an unknown id into visible text.
 * @param {{manifests: Manifest[], names: Record<string, string>, thumbs: Thumbnails}} input
 * @returns {Record<string, AssetRecord>}
 */
export function buildAssetIndex({ manifests, names, thumbs }) {
  /** @type {Record<string, AssetRecord>} */
  const index = {}
  for (const manifest of manifests) {
    const collection = `${manifest.character_id}/${manifest.release_version}`
    if (collection !== 'bunny/3.1.0' && collection !== 'origins/1.0.0') {
      throw new Error(`Unsupported asset collection: ${collection}`)
    }
    for (const asset of manifest.assets) {
      const { id } = asset
      if (Object.hasOwn(index, id)) throw new Error(`Duplicate asset id: ${id}`)
      const name = Object.hasOwn(names, id) ? names[id] : undefined
      if (typeof name !== 'string' || !name.trim()) throw new Error(`Missing asset name: ${id}`)
      const thumbKey = `${collection}/${id}`
      const thumb = Object.hasOwn(thumbs, thumbKey) ? thumbs[thumbKey] : undefined
      if (!thumb) throw new Error(`Missing asset thumbnail: ${id}`)
      index[id] = {
        id, collection, status: asset.source?.review_status ?? null, name,
        web: imageFile(asset.web), original: imageFile(asset.original),
        thumb: { path: thumb.path, width: thumb.width, height: thumb.height },
      }
    }
  }
  for (const id of Object.keys(names)) {
    if (!Object.hasOwn(index, id)) throw new Error(`Unknown asset name id: ${id}`)
  }
  return index
}

/** @param {ImageFile} image @returns {ImageFile} */
function imageFile({ path, width, height, bytes }) {
  return { path, width, height, bytes }
}

/** @param {Record<string, AssetRecord>} index @param {string} id @returns {AssetRecord} */
export function assetById(index, id) {
  if (!Object.hasOwn(index, id)) throw new Error(`Unknown asset id: ${id}`)
  return index[id]
}

/** @param {ChangeRecord[]} changes @param {number} count @returns {Array<{date: string, title: string, asset: string, caption: string}>} */
export function selectLatest(changes, count) {
  return changes.toSorted((a, b) => b.date.localeCompare(a.date) || a.order - b.order)
    .flatMap(({ date, latest }) => latest ? [{ date, ...latest }] : [])
    .slice(0, Math.max(0, count))
}

/** @param {string} pathname @returns {string} */
function normalizePath(pathname) {
  return pathname.replace(/\/index(?:\.html)?$/, '/').replace(/\.html$/, '')
}

/** @param {AnchorMap} anchorMap @param {string} pathname @param {string} hash @returns {string | null} */
export function resolveAnchorTarget(anchorMap, pathname, hash) {
  const path = normalizePath(pathname)
  let id = hash.replace(/^#/, '')
  try { id = decodeURIComponent(id) } catch { /* A malformed fragment still permits the stub fallback. */ }
  const key = `${path}#${id}`
  if (id && Object.hasOwn(anchorMap.anchors, key)) return anchorMap.anchors[key]
  return Object.hasOwn(anchorMap.stubs, path) ? anchorMap.stubs[path].target : null
}

/** @param {string} hash @param {boolean} hasElement @returns {boolean} */
export function shouldRedirectForHash(hash, hasElement) {
  return hash.replace(/^#/, '').length > 0 && !hasElement
}

/** @param {string} path @returns {{prev: {path: string, title: string} | null, next: {path: string, title: string} | null}} */
export function readingNeighbors(path) {
  const index = READING_ORDER.findIndex((entry) => entry.path === normalizePath(path))
  if (index < 0) return { prev: null, next: null }
  return { prev: READING_ORDER[index - 1] ?? null, next: READING_ORDER[index + 1] ?? null }
}

/** @param {number} index @param {number} delta @param {number} count @returns {number} */
export function stepIndex(index, delta, count) {
  return Math.max(0, Math.min(index + delta, count - 1))
}
