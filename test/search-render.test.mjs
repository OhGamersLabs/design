import test from 'node:test'
import assert from 'node:assert/strict'
import { createMarkdownRenderer } from 'vitepress'
import { createSearchRender } from '../docs/.vitepress/search-render.mjs'
const md = await createMarkdownRenderer(process.cwd())
const render = createSearchRender()
test('search excludes redirect stubs after parsing real frontmatter', () => {
  for (const name of ['face', 'archive', 'downloads']) {
    const env = { relativePath: `characters/bunny/${name}.md` }
    assert.equal(render('---\nsearch: false\n---\n# 旧入口\n不应索引', env, md), '')
    assert.equal(env.frontmatter.search, false)
  }
})
test('current page content remains searchable', () => {
  assert.ok(render('# 身体\n\n比例', { relativePath: 'characters/bunny/body-base.md' }, md).includes('比例'))
})
