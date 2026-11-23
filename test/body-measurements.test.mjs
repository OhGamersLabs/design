import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { promisify } from 'node:util'
import test from 'node:test'
import { bodyCanvasSize, measurementModel, renderMeasurementSvg } from '../docs/.vitepress/theme/components/body-measurements.mjs'

const fixture = () => ({ views: {
  front: {
    source: { width: 1024, height: 1536 },
    height: { crownY: 20, floorY: 1420, definition: '可见发冠至地面' },
    landmarks: { chin: { y: 220 }, shoulder: { y: 300 }, waist: { y: 500 }, crotch: { y: 700 } },
    widths: {
      shoulder: { xLeft: 350, xRight: 650, y: 300, definition: '肩外轮廓' },
      waist: { xLeft: 400, xRight: 600, y: 500, definition: '自然腰最窄处', visibility: 'estimated' },
      hip: { xLeft: 320, xRight: 680, y: 650, definition: '髋部外轮廓' },
    },
    lengths: { trunk: { from: 'shoulder', to: 'crotch', definition: '肩线至腿间隙' }, leg: { from: 'crotch', to: 'floor', definition: '腿间隙至地面' } },
  },
} })

test('ratios and lengths derive from the same view coordinates without an inclusive-pixel offset', () => {
  const model = measurementModel(fixture(), 'front', 'bonnie')
  assert.equal(model.H, 1400)
  assert.equal(model.headCount, 7)
  assert.equal(model.widthRatio, '1.5 : 1 : 1.8')
  assert.equal(model.rows.find((row) => row.id === 'trunk').px, 400)
  assert.equal(model.rows.find((row) => row.id === 'leg').px, 720)
  assert.equal(model.rows.find((row) => row.id === 'waist').ratio, 200 / 1400)
  assert.equal(model.rows.find((row) => row.id === 'waist').status, '近似取点')
})

test('occluded landmarks remain unmeasured and are never inferred from another view', () => {
  const data = fixture()
  data.views.back = structuredClone(data.views.front)
  data.views.back.height.floorY = 1400
  data.views.back.landmarks.chin = { y: null, visibility: 'occluded', reason: '背面看不到下颏' }
  data.views.back.widths.waist = { value: null, visibility: 'occluded', reason: '遮挡' }
  const model = measurementModel(data, 'back', 'bonnie')
  assert.equal(model.H, 1380)
  assert.equal(model.headCount, null)
  assert.equal(model.widthRatio, null)
  assert.equal(model.rows.find((row) => row.id === 'head').px, null)
  assert.equal(model.rows.find((row) => row.id === 'waist').status, '不赋值')
  const svg = renderMeasurementSvg(data, 'back', '/characters/test.webp', 'bonnie')
  assert.doesNotMatch(svg, /data-measurement="(?:head|waist)"/)
  assert.doesNotMatch(svg, /NaN|undefined/)
})

test('on-page and standalone SVG share identical geometry and labels, differing only in image source', () => {
  const data = fixture()
  const web = '/characters/test.webp'
  const embedded = 'data:image/webp;base64,dGVzdA=='
  const online = renderMeasurementSvg(data, 'front', web, 'bonnie')
  const offline = renderMeasurementSvg(data, 'front', embedded, 'bonnie')
  assert.equal(online.replace(web, embedded), offline)
  assert.match(offline, /width="1024" height="1536" preserveAspectRatio="xMidYMid meet"/)
  assert.match(offline, /S 300 px/)
  assert.match(offline, /x1="350" y1="300" x2="650" y2="300"/)
  assert.doesNotMatch(offline, /<script|href="https?:/)
})

test('native 4K landmarks remain exact while annotation typography, gutters and canvas scale together', () => {
  const data = fixture()
  const before = renderMeasurementSvg(data, 'front', '/characters/test.webp', 'bonnie')
  assert.match(before, /font-size="27"/)
  assert.match(before, /stroke-width="3"/)
  const view = data.views.front
  view.source = { width: 2352, height: 3520 }
  // Deliberately independent native readings, not a multiplied low-resolution fixture.
  view.height = { crownY: 61, floorY: 3437, definition: '原像素独立读数' }
  view.landmarks = { chin: { y: 537 }, shoulder: { y: 721 }, waist: { y: 1217 }, crotch: { y: 1693 } }
  view.widths.shoulder = { xLeft: 863, xRight: 1498, y: 721, definition: '原像素指定截线' }
  const scale = 3520 / 1536
  const model = measurementModel(data, 'front', 'bonnie')
  const svg = renderMeasurementSvg(data, 'front', '/characters/test.webp', 'bonnie')
  const canvas = bodyCanvasSize(model)
  assert.equal(model.H, 3376)
  assert.match(svg, /x1="863" y1="721" x2="1498" y2="721"/)
  assert.ok(svg.includes(`font-size="61.875"`))
  assert.ok(svg.includes(`stroke-width="6.875"`))
  assert.ok(svg.includes(`x1="165" y1="61"`))
  assert.ok(svg.includes(`viewBox="0 -252.083 2352 ${canvas.height}"`))
  assert.ok(svg.includes(`width="2352" height="3520" preserveAspectRatio="xMidYMid meet"`))
  assert.doesNotMatch(svg, /-?\d+\.\d{4,}/)
  const oldCanvas = bodyCanvasSize(measurementModel(fixture(), 'front', 'bonnie'))
  assert.equal(canvas.height, Number((oldCanvas.height * scale).toFixed(3)))
  assert.equal(svg.replace('/characters/test.webp', 'data:image/webp;base64,dGVzdA=='), renderMeasurementSvg(data, 'front', 'data:image/webp;base64,dGVzdA==', 'bonnie'))
})

test('a side depth belongs to its specified section and never becomes a front/back width ratio', () => {
  const data = fixture()
  data.views.side = structuredClone(data.views.front)
  data.views.side.widths = { waist: { xLeft: null, xRight: null, y: null, reason: '手臂遮挡' } }
  data.views.side.depths = { hip: { xLeft: 420, xRight: 587, y: 680, definition: '指定截面，含内搭' }, waist: { xLeft: null, xRight: null, y: null, reason: '后腰不可见' } }
  const model = measurementModel(data, 'side', 'bonnie')
  assert.equal(model.widthRatio, null)
  assert.equal(model.rows.find((row) => row.id === 'hipDepth').px, 167)
  assert.equal(model.rows.find((row) => row.id === 'hipDepth').label, '侧臀截面 y680')
  assert.equal(model.rows.find((row) => row.id === 'waistDepth').px, null)
  const svg = renderMeasurementSvg(data, 'side', '/characters/test.webp', 'bonnie')
  assert.match(svg, /D 167 px · y680/)
  assert.doesNotMatch(svg, /data-measurement="waistDepth"/)
})

test('estimated knee and ankle tolerances remain endpoint ranges, not invented length errors', () => {
  const data = fixture()
  data.views.front.landmarks.knee = { y: 1055, visibility: 'estimated', tolerancePx: 12 }
  data.views.front.landmarks.ankle = { y: 1400, visibility: 'estimated', tolerancePx: 10 }
  data.views.front.lengths.kneeToAnkle = { from: 'knee', to: 'ankle', definition: '图面垂直距离' }
  const row = measurementModel(data, 'front', 'bonnie').rows.find((item) => item.id === 'kneeToAnkle')
  assert.equal(row.px, 345)
  assert.equal(row.uncertainty, '')
  assert.equal(row.endpointNotes, '膝参考线 y1055，取点约 ±12 px；踝参考线 y1400，取点约 ±10 px')
})

test('invalid heights and active image schemes fail instead of producing an uncheckable ruler', () => {
  const data = fixture()
  assert.throws(() => renderMeasurementSvg(data, 'front', 'javascript:alert(1)', 'bonnie'), /Unsupported/)
  data.views.front.height.floorY = data.views.front.height.crownY
  assert.throws(() => measurementModel(data, 'front', 'bonnie'), /Invalid image height/)
})

test('explicit per-view resources select the matching artwork and ruler without changing measurements', () => {
  const data = fixture()
  const original = measurementModel(data, 'front', 'bonnie')
  assert.deepEqual(original.resources, {
    original: '/media/bonnie/body-front-latest.png',
    web: '/characters/bonnie/body-front-latest.webp',
    ruler: '/characters/bonnie/body-front-ruler-latest.svg',
  })
  data.views.front.resources = {
    original: '/media/bonnie/renamed-front-latest.png',
    web: '/characters/bonnie/renamed-front-latest.webp',
    ruler: '/characters/bonnie/renamed-front-ruler-latest.svg',
  }
  const revised = measurementModel(data, 'front', 'bonnie')
  assert.deepEqual(revised.resources, data.views.front.resources)
  assert.deepEqual(revised.rows, original.rows)
  assert.equal(revised.H, original.H)
})

test('explicit resources reject missing fields, external URLs and paths outside the body release', () => {
  const resources = {
    original: '/media/bonnie/renamed-front-latest.png',
    web: '/characters/bonnie/renamed-front-latest.webp',
    ruler: '/characters/bonnie/renamed-front-ruler-latest.svg',
  }
  for (const patch of [
    { original: undefined },
    { web: 'https://example.com/front.webp' },
    { original: '/media/bonnie/../outside.png' },
    { ruler: '/characters/bonnie/front-latest.svg?replace=1' },
    { ruler: '/characters/bonnie/front-latest.webp' },
  ]) {
    const data = fixture()
    data.views.front.resources = { ...resources, ...patch }
    assert.throws(() => measurementModel(data, 'front', 'bonnie'), /Invalid measurement resource/)
  }
})

test('the current canonical measurements build rulers from their own tracked artwork', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'body-measurements-current-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const source = resolve(import.meta.dirname, '..')
  const dataBytes = await readFile(join(source, 'catalog/bonnie/body-measurements.json'))
  const data = JSON.parse(dataBytes)
  const resources = Object.entries(data.views).map(([id, view]) => ({
    web: view.resources?.web ?? `/characters/bonnie/body-${id}-latest.webp`,
    ruler: view.resources?.ruler ?? `/characters/bonnie/body-${id}-ruler-latest.svg`,
  }))
  for (const path of [
    'tools/build-body-measurements.mjs',
    'docs/.vitepress/theme/components/body-measurements.mjs',
    'catalog/bonnie/body-measurements.json',
    'catalog/bonnie/manifest.json',
    ...resources.map(({ web }) => `docs/public${web}`),
  ]) {
    await mkdir(dirname(join(root, path)), { recursive: true })
    await cp(join(source, path), join(root, path))
  }
  const run = promisify(execFile)
  await run(process.execPath, ['tools/build-body-measurements.mjs'], { cwd: root })
  for (const { web, ruler } of resources) {
    const svg = await readFile(join(root, `docs/public${ruler}`), 'utf8')
    const embedded = Buffer.from(svg.match(/href="data:image\/webp;base64,([^\"]+)"/)[1], 'base64')
    assert.deepEqual(embedded, await readFile(join(source, `docs/public${web}`)))
  }
  assert.deepEqual(await readFile(join(root, 'docs/public/catalog/bonnie/body-measurements.json')), dataBytes)
  await assert.rejects(run(process.execPath, ['tools/build-body-measurements.mjs', '--check'], { cwd: root }), /ENOENT/)
})

test('the builder and native verifier use explicit resource paths without requiring legacy filenames', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'body-measurements-resources-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const source = resolve(import.meta.dirname, '..')
  // Small, valid transparent fixtures keep the test independent of ignored art.
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGNgYGBgAAAABQABpfZFQAAAAABJRU5ErkJggg==', 'base64')
  const webp = Buffer.from('UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==', 'base64')
  const hash = (bytes) => createHash('sha256').update(bytes).digest('hex')
  const data = { schemaVersion: 1, views: {} }
  const manifest = { assets: [] }
  for (const path of ['tools/build-body-measurements.mjs', 'docs/.vitepress/theme/components/body-measurements.mjs']) {
    await mkdir(dirname(join(root, path)), { recursive: true })
    await cp(join(source, path), join(root, path))
  }
  for (const id of ['front', 'side', 'back']) {
    const resources = {
      original: `/media/bonnie/fixture-${id}-latest.png`,
      web: `/characters/bonnie/fixture-${id}-latest.webp`,
      ruler: `/characters/bonnie/fixture-${id}-ruler-latest.svg`,
    }
    data.views[id] = {
      resources,
      source: { path: `/art-source/fixture-${id}.png`, sha256: hash(png), width: 1, height: 1 },
      height: { crownY: 0, floorY: 1, definition: 'Fixture height' },
      landmarks: {},
    }
    const originalPath = `.release/bonnie/fixture-${id}-latest.png`
    const webPath = `docs/public${resources.web}`
    await mkdir(dirname(join(root, originalPath)), { recursive: true })
    await mkdir(dirname(join(root, webPath)), { recursive: true })
    await writeFile(join(root, originalPath), png)
    await writeFile(join(root, webPath), webp)
    manifest.assets.push({
      original: { path: resources.original, sha256: hash(png), width: 1, height: 1 },
      web: { path: resources.web, sha256: hash(webp), width: 1, height: 1 },
    })
  }
  for (const [name, content] of [['body-measurements.json', data], ['manifest.json', manifest]]) {
    const path = join(root, 'catalog/bonnie', name)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, JSON.stringify(content))
  }
  const run = promisify(execFile)
  await run(process.execPath, ['tools/build-body-measurements.mjs'], { cwd: root })
  await run(process.execPath, ['tools/build-body-measurements.mjs', '--check'], { cwd: root })
  for (const id of ['front', 'side', 'back']) {
    const svg = await readFile(join(root, `docs/public/characters/bonnie/fixture-${id}-ruler-latest.svg`), 'utf8')
    const embedded = Buffer.from(svg.match(/href="data:image\/webp;base64,([^\"]+)"/)[1], 'base64')
    assert.deepEqual(embedded, webp)
  }
  await writeFile(join(root, '.release/bonnie/fixture-front-latest.png'), Buffer.concat([png, Buffer.from('changed')]))
  await assert.rejects(run(process.execPath, ['tools/build-body-measurements.mjs', '--check'], { cwd: root }), /does not match the native PNG: front/)
})
