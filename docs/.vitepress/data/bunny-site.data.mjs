import { defineLoader } from 'vitepress'
import { fileURLToPath } from 'node:url'
import { assetById, buildAssetIndex } from '../theme/bunny-site.mjs'
import { list, number, parseAnchorMap, parseNames, readJson, record, text } from './bunny-data.mjs'

const root = new URL('../../../', import.meta.url)
const dataRoot = new URL('./bunny/', import.meta.url)
/** @param {string} name @param {unknown} fallback @returns {unknown} */
function readData(name, fallback) { return readJson(new URL(`${name}.json`, dataRoot), fallback) }

/** @param {unknown} value @returns {import('../theme/bunny-site-types').AssetFile} */
function parseImage(value) {
  const image = record(value)
  return { path: text(image.path), width: number(image.width), height: number(image.height), bytes: number(image.bytes) }
}
/** @param {unknown} value @returns {import('../theme/bunny-site.mjs').Manifest} */
function parseManifest(value) {
  const manifest = record(value)
  return {
    character_id: text(manifest.character_id),
    assets: list(manifest.assets).map((entry) => {
      const asset = record(entry)
      return { id: text(asset.id), web: parseImage(asset.web), original: parseImage(asset.original) }
    }),
  }
}
/** @param {unknown} value @returns {import('../theme/bunny-site-types').Fact[]} */
function parseFacts(value) {
  return list(value).map((entry) => {
    const fact = record(entry)
    return { term: text(fact.term), value: text(fact.value), ...(fact.note === undefined ? {} : { note: text(fact.note) }) }
  })
}
/** @param {unknown} value @returns {import('../theme/bunny-site-types').HomeData} */
function parseHome(value) {
  const home = record(value)
  return {
    tabs: list(home.tabs).map((entry) => {
      const tab = record(entry)
      const key = text(tab.key)
      if (key !== 'scene' && key !== 'three' && key !== 'line') throw new Error(`Invalid hero tab: ${key}`)
      return { key, label: text(tab.label), caption: text(tab.caption), assets: list(tab.assets).map(text) }
    }),
    highlights: list(home.highlights).map((entry) => {
      const item = record(entry)
      return { date: text(item.date), title: text(item.title), asset: text(item.asset), caption: text(item.caption) }
    }),
    facts: parseFacts(home.facts),
    chips: list(home.chips).map((entry) => {
      const chip = record(entry)
      const swatch = text(chip.swatch)
      if (swatch !== 'orange' && swatch !== 'red' && swatch !== 'white' && swatch !== 'black') throw new Error(`Invalid color swatch: ${swatch}`)
      return { name: text(chip.name), use: text(chip.use), swatch }
    }),
    chipNote: text(home.chipNote), status: text(home.status), updated: text(home.updated),
    chapters: list(home.chapters).map((entry) => {
      const chapter = record(entry)
      return { id: text(chapter.id), label: text(chapter.label) }
    }),
  }
}
/** @param {unknown} value @returns {import('../theme/bunny-site-types').LayerRecord[]} */
function parseLayers(value) {
  return list(value).map((entry) => {
    const layer = record(entry)
    return {
      layer: number(layer.layer), name: text(layer.name), path: text(layer.path), front: text(layer.front), side: text(layer.side), back: text(layer.back),
      summary: text(layer.summary), facts: parseFacts(layer.facts), leftRight: text(layer.leftRight),
    }
  })
}
/** @returns {import('../theme/bunny-site-types').BunnySiteData} */
function load() {
  const bunnyManifest = readJson(new URL('catalog/bunny/manifest.json', root), null)
  const manifests = [parseManifest(bunnyManifest), parseManifest(readJson(new URL('catalog/origins/manifest.json', root), null))]
  const names = parseNames(readData('asset-names', {}))
  const thumbs = Object.fromEntries(Object.entries(record(readJson(new URL('docs/public/site/thumbs/index.json', root), null))).map(([key, value]) => {
    const thumb = record(value)
    return [key, { path: text(thumb.path), width: number(thumb.width), height: number(thumb.height) }]
  }))
  const assets = buildAssetIndex({ manifests, names, thumbs })
  const home = parseHome(readData('home', { tabs: [], facts: [], chips: [], chipNote: '', highlights: [], status: '', updated: '', chapters: [] }))
  const layers = parseLayers(readData('layers', []))
  const anchorMap = parseAnchorMap(readData('anchor-map', { stubs: {}, anchors: {} }))
  const displayText = Object.fromEntries(Object.entries(record(readData('display-text', {}))).map(([key, value]) => [key, parseNames(value)]))
  const ids = [
    ...home.tabs.flatMap((tab) => tab.assets),
    ...home.highlights.map((entry) => entry.asset),
    ...layers.flatMap((layer) => [layer.front, layer.side, layer.back]),
  ]
  for (const id of ids) assetById(assets, id)
  return { assets, home, layers, anchorMap, displayText }
}

export default defineLoader({
  watch: [
    fileURLToPath(new URL('*.json', dataRoot)),
    fileURLToPath(new URL('catalog/bunny/manifest.json', root)),
    fileURLToPath(new URL('catalog/origins/manifest.json', root)),
    fileURLToPath(new URL('docs/public/site/thumbs/index.json', root)),
  ],
  load,
})
