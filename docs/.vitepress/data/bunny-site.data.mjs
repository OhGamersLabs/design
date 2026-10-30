import { defineLoader } from 'vitepress'
import { fileURLToPath } from 'node:url'
import { assetById, buildAssetIndex } from '../theme/bunny-site.mjs'
import { list, number, parseAnchorMap, parseArchive, parseChanges, parseNames, parsePackage, readJson, record, text } from './bunny-data.mjs'

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
    character_id: text(manifest.character_id), release_version: text(manifest.release_version),
    assets: list(manifest.assets).map((entry) => {
      const asset = record(entry)
      const source = record(asset.source)
      return { id: text(asset.id), source: source.review_status === undefined ? {} : { review_status: text(source.review_status) }, web: parseImage(asset.web), original: parseImage(asset.original) }
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
    facts: parseFacts(home.facts),
    chips: list(home.chips).map((entry) => {
      const chip = record(entry)
      const swatch = text(chip.swatch)
      if (swatch !== 'orange' && swatch !== 'red' && swatch !== 'white' && swatch !== 'black') throw new Error(`Invalid color swatch: ${swatch}`)
      return { name: text(chip.name), use: text(chip.use), swatch }
    }),
    chipNote: text(home.chipNote), version: text(home.version), status: text(home.status), updated: text(home.updated),
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
/** @param {unknown} value @returns {import('../theme/bunny-site-types').DownloadsData} */
function parseDownloads(value) {
  /** @param {unknown} entries @returns {import('../theme/bunny-site-types').DownloadGroup[]} */
  function groups(entries) {
    return list(entries).map((entry) => {
      const group = record(entry)
      return {
        id: text(group.id), group: text(group.group), anchors: list(group.anchors).map(text),
        items: list(group.items).map((entry) => {
          const item = record(entry)
          const label = text(item.label)
          return item.asset === undefined ? { file: text(item.file), label } : { asset: text(item.asset), label }
        }),
      }
    })
  }
  const downloads = record(value)
  return { home: groups(downloads.home ?? []), page: groups(downloads.page ?? []) }
}

/** @returns {import('../theme/bunny-site-types').BunnySiteData} */
function load() {
  const bunnyManifest = readJson(new URL('catalog/bunny/3.1.0/manifest.json', root), null)
  const manifests = [parseManifest(bunnyManifest), parseManifest(readJson(new URL('catalog/origins/1.0.0/manifest.json', root), null))]
  const sourcePackage = parsePackage(record(bunnyManifest).downloads ?? [])
  const names = parseNames(readData('asset-names', {}))
  const thumbs = Object.fromEntries(Object.entries(record(readJson(new URL('docs/public/site/thumbs/index.json', root), null))).map(([key, value]) => {
    const thumb = record(value)
    return [key, { path: text(thumb.path), width: number(thumb.width), height: number(thumb.height) }]
  }))
  const assets = buildAssetIndex({ manifests, names, thumbs })
  const home = parseHome(readData('home', { tabs: [], facts: [], chips: [], chipNote: '', version: '', status: '', updated: '', chapters: [] }))
  const changes = parseChanges(readData('changes', []))
  const layers = parseLayers(readData('layers', []))
  const downloads = parseDownloads(readData('downloads', { home: [], page: [] }))
  const archive = parseArchive(readData('archive', { groups: [] }))
  const anchorMap = parseAnchorMap(readData('anchor-map', { stubs: {}, anchors: {} }))
  const displayText = Object.fromEntries(Object.entries(record(readData('display-text', {}))).map(([key, value]) => [key, parseNames(value)]))
  const ids = [
    ...home.tabs.flatMap((tab) => tab.assets),
    ...changes.flatMap((change) => change.latest ? [change.latest.asset, change.log.asset] : [change.log.asset]),
    ...layers.flatMap((layer) => [layer.front, layer.side, layer.back]),
    ...[...downloads.home, ...downloads.page].flatMap((group) => group.items.flatMap((item) => 'asset' in item ? [item.asset] : [])),
    ...archive.groups.flatMap((group) => group.items.map((item) => item.asset)),
  ]
  for (const id of ids) assetById(assets, id)
  return { assets, home, changes, layers, downloads, package: sourcePackage, archive, anchorMap, displayText }
}

export default defineLoader({
  watch: [
    fileURLToPath(new URL('*.json', dataRoot)),
    fileURLToPath(new URL('catalog/bunny/3.1.0/manifest.json', root)),
    fileURLToPath(new URL('catalog/origins/1.0.0/manifest.json', root)),
    fileURLToPath(new URL('docs/public/site/thumbs/index.json', root)),
  ],
  load,
})
