#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { garmentModel, renderGarmentSvg } from '../docs/.vitepress/theme/components/garment-measurements.mjs'

const root = resolve(import.meta.dirname, '..')
const check = process.argv.includes('--check')
const relative = 'catalog/bunny/garment-measurements.json'
const bytes = await readFile(resolve(root, relative))
const data = JSON.parse(bytes)
const bodyBytes = await readFile(resolve(root, 'catalog/bunny/body-measurements.json'))
const body = JSON.parse(bodyBytes)
const manifest = JSON.parse(await readFile(resolve(root, 'catalog/bunny/manifest.json'), 'utf8'))
const hash = (value) => createHash('sha256').update(value).digest('hex')
const h0 = body.views.front.landmarks.chin.y - body.views.front.height.crownY
if (data.schemaVersion !== 1 || data.bodyMeasurementsSha256 !== hash(bodyBytes) || data.designUnit?.px !== h0 || !(h0 > 0)) throw new Error('Garment design unit does not match the frozen body measurement source')
if (!data.sources || !Object.keys(data.sources).length) throw new Error('Missing garment observations')

async function output(path, value) {
  const target = resolve(root, path)
  if (check) {
    if (!Buffer.from(value).equals(await readFile(target))) throw new Error(`Stale garment measurement artifact: ${path}`)
  } else {
    await mkdir(resolve(target, '..'), { recursive: true })
    await writeFile(target, value)
  }
}

const rulers = new Set()
for (const [id, source] of Object.entries(data.sources)) {
  const model = garmentModel(data, id)
  if (!body.views[source.view] || source.registration.bodyView !== source.view) throw new Error(`Garment registration must use the same body view: ${id}`)
  if (source.registration.bodySourceSha256 !== undefined && source.registration.bodySourceSha256 !== body.views[source.view].source.sha256) throw new Error(`Garment registration body source changed: ${id}`)
  const { original: originalUrl, web: webUrl, ruler: rulerUrl } = model.resources
  const asset = manifest.assets.find((item) => item.original.path === originalUrl)
  const web = await readFile(resolve(root, 'docs/public' + webUrl))
  if (!asset || asset.original.sha256 !== source.source.sha256 || asset.original.width !== source.source.width || asset.original.height !== source.source.height || asset.web.path !== webUrl || asset.web.sha256 !== hash(web)) throw new Error(`Garment source does not match its manifest: ${id}`)
  if (check) {
    const native = await readFile(resolve(root, '.release', originalUrl.slice('/media/'.length)))
    if (hash(native) !== source.source.sha256 || native.readUInt32BE(16) !== source.source.width || native.readUInt32BE(20) !== source.source.height) throw new Error(`Garment source does not match the native PNG: ${id}`)
  }
  if (rulerUrl) {
    if (rulers.has(rulerUrl)) throw new Error('Duplicate garment ruler output')
    rulers.add(rulerUrl)
    await output('docs/public' + rulerUrl, renderGarmentSvg(data, id, `data:image/webp;base64,${web.toString('base64')}`) + '\n')
  }
}
await output('docs/public/' + relative, bytes)
console.log(`Garment measurements ${check ? 'verified' : 'built'}: ${Object.keys(data.sources).length} observed sources, ${rulers.size} self-contained SVGs, 1 shared data file`)
