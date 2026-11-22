import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { assetById, buildAssetIndex } from './theme/character-site.mjs'
import { list, number, parseManifest, parseNames, readJson, record, text } from './data/character-data.mjs'

const defaultRoot = fileURLToPath(new URL('../../', import.meta.url))

function parseFacts(value) {
  return list(value).map((entry) => {
    const fact = record(entry)
    return { term: text(fact.term), value: text(fact.value), ...(fact.note === undefined ? {} : { note: text(fact.note) }) }
  })
}

function parseSectionCards(raw, listKey) {
  const obj = record(raw)
  return {
    lead: text(obj.lead),
    items: list(obj[listKey]).map((entry) => {
      const item = record(entry)
      return { code: text(item.code), title: text(item.title), body: text(item.body) }
    }),
  }
}

export function loadWorld(root = defaultRoot) {
  const source = record(readJson(resolve(root, 'docs/.vitepress/data/world/world.json')))
  const manifest = parseManifest(readJson(resolve(root, 'catalog/world/manifest.json')))
  const thumbs = Object.fromEntries(Object.entries(record(readJson(resolve(root, 'docs/public/site/thumbs/index.json')))).map(([key, value]) => {
    const thumb = record(value)
    return [key, { path: text(thumb.path), width: number(thumb.width), height: number(thumb.height) }]
  }))
  const assetNames = parseNames(source.assetNames)
  const assets = buildAssetIndex({ character: 'world', manifests: [manifest], names: assetNames, thumbs })
  const relicSheetsSource = record(source.relicSheets)
  const relicSheets = {
    lead: text(relicSheetsSource.lead),
    items: list(relicSheetsSource.items).map((entry) => {
      const item = record(entry)
      const assetId = text(item.asset)
      assetById(assets, assetId)
      return {
        asset: assetId,
        code: text(item.code),
        title: text(item.title),
        caption: text(item.caption),
        badges: list(item.badges).map((b) => {
          const badge = record(b)
          return { pos: text(badge.pos), desc: text(badge.desc) }
        }),
      }
    }),
  }
  const races = list(source.races).map((entry) => {
    const race = record(entry)
    return {
      id: text(race.id),
      name: text(race.name),
      enName: text(race.enName),
      tagline: text(race.tagline),
      physiology: text(race.physiology),
      homeland: text(race.homeland),
      surnameRule: text(race.surnameRule),
      members: list(race.members).map(text),
    }
  })
  const raceIds = new Set(races.map((r) => r.id))
  const characters = Object.fromEntries(
    Object.entries(record(source.characters)).map(([id, value]) => {
      const ch = record(value)
      const raceId = text(ch.raceId)
      if (!raceIds.has(raceId)) throw new Error(`Unknown raceId for ${id}: ${raceId}`)
      return [
        id,
        {
          id: text(ch.id),
          name: text(ch.name),
          enName: text(ch.enName),
          ...(ch.twinNote === undefined ? {} : { twinNote: text(ch.twinNote) }),
          raceId,
          raceLabel: text(ch.raceLabel),
          role: text(ch.role),
          pactTrait: text(ch.pactTrait),
          pactScene: text(ch.pactScene),
          tagline: text(ch.tagline),
          signatureGear: text(ch.signatureGear),
          bonds: text(ch.bonds),
          story: list(ch.story).map(text),
        },
      ]
    }),
  )
  const originSection = parseSectionCards(source.originAndFactions, 'factions')
  const pactSection = parseSectionCards(source.coinPact, 'axioms')
  const echoesSection = parseSectionCards(source.echoesAndArk, 'cards')
  const pillars = list(source.pillars).map((entry) => {
    const item = record(entry)
    return { code: text(item.code), title: text(item.title), body: text(item.body) }
  })
  const overviewChapters = list(source.overviewChapters).map((entry) => {
    const ch = record(entry)
    return { id: text(ch.id), label: text(ch.label) }
  })
  const readingOrder = [
    { path: '/world/', title: '世界观总览' },
    { path: '/world/races', title: '五大种族与姓氏谱系' },
  ]
  return {
    title: text(source.title),
    subtitle: text(source.subtitle),
    updated: text(source.updated),
    status: text(source.status),
    intro: text(source.intro),
    facts: parseFacts(source.facts),
    overviewChapters,
    relicSheets,
    originAndFactions: { lead: originSection.lead, factions: originSection.items },
    coinPact: { lead: pactSection.lead, axioms: pactSection.items },
    echoesAndArk: { lead: echoesSection.lead, cards: echoesSection.items },
    pillars,
    races,
    racesById: Object.fromEntries(races.map((r) => [r.id, r])),
    characters,
    readingOrder,
    assets,
  }
}
