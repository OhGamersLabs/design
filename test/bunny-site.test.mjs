import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parsePackage } from '../docs/.vitepress/data/bunny-data.mjs'
import {
  assetById, bodyMeasurementScope, buildAssetIndex, createDisplayTextLookup,
  garmentMeasurementScope, readingNeighbors, resolveAnchorTarget,
  selectMeasurementMetric, selectMeasurementSource,
  selectLatest, shouldRedirectForHash, stepIndex,
} from '../docs/.vitepress/theme/bunny-site.mjs'

const json = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const manifests = [json('../catalog/bunny/3.1.0/manifest.json'), json('../catalog/origins/1.0.0/manifest.json')]
const names = json('../docs/.vitepress/data/bunny/asset-names.json')
const thumbs = json('../docs/public/site/thumbs/index.json')

test('source package follows the manifest download and requires its entry', () => {
  const downloads = [{ id: 'other-file', path: '/other.zip', bytes: 1 }, { id: 'source-images', path: '/updated-package.zip', bytes: 2048 }]
  assert.deepEqual(parsePackage(downloads), { path: '/updated-package.zip', bytes: 2048 })
  assert.throws(() => parsePackage(downloads.slice(0, 1)), /Missing manifest download: source-images/)
  assert.throws(() => parsePackage([]), /Missing manifest download: source-images/)
})

test('asset index joins manifests, finalized names and thumbnails', () => {
  const index = buildAssetIndex({ manifests, names, thumbs })
  assert.equal(Object.keys(index).length, 184)
  assert.equal(index['sun05-scene-final-v1'].web.width, 1774)
  assert.equal(index['sun05-scene-final-v1'].thumb.width, 480)
  assert.equal(index['bunny-original'].collection, 'origins/1.0.0')
  assert.throws(() => assetById(index, 'no-such-id'), /no-such-id/)
  assert.throws(() => assetById(index, 'constructor'), /constructor/)
})
test('incomplete or unknown names and missing thumbnails fail with the id', () => {
  const missing = { ...names }
  delete missing['sun05-scene-final-v1']
  assert.throws(() => buildAssetIndex({ manifests, names: missing, thumbs }), /sun05-scene-final-v1/)
  assert.throws(() => buildAssetIndex({ manifests, names: { ...names, unknown: '未知' }, thumbs }), /unknown/)
  assert.throws(() => buildAssetIndex({ manifests, names: { ...names, 'sun05-scene-final-v1': ' ' }, thumbs }), /sun05-scene-final-v1/)
  const missingThumb = { ...thumbs }
  delete missingThumb['bunny/3.1.0/sun05-scene-final-v1']
  assert.throws(() => buildAssetIndex({ manifests, names, thumbs: missingThumb }), /sun05-scene-final-v1/)
})
const records = [
  ['2026-10-29', 1, '场景图定稿', 'sun05-scene-final-v1'],
  ['2026-10-28', 1, 'STRUCTURE20 线稿通过', 'structure20-lineart-v1'],
  ['2026-10-28', 2, 'SUN-05 冲刺姿势选定', 'sun05-pose-structure-v1'],
  ['2026-10-27', 1, '后腰交叉携行三视', 'assassin-daggers-waist-carry-cel-back-v2'],
  ['2026-10-26', 1, null, 'a'], ['2026-10-26', 2, null, 'b'],
  ['2026-10-25', 1, null, 'c'], ['2026-10-25', 2, null, 'd'],
].map(([date, order, title, asset]) => ({ date, order, latest: title ? { title, asset, caption: title } : null, log: { change: '', reason: '—', asset, caption: '现行：示例' } }))
test('latest filters and sorts eight changes without changing the source', () => {
  const changes = records.toReversed()
  const before = structuredClone(changes)
  assert.deepEqual(selectLatest(changes, 4).map(({ date, title }) => [date, title]), [
    ['2026-10-29', '场景图定稿'], ['2026-10-28', 'STRUCTURE20 线稿通过'],
    ['2026-10-28', 'SUN-05 冲刺姿势选定'], ['2026-10-27', '后腰交叉携行三视'],
  ])
  assert.deepEqual(changes, before)
  assert.deepEqual(selectLatest(changes, 0), [])
})
const anchorMap = {
  stubs: { '/characters/bunny/face': { target: '/characters/bunny/#identity', title: '身份与画风' } },
  anchors: { '/characters/bunny/face#头': '/characters/bunny/#head', '/characters/bunny/#本轮补充': '/characters/bunny/archive#extra' },
}
test('legacy URLs normalize html/index and percent-encoded hashes before lookup', () => {
  assert.equal(resolveAnchorTarget(anchorMap, '/characters/bunny/face.html', '#%E5%A4%B4'), '/characters/bunny/#head')
  assert.equal(resolveAnchorTarget(anchorMap, '/characters/bunny/index.html', '#%E6%9C%AC%E8%BD%AE%E8%A1%A5%E5%85%85'), '/characters/bunny/archive#extra')
  assert.equal(resolveAnchorTarget(anchorMap, '/characters/bunny/index', '#本轮补充'), '/characters/bunny/archive#extra')
  assert.equal(resolveAnchorTarget(anchorMap, '/characters/bunny/face', ''), '/characters/bunny/#identity')
  assert.equal(resolveAnchorTarget(anchorMap, '/characters/bunny/jacket', '#jacket-wearing'), null)
  assert.equal(resolveAnchorTarget(anchorMap, '/characters/bunny/jacket', '#%broken'), null)
})
test('hash fallback requires a missing nonempty id; a later route is checked afresh', () => {
  assert.equal(shouldRedirectForHash('#x', false), true)
  assert.equal(shouldRedirectForHash('#x', true), false)
  assert.equal(shouldRedirectForHash('', false), false)
  assert.equal(shouldRedirectForHash('#', false), false)
  assert.deepEqual([true, false].map((exists) => shouldRedirectForHash('#x', exists)), [false, true])
})
test('lightbox steps clamp, including single and empty groups', () => {
  assert.equal(stepIndex(0, -1, 3), 0)
  assert.equal(stepIndex(2, 1, 3), 2)
  assert.equal(stepIndex(0, 1, 3), 1)
  assert.equal(stepIndex(0, 1, 1), 0)
  assert.equal(stepIndex(0, 1, 0), 0)
})
test('reading neighbors follow layer order and stop at both ends', () => {
  const { prev, next } = readingNeighbors('/characters/bunny/jacket')
  assert.equal(prev.path, '/characters/bunny/thigh-gear')
  assert.equal(next.path, '/characters/bunny/harness')
  assert.equal(readingNeighbors('/characters/bunny/index.html').prev, null)
  assert.equal(readingNeighbors('/characters/bunny/downloads').next, null)
  assert.deepEqual(readingNeighbors('/missing'), { prev: null, next: null })
})


const assets = buildAssetIndex({ manifests, names, thumbs })
const bodyMeasurements = json('../catalog/bunny/3.1.0/body-measurements.json')
const freshCelMeasurements = json('../catalog/bunny/3.1.0/body-measurements-fresh-cel-v1.json')
const sportsMeasurements = json('../catalog/bunny/3.1.0/body-measurements-sports-v1.json')
const garmentMeasurements = json('../catalog/bunny/3.1.0/garment-measurements.json')

test('body scope follows the web asset status and defaults to its first view', () => {
  const current = bodyMeasurementScope(bodyMeasurements, assets)
  assert.deepEqual(current.models.map(({ id }) => id), ['front', 'side', 'back'])
  assert.equal(current.defaultSourceId, 'front')
  const empty = bodyMeasurementScope(bodyMeasurements, assets, 'archive')
  assert.deepEqual(empty.models, [])
  assert.equal(empty.defaultSourceId, undefined)
  assert.equal(selectMeasurementSource(empty.models, 'front', empty.defaultSourceId), undefined)

  const freshCurrent = bodyMeasurementScope(freshCelMeasurements, assets, 'current')
  assert.deepEqual(freshCurrent.models.map(({ id }) => id), ['side', 'back'])
  assert.equal(freshCurrent.defaultSourceId, 'side')
  assert.equal(selectMeasurementSource(freshCurrent.models, 'front', freshCurrent.defaultSourceId).id, 'side')
  assert.equal(selectMeasurementSource(freshCurrent.models, 'back', freshCurrent.defaultSourceId).id, 'back')
  const freshArchive = bodyMeasurementScope(freshCelMeasurements, assets, 'archive')
  assert.deepEqual(freshArchive.models.map(({ id }) => id), ['front'])
  assert.equal(freshArchive.defaultSourceId, 'front')
})

test('body scope uses the frozen model resource defaults when no resources are supplied', () => {
  const archive = bodyMeasurementScope(sportsMeasurements, assets, 'archive')
  assert.deepEqual(archive.models.map(({ assetId }) => assetId), [
    'body-v2-full-front-v1', 'body-v2-full-side-v1', 'body-v2-full-back-v1',
  ])
  assert.deepEqual(bodyMeasurementScope(sportsMeasurements, assets, 'current').models, [])
})

test('garment scopes preserve model order, available metrics and scoped source defaults', () => {
  const current = garmentMeasurementScope(garmentMeasurements, assets)
  const archive = garmentMeasurementScope(garmentMeasurements, assets, 'archive')
  assert.equal(current.models.length, 18)
  assert.equal(current.models.filter(({ resources }) => resources.ruler).length, 6)
  assert.equal(current.hasRulers, true)
  assert.equal(current.defaultSourceId, garmentMeasurements.defaultSourceId)
  assert.equal(current.defaultMetricId, 'topLength')
  assert.equal(archive.models.length, 16)
  assert.equal(archive.models.filter(({ resources }) => resources.ruler).length, 0)
  assert.equal(archive.hasRulers, false)
  assert.equal(archive.defaultSourceId, archive.models[0].id)
  assert.equal(archive.defaultMetricId, 'topHemAboveWaist')
  const comparisonRows = archive.models.flatMap((model) => [...model.rows, ...model.derived])
    .filter(({ id }) => id === archive.defaultMetricId)
  assert.equal(comparisonRows.length, 16)
  assert.equal(selectMeasurementMetric(archive.metrics, 'topLength'), 'topHemAboveWaist')
  assert.equal(selectMeasurementMetric(current.metrics, 'topLength'), 'topLength')
  assert.equal(selectMeasurementMetric([], 'topLength'), undefined)
  assert.equal(selectMeasurementSource(current.models, 'missing', current.defaultSourceId).id, current.defaultSourceId)
  for (const scoped of [current, archive]) {
    const available = new Set(scoped.models.flatMap((model) => [...model.rows, ...model.derived].map(({ id }) => id)))
    assert.deepEqual(scoped.metrics.map(({ id }) => id), Object.keys(garmentMeasurements.metrics).filter((id) => available.has(id)))
  }
  const changedDefault = { ...garmentMeasurements, defaultSourceId: archive.models[1].id }
  assert.equal(garmentMeasurementScope(changedDefault, assets, 'archive').defaultSourceId, archive.models[1].id)
})

test('garment current scope falls back to a ruler source when the preferred source has no ruler', () => {
  const data = { ...garmentMeasurements, defaultSourceId: 'hosiery-front' }
  const current = garmentMeasurementScope(data, assets, 'current')
  assert.equal(current.models.some((model) => model.id === 'hosiery-front' && !model.resources.ruler), true)
  assert.equal(current.defaultSourceId, 'innerwear-front')
  assert.ok(current.models.find((model) => model.id === current.defaultSourceId).resources.ruler)
})

test('garment metric selector includes a metric available only through a derived row', () => {
  const data = structuredClone(garmentMeasurements)
  for (const source of Object.values(data.sources)) {
    source.measurements = source.measurements.filter(({ metricId }) => metricId !== 'jacketRightOffset')
  }
  const before = structuredClone(data)
  const scoped = garmentMeasurementScope(data, assets)
  assert.equal(scoped.models.some((model) => model.rows.some(({ id }) => id === 'jacketRightOffset')), false)
  assert.equal(scoped.models.some((model) => model.derived.some(({ id }) => id === 'jacketRightOffset')), true)
  assert.equal(scoped.metrics.some(({ id }) => id === 'jacketRightOffset'), true)
  assert.deepEqual(data, before)
})

test('measurement scopes reject unknown assets and invalid scopes, including empty sources', () => {
  const unknownBody = structuredClone(bodyMeasurements)
  unknownBody.views.front.resources.web = '/characters/bunny/3.1.0/unknown-body.webp'
  assert.throws(() => bodyMeasurementScope(unknownBody, assets, 'archive'), /Unknown asset id: unknown-body/)
  const unknownGarment = structuredClone(garmentMeasurements)
  unknownGarment.sources[Object.keys(unknownGarment.sources)[0]].resources.web = '/characters/bunny/3.1.0/unknown-garment.webp'
  assert.throws(() => garmentMeasurementScope(unknownGarment, assets, 'archive'), /Unknown asset id: unknown-garment/)
  for (const scope of ['', 'all', null]) {
    assert.throws(() => bodyMeasurementScope({ views: {} }, assets, scope), /Invalid measurement scope/)
    assert.throws(() => garmentMeasurementScope({ sources: {} }, assets, scope), /Invalid measurement scope/)
  }
})

test('display text matches whole strings globally and ignores view-label entries', () => {
  const display = createDisplayTextLookup({
    first: { '旧读数': '图面读数', shared: 'same' },
    second: { other: 'other display', shared: 'same' },
    '@labels': { 'body.side': '角色右侧面', shared: 'not the shared display' },
  })
  assert.equal(display('旧读数'), '图面读数')
  assert.equal(display('前缀旧读数'), '前缀旧读数')
  assert.equal(display('旧读数后缀'), '旧读数后缀')
  assert.equal(display('other'), 'other display')
  assert.equal(display('shared'), 'same')
  assert.equal(display('body.side'), 'body.side')
  assert.equal(display(undefined), undefined)
  assert.equal(display(null), null)
  assert.throws(() => createDisplayTextLookup({ first: { shared: 'one' }, second: { shared: 'two' } }), /Conflicting display text: shared/)
})
