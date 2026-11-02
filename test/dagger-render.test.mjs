import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compile } from '@vue/compiler-dom'
import { parse, compileScript, babelParse } from 'vue/compiler-sfc'
import { createMarkdownRenderer } from 'vitepress'
import { transformWithEsbuild } from 'vite'
import * as vue from 'vue'
import siteLoader from '../docs/.vitepress/data/bunny-site.data.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const read = (path) => readFileSync(resolve(root, path), 'utf8')
const specification = JSON.parse(read('catalog/bunny/dagger-dimensions.json'))
const siteData = await siteLoader.load()
const md = await createMarkdownRenderer(resolve(root, 'docs'))
const forbidden = /新图|旧图|重画|抽卡|take|guide|引导图|Phase|迭代|版本|不沿用旧测点|修图|(?:l9[a-z0-9]*-[^\s<>]*|dagger-master[^\s<>]*|root-scale-decision|sunraku04-projection-scale-analysis)\.(?:json|png)/iu
const assertDesignText = (text) => assert.doesNotMatch(text.replace(/\p{Cf}/gu, ''), forbidden)

// Run the client Vue render functions, including reactive component setup,
// against an in-memory host. This needs neither a browser nor a DOM emulator.
function host() {
  const make = (tag, text = '') => ({ tag, text, props: {}, children: [], parent: null })
  const renderer = vue.createRenderer({
    createElement: (tag) => make(tag), createText: (text) => make('#text', text),
    createComment: () => make('#comment'),
    setText: (node, text) => { node.text = text },
    setElementText: (node, text) => { node.text = text; node.children = [] },
    patchProp: (node, key, _before, value) => { node.props[key] = value },
    insert(node, parent, anchor = null) {
      if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1)
      node.parent = parent
      const index = anchor ? parent.children.indexOf(anchor) : -1
      parent.children.splice(index < 0 ? parent.children.length : index, 0, node)
    },
    remove(node) { node.parent?.children.splice(node.parent.children.indexOf(node), 1) },
    parentNode: (node) => node.parent,
    nextSibling: (node) => node.parent?.children[node.parent.children.indexOf(node) + 1] ?? null,
  })
  return { renderer, container: make('root') }
}
const textOf = (node) => node.text + node.children.map(textOf).join('')
const nodes = (node, tag) => [...(node.tag === tag ? [node] : []), ...node.children.flatMap((child) => nodes(child, tag))]
const snapshot = (node) => ({ tag: node.tag, text: node.text, props: { ...node.props }, children: node.children.map(snapshot) })
const Empty = { render: () => null }

function renderPage(page, extra = '') {
  const env = { relativePath: `characters/bunny/${page}.md` }
  const template = md.render(read(`docs/characters/bunny/${page}.md`) + extra, env)
  const { code } = compile(template, { mode: 'function', prefixIdentifiers: true, hoistStatic: false })
  const render = new Function('Vue', code)(vue)
  const { renderer, container } = host()
  const app = renderer.createApp({
    // These unrelated measurement children do not supply any dagger text.
    setup: () => ({ measurements: {}, garments: {} }), render,
  })
  for (const name of ['BodyMeasurements', 'GarmentMeasurements', 'AssetImage', 'LayerTpose', 'LayerStrip', 'LatestList', 'OriginNote', 'CharacterHero', 'ChapterBar']) app.component(name, Empty)
  app.mount(container)
  const result = { text: textOf(container), tree: snapshot(container) }
  app.unmount()
  return result
}

async function layerCard(data = siteData) {
  const filename = 'docs/.vitepress/theme/components/LayerCard.vue'
  const { descriptor, errors } = parse(read(filename), { filename })
  assert.deepEqual(errors, [])
  const compiled = compileScript(descriptor, { id: 'dagger-layer-client', genDefaultAs: '__component', inlineTemplate: true }).content
  const modules = { vue, vitepress: { withBase: (value) => value }, '../../data/bunny-site.data.mjs': { data } }
  let executable = (await transformWithEsbuild(compiled, filename + '.ts', { loader: 'ts' })).code
  for (const node of babelParse(executable, { sourceType: 'module' }).program.body.toReversed()) {
    if (node.type !== 'ImportDeclaration') continue
    assert.ok(modules[node.source.value], `Unmapped LayerCard dependency: ${node.source.value}`)
    const bindings = node.specifiers.map((item) => `${JSON.stringify(item.imported.name)}: ${item.local.name}`).join(', ')
    executable = executable.slice(0, node.start) + `const { ${bindings} } = modules[${JSON.stringify(node.source.value)}];` + executable.slice(node.end)
  }
  const component = new Function('modules', `${executable}\nreturn __component`)(modules)
  const { renderer, container } = host()
  const app = renderer.createApp(component, { layer: 9 })
  app.mount(container)
  const text = textOf(container)
  app.unmount()
  return text
}

test('dagger pages render current target strings through VitePress and the client Vue compiler', () => {
  for (const page of ['weapon', 'dimensions', 'index', 'application']) {
    const { text } = renderPage(page)
    for (const name of ['dark', 'ivory']) {
      const total = specification.designTargets.values[name].total_H0.toFixed(3)
      assert.ok(new RegExp(`${total}\\s*H0`).test(text), `${page}: missing ${total} H0`)
    }
    assert.doesNotMatch(text, /0\.(?:360?|420?)\s*H0|短于设计目标，待复核|28°\s*是握柄方向/)
    assertDesignText(text)
  }
  const { tree } = renderPage('dimensions')
  const rows = nodes(tree, 'tr')
  const labels = {
    blade_axial: '刃部轴向段', guard_center_band: '护手中央段', red_collar: '红领段',
    visible_grip: '可见握柄段', pommel_axial: '柄尾轴向段',
    blade_max_front_width: '刀身最大正面截宽', guard_transverse_envelope: '护手横向总宽',
    grip_max_front_width: '握柄最大正面截宽',
  }
  for (const [key, label] of Object.entries(labels)) {
    const row = rows.find((candidate) => {
      const firstCell = candidate.children.find((child) => child.tag === 'td' || child.tag === 'th')
      return firstCell && textOf(firstCell) === label
    })
    assert.ok(row, `missing rendered dimension row: ${label}`)
    const cells = row.children.filter((child) => child.tag === 'td').map(textOf)
    for (const [i, name] of ['dark', 'ivory'].entries()) {
      const value = specification.designTargets.values[name].partsAndWidths_H0[key].toFixed(3)
      assert.match(cells[i + 1], new RegExp(`${value}\\s*H0`), `${label}: ${name}`)
    }
  }
})

test('layer 9 fact strings execute the actual client Vue component setup and template', async () => {
  const text = await layerCard()
  const facts = siteData.layers.find((layer) => layer.layer === 9).facts
  for (const fact of facts) assert.ok(text.includes(fact.value), `layer fact missing from render: ${fact.term}`)
  assertDesignText(text)
})

test('rendered dagger checks reject every prohibited process term and internal evidence filename', async () => {
  const terms = ['新图', '旧图', '重画', '抽卡', 'take', 'guide', '引导图', 'Phase', '迭代', '版本', '不沿用旧测点', '修图', 'l9n-daggers-back-native-observations.json']
  for (const term of terms) {
    const { text } = renderPage('weapon', `\n\n<p>${term}</p>\n`)
    assert.throws(() => assertDesignText(text), { name: 'AssertionError' }, `rendered Markdown must reject ${term}`)
    const mutated = structuredClone(siteData)
    mutated.layers.find((layer) => layer.layer === 9).facts[0].value = term
    const dynamicText = await layerCard(mutated)
    assert.throws(() => assertDesignText(dynamicText), { name: 'AssertionError' }, `rendered Vue fact must reject ${term}`)
  }
})
