import { READING_ORDER } from '../bunny-navigation.mjs'
import { measurementModel } from './components/body-measurements.mjs'
import { garmentModel } from './components/garment-measurements.mjs'

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


/**
 * One exact display-text lookup shared by measurement files. Labels remain a
 * separate namespace so a view name cannot accidentally rewrite JSON content.
 * @param {Record<string, Record<string, string>>} displayText
 */
export function createDisplayTextLookup(displayText) {
  const translations = new Map()
  for (const [file, entries] of Object.entries(displayText)) {
    if (file === '@labels') continue
    for (const [original, displayed] of Object.entries(entries)) {
      if (translations.has(original) && translations.get(original) !== displayed) {
        throw new Error(`Conflicting display text: ${original}`)
      }
      translations.set(original, displayed)
    }
  }
  return (value) => translations.has(value) ? translations.get(value) : value
}

/** @param {string} scope */
function validateMeasurementScope(scope) {
  if (scope !== 'current' && scope !== 'archive') throw new Error(`Invalid measurement scope: ${scope}`)
}

/** @param {string} web @returns {string} */
function measurementAssetId(web) {
  const basename = web.split('/').at(-1)
  if (!basename?.endsWith('.webp')) throw new Error(`Invalid measurement web resource: ${web}`)
  return basename.slice(0, -'.webp'.length)
}

function scopedMeasurementModels(models, assets, scope) {
  return models.map((model) => {
    const assetId = measurementAssetId(model.resources.web)
    const asset = assetById(assets, assetId)
    return { model: { ...model, assetId }, current: asset.status?.startsWith('current-') ?? false }
  }).filter((entry) => entry.current === (scope === 'current')).map(({ model }) => model)
}

/** Select only views whose web asset belongs to the requested status scope. */
export function bodyMeasurementScope(data, assets, scope = 'current') {
  validateMeasurementScope(scope)
  const models = scopedMeasurementModels(Object.keys(data.views).map((id) => measurementModel(data, id)), assets, scope)
  return { models, defaultSourceId: models[0]?.id }
}

/**
 * Build against the complete data so a derived row retains its exact reference,
 * then filter sources and the metric selector using the scoped rows.
 */
export function garmentMeasurementScope(data, assets, scope = 'current') {
  validateMeasurementScope(scope)
  const models = scopedMeasurementModels(Object.keys(data.sources).map((id) => garmentModel(data, id)), assets, scope)
  const available = new Set(models.flatMap((model) => [...model.rows, ...model.derived].map(({ id }) => id)))
  const metrics = Object.entries(data.metrics).filter(([id]) => available.has(id)).map(([id, metric]) => ({ id, ...metric }))
  const hasRulers = models.some((model) => Boolean(model.resources.ruler))
  const selectable = hasRulers ? models.filter((m) => m.resources.ruler) : models
  const defaultSourceId = selectMeasurementSource(selectable, '', data.defaultSourceId)?.id
  return { models, metrics, defaultSourceId, defaultMetricId: metrics[0]?.id, hasRulers }
}

/** Keep a selection only while it remains in scope; otherwise use the default. */
export function selectMeasurementSource(models, selectedId, defaultSourceId) {
  return models.find(({ id }) => id === selectedId) ?? models.find(({ id }) => id === defaultSourceId) ?? models[0]
}

/** Metric options and their fallback follow the order in the measurement JSON. */
export function selectMeasurementMetric(metrics, selectedId) {
  return metrics.find(({ id }) => id === selectedId)?.id ?? metrics[0]?.id
}
