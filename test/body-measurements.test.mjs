import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { promisify } from 'node:util'
import test from 'node:test'
import { measurementModel, renderMeasurementSvg } from '../docs/.vitepress/theme/components/body-measurements.mjs'

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
  const model = measurementModel(fixture(), 'front')
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
  const model = measurementModel(data, 'back')
  assert.equal(model.H, 1380)
  assert.equal(model.headCount, null)
  assert.equal(model.widthRatio, null)
  assert.equal(model.rows.find((row) => row.id === 'head').px, null)
  assert.equal(model.rows.find((row) => row.id === 'waist').status, '不赋值')
  const svg = renderMeasurementSvg(data, 'back', '/characters/test.webp')
  assert.doesNotMatch(svg, /data-measurement="(?:head|waist)"/)
  assert.doesNotMatch(svg, /NaN|undefined/)
})

test('on-page and standalone SVG share identical geometry and labels, differing only in image source', () => {
  const data = fixture()
  const web = '/characters/test.webp'
  const embedded = 'data:image/webp;base64,dGVzdA=='
  const online = renderMeasurementSvg(data, 'front', web)
  const offline = renderMeasurementSvg(data, 'front', embedded)
  assert.equal(online.replace(web, embedded), offline)
  assert.match(offline, /width="1024" height="1536" preserveAspectRatio="xMidYMid meet"/)
  assert.match(offline, /S 300 px/)
  assert.match(offline, /x1="350" y1="300" x2="650" y2="300"/)
  assert.doesNotMatch(offline, /<script|href="https?:/)
})

test('a side depth belongs to its specified section and never becomes a front/back width ratio', () => {
  const data = fixture()
  data.views.side = structuredClone(data.views.front)
  data.views.side.widths = { waist: { xLeft: null, xRight: null, y: null, reason: '手臂遮挡' } }
  data.views.side.depths = { hip: { xLeft: 420, xRight: 587, y: 680, definition: '指定截面，含内搭' }, waist: { xLeft: null, xRight: null, y: null, reason: '后腰不可见' } }
  const model = measurementModel(data, 'side')
  assert.equal(model.widthRatio, null)
  assert.equal(model.rows.find((row) => row.id === 'hipDepth').px, 167)
  assert.equal(model.rows.find((row) => row.id === 'hipDepth').label, '侧臀截面 y680')
  assert.equal(model.rows.find((row) => row.id === 'waistDepth').px, null)
  const svg = renderMeasurementSvg(data, 'side', '/characters/test.webp')
  assert.match(svg, /D 167 px · y680/)
  assert.doesNotMatch(svg, /data-measurement="waistDepth"/)
})

test('estimated knee and ankle tolerances remain endpoint ranges, not invented length errors', () => {
  const data = fixture()
  data.views.front.landmarks.knee = { y: 1055, visibility: 'estimated', tolerancePx: 12 }
  data.views.front.landmarks.ankle = { y: 1400, visibility: 'estimated', tolerancePx: 10 }
  data.views.front.lengths.kneeToAnkle = { from: 'knee', to: 'ankle', definition: '图面垂直距离' }
  const row = measurementModel(data, 'front').rows.find((item) => item.id === 'kneeToAnkle')
  assert.equal(row.px, 345)
  assert.equal(row.uncertainty, '')
  assert.equal(row.endpointNotes, '膝参考线 y1055，取点约 ±12 px；踝参考线 y1400，取点约 ±10 px')
})

test('invalid heights and active image schemes fail instead of producing an uncheckable ruler', () => {
  const data = fixture()
  assert.throws(() => renderMeasurementSvg(data, 'front', 'javascript:alert(1)'), /Unsupported/)
  data.views.front.height.floorY = data.views.front.height.crownY
  assert.throws(() => measurementModel(data, 'front'), /Invalid image height/)
})

test('explicit per-view resources select the matching artwork and ruler without changing measurements', () => {
  const data = fixture()
  const original = measurementModel(data, 'front')
  assert.deepEqual(original.resources, {
    original: '/media/bunny/body-front-latest.png',
    web: '/characters/bunny/body-front-latest.webp',
    ruler: '/characters/bunny/body-front-ruler-latest.svg',
  })
  data.views.front.resources = {
    original: '/media/bunny/renamed-front-latest.png',
    web: '/characters/bunny/renamed-front-latest.webp',
    ruler: '/characters/bunny/renamed-front-ruler-latest.svg',
  }
  const revised = measurementModel(data, 'front')
  assert.deepEqual(revised.resources, data.views.front.resources)
  assert.deepEqual(revised.rows, original.rows)
  assert.equal(revised.H, original.H)
})

test('explicit resources reject missing fields, external URLs and paths outside the body release', () => {
  const resources = {
    original: '/media/bunny/renamed-front-latest.png',
    web: '/characters/bunny/renamed-front-latest.webp',
    ruler: '/characters/bunny/renamed-front-ruler-latest.svg',
  }
  for (const patch of [
    { original: undefined },
    { web: 'https://example.com/front.webp' },
    { original: '/media/bunny/../outside.png' },
    { ruler: '/characters/bunny/front-latest.svg?replace=1' },
    { ruler: '/characters/bunny/front-latest.webp' },
  ]) {
    const data = fixture()
    data.views.front.resources = { ...resources, ...patch }
    assert.throws(() => measurementModel(data, 'front'), /Invalid measurement resource/)
  }
})

test('the current canonical measurements build rulers from their own tracked artwork', async (t) => {
  const root = await mkdtemp(join(tmpdir(), 'body-measurements-current-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  const source = resolve(import.meta.dirname, '..')
  const dataBytes = await readFile(join(source, 'catalog/bunny/body-measurements.json'))
  const data = JSON.parse(dataBytes)
  const resources = Object.entries(data.views).map(([id, view]) => ({
    web: view.resources?.web ?? `/characters/bunny/body-${id}-latest.webp`,
    ruler: view.resources?.ruler ?? `/characters/bunny/body-${id}-ruler-latest.svg`,
  }))
  for (const path of [
    'tools/build-body-measurements.mjs',
    'docs/.vitepress/theme/components/body-measurements.mjs',
    'catalog/bunny/body-measurements.json',
    'catalog/bunny/manifest.json',
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
  assert.deepEqual(await readFile(join(root, 'docs/public/catalog/bunny/body-measurements.json')), dataBytes)
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
      original: `/media/bunny/fixture-${id}-latest.png`,
      web: `/characters/bunny/fixture-${id}-latest.webp`,
      ruler: `/characters/bunny/fixture-${id}-ruler-latest.svg`,
    }
    data.views[id] = {
      resources,
      source: { path: `/art-source/fixture-${id}.png`, sha256: hash(png), width: 1, height: 1 },
      height: { crownY: 0, floorY: 1, definition: 'Fixture height' },
      landmarks: {},
    }
    const originalPath = `.release/bunny/fixture-${id}-latest.png`
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
    const path = join(root, 'catalog/bunny', name)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, JSON.stringify(content))
  }
  const run = promisify(execFile)
  await run(process.execPath, ['tools/build-body-measurements.mjs'], { cwd: root })
  await run(process.execPath, ['tools/build-body-measurements.mjs', '--check'], { cwd: root })
  for (const id of ['front', 'side', 'back']) {
    const svg = await readFile(join(root, `docs/public/characters/bunny/fixture-${id}-ruler-latest.svg`), 'utf8')
    const embedded = Buffer.from(svg.match(/href="data:image\/webp;base64,([^\"]+)"/)[1], 'base64')
    assert.deepEqual(embedded, webp)
  }
  await writeFile(join(root, '.release/bunny/fixture-front-latest.png'), Buffer.concat([png, Buffer.from('changed')]))
  await assert.rejects(run(process.execPath, ['tools/build-body-measurements.mjs', '--check'], { cwd: root }), /does not match the native PNG: front/)
})
