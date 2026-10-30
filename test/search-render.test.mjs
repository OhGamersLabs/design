import test from 'node:test'
import assert from 'node:assert/strict'
import { createMarkdownRenderer } from 'vitepress'
import { createSearchRender } from '../docs/.vitepress/search-render.mjs'

const md = await createMarkdownRenderer(process.cwd())
const archive = { groups: [{ id: 'staff', title: '双手棍', items: [{ asset: 'staff-v2-held-v1', date: '2026-10-26', replacedBy: '双匕首' }] }] }
const names = { 'staff-v2-held-v1': '双手棍持握' }
const changes = [{ date: '2026-10-26', order: 1, latest: null, log: { change: '武器改为双匕首', reason: '负责人选定', asset: 'staff-v2-held-v1', caption: '现行：双匕首' } }]
const render = createSearchRender({ archive, names, changes })
test('archive grids and changelog contribute searchable text under their headings', () => {
  const env = { relativePath: 'characters/bunny/archive.md' }
  const html = render('# 历史档案\n\n## 双手棍\n\n<ArchiveGrid group="staff" />\n\n<ChangelogTable />', env, md)
  for (const text of ['历史档案', '双手棍持握', '2026-10-26', '已改为', '双匕首', '负责人选定']) assert.ok(html.includes(text), text)
  assert.ok(!html.includes('<ArchiveGrid'))
  assert.ok(!html.includes('<ChangelogTable'))
})
test('search false is read only after real markdown frontmatter parsing', () => {
  const env = { relativePath: 'characters/bunny/face.md' }
  assert.equal(render('---\nsearch: false\n---\n# 面部\n不应索引', env, md), '')
  assert.equal(env.frontmatter.search, false)
})
test('non-archive source renders normally and archive labels are escaped', () => {
  assert.ok(render('# 身体\n\n比例', { relativePath: 'characters/bunny/body-base.md' }, md).includes('比例'))
  const safe = createSearchRender({ archive, names: { 'staff-v2-held-v1': '<script>bad</script>' }, changes: [] })
  assert.ok(!safe('<ArchiveGrid group="staff" />', { relativePath: 'characters/bunny/archive.md' }, md).includes('<script>bad</script>'))
})
