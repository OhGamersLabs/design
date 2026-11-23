import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  activeChapterId, assetById, bodyMeasurementScope, buildAssetIndex, createDisplayTextLookup,
  focusAfterStep, garmentMeasurementScope, readingLine, readingNeighbors,   selectMeasurementMetric, selectMeasurementSource,
  stepIndex,
} from '../docs/.vitepress/theme/character-site.mjs'

const json = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const character = json('../docs/.vitepress/data/bonnie/character.json')
const readingOrder = [{ path: '/characters/bonnie/', title: character.name }, ...character.pages]
// The site gives each character only its own original from the shared origins collection (characters.mjs).
const origins = json('../catalog/origins/manifest.json')
const manifests = [json('../catalog/bonnie/manifest.json'), { ...origins, assets: origins.assets.filter((asset) => asset.id === 'bonnie-original-latest') }]
const names = json('../docs/.vitepress/data/bonnie/asset-names.json')
const thumbs = json('../docs/public/site/thumbs/index.json')

test('asset index joins manifests, finalized names and thumbnails', () => {
  const index = buildAssetIndex({ character: 'bonnie', manifests, names, thumbs })
  assert.equal(Object.keys(index).length, 96)
  assert.equal(index['sun05-scene-latest'].web.width, 1774)
  assert.equal(index['sun05-scene-latest'].thumb.width, 480)
  assert.equal(index['bonnie-original-latest'].collection, 'origins')
  assert.throws(() => assetById(index, 'no-such-id'), /no-such-id/)
  assert.throws(() => assetById(index, 'constructor'), /constructor/)
})
test('incomplete or unknown names and missing thumbnails fail with the id', () => {
  const missing = { ...names }
  delete missing['sun05-scene-latest']
  assert.throws(() => buildAssetIndex({ character: 'bonnie', manifests, names: missing, thumbs }), /sun05-scene-latest/)
  assert.throws(() => buildAssetIndex({ character: 'bonnie', manifests, names: { ...names, unknown: '未知' }, thumbs }), /unknown/)
  assert.throws(() => buildAssetIndex({ character: 'bonnie', manifests, names: { ...names, 'sun05-scene-latest': ' ' }, thumbs }), /sun05-scene-latest/)
  const missingThumb = { ...thumbs }
  delete missingThumb['bonnie/sun05-scene-latest']
  assert.throws(() => buildAssetIndex({ character: 'bonnie', manifests, names, thumbs: missingThumb }), /sun05-scene-latest/)
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
  const { prev, next } = readingNeighbors(readingOrder, '/characters/bonnie/jacket')
  assert.equal(prev.path, '/characters/bonnie/thigh-gear')
  assert.equal(next.path, '/characters/bonnie/headgear')
  assert.equal(readingNeighbors(readingOrder, '/characters/bonnie/headgear').next.path, '/characters/bonnie/harness')
  assert.equal(readingNeighbors(readingOrder, '/characters/bonnie/harness').next.path, '/characters/bonnie/weapon')
  assert.equal(readingNeighbors(readingOrder, '/characters/bonnie/index.html').prev, null)
  assert.equal(readingNeighbors(readingOrder, '/characters/bonnie/downloads').next, null)
  assert.deepEqual(readingNeighbors(readingOrder, '/missing'), { prev: null, next: null })
})


const assets = buildAssetIndex({ character: 'bonnie', manifests, names, thumbs })
const bodyMeasurements = json('../catalog/bonnie/body-measurements.json')
const garmentMeasurements = json('../catalog/bonnie/garment-measurements.json')

test('garment current scope falls back to a ruler source when the preferred source has no ruler', () => {
  const data = { ...garmentMeasurements, defaultSourceId: 'hosiery-front' }
  const current = garmentMeasurementScope(data, assets, 'bonnie', 'current')
  assert.equal(current.models.some((model) => model.id === 'hosiery-front' && !model.resources.ruler), true)
  assert.equal(current.defaultSourceId, 'innerwear-front')
  assert.ok(current.models.find((model) => model.id === current.defaultSourceId).resources.ruler)
})

test('garment metric selector includes a metric available only through a derived row', () => {
  const data = structuredClone(garmentMeasurements)
  for (const source of Object.values(data.sources)) {
    source.measurements = source.measurements.filter(({ metricId }) => metricId !== 'jacketRightOffset')
  }
  // Build this selector fixture explicitly; current artwork need not expose any derived rows.
  data.sources['jacket-highlow-base-aligned-front'].referenceDerivedMetrics = [{
    metricId: 'jacketRightOffset',
    current: { metricId: 'jacketFrontTipRight', endpoint: 1 },
    reference: { sourceId: 'innerwear-front', metricId: 'topMatchedRightHem', endpoint: 1, sha256: data.sources['innerwear-front'].source.sha256 },
  }]
  const before = structuredClone(data)
  const scoped = garmentMeasurementScope(data, assets, 'bonnie')
  assert.equal(scoped.models.some((model) => model.rows.some(({ id }) => id === 'jacketRightOffset')), false)
  assert.equal(scoped.models.some((model) => model.derived.some(({ id }) => id === 'jacketRightOffset')), true)
  assert.equal(scoped.metrics.some(({ id }) => id === 'jacketRightOffset'), true)
  const derived = scoped.models.find(({ id }) => id === 'jacket-highlow-base-aligned-front').derived[0]
  assert.equal(derived.stationMatched, true)
  assert.ok(Number.isFinite(derived.normalized))
  assert.equal(derived.referenceSourceSha256, data.sources['innerwear-front'].source.sha256)
  assert.deepEqual(data, before)
  const wrongHash = structuredClone(data)
  wrongHash.sources['jacket-highlow-base-aligned-front'].referenceDerivedMetrics[0].reference.sha256 = '0'.repeat(64)
  assert.throws(() => garmentMeasurementScope(wrongHash, assets, 'bonnie'), /exact same-view source/)
})

test('measurement scopes reject unknown assets and invalid scopes, including empty sources', () => {
  const unknownBody = structuredClone(bodyMeasurements)
  unknownBody.views.front.resources.web = '/characters/bonnie/unknown-body-latest.webp'
  assert.throws(() => bodyMeasurementScope(unknownBody, assets, 'bonnie', 'current'), /Unknown asset id: unknown-body/)
  const unknownGarment = structuredClone(garmentMeasurements)
  unknownGarment.sources[Object.keys(unknownGarment.sources)[0]].resources.web = '/characters/bonnie/unknown-garment-latest.webp'
  assert.throws(() => garmentMeasurementScope(unknownGarment, assets, 'bonnie', 'current'), /Unknown asset id: unknown-garment/)
  for (const scope of ['', 'all', null]) {
    assert.throws(() => bodyMeasurementScope({ views: {} }, assets, 'bonnie', scope), /Invalid measurement scope/)
    assert.throws(() => garmentMeasurementScope({ sources: {} }, assets, 'bonnie', scope), /Invalid measurement scope/)
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
  const body = bodyMeasurementScope(bodyMeasurements, assets, 'bonnie')
  assert.deepEqual(body.models.map(({ id }) => id), ['front', 'side', 'back'])
  assert.equal(body.defaultSourceId, 'front')
  const garment = garmentMeasurementScope(garmentMeasurements, assets, 'bonnie')
  assert.equal(garment.models.length, 18)
  assert.equal(garment.models.filter(({ resources }) => resources.ruler).length, 6)
  for (const model of [...body.models, ...garment.models]) assert.match(model.resources.web, /-latest[.]webp$/)
  assert.equal(garment.defaultSourceId, garmentMeasurements.defaultSourceId)
  for (const fn of [bodyMeasurementScope, garmentMeasurementScope]) assert.throws(() => fn({}, assets, 'bonnie', 'archive'), /Invalid measurement scope/)
})

test('home highlights reference current image identities without change history', () => {
  const home = json('../docs/.vitepress/data/bonnie/home.json')
  assert.equal(home.highlights.length, 4)
  for (const entry of home.highlights) assert.ok(assets[entry.asset])
  assert.ok(home.chapters.every(({ id }) => id !== 'downloads'))
})


test('all ten cumulative layers use the approved order and four character-relative T-pose views', () => {
  const layers = json('../docs/.vitepress/data/bonnie/layers.json').items
  const prefixes = ['body', 'innerwear', 'hosiery', 'shoes', 'hands', 'thigh-gear', 'jacket', 'goggles', 'belt', 'daggers']
  assert.deepEqual(layers.map(({ layer }) => layer), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  assert.deepEqual(layers.map(({ name }) => name), ['身体', '上衣与短裤', '袜装', '鞋靴', '手部', '腿带', '橙色夹克', '护目镜', '裤腰皮带', '双匕首'])
  for (const [i, layer] of layers.entries()) {
    assert.equal(layer.front, `${prefixes[i]}-front-latest`)
    assert.equal(layer.side, `${prefixes[i]}-side-latest`)
    assert.equal(layer.back, `${prefixes[i]}-back-latest`)
    assert.deepEqual(layer.tpose, Object.fromEntries(['front', 'right', 'back', 'left'].map(view => [view, `${prefixes[i]}-tpose-${view}-latest`])))
    for (const id of Object.values(layer.tpose)) assert.ok(assets[id], id)
    const page = readFileSync(new URL(`../docs${layer.path}.md`, import.meta.url), 'utf8')
    assert.match(page, new RegExp(`layer: ${i}\\n`))
    assert.ok(page.includes(`<LayerTpose :layer="${i}" />`), layer.path)
  }
  assert.equal(layers[7].path, '/characters/bonnie/headgear')
  assert.equal(layers[8].path, '/characters/bonnie/harness')
  assert.equal(layers[9].path, '/characters/bonnie/weapon')
  assert.equal(layers[9].facts.find(({ term }) => term === '外层').value, '最外层')
  const home = json('../docs/.vitepress/data/bonnie/home.json')
  assert.deepEqual(home.tabs.find(({ key }) => key === 'tpose').assets, Object.values(layers[9].tpose))
  assert.equal(home.updated, '2026-11-22')
})

test('downloadable dagger specification matches the approved leather-tab carry source', () => {
  const source = json('../catalog/bonnie/dagger-dimensions.json')
  assert.deepEqual(json('../docs/public/catalog/bonnie/dagger-dimensions.json'), source)
  const carry = source.carryingDesign.definition
  const visible = source.carryingDesign.visibleAppearance
  assert.match(carry, /^设计要求：/)
  assert.match(visible, /^图面可见：/)
  for (const term of ['窄口', '28°']) assert.ok(carry.includes(term), term)
  for (const term of ['不带鞘', '黑色皮挂片', '圆形银按扣', '骨白在外']) assert.ok(visible.includes(term), term)
  assert.doesNotMatch(carry, /圆形银按扣|红领|骨白在外|柄尾朝|伸向另一侧|贴着后背|拇指/)
  assert.doesNotMatch(carry + visible, /刀鞘|短托|束带|带耳/)
})

test('dagger totals and every master proportion use the current owner length decision', () => {
  const source = json('../catalog/bonnie/dagger-dimensions.json')
  assert.equal(source.updated, '2026-11-22')
  assert.deepEqual(source.designTargets.rootTotalDecision, {
    path: '/Users/roy/Developments/x_ops/output/bunny-l9-4k-evidence/l9n-length-angle-decision.json',
    sha256: '4d401d922c4e653824cb28f439e7fb109a00e79f76f46c56bbe7131fc1455d59',
  })
  const segmentKeys = { blade_axial: 'blade', guard_center_band: 'guard_center_band', red_collar: 'red_collar', visible_grip: 'visible_grip', pommel_axial: 'pommel' }
  for (const [name, total] of Object.entries({ dark: 0.2246, ivory: 0.2633 })) {
    const target = source.designTargets.values[name]
    const current = source.currentDimensions.values[name]
    const observed = source.sourceObservations[0].observations.find((item) => item.name === name)
    assert.equal(target.total_H0, total)
    assert.equal(current.total_H0, total)
    assert.equal(target.totalReferencePx, total * source.designUnit.H0Px)
    assert.equal(current.H0PerSourcePixel, total / current.sourceLengthPx)
    assert.deepEqual(current.partsAndWidths_H0, target.partsAndWidths_H0)
    for (const [key, segment] of Object.entries(segmentKeys)) {
      assert.ok(Math.abs(target.partsAndWidths_H0[key] - observed.segments[segment].fraction_of_L * total) < 1e-12, `${name}: ${key}`)
    }
    for (const [key, width] of [['blade_max_front_width', 'blade'], ['grip_max_front_width', 'grip']]) {
      assert.ok(Math.abs(target.partsAndWidths_H0[key] - observed.widths[width].threshold_sensitivity['210'].fraction_of_L * total) < 1e-12, `${name}: ${key}`)
    }
    assert.ok(Math.abs(target.partsAndWidths_H0.guard_transverse_envelope - observed.guard_envelope.fraction_of_L * total) < 1e-12, `${name}: guard envelope`)
    for (const [key, bounds] of Object.entries(current.conservativeIntervals_H0)) {
      assert.equal(bounds.length, 2, `${name}: ${key} interval`)
      assert.ok(bounds[0] < current.partsAndWidths_H0[key] && bounds[1] > current.partsAndWidths_H0[key], `${name}: ${key} bounded`)
    }
  }
  assert.doesNotMatch(source.referenceBasis.meaning, /0\.(?:36|42)\s*H0/)
})
