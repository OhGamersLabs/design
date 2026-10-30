import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parsePackage } from '../docs/.vitepress/data/bunny-data.mjs'
import {
  assetById, buildAssetIndex, readingNeighbors, resolveAnchorTarget,
  selectLatest, shouldRedirectForHash, stepIndex,
} from '../docs/.vitepress/theme/bunny-site.mjs'

const json = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'))
const manifests = [json('../catalog/bunny/3.1.0/manifest.json'), json('../catalog/origins/1.0.0/manifest.json')]
const names = json('../docs/.vitepress/data/bunny/asset-names.json')
const thumbs = json('../docs/public/site/thumbs/index.json')

test('source package follows the manifest download and requires its entry', () => {
  const downloads = [{ id: 'other-file', path: '/other.zip', bytes: 1 }, { id: 'source-images', path: '/updated-package.zip', bytes: 2048 }]
  assert.deepEqual(parsePackage(downloads), { path: '/updated-package.zip', bytes: 2048 })
  assert.throws(() => parsePackage(downloads.slice(0, 1)), /Missing manifest download: source-images/)
  assert.throws(() => parsePackage([]), /Missing manifest download: source-images/)
})

test('asset index joins manifests, finalized names and thumbnails', () => {
  const index = buildAssetIndex({ manifests, names, thumbs })
  assert.equal(Object.keys(index).length, 184)
  assert.equal(index['sun05-scene-final-v1'].web.width, 1774)
  assert.equal(index['sun05-scene-final-v1'].thumb.width, 480)
  assert.equal(index['bunny-original'].collection, 'origins/1.0.0')
  assert.throws(() => assetById(index, 'no-such-id'), /no-such-id/)
  assert.throws(() => assetById(index, 'constructor'), /constructor/)
})
test('incomplete or unknown names and missing thumbnails fail with the id', () => {
  const missing = { ...names }
  delete missing['sun05-scene-final-v1']
  assert.throws(() => buildAssetIndex({ manifests, names: missing, thumbs }), /sun05-scene-final-v1/)
  assert.throws(() => buildAssetIndex({ manifests, names: { ...names, unknown: '未知' }, thumbs }), /unknown/)
  assert.throws(() => buildAssetIndex({ manifests, names: { ...names, 'sun05-scene-final-v1': ' ' }, thumbs }), /sun05-scene-final-v1/)
  const missingThumb = { ...thumbs }
  delete missingThumb['bunny/3.1.0/sun05-scene-final-v1']
  assert.throws(() => buildAssetIndex({ manifests, names, thumbs: missingThumb }), /sun05-scene-final-v1/)
})
const records = [
  ['2026-10-29', 1, '场景图定稿', 'sun05-scene-final-v1'],
  ['2026-10-28', 1, 'STRUCTURE20 线稿通过', 'structure20-lineart-v1'],
  ['2026-10-28', 2, 'SUN-05 冲刺姿势选定', 'sun05-pose-structure-v1'],
  ['2026-10-27', 1, '后腰交叉携行三视', 'assassin-daggers-waist-carry-cel-back-v2'],
  ['2026-10-26', 1, null, 'a'], ['2026-10-26', 2, null, 'b'],
  ['2026-10-25', 1, null, 'c'], ['2026-10-25', 2, null, 'd'],
].map(([date, order, title, asset]) => ({ date, order, latest: title ? { title, asset, caption: title } : null, log: { change: '', reason: '—', asset, caption: '现行：示例' } }))
test('latest filters and sorts eight changes without changing the source', () => {
  const changes = records.toReversed()
  const before = structuredClone(changes)
  assert.deepEqual(selectLatest(changes, 4).map(({ date, title }) => [date, title]), [
    ['2026-10-29', '场景图定稿'], ['2026-10-28', 'STRUCTURE20 线稿通过'],
    ['2026-10-28', 'SUN-05 冲刺姿势选定'], ['2026-10-27', '后腰交叉携行三视'],
  ])
  assert.deepEqual(changes, before)
  assert.deepEqual(selectLatest(changes, 0), [])
})
const anchorMap = {
  stubs: { '/characters/bunny/face': { target: '/characters/bunny/#identity', title: '身份与画风' } },
  anchors: { '/characters/bunny/face#头': '/characters/bunny/#head', '/characters/bunny/#本轮补充': '/characters/bunny/archive#extra' },
}
test('legacy URLs normalize html/index and percent-encoded hashes before lookup', () => {
  assert.equal(resolveAnchorTarget(anchorMap, '/characters/bunny/face.html', '#%E5%A4%B4'), '/characters/bunny/#head')
  assert.equal(resolveAnchorTarget(anchorMap, '/characters/bunny/index.html', '#%E6%9C%AC%E8%BD%AE%E8%A1%A5%E5%85%85'), '/characters/bunny/archive#extra')
  assert.equal(resolveAnchorTarget(anchorMap, '/characters/bunny/index', '#本轮补充'), '/characters/bunny/archive#extra')
  assert.equal(resolveAnchorTarget(anchorMap, '/characters/bunny/face', ''), '/characters/bunny/#identity')
  assert.equal(resolveAnchorTarget(anchorMap, '/characters/bunny/jacket', '#jacket-wearing'), null)
  assert.equal(resolveAnchorTarget(anchorMap, '/characters/bunny/jacket', '#%broken'), null)
})
test('hash fallback requires a missing nonempty id; a later route is checked afresh', () => {
  assert.equal(shouldRedirectForHash('#x', false), true)
  assert.equal(shouldRedirectForHash('#x', true), false)
  assert.equal(shouldRedirectForHash('', false), false)
  assert.equal(shouldRedirectForHash('#', false), false)
  assert.deepEqual([true, false].map((exists) => shouldRedirectForHash('#x', exists)), [false, true])
})
test('lightbox steps clamp, including single and empty groups', () => {
  assert.equal(stepIndex(0, -1, 3), 0)
  assert.equal(stepIndex(2, 1, 3), 2)
  assert.equal(stepIndex(0, 1, 3), 1)
  assert.equal(stepIndex(0, 1, 1), 0)
  assert.equal(stepIndex(0, 1, 0), 0)
})
test('reading neighbors follow layer order and stop at both ends', () => {
  const { prev, next } = readingNeighbors('/characters/bunny/jacket')
  assert.equal(prev.path, '/characters/bunny/thigh-gear')
  assert.equal(next.path, '/characters/bunny/harness')
  assert.equal(readingNeighbors('/characters/bunny/index.html').prev, null)
  assert.equal(readingNeighbors('/characters/bunny/downloads').next, null)
  assert.deepEqual(readingNeighbors('/missing'), { prev: null, next: null })
})
