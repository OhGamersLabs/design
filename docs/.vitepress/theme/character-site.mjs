import { measurementModel } from './components/body-measurements.mjs'
import { garmentModel } from './components/garment-measurements.mjs'

/** @typedef {import('./character-site-types').AssetRecord} AssetRecord */
/** @typedef {{path: string, width: number, height: number, bytes: number}} ImageFile */
/** @typedef {{character_id: string, assets: Array<{id: string, web: ImageFile, original: ImageFile}>}} Manifest */
/** @typedef {Record<string, {path: string, width: number, height: number}>} Thumbnails */

/**
 * Join only named, indexed assets; never turn an unknown id into visible text.
 * @param {{character: string, manifests: Manifest[], names: Record<string, string>, thumbs: Thumbnails}} input
 * @returns {Record<string, AssetRecord>}
 */
export function buildAssetIndex({ character, manifests, names, thumbs }) {
  /** @type {Record<string, AssetRecord>} */
  const index = {}
  for (const manifest of manifests) {
    const collection = manifest.character_id
    if (collection !== character && collection !== 'origins') {
      throw new Error(`Unsupported asset collection: ${collection}`)
    }
    for (const asset of manifest.assets) {
      const { id } = asset
      if (collection === 'origins' && id !== `${character}-original-latest`) throw new Error(`Foreign original asset: ${id}`)
      if (Object.hasOwn(index, id)) throw new Error(`Duplicate asset id: ${id}`)
      const name = Object.hasOwn(names, id) ? names[id] : undefined
      if (typeof name !== 'string' || !name.trim()) throw new Error(`Missing asset name: ${id}`)
      const thumbKey = `${collection}/${id}`
      const thumb = Object.hasOwn(thumbs, thumbKey) ? thumbs[thumbKey] : undefined
      if (!thumb) throw new Error(`Missing asset thumbnail: ${id}`)
      index[id] = {
        id, collection, name,
        web: imageFile(asset.web), original: imageFile(asset.original),
        thumb: { path: thumb.path, width: thumb.width, height: heightOf(thumb) },
      }
    }
  }
  for (const id of Object.keys(names)) {
    if (!Object.hasOwn(index, id)) throw new Error(`Unknown asset name id: ${id}`)
  }
  return index
}

/** @param {{height: number}} thumb */
function heightOf(thumb) {
  return thumb.height
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

/** @param {string} pathname @returns {string} */
function normalizePath(pathname) {
  return pathname.replace(/\/index(?:\.html)?$/, '/').replace(/\.html$/, '')
}

/** @param {import('./character-site-types').ReadingEntry[]} order @param {string} path @returns {{prev: {path: string, title: string} | null, next: {path: string, title: string} | null}} */
export function readingNeighbors(order, path) {
  const index = order.findIndex((entry) => entry.path === normalizePath(path))
  if (index < 0) return { prev: null, next: null }
  return { prev: order[index - 1] ?? null, next: order[index + 1] ?? null }
}

/** @param {number} index @param {number} delta @param {number} count @returns {number} */
export function stepIndex(index, delta, count) {
  return Math.max(0, Math.min(index + delta, count - 1))
}

/**
 * Where focus goes after a lightbox paging step.
 * @param {'prev' | 'next' | 'other'} focused
 * @param {{ prevDisabled: boolean, nextDisabled: boolean }} state
 * @returns {'prev' | 'next' | 'close' | null}
 */
export function focusAfterStep(focused, { prevDisabled, nextDisabled }) {
  if (focused === 'prev' && prevDisabled) return nextDisabled ? 'close' : 'next'
  if (focused === 'next' && nextDisabled) return prevDisabled ? 'close' : 'prev'
  return null
}

/**
 * @param {number} viewportHeight
 * @param {number} scrollOffset
 * @returns {number}
 */
export function readingLine(viewportHeight, scrollOffset) {
  return Math.max(viewportHeight * 0.35, scrollOffset + 1)
}

/**
 * @param {Array<{ id: string, top: number | null }>} headings
 * @param {{ line: number, viewportHeight: number, atBottom: boolean, hashId: string }} view
 * @returns {string}
 */
export function activeChapterId(headings, { line, viewportHeight, atBottom, hashId }) {
  const present = headings.flatMap((heading) => heading.top === null ? [] : [{ id: heading.id, top: heading.top }])
  if (atBottom) {
    const target = present.find((heading) => heading.id === hashId)
    if (target && target.top >= 0 && target.top < viewportHeight) return target.id
    const last = present[present.length - 1]
    if (last && last.top < viewportHeight) return last.id
  }
  let current = ''
  for (const heading of present) if (heading.top <= line) current = heading.id
  return current
}

/**
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
  if (scope !== 'current') throw new Error(`Invalid measurement scope: ${scope}`)
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
    assetById(assets, assetId)
    return { model: { ...model, assetId } }
  }).map(({ model }) => model)
}

export function bodyMeasurementScope(data, assets, character, scope = 'current') {
  validateMeasurementScope(scope)
  const models = scopedMeasurementModels(Object.keys(data.views).map((id) => measurementModel(data, id, character)), assets, scope)
  return { models, defaultSourceId: models[0]?.id }
}

export function garmentMeasurementScope(data, assets, character, scope = 'current') {
  validateMeasurementScope(scope)
  const models = scopedMeasurementModels(Object.keys(data.sources).map((id) => garmentModel(data, id, character)), assets, scope)
  const available = new Set(models.flatMap((model) => [...model.rows, ...model.derived].map(({ id }) => id)))
  const metrics = Object.entries(data.metrics).filter(([id]) => available.has(id)).map(([id, metric]) => ({ id, ...metric }))
  const hasRulers = models.some((model) => Boolean(model.resources.ruler))
  const selectable = hasRulers ? models.filter((m) => m.resources.ruler) : models
  const defaultSourceId = selectMeasurementSource(selectable, '', data.defaultSourceId)?.id
  return { models, metrics, defaultSourceId, defaultMetricId: metrics[0]?.id, hasRulers }
}

export function selectMeasurementSource(models, selectedId, defaultSourceId) {
  return models.find(({ id }) => id === selectedId) ?? models.find(({ id }) => id === defaultSourceId) ?? models[0]
}

export function selectMeasurementMetric(metrics, selectedId) {
  return metrics.find(({ id }) => id === selectedId)?.id ?? metrics[0]?.id
}

/** @param {Record<string, import('./character-site-types').CharacterData>} characters @param {string} relativePath @param {string | undefined} [explicitId] @returns {import('./character-site-types').CharacterData} */
export function characterForPage(characters, relativePath, explicitId = undefined) {
  const id = explicitId ?? /^characters\/([a-z0-9]+(?:-[a-z0-9]+)*)\//.exec(relativePath)?.[1]
  if (!id) throw new Error(`Character component outside a character page: ${relativePath}`)
  if (!Object.hasOwn(characters, id)) throw new Error(`Unknown character: ${id}`)
  return characters[id]
}
