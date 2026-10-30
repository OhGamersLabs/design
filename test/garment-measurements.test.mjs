import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { promisify } from 'node:util'
import test from 'node:test'
import { fitRegistration, garmentCanvasSize, garmentModel, renderGarmentSvg } from '../docs/.vitepress/theme/components/garment-measurements.mjs'

function fixture() {
  return { schemaVersion: 1, designUnit: { px: 225 },
    metrics: { length: { label: '衣长', symbol: 'L', garment: 'top', definition: '可见两端的垂直投影', axis: 'y' }, gap: { label: '露边', symbol: 'E', garment: 'jacket', definition: '同站位下缘差', axis: 'y', signed: true } },
    targets: { front: { length: { min: 0.85, max: 0.95, unit: 'h0', status: 'accepted' }, gap: { min: -0.05, max: 0.05, unit: 'h0', status: 'accepted' } } },
    sources: { front: { label: '外套正面', view: 'front', layer: 'jacket', source: { width: 1024, height: 1536 },
      resources: { original: '/media/bunny/front-latest.png', web: '/characters/bunny/front-latest.webp', ruler: '/characters/bunny/front-ruler-latest.svg' },
      registration: { bodyView: 'front', coverage: 'distributed', anchors: [
        { id: 'crown', region: 'head', source: [250, 20], reference: [500, 40], sourceTolerancePx: 1, referenceTolerancePx: 2 },
        { id: 'waist', region: 'torso', source: [250, 300], reference: [500, 600], sourceTolerancePx: 1, referenceTolerancePx: 2 },
        { id: 'knee', region: 'leg', source: [250, 600], reference: [500, 1200], sourceTolerancePx: 1, referenceTolerancePx: 2 },
      ] },
      measurements: [{ metricId: 'length', visibility: 'visible', points: [[200, 200], [200, 300]], tolerancePx: [1, 1] }, { metricId: 'gap', visibility: 'visible', points: [[210, 300], [210, 301]], tolerancePx: [0.5, 0.5] }] } } }
}

test('uniform registration and h0 ratios are invariant to whole-image scale and translation', () => {
  const first = fixture(); const original = garmentModel(first, 'front')
  assert.equal(original.registration.scale, 2)
  assert.deepEqual(original.registration.translation, [0, 0])
  assert.equal(original.rows[0].normalized, 200 / 225)
  const second = fixture(); const src = second.sources.front
  const transform = (p) => p.map((v) => v * 0.75 + 100)
  src.registration.anchors.forEach((a) => { a.source = transform(a.source); a.sourceTolerancePx *= 0.75 })
  src.measurements.forEach((m) => { m.points = m.points.map(transform); m.tolerancePx = m.tolerancePx.map((v) => v * 0.75) })
  const changed = garmentModel(second, 'front')
  assert.ok(Math.abs(changed.rows[0].normalized - original.rows[0].normalized) < 1e-10)
  assert.equal(changed.rows[0].status, 'pass')
})

test('head-only anchor clusters remain limited despite zero residuals', () => {
  const data = fixture(); data.sources.front.registration.anchors.forEach((a) => { a.region = 'head' })
  const model = garmentModel(data, 'front')
  assert.equal(model.registration.rms, 0)
  assert.equal(model.registration.status, 'limited')
  assert.equal(model.rows[0].status, 'uncertain')
})

test('each anchor uses its own semantic tolerance; a large mismatch cannot be hidden in aggregate RMS', () => {
  const data = fixture(); data.sources.front.registration.anchors[1].reference[0] += 40
  const model = garmentModel(data, 'front')
  assert.equal(model.registration.status, 'failed')
  assert.ok(model.registration.anchors.some((a) => a.withinTolerance === false))
  assert.equal(model.rows[0].status, 'uncertain')
})

test('missing or coincident anchors never create a fabricated scale', () => {
  assert.equal(fitRegistration({ anchors: [] }).scale, null)
  assert.equal(fitRegistration({ anchors: [{ source: [2, 2], reference: [4, 4] }, { source: [2, 2], reference: [4, 4] }] }).scale, null)
})

test('an occluded endpoint stays unmeasured and cannot silently carry invented points', () => {
  const data = fixture(); data.sources.front.measurements[0] = { metricId: 'length', visibility: 'occluded', reason: '袖子遮挡下缘' }
  const row = garmentModel(data, 'front').rows[0]
  assert.equal(row.px, null); assert.equal(row.normalized, null); assert.equal(row.status, 'occluded')
  const svg = renderGarmentSvg(data, 'front', '/characters/source.webp')
  assert.doesNotMatch(svg, /data-measurement="length"/)
  data.sources.front.measurements[0].points = [[200, 200], [200, 300]]
  assert.throws(() => garmentModel(data, 'front'), /Hidden garment endpoint/)
})

test('tolerance and registration scale intervals distinguish pass, clear fail and boundary uncertainty', () => {
  const data = fixture()
  assert.equal(garmentModel(data, 'front').rows[0].status, 'pass')
  data.targets.front.length = { min: 1.1, max: 1.2, unit: 'h0', status: 'accepted' }
  assert.equal(garmentModel(data, 'front').rows[0].status, 'fail')
  data.targets.front.length = { min: 0.89, max: 0.95, unit: 'h0', status: 'accepted' }
  assert.equal(garmentModel(data, 'front').rows[0].status, 'uncertain')
  data.targets.front.length.status = 'proposed'
  assert.equal(garmentModel(data, 'front').rows[0].status, 'unrated')
})

test('a minimum clearance has no invented upper limit and still propagates uncertainty at its boundary', () => {
  const data = fixture(); data.targets.front.length = { min: 0.3, max: null, unit: 'h0', status: 'accepted' }
  let row = garmentModel(data, 'front').rows[0]
  assert.equal(row.status, 'pass'); assert.equal(row.targetText, '≥ 0.3 h₀')
  data.targets.front.length.min = 0.89
  row = garmentModel(data, 'front').rows[0]; assert.equal(row.status, 'uncertain')
  data.targets.front.length.min = 1.1
  assert.equal(garmentModel(data, 'front').rows[0].status, 'fail')
})

test('reference positions report a nominal reading without creating an automatic acceptance interval', () => {
  const data = fixture(); delete data.targets.front.length
  data.referencePositions = { front: { length: { nominal: 0.9, status: 'reference-only' } } }
  const row = garmentModel(data, 'front').rows[0]
  assert.equal(row.target, null); assert.equal(row.status, 'unrated')
  assert.equal(row.statusLabel, '参照读数'); assert.equal(row.targetText, '参照 0.9 h₀')
  assert.ok(row.interval)
})

test('signed same-station hem differences preserve sign rather than becoming an absolute garment length', () => {
  const data = fixture(); data.sources.front.measurements[1].points = [[210, 301], [210, 300]]
  const row = garmentModel(data, 'front').rows[1]
  assert.equal(row.px, -1); assert.equal(row.normalized, -2 / 225)
  assert.ok(row.interval[0] < 0)
})

test('a covered hem remains occluded while its cross-image reference estimate keeps a separate conservative interval', () => {
  const data = fixture()
  data.sources.inner = structuredClone(data.sources.front)
  data.sources.inner.source.sha256 = 'a'.repeat(64)
  data.sources.inner.label = '白衣参考正面'
  data.sources.front.measurements[0].points[1][1] = 310
  data.sources.front.measurements[1] = { metricId: 'gap', visibility: 'occluded', reason: '白衣下缘已覆盖' }
  data.sources.front.referenceDerivedMetrics = [{ metricId: 'gap', current: { metricId: 'length', endpoint: 1 }, reference: { sourceId: 'inner', metricId: 'length', endpoint: 1, sha256: 'a'.repeat(64) }, observedCoverage: 'covered' }]
  const model = garmentModel(data, 'front')
  assert.equal(model.rows[1].status, 'occluded'); assert.equal(model.rows[1].normalized, null)
  const estimate = model.derived[0]
  assert.equal(estimate.normalized, 20 / 225)
  assert.equal(estimate.status, 'limited'); assert.equal(estimate.evidenceKind, 'reference-derived')
  assert.ok(estimate.interval[0] < estimate.normalized && estimate.interval[1] > estimate.normalized)
  assert.ok((estimate.interval[1] - estimate.interval[0]) * 225 > 8)
  const svg = renderGarmentSvg(data, 'front', '/characters/source.webp')
  assert.doesNotMatch(svg, /data-measurement="gap"/)
  assert.match(svg, /基准推算（非同图实测）/)
  delete data.targets.front.gap
  assert.equal(garmentModel(data, 'front').derived[0].indication, 'reference')
  data.sources.inner.measurements[0].points[1][0] += 30
  const mismatched = garmentModel(data, 'front').derived[0]
  assert.equal(mismatched.stationMatched, false)
  assert.equal(mismatched.normalized, null); assert.equal(mismatched.interval, null)
  assert.equal(mismatched.indicationLabel, '横向站位未匹配')
  data.sources.front.referenceDerivedMetrics[0].reference.sha256 = 'b'.repeat(64)
  assert.throws(() => garmentModel(data, 'front'), /exact same-view source/)
})

test('side targets are independent and widths cannot use endpoints at different image heights', () => {
  const data = fixture(); data.sources.front.view = 'side'
  assert.equal(garmentModel(data, 'front').rows[0].status, 'unrated')
  data.sources.front.measurements[0].axis = 'x'
  assert.throws(() => garmentModel(data, 'front'), /exact image section/)
})

test('self-contained SVG preserves the source image area and does not add marks for hidden dimensions', () => {
  const data = fixture(); const online = renderGarmentSvg(data, 'front', '/characters/source.webp'); const href = 'data:image/webp;base64,dGVzdA=='
  assert.equal(online.replace('/characters/source.webp', href), renderGarmentSvg(data, 'front', href))
  assert.match(online, /x="0" y="0" width="1024" height="1536" preserveAspectRatio="xMidYMid meet"/)
  const canvas = garmentCanvasSize(garmentModel(data, 'front'))
  assert.match(online, new RegExp(`viewBox="0 -100 ${canvas.width} ${canvas.height}" width="${canvas.width}" height="${canvas.height}"`))
  assert.doesNotMatch(online, /NaN|undefined|<script/)
  assert.throws(() => renderGarmentSvg(data, 'front', 'javascript:alert(1)'), /Unsupported/)
  data.sources.front.resources.web = '/characters/bunny/../outside.webp'
  assert.throws(() => garmentModel(data, 'front'), /Invalid garment resource/)
})

test('builder binds artwork and body hashes, embeds exact web bytes and detects stale annotation exports', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'garment-measurement-test-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const source = resolve(import.meta.dirname, '..')
  for (const path of ['tools/build-garment-measurements.mjs', 'docs/.vitepress/theme/components/garment-measurements.mjs', 'docs/.vitepress/theme/components/body-measurements.mjs']) {
    await mkdir(dirname(join(root, path)), { recursive: true }); await cp(join(source, path), join(root, path))
  }
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGBgAAAABQABpfZFQAAAAABJRU5ErkJggg==', 'base64')
  const webp = Buffer.from('UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==', 'base64')
  const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
  const body = Buffer.from(JSON.stringify({ views: { front: { height: { crownY: 0 }, landmarks: { chin: { y: 1 } } } } }))
  const data = { schemaVersion: 1, designUnit: { px: 1 }, bodyMeasurementsSha256: hash(body), metrics: {}, targets: {}, sources: {
    fixture: { label: 'Fixture', view: 'front', layer: 'innerwear', source: { width: 1, height: 1, sha256: hash(png) },
      resources: { original: '/media/bunny/fixture-latest.png', web: '/characters/bunny/fixture-latest.webp', ruler: '/characters/bunny/fixture-latest.svg' },
      registration: { bodyView: 'front', anchors: [] }, measurements: [] },
  } }
  const manifest = { assets: [{ original: { path: data.sources.fixture.resources.original, sha256: hash(png), width: 1, height: 1 }, web: { path: data.sources.fixture.resources.web, sha256: hash(webp) } }] }
  for (const [name, bytes] of [
    ['catalog/bunny/garment-measurements.json', JSON.stringify(data)], ['catalog/bunny/body-measurements.json', body],
    ['catalog/bunny/manifest.json', JSON.stringify(manifest)], ['docs/public/characters/bunny/fixture-latest.webp', webp],
  ]) { await mkdir(dirname(join(root, name)), { recursive: true }); await writeFile(join(root, name), bytes) }
  const run = promisify(execFile)
  await run(process.execPath, ['tools/build-garment-measurements.mjs'], { cwd: root })
  const svgPath = join(root, 'docs/public/characters/bunny/fixture-latest.svg')
  const svg = await readFile(svgPath, 'utf8')
  const embedded = Buffer.from(svg.match(/href="data:image\/webp;base64,([^\"]+)"/)[1], 'base64')
  assert.deepEqual(embedded, webp)
  await assert.rejects(run(process.execPath, ['tools/build-garment-measurements.mjs', '--check'], { cwd: root }), /ENOENT/)
  await mkdir(join(root, '.release/bunny'), { recursive: true }); await writeFile(join(root, '.release/bunny/fixture-latest.png'), png)
  await run(process.execPath, ['tools/build-garment-measurements.mjs', '--check'], { cwd: root })
  await writeFile(svgPath, svg + 'stale')
  await assert.rejects(run(process.execPath, ['tools/build-garment-measurements.mjs', '--check'], { cwd: root }), /Stale garment measurement artifact/)
  await writeFile(svgPath, svg)
  await writeFile(join(root, 'catalog/bunny/body-measurements.json'), Buffer.from(JSON.stringify({ views: { front: { height: { crownY: 0 }, landmarks: { chin: { y: 2 } } } } })))
  await assert.rejects(run(process.execPath, ['tools/build-garment-measurements.mjs'], { cwd: root }), /frozen body measurement source/)
})
