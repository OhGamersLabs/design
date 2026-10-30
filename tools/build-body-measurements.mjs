#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { measurementModel, renderMeasurementSvg } from '../docs/.vitepress/theme/components/body-measurements.mjs'

const root = resolve(import.meta.dirname, '..')
const check = process.argv.includes('--check')
const relative = 'catalog/bunny/body-measurements.json'
const bytes = await readFile(resolve(root, relative))
const data = JSON.parse(bytes)
const manifest = JSON.parse(await readFile(resolve(root, 'catalog/bunny/manifest.json'), 'utf8'))
const hash = (value) => createHash('sha256').update(value).digest('hex')

async function output(path, value) {
  const target = resolve(root, path)
  if (check) {
    if (!Buffer.from(value).equals(await readFile(target))) throw new Error(`Stale body measurement artifact: ${path}`)
  } else {
    await mkdir(resolve(target, '..'), { recursive: true })
    await writeFile(target, value)
  }
}

if (data.schemaVersion !== 1 || Object.keys(data.views).join(',') !== 'front,side,back') throw new Error('Expected three independent body measurement views')
for (const id of ['front', 'side', 'back']) {
  const model = measurementModel(data, id)
  const { original: originalUrl, web: webUrl, ruler: rulerUrl } = model.resources
  const asset = manifest.assets.find((item) => item.original.path === originalUrl)
  const web = await readFile(resolve(root, 'docs/public' + webUrl))
  if (!asset || asset.original.sha256 !== model.source.sha256 || asset.original.width !== model.source.width || asset.original.height !== model.source.height || asset.web.path !== webUrl || asset.web.sha256 !== hash(web)) throw new Error(`Measurement source does not match its manifest: ${id}`)
  // A checkout can build the website from tracked WebPs. Only local-media
  // verification requires the ignored native PNGs, as before this feature.
  if (check) {
    const original = await readFile(resolve(root, '.release', originalUrl.slice('/media/'.length)))
    if (hash(original) !== model.source.sha256 || original.readUInt32BE(16) !== model.source.width || original.readUInt32BE(20) !== model.source.height) throw new Error(`Measurement source does not match the native PNG: ${id}`)
  }
  const svg = renderMeasurementSvg(data, id, `data:image/webp;base64,${web.toString('base64')}`)
  await output('docs/public' + rulerUrl, svg + '\n')
}
await output('docs/public/' + relative, bytes)
console.log(`Body measurements ${check ? 'verified' : 'built'}: 3 original images, 3 self-contained SVGs, 1 shared data file`)
