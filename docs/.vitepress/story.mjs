import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { assetById, buildAssetIndex } from './theme/character-site.mjs'
import { list, number, parseManifest, parseNames, readJson, record, text } from './data/character-data.mjs'

const defaultRoot = fileURLToPath(new URL('../../', import.meta.url))

export function loadStory(root = defaultRoot) {
  const source = record(readJson(resolve(root, 'docs/.vitepress/data/story/story.json')))
  const manifestPath = resolve(root, 'catalog/story/manifest.json')
  if (!existsSync(manifestPath)) throw new Error('Missing catalog/story/manifest.json')
  const manifest = parseManifest(readJson(manifestPath))
  const thumbs = Object.fromEntries(Object.entries(record(readJson(resolve(root, 'docs/public/site/thumbs/index.json')))).map(([key, value]) => {
    const thumb = record(value)
    return [key, { path: text(thumb.path), width: number(thumb.width), height: number(thumb.height) }]
  }))
  const assetNames = parseNames(source.assetNames ?? {})
  const assets = buildAssetIndex({ character: 'story', manifests: [manifest], names: assetNames, thumbs })

  const episodes = list(source.episodes).map((entry) => {
    const ep = record(entry)
    const acts = list(ep.acts).map((rawAct) => {
      const act = record(rawAct)
      return { id: text(act.id), code: text(act.code), title: text(act.title), range: text(act.range) }
    })
    const actIds = new Set(acts.map((a) => a.id))
    const pages = list(ep.pages).map((rawPage) => {
      const p = record(rawPage)
      const asset = text(p.asset)
      assetById(assets, asset)
      const actId = text(p.actId)
      if (!actIds.has(actId)) throw new Error(`Unknown story actId: ${actId}`)
      return {
        index: number(p.index),
        asset,
        pageLabel: text(p.pageLabel),
        actId,
        spread: Boolean(p.spread),
        title: text(p.title),
      }
    })
    const coverAsset = text(ep.coverAsset)
    assetById(assets, coverAsset)
    const previewAssets = list(ep.previewAssets).map((id) => {
      const aid = text(id)
      assetById(assets, aid)
      return aid
    })
    return {
      id: text(ep.id),
      number: text(ep.number),
      title: text(ep.title),
      enTitle: text(ep.enTitle),
      path: text(ep.path),
      updated: text(ep.updated),
      pageCountLabel: text(ep.pageCountLabel),
      readingDirection: text(ep.readingDirection),
      coverAsset,
      coverThumb: { asset: coverAsset, ...assetById(assets, coverAsset).thumb },
      previewAssets,
      previewThumbs: previewAssets.map((aid) => ({ asset: aid, ...assetById(assets, aid).thumb })),
      summary: text(ep.summary),
      featuredCharacters: list(ep.featuredCharacters).map(text),
      featuredNpcs: list(ep.featuredNpcs).map(text),
      acts,
      pages,
    }
  })

  const readingOrder = [
    { path: '/story/', title: '主线漫画连载' },
    ...episodes.map((ep) => ({ path: ep.path, title: ep.title })),
  ]

  return {
    title: text(source.title),
    subtitle: text(source.subtitle),
    updated: text(source.updated),
    status: text(source.status),
    allowedDates: list(source.allowedDates).map(text),
    intro: text(source.intro),
    episodes,
    episodesById: Object.fromEntries(episodes.map((ep) => [ep.id, ep])),
    readingOrder,
    assets,
  }
}
