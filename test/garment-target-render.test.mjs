import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parse as parseSfc, compileScript, babelParse } from 'vue/compiler-sfc'
import { parse as parseHtml } from '@vue/compiler-dom'
import * as vue from 'vue'
import * as serverRenderer from 'vue/server-renderer'
import siteLoader from '../docs/.vitepress/data/bunny-site.data.mjs'
import * as siteHelpers from '../docs/.vitepress/theme/bunny-site.mjs'
import * as garmentHelpers from '../docs/.vitepress/theme/components/garment-measurements.mjs'

const filename = new URL('../docs/.vitepress/theme/components/GarmentMeasurements.vue', import.meta.url)
const source = readFileSync(filename, 'utf8')
const { descriptor, errors } = parseSfc(source, { filename: filename.pathname })
assert.deepEqual(errors, [])
const compiled = compileScript(descriptor, {
  id: 'garment-target-regression', genDefaultAs: '__component', inlineTemplate: true,
  templateOptions: { ssr: true },
}).content
// Compile the actual SFC, with its complete template and setup. Only the image
// child and URL base need stand-ins; all data/model/formatting code runs as used
// by the page, with the real Vue SSR runtime and site loader.
const modules = {
  vue, 'vue/server-renderer': serverRenderer,
  vitepress: { withBase: (value) => value },
  './ReleaseImage.vue': { default: { render: () => null } },
  '../../data/bunny-site.data.mjs': { data: await siteLoader.load() },
  '../bunny-site.mjs': siteHelpers,
  './garment-measurements.mjs': garmentHelpers,
}
let executable = compiled
for (const node of babelParse(compiled, { sourceType: 'module' }).program.body.toReversed()) {
  if (node.type !== 'ImportDeclaration') continue
  assert.ok(modules[node.source.value], `Unmapped SFC dependency: ${node.source.value}`)
  const bindings = node.specifiers.map((specifier) => {
    const imported = specifier.type === 'ImportDefaultSpecifier' ? 'default' : specifier.imported.name
    return `${JSON.stringify(imported)}: ${specifier.local.name}`
  }).join(', ')
  executable = executable.slice(0, node.start)
    + `const { ${bindings} } = modules[${JSON.stringify(node.source.value)}];`
    + executable.slice(node.end)
}
const component = new Function('modules', `${executable}\nreturn __component`)(modules)
const data = JSON.parse(readFileSync(new URL('../catalog/bunny/garment-measurements.json', import.meta.url), 'utf8'))

function all(node, tag) {
  return [...(node.type === 1 && node.tag === tag ? [node] : []),
    ...(node.children ?? []).flatMap((child) => all(child, tag))]
}
const text = (node) => node.type === 2 ? node.content : (node.children ?? []).map(text).join('')
function rowIn(table, label) {
  const rows = all(table, 'tr').filter((row) => all(row, 'th').some((cell) => text(cell) === label))
  assert.equal(rows.length, 1, `Expected one row for ${label}`)
  return rows[0]
}
function assertTargetCell(row, range, midpoint) {
  const cell = all(row, 'td')[0]
  assert.ok(cell)
  assert.deepEqual(all(cell, 'strong').map(text), [range], 'the range must be the primary target')
  assert.deepEqual(all(cell, 'small').map(text), midpoint === undefined ? [] : [`区间中值 ${midpoint}`])
  assert.equal(text(cell), range + (midpoint === undefined ? '' : `区间中值 ${midpoint}`), 'nominal is only an annotated midpoint')
}
async function render(input = data) {
  const html = await serverRenderer.renderToString(vue.createSSRApp(component, { data: input }))
  const tree = parseHtml(html)
  const tables = all(tree, 'table')
  const standards = tables.find((table) => all(table, 'caption').some((caption) => text(caption) === '固定设计目标'))
  assert.ok(standards, 'the actual SFC must render its target table')
  return { tree, standards }
}

test('jacket D SSR target cells emphasize two-decimal ranges and label nominal only as midpoint', async () => {
  const { standards } = await render()
  assertTargetCell(rowIn(standards, '前襟盖过白衣'), '0.04–0.10 h₀', '0.07 h₀')
  assertTargetCell(rowIn(standards, '后中露白'), '0.03–0.09 h₀', '0.06 h₀')
  assertTargetCell(rowIn(standards, '前端至裤腰净空'), '≥ 0.30 h₀')
})

test('the actual back readings table renders signed D bounds with 至 and Unicode minus', async () => {
  const input = structuredClone(data)
  input.defaultSourceId = 'jacket-highlow-base-aligned-back'
  const { tree } = await render(input)
  const readings = all(tree, 'div').find((node) => node.props.some((prop) => prop.name === 'class' && prop.value?.content === 'garment-measurements__readings'))
  assert.ok(readings)
  const cells = all(all(readings, 'table')[0], 'td').map(text)
  assert.ok(cells.includes('−0.09 至 −0.03 h₀'), 'back D range must appear in the rendered readings target cell')
  assert.ok(!cells.some((cell) => cell.includes('-0.09–-0.03')))
})

test('one-sided back targets preserve null bounds and suppress null or missing nominal', async () => {
  for (const [min, max, nominal, range] of [
    [null, -0.03, undefined, '≥ 0.03 h₀'],
    [-0.09, null, null, '≤ 0.09 h₀'],
    [-0.09, 0, undefined, '0.00–0.09 h₀'],
  ]) {
    const input = structuredClone(data)
    const target = input.targets.back.jacketWhiteOffset
    Object.assign(target, { min, max })
    if (nominal === undefined) delete target.nominal
    else target.nominal = nominal
    const { standards } = await render(input)
    const row = rowIn(standards, '后中露白')
    assertTargetCell(row, range)
    assert.doesNotMatch(text(row), /NaN|null|[−-]0(?:\.0+)?(?:\s|–|$)/)
  }
})
