import { readFileSync } from 'node:fs'

/** @param {string | URL} file @returns {unknown} */
export function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'))
}
/** @param {unknown} value @returns {Record<string, unknown>} */
export function record(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('Expected a JSON object')
  return Object.fromEntries(Object.entries(value))
}
/** @param {unknown} value @returns {unknown[]} */
export function list(value) {
  if (!Array.isArray(value)) throw new Error('Expected a JSON array')
  return value
}
/** @param {unknown} value @returns {string} */
export function text(value) {
  if (typeof value !== 'string') throw new Error('Expected a JSON string')
  return value
}
/** @param {unknown} value @returns {number} */
export function number(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Expected a finite JSON number')
  return value
}
/** @param {unknown} value @returns {Record<string, string>} */
export function parseNames(value) {
  return Object.fromEntries(Object.entries(record(value)).map(([key, name]) => [key, text(name)]))
}
/** @param {unknown} value @returns {import('../theme/character-site-types').AnchorMap} */
export function parseAnchorMap(value) {
  const source = record(value)
  return {
    anchors: parseNames(source.anchors),
    stubs: Object.fromEntries(Object.entries(record(source.stubs)).map(([path, entry]) => {
      const stub = record(entry)
      return [path, { target: text(stub.target), title: text(stub.title) }]
    })),
  }
}

/** @param {unknown} value @returns {import('../theme/character-site-types').AssetFile} */
function parseImage(value) {
  const image = record(value)
  return { path: text(image.path), width: number(image.width), height: number(image.height), bytes: number(image.bytes) }
}
/** @param {unknown} value @returns {import('../theme/character-site.mjs').Manifest} */
export function parseManifest(value) {
  const manifest = record(value)
  return {
    character_id: text(manifest.character_id),
    assets: list(manifest.assets).map((entry) => {
      const asset = record(entry)
      return { id: text(asset.id), web: parseImage(asset.web), original: parseImage(asset.original) }
    }),
  }
}
/** @param {unknown} value @returns {import('../theme/character-site-types').Fact[]} */
function parseFacts(value) {
  return list(value).map((entry) => {
    const fact = record(entry)
    return { term: text(fact.term), value: text(fact.value), ...(fact.note === undefined ? {} : { note: text(fact.note) }) }
  })
}
/** @param {unknown} value @returns {import('../theme/character-site-types').ColorChip} */
export function parseChip(value) {
  const chip = record(value)
  if (Object.hasOwn(chip, 'swatch') === Object.hasOwn(chip, 'color')) throw new Error('Chip needs exactly one of swatch or color')
  const base = { name: text(chip.name), use: text(chip.use) }
  if (Object.hasOwn(chip, 'swatch')) {
    const swatch = text(chip.swatch)
    if (swatch !== 'orange' && swatch !== 'red' && swatch !== 'white' && swatch !== 'black') throw new Error(`Invalid color swatch: ${swatch}`)
    return { ...base, swatch }
  }
  const color = text(chip.color)
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) throw new Error(`Invalid chip color: ${color}`)
  return { ...base, color }
}
/** @param {unknown} value @returns {import('../theme/character-site-types').HomeData} */
export function parseHome(value) {
  const home = record(value)
  return {
    tabs: list(home.tabs).map((entry) => {
      const tab = record(entry)
      const key = text(tab.key)
      if (key !== 'scene' && key !== 'three' && key !== 'tpose' && key !== 'line' && key !== 'card') throw new Error(`Invalid hero tab: ${key}`)
      return { key, label: text(tab.label), caption: text(tab.caption), assets: list(tab.assets).map(text) }
    }),
    highlights: list(home.highlights).map((entry) => {
      const item = record(entry)
      return { date: text(item.date), title: text(item.title), asset: text(item.asset), caption: text(item.caption) }
    }),
    facts: parseFacts(home.facts),
    chips: list(home.chips).map(parseChip),
    chipNote: text(home.chipNote), status: text(home.status), updated: text(home.updated),
    chapters: list(home.chapters).map((entry) => {
      const chapter = record(entry)
      return { id: text(chapter.id), label: text(chapter.label) }
    }),
  }
}
/** T-pose views are optional: a character drawn in one stance only (a mech, an animal) has none. @param {unknown} value */
function parseTpose(value) {
  const tpose = record(value)
  return { front: text(tpose.front), right: text(tpose.right), back: text(tpose.back), left: text(tpose.left) }
}
/** @param {unknown} value @returns {import('../theme/character-site-types').LayerSet} */
export function parseLayers(value) {
  const source = record(value)
  const numbers = new Set()
  const items = list(source.items).map((entry) => {
    const layer = record(entry)
    const n = number(layer.layer)
    if (!Number.isInteger(n) || numbers.has(n)) throw new Error(`Invalid or duplicate layer number: ${n}`)
    numbers.add(n)
    return {
      layer: n, name: text(layer.name), path: text(layer.path), front: text(layer.front), side: text(layer.side), back: text(layer.back),
      ...(layer.tpose === undefined ? {} : { tpose: parseTpose(layer.tpose) }),
      summary: text(layer.summary), facts: parseFacts(layer.facts), leftRight: text(layer.leftRight),
    }
  })
  if (!items.length) throw new Error('Layer set needs at least one layer')
  return { chapter: text(source.chapter), noun: text(source.noun), wear: text(source.wear), items }
}

/** @param {string} id @param {string} path */
export function validateCharacterPath(id, path) {
  if (!path.startsWith(`/characters/${id}/`)) throw new Error(`Path outside character ${id}: ${path}`)
}

/** @param {unknown} value @param {string} id @param {boolean} listed @returns {import('../theme/character-site-types').CharacterDefinition} */
export function parseCharacter(value, id, listed) {
  const character = record(value)
  const pages = list(character.pages).map((entry) => {
    const page = record(entry)
    const path = text(page.path)
    validateCharacterPath(id, path)
    return { path, title: text(page.title) }
  })
  const portrait = text(character.portrait)
  if (portrait === `${id}-original-latest`) throw new Error(`Portrait must belong to character collection: ${id}/${portrait}`)
  const group = character.group === undefined ? undefined : text(character.group)
  if (group !== undefined && group !== 'squad' && group !== 'major-cast') throw new Error(`Invalid character group: ${id}/${group}`)
  return {
    id,
    name: text(character.name),
    role: text(character.role),
    order: number(character.order),
    portrait,
    listed,
    ...(group === undefined ? {} : { group }),
    pages,
  }
}

/** Validate checker expectations even for characters without pages. @param {unknown} value @param {string} id */
export function validateSiteCheck(value, id) {
  const spec = record(value)
  for (const key of Object.keys(spec)) {
    if (!['allowedDates', 'forbiddenWords', 'fixedCaptions'].includes(key)) throw new Error(`Unknown site-check.json key: ${id}/${key}`)
  }
  list(spec.allowedDates).forEach(text)
  list(spec.forbiddenWords).forEach(text)
  parseNames(spec.fixedCaptions)
}
