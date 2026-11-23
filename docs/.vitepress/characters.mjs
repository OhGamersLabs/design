import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { assetById, buildAssetIndex } from './theme/character-site.mjs'
import {
  number, parseCharacter, parseHome, parseLayers, parseManifest,
  parseNames, readJson, record, text, validateCharacterPath, validateSiteCheck,
} from './data/character-data.mjs'

const defaultRoot = fileURLToPath(new URL('../../', import.meta.url))
const SHARED_DATA_DIRS = new Set(['origins', 'base-bodies', 'world', 'story'])

/** A data folder exists independently of its optional home page. @param {string} root @returns {import('./theme/character-site-types').CharacterDefinition[]} */
export function discoverCharacters(root = defaultRoot) {
  const dataRoot = resolve(root, 'docs/.vitepress/data')
  return readdirSync(dataRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(resolve(dataRoot, entry.name, 'character.json')))
    .sort((a, b) => a.name < b.name ? -1 : a.name > b.name ? 1 : 0)
    .map(({ name: id }) => {
      if (SHARED_DATA_DIRS.has(id) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error(`Invalid character id: ${id}`)
      return parseCharacter(readJson(resolve(dataRoot, id, 'character.json')), id, existsSync(resolve(root, 'docs/characters', id, 'index.md')))
    })
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
    const { id, name, role, order, portrait, listed, group, accent, pages } = definition
    const dataRoot = resolve(root, 'docs/.vitepress/data', id)
    const files = Object.fromEntries(readdirSync(dataRoot).filter((file) => file.endsWith('.json')).map((file) => [file, readJson(resolve(dataRoot, file))]))
    for (const file of Object.keys(files)) {
      if (!['character.json', 'asset-names.json', 'home.json', 'layers.json', 'display-text.json', 'site-check.json'].includes(file)) throw new Error(`Unknown character data file: ${id}/${file}`)
    }
    for (const file of ['character.json', 'asset-names.json', 'home.json', 'display-text.json', 'site-check.json']) {
      if (!Object.hasOwn(files, file)) throw new Error(`Missing character data file: ${id}/${file}`)
    }
    validateSiteCheck(files['site-check.json'], id)
    const manifests = [parseManifest(readJson(resolve(root, 'catalog', id, 'manifest.json')))]
    if (origins) manifests.push({ ...origins, assets: origins.assets.filter((asset) => asset.id === `${id}-original-latest`) })
    const assets = buildAssetIndex({ character: id, manifests, names: parseNames(files['asset-names.json']), thumbs })
    if (assetById(assets, portrait).collection !== id) throw new Error(`Portrait must belong to character collection: ${id}/${portrait}`)
    const home = parseHome(files['home.json'])
    const layers = files['layers.json'] === undefined ? null : parseLayers(files['layers.json'])
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
    characters[id] = {
      id, name, role, order, portrait, listed,
      ...(group === undefined ? {} : { group }),
      ...(accent === undefined ? {} : { accent }),
      readingOrder: [{ path: `/characters/${id}/`, title: name }, ...pages],
      assets, home, layers, displayText,
    }
  }
  const toRosterEntry = ({ id, name, role, portrait, accent, assets, home }) => ({
    id, name, role, home: `/characters/${id}/`, updated: home.updated,
    ...(accent === undefined ? {} : { accent }),
    portrait: { asset: portrait, ...assetById(assets, portrait).thumb },
  })
  const byOrder = (a, b) => a.order - b.order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  const roster = Object.values(characters).filter((character) => character.listed && (character.group ?? 'squad') === 'squad').sort(byOrder).map(toRosterEntry)
  const majorCast = Object.values(characters).filter((character) => character.listed && character.group === 'major-cast').sort(byOrder).map(toRosterEntry)
  return { characters, roster, majorCast }
}

/**
 * @param {import('./theme/character-site-types').RosterEntry[]} roster
 * @param {import('./theme/character-site-types').RosterEntry[]} [majorCast]
 * @returns {import('vitepress').DefaultTheme.NavItem[]}
 */
export function siteNav(roster, majorCast = []) {
  const characterItems = majorCast.length
    ? [
      {
        text: '星环小队（11人）',
        items: roster.map(({ id, name, home }) => ({ text: name, link: home, activeMatch: `^/characters/${id}/` })),
      },
      {
        text: '宿敌与剧情角色',
        items: [
          ...majorCast.map(({ id, name, home }) => ({ text: name, link: home, activeMatch: `^/characters/${id}/` })),
          { text: '普通剧情角色图鉴', link: '/world/cast', activeMatch: '^/world/cast' },
        ],
      },
    ]
    : roster.map(({ id, name, home }) => ({ text: name, link: home, activeMatch: `^/characters/${id}/` }))

  return [
    ...(roster.length ? [{
      text: '角色', activeMatch: '^/characters/',
      items: characterItems,
    }] : []),
    {
      text: '世界观', activeMatch: '^/world/',
      items: [
        { text: '世界观总览', link: '/world/', activeMatch: '^/world/$' },
        { text: '抛币结契交互图解', link: '/world/#coin-pact' },
        { text: '五大种族与姓氏谱系', link: '/world/races', activeMatch: '^/world/races' },
        { text: '剧情角色与敌方图鉴', link: '/world/cast', activeMatch: '^/world/cast' },
      ],
    },
    {
      text: '主线连载', activeMatch: '^/story/',
      items: [
        { text: '连载总览', link: '/story/', activeMatch: '^/story/$' },
        { text: '第 01 话：0.00 的游戏币', link: '/story/ep01', activeMatch: '^/story/ep01' },
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
