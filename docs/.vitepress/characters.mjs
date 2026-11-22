import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { assetById, buildAssetIndex } from './theme/character-site.mjs'
import {
  number, parseAnchorMap, parseCharacter, parseHome, parseLayers, parseManifest,
  parseNames, readJson, record, text, validateCharacterPath, validateSiteCheck,
} from './data/character-data.mjs'

const defaultRoot = fileURLToPath(new URL('../../', import.meta.url))

/** A data folder exists independently of its optional home page. @param {string} root @returns {import('./theme/character-site-types').CharacterDefinition[]} */
export function discoverCharacters(root = defaultRoot) {
  const dataRoot = resolve(root, 'docs/.vitepress/data')
  return readdirSync(dataRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(resolve(dataRoot, entry.name, 'character.json')))
    .sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
    .map(({ name: id }) => {
      if (id === 'origins' || id === 'base-bodies' || id === 'world' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error(`Invalid character id: ${id}`)
      return parseCharacter(readJson(resolve(dataRoot, id, 'character.json')), id, existsSync(resolve(root, 'docs/characters', id, 'index.md')))
    })
}

/** @param {import('./theme/character-site-types').AnchorMap[]} maps @returns {import('./theme/character-site-types').AnchorMap} */
export function mergeAnchorMaps(maps) {
  /** @type {import('./theme/character-site-types').AnchorMap} */
  const merged = { stubs: {}, anchors: {} }
  const keys = new Set()
  /** @type {Array<keyof import('./theme/character-site-types').AnchorMap>} */
  const kinds = ['anchors', 'stubs']
  for (const map of maps) {
    for (const kind of kinds) {
      for (const key of Object.keys(map[kind])) {
        if (keys.has(key)) throw new Error(`Duplicate anchor map key: ${key}`)
        keys.add(key)
      }
    }
    Object.assign(merged.anchors, map.anchors)
    Object.assign(merged.stubs, map.stubs)
  }
  return merged
}

/** @param {string} root @returns {import('./theme/character-site-types').SiteData} */
export function loadCharacters(root = defaultRoot) {
  const definitions = discoverCharacters(root)
  const thumbs = Object.fromEntries(Object.entries(record(readJson(resolve(root, 'docs/public/site/thumbs/index.json')))).map(([key, value]) => {
    const thumb = record(value)
    return [key, { path: text(thumb.path), width: number(thumb.width), height: number(thumb.height) }]
  }))
  const originFile = resolve(root, 'catalog/origins/manifest.json')
  const origins = existsSync(originFile) ? parseManifest(readJson(originFile)) : null
  if (origins && origins.character_id !== 'origins') throw new Error(`Unsupported asset collection: ${origins.character_id}`)
  /** @type {Record<string, import('./theme/character-site-types').CharacterData>} */
  const characters = {}
  for (const definition of definitions) {
    const { id, name, role, order, portrait, listed, pages } = definition
    const dataRoot = resolve(root, 'docs/.vitepress/data', id)
    const files = Object.fromEntries(readdirSync(dataRoot).filter((file) => file.endsWith('.json')).map((file) => [file, readJson(resolve(dataRoot, file))]))
    for (const file of Object.keys(files)) {
      if (!['character.json', 'asset-names.json', 'home.json', 'layers.json', 'anchor-map.json', 'display-text.json', 'site-check.json'].includes(file)) throw new Error(`Unknown character data file: ${id}/${file}`)
    }
    for (const file of ['character.json', 'asset-names.json', 'home.json', 'anchor-map.json', 'display-text.json', 'site-check.json']) {
      if (!Object.hasOwn(files, file)) throw new Error(`Missing character data file: ${id}/${file}`)
    }
    validateSiteCheck(files['site-check.json'], id)
    const manifests = [parseManifest(readJson(resolve(root, 'catalog', id, 'manifest.json')))]
    if (origins) manifests.push({ ...origins, assets: origins.assets.filter((asset) => asset.id === `${id}-original-latest`) })
    const assets = buildAssetIndex({ character: id, manifests, names: parseNames(files['asset-names.json']), thumbs })
    if (assetById(assets, portrait).collection !== id) throw new Error(`Portrait must belong to character collection: ${id}/${portrait}`)
    const home = parseHome(files['home.json'])
    const layers = files['layers.json'] === undefined ? null : parseLayers(files['layers.json'])
    const anchorMap = parseAnchorMap(files['anchor-map.json'])
    for (const path of Object.keys(anchorMap.stubs)) validateCharacterPath(id, path)
    const displayText = Object.fromEntries(Object.entries(record(files['display-text.json'])).map(([key, value]) => [key, parseNames(value)]))
    if (layers) {
      if (!home.chapters.some((chapter) => chapter.id === layers.chapter)) throw new Error(`Unknown layer chapter: ${id}/${layers.chapter}`)
      for (const layer of layers.items) validateCharacterPath(id, layer.path)
    }
    const ids = [
      ...home.tabs.flatMap((tab) => tab.assets),
      ...home.highlights.map((entry) => entry.asset),
      ...(layers?.items ?? []).flatMap((layer) => [layer.front, layer.side, layer.back, ...Object.values(layer.tpose ?? {})]),
    ]
    for (const asset of ids) assetById(assets, asset)
    characters[id] = { id, name, role, order, portrait, listed, readingOrder: [{ path: `/characters/${id}/`, title: name }, ...pages], assets, home, layers, anchorMap, displayText }
  }
  const roster = Object.values(characters).filter((character) => character.listed)
    .sort((a, b) => a.order - b.order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map(({ id, name, role, portrait, assets, home }) => ({ id, name, role, home: `/characters/${id}/`, updated: home.updated, portrait: { asset: portrait, ...assetById(assets, portrait).thumb } }))
  return { characters, roster, anchorMap: mergeAnchorMaps(Object.values(characters).map((character) => character.anchorMap)) }
}

/** @param {import('./theme/character-site-types').RosterEntry[]} roster @returns {import('vitepress').DefaultTheme.NavItem[]} */
export function siteNav(roster) {
  return [
    ...(roster.length ? [{
      text: '角色', activeMatch: '^/characters/',
      items: roster.map(({ id, name, home }) => ({ text: name, link: home, activeMatch: `^/characters/${id}/` })),
    }] : []),
    {
      text: '世界观', activeMatch: '^/world/',
      items: [
        { text: '世界观总览', link: '/world/', activeMatch: '^/world/$' },
        { text: '抛币结契交互图解', link: '/world/#coin-pact' },
        { text: '五大种族与姓氏谱系', link: '/world/races', activeMatch: '^/world/races' },
      ],
    },
    {
      text: '通用规范', activeMatch: '^/standards/',
      items: [
        { text: '素体与规范总览', link: '/standards/', activeMatch: '^/standards/$' },
        { text: '女性标准素体', link: '/standards/female-standard', activeMatch: '^/standards/female-standard' },
        { text: '女性丰满素体', link: '/standards/female-curvy', activeMatch: '^/standards/female-curvy' },
        { text: '标准青年男素体', link: '/standards/male-standard', activeMatch: '^/standards/male-standard' },
        { text: '重壮男素体', link: '/standards/male-heavy', activeMatch: '^/standards/male-heavy' },
      ],
    },
  ]
}
