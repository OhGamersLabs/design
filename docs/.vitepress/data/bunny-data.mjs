import { existsSync, readFileSync } from 'node:fs'

/** @param {URL} file @param {unknown} fallback @returns {unknown} */
export function readJson(file, fallback) {
  if (!existsSync(file)) return fallback
  return JSON.parse(readFileSync(file, 'utf8'))
}
/** @param {unknown} value @returns {Record<string, unknown>} */
export function record(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('Expected a JSON object')
  return Object.fromEntries(Object.entries(value))
}
/** @param {unknown} value @returns {unknown[]} */
export function list(value) {
  if (!Array.isArray(value)) throw new Error('Expected a JSON array')
  return value
}
/** @param {unknown} value @returns {string} */
export function text(value) {
  if (typeof value !== 'string') throw new Error('Expected a JSON string')
  return value
}
/** @param {unknown} value @returns {number} */
export function number(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) throw new Error('Expected a finite JSON number')
  return value
}
/** @param {unknown} value @returns {Record<string, string>} */
export function parseNames(value) {
  return Object.fromEntries(Object.entries(record(value)).map(([key, name]) => [key, text(name)]))
}
/** @param {unknown} value @returns {import('../theme/bunny-site-types').DownloadPackage} */
export function parsePackage(value) {
  const entry = list(value).map(record).find((download) => download.id === 'source-images')
  if (!entry) throw new Error('Missing manifest download: source-images')
  return { path: text(entry.path), bytes: number(entry.bytes) }
}
/** @param {unknown} value @returns {import('../theme/bunny-site-types').ArchiveData} */
export function parseArchive(value) {
  return { groups: list(record(value).groups).map((entry) => {
    const group = record(entry)
    return {
      id: text(group.id), title: text(group.title), statuses: list(group.statuses).map(text),
      items: list(group.items).map((entry) => {
        const item = record(entry)
        return { asset: text(item.asset), date: text(item.date), replacedBy: text(item.replacedBy) }
      }),
    }
  }) }
}
/** @param {unknown} value @returns {import('../theme/bunny-site-types').ChangeRecord[]} */
export function parseChanges(value) {
  return list(value).map((entry) => {
    const item = record(entry)
    const log = record(item.log)
    const latest = item.latest === null ? null : record(item.latest)
    return {
      date: text(item.date), order: number(item.order),
      latest: latest ? { title: text(latest.title), asset: text(latest.asset), caption: text(latest.caption) } : null,
      log: { change: text(log.change), reason: text(log.reason), asset: text(log.asset), caption: text(log.caption) },
    }
  })
}
/** @param {unknown} value @returns {import('../theme/bunny-site-types').AnchorMap} */
export function parseAnchorMap(value) {
  const source = record(value)
  return {
    anchors: parseNames(source.anchors),
    stubs: Object.fromEntries(Object.entries(record(source.stubs)).map(([path, entry]) => {
      const stub = record(entry)
      return [path, { target: text(stub.target), title: text(stub.title) }]
    })),
  }
}
