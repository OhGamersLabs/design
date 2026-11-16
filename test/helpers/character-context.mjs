import { readFileSync } from 'node:fs'
import { babelParse } from 'vue/compiler-sfc'
import { transformWithEsbuild } from 'vite'
import * as vue from 'vue'
import * as helpers from '../../docs/.vitepress/theme/character-site.mjs'

/** Exercise the real composable with VitePress's reactive page contract. */
export async function characterContext(data, relativePath = 'characters/bunny/index.md') {
  const page = vue.ref({ relativePath, headers: [], title: '', frontmatter: {} })
  const frontmatter = vue.computed(() => page.value.frontmatter)
  const vitepress = { useData: () => ({ page, frontmatter }), withBase: (value) => value }
  const modules = { vue, vitepress, '../data/site.data.mjs': { data }, './character-site.mjs': helpers }
  const path = new URL('../../docs/.vitepress/theme/use-character.ts', import.meta.url)
  const { code } = await transformWithEsbuild(readFileSync(path, 'utf8'), path.pathname, { loader: 'ts', format: 'cjs' })
  // esbuild emits CJS so the real TypeScript module can use the fixture's data
  // and useData without a browser, a Vite server or a second loader instance.
  const output = { exports: {} }
  new Function('require', 'module', 'exports', code)((name) => {
    if (!Object.hasOwn(modules, name)) throw new Error(`Unmapped composable dependency: ${name}`)
    return modules[name]
  }, output, output.exports)
  return { page, vitepress, composable: output.exports }
}

/** Rewrite only static imports in compiler output; retain its render/setup. */
export function bindImports(source, modules) {
  let result = source
  for (const node of babelParse(source, { sourceType: 'module' }).program.body.toReversed()) {
    if (node.type !== 'ImportDeclaration') continue
    if (!Object.hasOwn(modules, node.source.value)) throw new Error(`Unmapped component dependency: ${node.source.value}`)
    const bindings = node.specifiers.map((item) => `${JSON.stringify(item.type === 'ImportDefaultSpecifier' ? 'default' : item.imported.name)}: ${item.local.name}`).join(', ')
    result = result.slice(0, node.start) + `const { ${bindings} } = modules[${JSON.stringify(node.source.value)}];` + result.slice(node.end)
  }
  return result
}
