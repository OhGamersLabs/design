import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  activeChapterId, assetById, bodyMeasurementScope, buildAssetIndex, createDisplayTextLookup,
  focusAfterStep, garmentMeasurementScope, readingLine, readingNeighbors, resolveAnchorTarget,
  selectMeasurementMetric, selectMeasurementSource,
  shouldRedirectForHash, stepIndex,
} from '../docs/.vitepress/theme/bunny-site.mjs'

const json = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const manifests = [json('../catalog/bunny/manifest.json'), json('../catalog/origins/manifest.json')]
const names = json('../docs/.vitepress/data/bunny/asset-names.json')
const thumbs = json('../docs/public/site/thumbs/index.json')

test('asset index joins manifests, finalized names and thumbnails', () => {
  const index = buildAssetIndex({ manifests, names, thumbs })
  assert.equal(Object.keys(index).length, 54)
  assert.equal(index['sun05-scene-latest'].web.width, 1774)
  assert.equal(index['sun05-scene-latest'].thumb.width, 480)
  assert.equal(index['bunny-original-latest'].collection, 'origins')
  assert.throws(() => assetById(index, 'no-such-id'), /no-such-id/)
  assert.throws(() => assetById(index, 'constructor'), /constructor/)
})
test('incomplete or unknown names and missing thumbnails fail with the id', () => {
  const missing = { ...names }
  delete missing['sun05-scene-latest']
  assert.throws(() => buildAssetIndex({ manifests, names: missing, thumbs }), /sun05-scene-latest/)
  assert.throws(() => buildAssetIndex({ manifests, names: { ...names, unknown: '未知' }, thumbs }), /unknown/)
  assert.throws(() => buildAssetIndex({ manifests, names: { ...names, 'sun05-scene-latest': ' ' }, thumbs }), /sun05-scene-latest/)
  const missingThumb = { ...thumbs }
  delete missingThumb['bunny/sun05-scene-latest']
  assert.throws(() => buildAssetIndex({ manifests, names, thumbs: missingThumb }), /sun05-scene-latest/)
})
const anchorMap = {
  stubs: { '/characters/bunny/face': { target: '/characters/bunny/#identity', title: '身份与画风' } },
  anchors: { '/characters/bunny/face#头': '/characters/bunny/#head', '/characters/bunny/#本轮补充': '/characters/bunny/' },
}
test('legacy URLs normalize html/index and percent-encoded hashes before lookup', () => {
  assert.equal(resolveAnchorTarget(anchorMap, '/characters/bunny/face.html', '#%E5%A4%B4'), '/characters/bunny/#head')
  assert.equal(resolveAnchorTarget(anchorMap, '/characters/bunny/index.html', '#%E6%9C%AC%E8%BD%AE%E8%A1%A5%E5%85%85'), '/characters/bunny/')
  assert.equal(resolveAnchorTarget(anchorMap, '/characters/bunny/index', '#本轮补充'), '/characters/bunny/')
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

test('lightbox focus moves to the other paging button when the focused one is disabled at an end', () => {
  assert.equal(focusAfterStep('next', { prevDisabled: false, nextDisabled: true }), 'prev')
  assert.equal(focusAfterStep('prev', { prevDisabled: true, nextDisabled: false }), 'next')
  assert.equal(focusAfterStep('next', { prevDisabled: true, nextDisabled: true }), 'close')
  assert.equal(focusAfterStep('next', { prevDisabled: false, nextDisabled: false }), null)
  assert.equal(focusAfterStep('other', { prevDisabled: true, nextDisabled: true }), null)
})

test('chapter highlight follows the reading line both ways and settles at the page bottom', () => {
  const view = { line: 315, viewportHeight: 900, atBottom: false, hashId: '' }
  const headings = (tops) => ['identity', 'body', 'layers', 'expressions'].map((id, index) => ({ id, top: tops[index] }))
  assert.equal(activeChapterId(headings([400, 1600, 2800, 4000]), view), '')
  assert.equal(activeChapterId(headings([-2000, -200, 600, 1800]), view), 'body')
  assert.equal(activeChapterId(headings([-3000, -1800, 315, 1500]), view), 'layers')
  assert.equal(activeChapterId(headings([-3000, null, 200, 1500]), view), 'layers')
  const bottom = { ...view, atBottom: true }
  assert.equal(activeChapterId(headings([-4000, -2800, 380, 700]), { ...bottom, hashId: 'layers' }), 'layers')
  assert.equal(activeChapterId(headings([-4000, -2800, 380, 700]), bottom), 'expressions')
  assert.equal(activeChapterId(headings([-4000, -2800, -900, 700]), { ...bottom, hashId: 'body' }), 'expressions')
})

test('reading line never sits above the heading landing position on short viewports', () => {
  assert.equal(readingLine(900, 134), 315)
  assert.equal(readingLine(340, 134), 135)
  const headings = [{ id: 'identity', top: -400 }, { id: 'body', top: 134 }, { id: 'layers', top: 900 }]
  assert.equal(activeChapterId(headings, { line: readingLine(340, 134), viewportHeight: 340, atBottom: false, hashId: 'body' }), 'body')
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
const bodyMeasurements = json('../catalog/bunny/body-measurements.json')
const garmentMeasurements = json('../catalog/bunny/garment-measurements.json')

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
  unknownBody.views.front.resources.web = '/characters/bunny/unknown-body-latest.webp'
  assert.throws(() => bodyMeasurementScope(unknownBody, assets, 'current'), /Unknown asset id: unknown-body/)
  const unknownGarment = structuredClone(garmentMeasurements)
  unknownGarment.sources[Object.keys(unknownGarment.sources)[0]].resources.web = '/characters/bunny/unknown-garment-latest.webp'
  assert.throws(() => garmentMeasurementScope(unknownGarment, assets, 'current'), /Unknown asset id: unknown-garment/)
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


test('only current measurement sources remain and resolve to stable assets', () => {
  const body = bodyMeasurementScope(bodyMeasurements, assets)
  assert.deepEqual(body.models.map(({ id }) => id), ['front', 'side', 'back'])
  assert.equal(body.defaultSourceId, 'front')
  const garment = garmentMeasurementScope(garmentMeasurements, assets)
  assert.equal(garment.models.length, 18)
  assert.equal(garment.models.filter(({ resources }) => resources.ruler).length, 6)
  for (const model of [...body.models, ...garment.models]) assert.match(model.resources.web, /-latest[.]webp$/)
  assert.equal(garment.defaultSourceId, garmentMeasurements.defaultSourceId)
  for (const fn of [bodyMeasurementScope, garmentMeasurementScope]) assert.throws(() => fn({}, assets, 'archive'), /Invalid measurement scope/)
})

test('home highlights reference current image identities without change history', () => {
  const home = json('../docs/.vitepress/data/bunny/home.json')
  assert.equal(home.highlights.length, 4)
  for (const entry of home.highlights) assert.ok(assets[entry.asset])
  assert.ok(home.chapters.every(({ id }) => id !== 'downloads'))
})
