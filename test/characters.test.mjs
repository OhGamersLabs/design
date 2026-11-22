import test from 'node:test'
import assert from 'node:assert/strict'
import { cpSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { parse, compileScript } from 'vue/compiler-sfc'
import { transformWithEsbuild } from 'vite'
import * as vue from 'vue'
import * as serverRenderer from 'vue/server-renderer'
import { discoverCharacters, loadCharacters, mergeAnchorMaps, siteNav } from '../docs/.vitepress/characters.mjs'
import { loadBaseBodies } from '../docs/.vitepress/base-bodies.mjs'
import { loadWorld } from '../docs/.vitepress/world.mjs'
import { parseChip } from '../docs/.vitepress/data/character-data.mjs'
import loader from '../docs/.vitepress/data/site.data.mjs'
import baseBodiesLoader from '../docs/.vitepress/data/base-bodies.data.mjs'
import worldLoader from '../docs/.vitepress/data/world.data.mjs'
import { assetById, buildAssetIndex, characterForPage, focusAfterStep, readingNeighbors, stepIndex } from '../docs/.vitepress/theme/character-site.mjs'
import { measurementModel } from '../docs/.vitepress/theme/components/body-measurements.mjs'
import { garmentModel } from '../docs/.vitepress/theme/components/garment-measurements.mjs'
import { bindImports, characterContext } from './helpers/character-context.mjs'

const json = (path) => JSON.parse(readFileSync(path, 'utf8'))
const sourceData = new URL('./fixtures/fixture-character/docs/.vitepress/data/fixture/', import.meta.url)
const write = (root, path, data) => {
  const target = join(root, path)
  mkdirSync(join(target, '..'), { recursive: true })
  writeFileSync(target, typeof data === 'string' ? data : JSON.stringify(data))
}
function sandbox(t) {
  const root = mkdtempSync(join(tmpdir(), 'character-registry-'))
  t.after(() => rmSync(root, { recursive: true }))
  write(root, 'docs/public/site/thumbs/index.json', {})
  return root
}
function addCharacter(root, id, { listed = true, order = 1 } = {}) {
  const dataDir = `docs/.vitepress/data/${id}`
  for (const file of readdirSync(sourceData)) {
    const value = readFileSync(new URL(file, sourceData), 'utf8').replaceAll('fixture-original-latest', `${id}-original-latest`).replaceAll('/fixture/', `/${id}/`)
    write(root, `${dataDir}/${file}`, value)
  }
  const definition = json(join(root, dataDir, 'character.json'))
  definition.name = id[0].toUpperCase() + id.slice(1)
  definition.order = order
  write(root, `${dataDir}/character.json`, definition)
  if (listed) write(root, `docs/characters/${id}/index.md`, '# ' + definition.name)
  const names = json(join(root, dataDir, 'asset-names.json'))
  const own = Object.keys(names).filter((aid) => aid !== `${id}-original-latest`)
  const image = (collection, aid, kind) => ({ path: `/${kind === 'web' ? 'characters' : 'media'}/${collection}/${aid}.${kind === 'web' ? 'webp' : 'png'}`, width: 24, height: 32, bytes: 100 })
  const asset = (collection, aid) => ({ id: aid, web: image(collection, aid, 'web'), original: image(collection, aid, 'original') })
  write(root, `catalog/${id}/manifest.json`, { character_id: id, assets: own.map((aid) => asset(id, aid)) })
  const originPath = join(root, 'catalog/origins/manifest.json')
  let origins
  try { origins = json(originPath) } catch { origins = { character_id: 'origins', assets: [] } }
  origins.assets.push(asset('origins', `${id}-original-latest`))
  write(root, 'catalog/origins/manifest.json', origins)
  const thumbs = json(join(root, 'docs/public/site/thumbs/index.json'))
  for (const aid of Object.keys(names)) {
    const collection = aid === `${id}-original-latest` ? 'origins' : id
    thumbs[`${collection}/${aid}`] = { path: `/site/thumbs/${collection}/${aid}.webp`, width: 24, height: 32 }
  }
  write(root, 'docs/public/site/thumbs/index.json', thumbs)
  return dataDir
}
function mutate(root, dir, file, update) {
  const value = json(join(root, dir, file))
  update(value)
  write(root, `${dir}/${file}`, value)
}

test('discovery uses character.json and the home file alone determines listing', (t) => {
  const root = sandbox(t)
  addCharacter(root, 'robot', { listed: false })
  addCharacter(root, 'bunny')
  write(root, 'docs/.vitepress/data/origins/ignored.json', {})
  write(root, 'docs/.vitepress/data/ignored/home.json', {})
  assert.deepEqual(discoverCharacters(root).map(({ id, listed }) => ({ id, listed })), [{ id: 'bunny', listed: true }, { id: 'robot', listed: false }])
  write(root, 'docs/characters/robot/index.md', '# Robot')
  assert.equal(discoverCharacters(root)[1].listed, true)
})
for (const id of ['Bad', 'two--words', 'origins', 'base-bodies', 'world']) test(`discovery rejects invalid or shared collection id ${id}`, (t) => {
  const root = sandbox(t)
  write(root, `docs/.vitepress/data/${id}/character.json`, { name: id, role: '角色', order: 1, pages: [] })
  assert.throws(() => discoverCharacters(root), /Invalid character id/)
})
test('roster sorts listed characters by order and then id while loading unlisted data', (t) => {
  const root = sandbox(t)
  addCharacter(root, 'zeta', { order: 1 })
  addCharacter(root, 'robot', { order: 1 })
  addCharacter(root, 'bunny', { order: 0 })
  addCharacter(root, 'alpha', { listed: false, order: -1 })
  const data = loadCharacters(root)
  assert.deepEqual(data.roster.map(({ id }) => id), ['bunny', 'robot', 'zeta'])
  assert.deepEqual(data.roster[0], { id: 'bunny', name: 'Bunny', role: '守卫', home: '/characters/bunny/', updated: '2026-11-16', portrait: { asset: 'body-front-latest', path: '/site/thumbs/bunny/body-front-latest.webp', width: 24, height: 32 } })
  assert.equal(data.characters.alpha.listed, false)
  assert.equal(Object.keys(data.characters.alpha.assets).length, 10)
})
for (const count of [0, 1, 2]) test(`siteNav lists ${count} characters in one 角色 flyout before world and standards`, (t) => {
  const root = sandbox(t)
  if (count > 0) addCharacter(root, 'bunny')
  if (count > 1) addCharacter(root, 'robot', { order: 2 })
  addCharacter(root, 'draft', { listed: false })
  const world = {
    text: '世界观', activeMatch: '^/world/',
    items: [
      { text: '世界观总览', link: '/world/', activeMatch: '^/world/$' },
      { text: '抛币结契交互图解', link: '/world/#coin-pact' },
      { text: '五大种族与姓氏谱系', link: '/world/races', activeMatch: '^/world/races' },
    ],
  }
  const standards = {
    text: '通用规范', activeMatch: '^/standards/',
    items: [
      { text: '素体与规范总览', link: '/standards/', activeMatch: '^/standards/$' },
      { text: '女性标准素体', link: '/standards/female-standard', activeMatch: '^/standards/female-standard' },
      { text: '女性丰满素体', link: '/standards/female-curvy', activeMatch: '^/standards/female-curvy' },
      { text: '标准青年男素体', link: '/standards/male-standard', activeMatch: '^/standards/male-standard' },
      { text: '重壮男素体', link: '/standards/male-heavy', activeMatch: '^/standards/male-heavy' },
    ],
  }
  const expected = count ? [{ text: '角色', activeMatch: '^/characters/', items: [
    { text: 'Bunny', link: '/characters/bunny/', activeMatch: '^/characters/bunny/' },
    ...(count === 2 ? [{ text: 'Robot', link: '/characters/robot/', activeMatch: '^/characters/robot/' }] : []),
  ] }, world, standards] : [world, standards]
  assert.deepEqual(siteNav(loadCharacters(root).roster), expected)
})
for (const portrait of ['missing-latest', 'robot-original-latest']) test(`registry rejects portrait ${portrait} even without pages`, (t) => {
  const root = sandbox(t); const dir = addCharacter(root, 'robot', { listed: false })
  mutate(root, dir, 'character.json', (value) => { value.portrait = portrait })
  assert.throws(() => loadCharacters(root), /Unknown asset id|Portrait must belong to character collection/)
})
test('portrait requires its own collection thumbnail', (t) => {
  const root = sandbox(t); addCharacter(root, 'robot', { listed: false })
  mutate(root, 'docs/public/site/thumbs', 'index.json', (value) => { delete value['robot/body-front-latest'] })
  assert.throws(() => loadCharacters(root), /Missing asset thumbnail: body-front-latest/)
})
for (const key of ['pages', 'stubs', 'latest', 'unexpected']) test(`site-check rejects extra key ${key} even without pages`, (t) => {
  const root = sandbox(t); const dir = addCharacter(root, 'robot', { listed: false })
  mutate(root, dir, 'site-check.json', (value) => { value[key] = [] })
  assert.throws(() => loadCharacters(root), new RegExp(`Unknown site-check.json key: robot/${key}`))
})
test('loader exposes all characters, roster, merged map and wildcard watch paths', () => {
  const data = loader.load()
  assert.deepEqual(Object.keys(data).sort(), ['anchorMap', 'characters', 'roster'])
  assert.equal(data.characters.bunny.readingOrder.length, 14)
  assert.equal(data.characters.bunny.layers.items.length, 10)
  assert.deepEqual(data.anchorMap, data.characters.bunny.anchorMap)
  assert.deepEqual(loader.watch.map((path) => path.slice(path.indexOf('/docs/') >= 0 ? path.indexOf('/docs/') : path.indexOf('/catalog/'))), ['/docs/.vitepress/data/*/*.json', '/catalog/*/manifest.json', '/docs/public/site/thumbs/index.json'])
})
test('two characters share local asset ids without sharing artwork or originals', (t) => {
  const root = sandbox(t)
  addCharacter(root, 'bunny')
  addCharacter(root, 'robot')
  const { characters } = loadCharacters(root)
  assert.equal(characters.bunny.assets['body-front-latest'].web.path, '/characters/bunny/body-front-latest.webp')
  assert.equal(characters.robot.assets['body-front-latest'].web.path, '/characters/robot/body-front-latest.webp')
  assert.ok(characters.robot.assets['robot-original-latest'])
  assert.equal(characters.robot.assets['bunny-original-latest'], undefined)
})
test('buildAssetIndex rejects a foreign collection, foreign original and duplicate local identity', () => {
  const image = { path: '/asset', width: 1, height: 1, bytes: 1 }
  const asset = { id: 'robot-original-latest', web: image, original: image }
  const input = { character: 'bunny', names: { [asset.id]: '原稿' }, thumbs: { [`origins/${asset.id}`]: image } }
  assert.throws(() => buildAssetIndex({ ...input, manifests: [{ character_id: 'origins', assets: [asset] }] }), /Foreign original asset: robot-original-latest/)
  assert.throws(() => buildAssetIndex({ ...input, manifests: [{ character_id: 'robot', assets: [] }] }), /Unsupported asset collection: robot/)
  const own = { ...asset, id: 'bunny-original-latest' }
  const ownInput = { character: 'bunny', names: { [own.id]: '原稿' }, thumbs: { [`origins/${own.id}`]: image } }
  assert.throws(() => buildAssetIndex({ ...ownInput, manifests: [{ character_id: 'origins', assets: [own, own] }] }), /Duplicate asset id/)
})
test('merged anchor and stub keys are unique across character maps', (t) => {
  const root = sandbox(t)
  addCharacter(root, 'bunny')
  const robot = addCharacter(root, 'robot')
  const key = '/characters/bunny/legacy'
  mutate(root, robot, 'anchor-map.json', (map) => { map.anchors[key] = '/characters/robot/' })
  assert.throws(() => loadCharacters(root), /Duplicate anchor map key/)
  assert.throws(() => mergeAnchorMaps([{ stubs: {}, anchors: { [key]: '/' } }, { stubs: { [key]: { target: '/', title: '角色' } }, anchors: {} }]), /Duplicate anchor map key/)
})
for (const [label, patch] of [
  ['both chip formats', { swatch: 'orange', color: '#123456' }],
  ['neither chip format', {}],
  ['short hex', { color: '#abc' }],
  ['non-hex colour', { color: 'orange' }],
  ['bad hex', { color: '#12abzz' }],
  ['unknown swatch', { swatch: 'cyan' }],
]) test(`chips reject ${label}`, () => assert.throws(() => parseChip({ name: '色彩', use: '识别', ...patch }), /Chip|chip|swatch/))
test('chips retain palette names and exact six-digit custom colours', () => {
  assert.deepEqual(parseChip({ name: '橙色', use: '识别', swatch: 'orange' }), { name: '橙色', use: '识别', swatch: 'orange' })
  assert.deepEqual(parseChip({ name: '青色', use: '识别', color: '#12ab89' }), { name: '青色', use: '识别', color: '#12ab89' })
})
for (const field of ['name', 'role', 'order', 'portrait', 'pages']) test(`character definition requires ${field}`, (t) => {
  const root = sandbox(t); const dir = addCharacter(root, 'robot')
  mutate(root, dir, 'character.json', (value) => { delete value[field] })
  assert.throws(() => loadCharacters(root), /Expected/)
})
test('optional layers are null, while a supplied layer chapter must exist', (t) => {
  const root = sandbox(t); const dir = addCharacter(root, 'robot')
  mutate(root, dir, 'layers.json', (value) => { value.chapter = 'missing' })
  assert.throws(() => loadCharacters(root), /Unknown layer chapter/)
  rmSync(join(root, dir, 'layers.json'))
  assert.equal(loadCharacters(root).characters.robot.layers, null)
})
for (const [label, update] of [
  ['reading page path', (root, dir) => mutate(root, dir, 'character.json', (value) => { value.pages[0].path = '/characters/other/page' })],
  ['stub path', (root, dir) => mutate(root, dir, 'anchor-map.json', (value) => { value.stubs['/characters/other/page'] = { target: '/characters/robot/', title: '角色' } })],
  ['layer path', (root, dir) => mutate(root, dir, 'layers.json', (value) => { value.items[0].path = '/characters/other/page' })],
  ['duplicate layer number', (root, dir) => mutate(root, dir, 'layers.json', (value) => { value.items[1].layer = 0 })],
  ['fractional layer number', (root, dir) => mutate(root, dir, 'layers.json', (value) => { value.items[0].layer = 1.5 })],
  ['tab asset', (root, dir) => mutate(root, dir, 'home.json', (value) => { value.tabs[0].assets[0] = 'missing-latest' })],
  ['highlight asset', (root, dir) => mutate(root, dir, 'home.json', (value) => { value.highlights[0].asset = 'missing-latest' })],
  ...['front', 'side', 'back'].map((field) => [`layer ${field} asset`, (root, dir) => mutate(root, dir, 'layers.json', (value) => { value.items[0][field] = 'missing-latest' })]),
  ...['front', 'right', 'back', 'left'].map((field) => [`T-pose ${field} asset`, (root, dir) => mutate(root, dir, 'layers.json', (value) => { value.items[0].tpose[field] = 'missing-latest' })]),
]) test(`registry validates ${label} even for unlisted characters`, (t) => {
  const root = sandbox(t); const dir = addCharacter(root, 'robot', { listed: false }); update(root, dir)
  assert.throws(() => loadCharacters(root), /Path outside|layer number|Unknown asset id/)
})
test('a layer may omit its T-pose views, and the T-pose block then refuses to render', async (t) => {
  const root = sandbox(t); const dir = addCharacter(root, 'robot')
  mutate(root, dir, 'layers.json', (value) => { delete value.items[0].tpose })
  const data = loadCharacters(root)
  assert.equal(Object.hasOwn(data.characters.robot.layers.items[0], 'tpose'), false)
  assert.deepEqual(Object.keys(data.characters.robot.layers.items[1].tpose), ['front', 'right', 'back', 'left'])
  await assert.rejects(renderComponent('components/LayerTpose.vue', data, 'characters/robot/part-0.md', { layer: 0 }), /has no T-pose views: 0/)
  assert.match(await renderComponent('components/LayerTpose.vue', data, 'characters/robot/part-1.md', { layer: 1 }), /data-image-id="body-tpose-front-latest"/)
})
test('registry parses every JSON file and requires checker expectations', (t) => {
  const root = sandbox(t); const dir = addCharacter(root, 'robot', { listed: false })
  write(root, `${dir}/extra.json`, '{bad JSON')
  assert.throws(() => loadCharacters(root), SyntaxError)
  rmSync(join(root, dir, 'extra.json')); rmSync(join(root, dir, 'site-check.json'))
  assert.throws(() => loadCharacters(root), /site-check|Expected a JSON object/)
})
test('page selection is reactive and rejects missing context or unknown characters', async (t) => {
  const root = sandbox(t); addCharacter(root, 'bunny'); addCharacter(root, 'robot')
  const data = loadCharacters(root); const context = await characterContext(data)
  const current = context.composable.useCharacter()
  assert.equal(current.value.id, 'bunny')
  context.page.value.relativePath = 'characters/robot/part-1.md'
  assert.equal(current.value.id, 'robot')
  assert.throws(() => characterForPage(data.characters, 'standards/index.md'), /outside a character page/)
  assert.throws(() => characterForPage(data.characters, 'characters/missing/index.md'), /Unknown character/)
  assert.equal(characterForPage(data.characters, 'index.md', 'robot').id, 'robot')
  assert.equal(readingNeighbors(data.characters.robot.readingOrder, '/characters/robot/part-0').prev.path, '/characters/robot/')
  assert.equal(readingNeighbors(data.characters.robot.readingOrder, '/characters/bunny/part-0').next, null)
})

const empty = { render: () => null }
async function renderComponent(name, data, path, props = {}, frontmatter = {}) {
  const context = await characterContext(data, path)
  context.page.value.frontmatter = frontmatter
  const url = new URL(`../docs/.vitepress/theme/${name}`, import.meta.url)
  const { descriptor, errors } = parse(readFileSync(url, 'utf8'), { filename: url.pathname })
  assert.deepEqual(errors, [])
  const compiled = compileScript(descriptor, { id: 'character-regression', genDefaultAs: '__component', inlineTemplate: true, templateOptions: { ssr: true } }).content
  const code = (await transformWithEsbuild(compiled, url.pathname + '.ts', { loader: 'ts' })).code
  const baseBodies = baseBodiesLoader.load()
  const world = worldLoader.load()
  const modules = { vue, 'vue/server-renderer': serverRenderer, vitepress: context.vitepress, '../data/site.data.mjs': { data }, '../data/base-bodies.data.mjs': { data: baseBodies }, '../../data/base-bodies.data.mjs': { data: baseBodies }, '../data/world.data.mjs': { data: world }, '../../data/world.data.mjs': { data: world }, '../use-character': context.composable, './use-character': context.composable,
    '../character-site.mjs': { assetById, buildAssetIndex, focusAfterStep, readingNeighbors, stepIndex }, './AssetImage.vue': { default: { props: ['id', 'group'], render() { return vue.h('figure', { 'data-image-id': this.id, 'data-group': this.group }) } } },
    './ReleaseImage.vue': { default: { props: ['src', 'group'], render() { return vue.h('figure', { 'data-source': this.src, 'data-group': this.group }) } } },
    './components/LayerCard.vue': { default: empty }, './components/ReferenceCard.vue': { default: empty }, './components/PagePager.vue': { default: empty }, './components/RedirectStub.vue': { default: empty } }
  const component = new Function('modules', bindImports(code, modules) + '\nreturn __component')(modules)
  const app = vue.createSSRApp(component, props)
  app.config.warnHandler = () => {}
  return serverRenderer.renderToString(app)
}
test('CharacterRoster renders the listed data with its thumbnail, date and decorative alt alongside base bodies section', async (t) => {
  const root = sandbox(t); addCharacter(root, 'fixture'); addCharacter(root, 'draft', { listed: false })
  const html = await renderComponent('CharacterRoster.vue', loadCharacters(root), 'index.md')
  assert.match(html, /class="character-card" href="\/characters\/fixture\/" data-character-id="fixture" data-asset-id="body-front-latest"/)
  assert.match(html, /src="\/site\/thumbs\/fixture\/body-front-latest.webp" width="24" height="32" alt="" loading="lazy" decoding="async"/)
  assert.match(html, /class="character-card__name">Fixture<\/h2>/)
  assert.match(html, /class="character-card__role">守卫<\/p>/)
  assert.match(html, /最近更新 <time datetime="2026-11-16">2026-11-16<\/time>/)
  assert.match(html, /class="base-body-card" href="\/standards\/female-standard" data-base-body-id="female-standard" data-asset-id="female-standard-front-latest"/)
  assert.match(html, /class="base-body-card" href="\/standards\/female-curvy" data-base-body-id="female-curvy" data-asset-id="female-curvy-front-latest"/)
  assert.match(html, /class="base-body-card" href="\/standards\/male-standard" data-base-body-id="male-standard" data-asset-id="male-standard-front-latest"/)
  assert.match(html, /class="base-body-card" href="\/standards\/male-heavy" data-base-body-id="male-heavy" data-asset-id="male-heavy-front-latest"/)
  assert.doesNotMatch(html, /draft/)
})
test('base bodies registry loads all four tiers and twenty-nine stable assets', () => {
  const baseBodies = loadBaseBodies()
  assert.deepEqual(baseBodies.tiers.map(({ id }) => id), ['female-standard', 'female-curvy', 'male-standard', 'male-heavy'])
  assert.equal(Object.keys(baseBodies.assets).length, 29)
  assert.equal(baseBodies.assets['family-scale-latest'].original.path, '/media/base-bodies/family-scale-latest.png')
  assert.equal(baseBodies.readingOrder.length, 5)
})
test('LayerCard renders a 0..2 map with that character chapter, noun and wear', async (t) => {
  const root = sandbox(t); addCharacter(root, 'fixture')
  const html = await renderComponent('components/LayerCard.vue', loadCharacters(root), 'characters/fixture/part-1.md', { layer: 1 })
  assert.match(html, /href="\/characters\/fixture\/">Fixture<\/a> \/ <a href="\/characters\/fixture\/#parts">部件装配<\/a>/)
  assert.match(html, /aria-label="部件资料"/)
  assert.match(html, /第 1 层，共 0 到 2 层/)
  assert.match(html, /aria-label="第 0 到 2 层装配"/)
  assert.equal((html.match(/aria-label="第 [012] 层：/g) ?? []).length, 3)
})
test('world lore registry loads all five races and covers every listed character', () => {
  const world = loadWorld()
  const site = loader.load()
  assert.deepEqual(world.races.map(({ id }) => id), ['terran', 'avian', 'silica-carbon', 'automaton', 'nano-kin'])
  const memberIds = world.races.flatMap(({ members }) => members).sort()
  const rosterIds = site.roster.map(({ id }) => id).sort()
  assert.deepEqual(memberIds, rosterIds)
  for (const entry of site.roster) {
    const lore = world.characters[entry.id]
    assert.ok(lore, `Missing world lore for ${entry.id}`)
    assert.equal(lore.name, entry.name)
    assert.equal(lore.role, entry.role)
    assert.ok(lore.story.length >= 2)
  }
})
test('Bunny LayerCard retains its exact breadcrumb, noun, range and wear', async () => {
  const html = await renderComponent('components/LayerCard.vue', loader.load(), 'characters/bunny/weapon.md', { layer: 9 })
  for (const value of ['href="/characters/bunny/">邦妮·弗林</a> / <a href="/characters/bunny/#layers">衣层由内到外</a>', 'aria-label="衣层资料"', '第 9 层，共 0 到 9 层', 'aria-label="第 0 到 9 层穿着"']) assert.ok(html.includes(value), value)
})
test('CharacterPage validates layers against its data, including a number beyond nine', async (t) => {
  const root = sandbox(t); const dir = addCharacter(root, 'fixture')
  mutate(root, dir, 'layers.json', (value) => { value.items[2].layer = 12 })
  const data = loadCharacters(root)
  assert.match(await renderComponent('CharacterPage.vue', data, 'characters/fixture/part-2.md', {}, { pageType: 'layer', layer: 12 }), /bunny-page--layer/)
  await assert.rejects(renderComponent('CharacterPage.vue', data, 'characters/fixture/part-2.md', {}, { pageType: 'layer', layer: 9 }), /Invalid character layer/)
})
test('hero starts at the first tab and custom chips have inline colour without a modifier', async (t) => {
  const root = sandbox(t); addCharacter(root, 'fixture')
  const html = await renderComponent('components/CharacterHero.vue', loadCharacters(root), 'characters/fixture/index.md')
  assert.match(html, /class="bunny-idcard__name">Fixture/)
  assert.match(html, /class="bunny-idcard__role">守卫 <span>职业定位/)
  assert.match(html, /data-hero-panel="line"[^>]*tabindex="0"/)
  assert.doesNotMatch(html.match(/<div[^>]*data-hero-panel="line"[^>]*>/)[0], /hidden/)
  assert.match(html, /class="bunny-chips__swatch" style="background-color:#12ab89;"/)
  assert.match(html, /class="bunny-chips__swatch--orange bunny-chips__swatch" aria-hidden/)
})
test('hero lightbox groups follow asset count for every allowed tab key', async (t) => {
  const root = sandbox(t); const dir = addCharacter(root, 'fixture')
  mutate(root, dir, 'home.json', (value) => {
    value.tabs = [
      { key: 'line', label: '线稿', caption: '线稿', assets: ['line-latest', 'scene-latest'] },
      { key: 'three', label: '正面', caption: '正面', assets: ['body-front-latest'] },
    ]
  })
  const html = await renderComponent('components/CharacterHero.vue', loadCharacters(root), 'characters/fixture/index.md')
  assert.equal((html.match(/data-group="hero-line"/g) ?? []).length, 2)
  assert.doesNotMatch(html, /data-group="hero-three"/)
})
test('a card hero tab renders its own panel kind, phones show it whole, and unknown kinds are rejected', async (t) => {
  const root = sandbox(t); const dir = addCharacter(root, 'fixture')
  mutate(root, dir, 'home.json', (value) => { value.tabs = [{ key: 'card', label: '角色卡', caption: '角色卡', assets: ['scene-latest'] }] })
  const html = await renderComponent('components/CharacterHero.vue', loadCharacters(root), 'characters/fixture/index.md')
  assert.match(html, /<div[^>]*class="[^"]*\bbunny-hero__panel--card\b[^"]*"[^>]*data-hero-panel="card"/)
  const phone = readFileSync(new URL('../docs/.vitepress/theme/style.css', import.meta.url), 'utf8').match(/@media \(max-width: 760px\) \{([\s\S]*?)\n\}/)[1]
  assert.match(phone, /\.bunny-hero__panel--card \.release-image__trigger img[^{]*\{ object-fit: contain; \}/)
  mutate(root, dir, 'home.json', (value) => { value.tabs[0].key = 'poster' })
  assert.throws(() => loadCharacters(root), /Invalid hero tab: poster/)
})
test('OriginNote selects the current character original with the existing caption and detail', async (t) => {
  const root = sandbox(t); addCharacter(root, 'robot')
  const html = await renderComponent('components/OriginNote.vue', loadCharacters(root), 'characters/robot/index.md')
  assert.match(html, /data-image-id="robot-original-latest"/)
  assert.match(html, /caption="画师原稿 · 设计依据"/)
  assert.match(html, /detail="现行造型以本站三视为准"/)
  assert.doesNotMatch(html, /data-group/)
})
test('ReleaseImage excludes every origins source from groups while retaining ordinary groups', async () => {
  const data = loader.load()
  const origin = await renderComponent('components/ReleaseImage.vue', data, 'index.md', { src: '/characters/origins/robot-original-latest.webp', alt: '画师原稿', group: 'gallery' })
  assert.doesNotMatch(origin, /data-lightbox-group/)
  const ordinary = await renderComponent('components/ReleaseImage.vue', data, 'index.md', { src: '/characters/robot/body-front-latest.webp', alt: '正面', group: 'gallery' })
  assert.match(ordinary, /data-lightbox-group="gallery"/)
})
test('AssetImage can explicitly select another character outside a character page', async (t) => {
  const root = sandbox(t); addCharacter(root, 'bunny'); addCharacter(root, 'robot')
  const data = loadCharacters(root)
  assert.match(await renderComponent('components/AssetImage.vue', data, 'characters/bunny/index.md', { id: 'body-front-latest' }), /data-source="\/characters\/bunny\/body-front-latest.webp"/)
  assert.match(await renderComponent('components/AssetImage.vue', data, 'index.md', { character: 'robot', id: 'body-front-latest' }), /data-source="\/characters\/robot\/body-front-latest.webp"/)
  await assert.rejects(renderComponent('components/AssetImage.vue', data, 'index.md', { id: 'body-front-latest' }), /outside a character page/)
  await assert.rejects(renderComponent('components/AssetImage.vue', data, 'characters/robot/index.md', { id: 'robot-original-latest', group: 'gallery' }), /cannot join a lightbox group/)
})
test('measurement resources are scoped to the supplied character and default body URLs follow it', () => {
  const body = { views: { front: { source: { width: 24, height: 32 }, height: { crownY: 0, floorY: 30 }, landmarks: {} } } }
  assert.deepEqual(measurementModel(body, 'front', 'robot').resources, { original: '/media/robot/body-front-latest.png', web: '/characters/robot/body-front-latest.webp', ruler: '/characters/robot/body-front-ruler-latest.svg' })
  body.views.front.resources = { original: '/media/bunny/body-front-latest.png', web: '/characters/bunny/body-front-latest.webp', ruler: '/characters/bunny/body-front-ruler-latest.svg' }
  assert.throws(() => measurementModel(body, 'front', 'robot'), /Invalid measurement resource/)
  const garment = { designUnit: { px: 1 }, sources: { front: { source: { width: 24, height: 32 }, resources: body.views.front.resources } } }
  assert.throws(() => garmentModel(garment, 'front', 'robot'), /Invalid garment resource/)
})

test('measurement builders traverse every catalog, skip absent files and keep garment body dependencies local', (t) => {
  const root = sandbox(t)
  const sourceRoot = new URL('../', import.meta.url)
  for (const path of ['tools/build-body-measurements.mjs', 'tools/build-garment-measurements.mjs', 'docs/.vitepress/theme/components/body-measurements.mjs', 'docs/.vitepress/theme/components/garment-measurements.mjs']) {
    mkdirSync(join(root, path, '..'), { recursive: true })
    cpSync(new URL(path, sourceRoot), join(root, path))
  }
  const hash = (value) => createHash('sha256').update(value).digest('hex')
  for (const character of ['bunny', 'robot']) {
    const bodyBytes = readFileSync(new URL('catalog/bunny/body-measurements.json', sourceRoot), 'utf8').replaceAll('/bunny/', `/${character}/`)
    const body = JSON.parse(bodyBytes)
    const garment = JSON.parse(readFileSync(new URL('catalog/bunny/garment-measurements.json', sourceRoot), 'utf8').replaceAll('/bunny/', `/${character}/`))
    garment.bodyMeasurementsSha256 = hash(bodyBytes)
    const manifest = readFileSync(new URL('catalog/bunny/manifest.json', sourceRoot), 'utf8').replaceAll('/bunny/', `/${character}/`)
    write(root, `catalog/${character}/body-measurements.json`, bodyBytes)
    write(root, `catalog/${character}/garment-measurements.json`, garment)
    write(root, `catalog/${character}/manifest.json`, manifest)
    const models = [...Object.keys(body.views).map((id) => measurementModel(body, id, character)), ...Object.keys(garment.sources).map((id) => garmentModel(garment, id, character))]
    for (const path of new Set(models.map(({ resources }) => resources.web))) {
      const source = path.replace(`/${character}/`, '/bunny/')
      mkdirSync(join(root, 'docs/public' + path, '..'), { recursive: true })
      cpSync(new URL('docs/public' + source, sourceRoot), join(root, 'docs/public' + path))
    }
  }
  write(root, 'catalog/no-measurements/manifest.json', { assets: [] })
  for (const kind of ['body', 'garment']) {
    const output = execFileSync(process.execPath, [`tools/build-${kind}-measurements.mjs`], { cwd: root, encoding: 'utf8' })
    assert.equal((output.match(/measurements built:/g) ?? []).length, 2)
    for (const character of ['bunny', 'robot']) {
      assert.ok(readFileSync(join(root, `docs/public/catalog/${character}/${kind}-measurements.json`)).length)
      const ruler = `/characters/${character}/${kind === 'body' ? 'body' : 'innerwear'}-front-ruler-latest.svg`
      assert.match(readFileSync(join(root, 'docs/public' + ruler), 'utf8'), /data:image\/webp;base64,/)
    }
  }
  rmSync(join(root, 'catalog/robot/body-measurements.json'))
  assert.throws(() => execFileSync(process.execPath, ['tools/build-garment-measurements.mjs'], { cwd: root, stdio: 'pipe' }), /robot\/body-measurements.json/)
})
