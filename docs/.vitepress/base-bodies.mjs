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

function parseMetrics(value) {
  return list(value).map((entry) => {
    const row = record(entry)
    return { label: text(row.label), value: text(row.value) }
  })
}

export function loadBaseBodies(root = defaultRoot) {
  const source = record(readJson(resolve(root, 'docs/.vitepress/data/base-bodies/base-bodies.json')))
  const manifest = parseManifest(readJson(resolve(root, 'catalog/base-bodies/manifest.json')))
  const thumbs = Object.fromEntries(Object.entries(record(readJson(resolve(root, 'docs/public/site/thumbs/index.json')))).map(([key, value]) => {
    const thumb = record(value)
    return [key, { path: text(thumb.path), width: number(thumb.width), height: number(thumb.height) }]
  }))
  const assetNames = parseNames(source.assetNames)
  const assets = buildAssetIndex({ character: 'base-bodies', manifests: [manifest], names: assetNames, thumbs })

  const overviewSource = record(source.overview)
  const overview = {
    tabs: list(overviewSource.tabs).map((entry) => {
      const tab = record(entry)
      const tabAssets = list(tab.assets).map(text)
      for (const id of tabAssets) assetById(assets, id)
      return { key: text(tab.key), label: text(tab.label), caption: text(tab.caption), assets: tabAssets }
    }),
    facts: parseFacts(overviewSource.facts),
    chapters: list(overviewSource.chapters).map((entry) => {
      const ch = record(entry)
      return { id: text(ch.id), label: text(ch.label) }
    }),
  }

  const tiers = list(source.tiers).map((entry) => {
    const tier = record(entry)
    const id = text(tier.id)
    const path = text(tier.path)
    if (!path.startsWith('/base-bodies/')) throw new Error(`Base body path outside /base-bodies/: ${path}`)
    const portraitId = text(tier.portrait)
    const portraitAsset = assetById(assets, portraitId)
    const aposeSource = record(tier.apose)
    const tposeSource = record(tier.tpose)
    const apose = { front: text(aposeSource.front), side: text(aposeSource.side), back: text(aposeSource.back) }
    const tpose = { front: text(tposeSource.front), right: text(tposeSource.right), back: text(tposeSource.back), left: text(tposeSource.left) }
    for (const assetId of [...Object.values(apose), ...Object.values(tpose)]) assetById(assets, assetId)
    return {
      id,
      code: text(tier.code),
      name: text(tier.name),
      shortName: text(tier.shortName),
      role: text(tier.role),
      scale: text(tier.scale),
      headRatio: text(tier.headRatio),
      path,
      summary: text(tier.summary),
      calloutTitle: text(tier.calloutTitle),
      callout: text(tier.callout),
      portrait: { asset: portraitId, ...portraitAsset.thumb },
      apose,
      tpose,
      facts: parseFacts(tier.facts),
      metrics: parseMetrics(tier.metrics),
    }
  })

  const readingOrder = [
    { path: '/base-bodies/', title: '通用素体总览' },
    ...tiers.map((tier) => ({ path: tier.path, title: tier.name })),
  ]

  return {
    title: text(source.title),
    subtitle: text(source.subtitle),
    intro: text(source.intro),
    status: text(source.status),
    updated: text(source.updated),
    allowedDates: list(source.allowedDates).map(text),
    overview,
    tiers,
    tiersById: Object.fromEntries(tiers.map((tier) => [tier.id, tier])),
    readingOrder,
    assets,
  }
}
