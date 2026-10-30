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
