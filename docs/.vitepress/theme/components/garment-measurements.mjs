import { formatNumber } from './body-measurements.mjs'

const finite = (n) => typeof n === 'number' && Number.isFinite(n)
const point = (p) => Array.isArray(p) && p.length === 2 && p.every(finite)
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1])
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]))
const statusLabels = { pass: '符合区间', fail: '超出区间', uncertain: '待复核', occluded: '遮挡', unmeasurable: '无法取点', unrated: '参照读数' }
const registrationLabels = { registered: '可作图面比对', limited: '标定依据有限', failed: '锚点对应待复核' }

export { formatNumber }

function targetBounds(target) {
  if (!target || target.unit !== 'h0' || (!finite(target.min) && target.min !== null) || (!finite(target.max) && target.max !== null) || (target.min === null && target.max === null)) throw new Error('Invalid garment target interval')
  const low = target.min === null ? -Infinity : target.min
  const high = target.max === null ? Infinity : target.max
  if (high < low) throw new Error('Invalid garment target interval')
  return [low, high]
}

export function formatTarget(target) {
  if (!target) return '仅记录'
  targetBounds(target)
  if (target.min === null) return `≤ ${formatNumber(target.max, 3)} h₀`
  if (target.max === null) return `≥ ${formatNumber(target.min, 3)} h₀`
  return `${formatNumber(target.min, 3)}–${formatNumber(target.max, 3)} h₀`
}

/** Fit one positive scale and a translation. No rotation or independent axis stretch. */
export function fitRegistration(registration) {
  const anchors = registration?.anchors ?? []
  const usable = anchors.filter((a) => point(a.source) && point(a.reference))
  if (usable.length < 2) return { status: 'limited', scale: null, scaleRange: null, rms: null, anchors: [], reason: '不足两个可对应的可见锚点。' }
  const mean = (key) => [0, 1].map((axis) => usable.reduce((sum, a) => sum + a[key][axis], 0) / usable.length)
  const centerSource = mean('source'); const centerReference = mean('reference')
  let numerator = 0; let denominator = 0
  for (const a of usable) for (const axis of [0, 1]) {
    const v = a.source[axis] - centerSource[axis]
    numerator += v * (a.reference[axis] - centerReference[axis]); denominator += v * v
  }
  if (denominator <= 0 || numerator <= 0) return { status: 'limited', scale: null, scaleRange: null, rms: null, anchors: [], reason: '锚点重合或无法得到正向统一尺度。' }
  const scale = numerator / denominator
  const translation = centerReference.map((v, axis) => v - scale * centerSource[axis])
  const fitted = usable.map((a) => {
    const transformed = a.source.map((v, axis) => scale * v + translation[axis])
    const residual = distance(transformed, a.reference)
    const hasTolerance = finite(a.sourceTolerancePx) && a.sourceTolerancePx >= 0 && finite(a.referenceTolerancePx) && a.referenceTolerancePx >= 0
    const tolerance = hasTolerance ? scale * a.sourceTolerancePx + a.referenceTolerancePx : null
    return { ...a, transformed, residual, tolerance, withinTolerance: tolerance === null ? null : residual <= tolerance + 1e-9 }
  })
  let widest = null
  for (let i = 0; i < fitted.length; i += 1) for (let j = i + 1; j < fitted.length; j += 1) {
    const d = distance(fitted[i].source, fitted[j].source)
    if (!widest || d > widest.distance) widest = { a: fitted[i], b: fitted[j], distance: d }
  }
  let scaleRange = null
  if (widest && [widest.a, widest.b].every((a) => a.tolerance !== null)) {
    const sourceTolerance = widest.a.sourceTolerancePx + widest.b.sourceTolerancePx
    const referenceTolerance = widest.a.referenceTolerancePx + widest.b.referenceTolerancePx
    if (widest.distance > sourceTolerance) {
      const referenceDistance = distance(widest.a.reference, widest.b.reference)
      const low = Math.max(0, (referenceDistance - referenceTolerance) / (widest.distance + sourceTolerance))
      const high = (referenceDistance + referenceTolerance) / (widest.distance - sourceTolerance)
      scaleRange = [Math.min(scale, low), Math.max(scale, high)]
    }
  }
  const regions = new Set(fitted.map((a) => a.region).filter(Boolean))
  const exceeded = fitted.some((a) => a.withinTolerance === false)
  const limited = registration.coverage !== 'distributed' || regions.size < 2 || !scaleRange || fitted.some((a) => a.withinTolerance === null)
  const status = exceeded ? 'failed' : limited ? 'limited' : 'registered'
  return { status, label: registrationLabels[status], scale, scaleRange, translation, centerSource, anchors: fitted,
    rms: Math.sqrt(fitted.reduce((sum, a) => sum + a.residual ** 2, 0) / fitted.length),
    maxResidual: Math.max(...fitted.map((a) => a.residual)),
    scalePair: widest ? [widest.a.id, widest.b.id] : [],
    reason: registration.reason ?? (status === 'registered' ? '锚点覆盖不同身体区域，逐点残差在各自取点容差内。' : status === 'failed' ? '至少一个锚点超出其自身语义容差。' : '锚点分布或容差不足，读数只作近似参考。') }
}

function resources(source) {
  const r = source.resources
  const patterns = {
    original: /^\/media\/bunny\/3\.1\.0\/[A-Za-z0-9][A-Za-z0-9._-]*\.png$/,
    web: /^\/characters\/bunny\/3\.1\.0\/[A-Za-z0-9][A-Za-z0-9._-]*\.webp$/,
    ruler: /^\/characters\/bunny\/3\.1\.0\/[A-Za-z0-9][A-Za-z0-9._-]*\.svg$/,
  }
  for (const key of ['original', 'web', ...(r?.ruler === undefined ? [] : ['ruler'])]) {
    if (typeof r?.[key] !== 'string' || !patterns[key].test(r[key]) || r[key].includes('..')) throw new Error(`Invalid garment resource: ${key}`)
  }
  return r
}

function normalizedInterval(raw, tolerance, scaleRange, unit, signed = false) {
  if (!scaleRange) return null
  const low = signed ? raw - tolerance : Math.max(0, raw - tolerance); const high = raw + tolerance
  const values = [low * scaleRange[0], low * scaleRange[1], high * scaleRange[0], high * scaleRange[1]]
  return [Math.min(...values) / unit, Math.max(...values) / unit]
}

export function garmentModel(data, id) {
  const source = data.sources?.[id]
  if (!source) throw new Error(`Unknown garment source: ${id}`)
  if (!Number.isInteger(source.source?.width) || !Number.isInteger(source.source?.height) || source.source.width < 1 || source.source.height < 1) throw new Error('Invalid garment image dimensions')
  const unit = data.designUnit?.px
  if (!finite(unit) || unit <= 0) throw new Error('Invalid garment design unit')
  const registration = fitRegistration(source.registration)
  const ids = new Set()
  const rows = (source.measurements ?? []).map((measurement, index) => {
    const metric = data.metrics?.[measurement.metricId]
    if (!metric || ids.has(measurement.metricId)) throw new Error(`Missing or duplicate garment metric: ${measurement.metricId}`)
    ids.add(measurement.metricId)
    const target = data.targets?.[source.view]?.[measurement.metricId] ?? null
    const referencePosition = data.referencePositions?.[source.view]?.[measurement.metricId] ?? null
    const bounds = target ? targetBounds(target) : null
    const common = { id: measurement.metricId, label: metric.label, symbol: metric.symbol ?? `G${index + 1}`, garment: metric.garment, definition: metric.definition,
      visibility: measurement.visibility, reason: measurement.reason ?? '', notes: measurement.notes ?? '', target,
      referencePosition, targetText: target ? formatTarget(target) : referencePosition ? `参照 ${formatNumber(referencePosition.nominal, 3)} h₀` : '仅记录' }
    if (['occluded', 'unmeasurable'].includes(measurement.visibility)) {
      if (measurement.points !== undefined && measurement.points !== null) throw new Error(`Hidden garment endpoint must not be assigned: ${measurement.metricId}`)
      return { ...common, px: null, normalized: null, interval: null, status: measurement.visibility, statusLabel: statusLabels[measurement.visibility] }
    }
    if (!['visible', 'estimated'].includes(measurement.visibility) || !Array.isArray(measurement.points) || measurement.points.length !== 2 || !measurement.points.every(point)) throw new Error(`Invalid garment endpoints: ${measurement.metricId}`)
    for (const p of measurement.points) if (p[0] < 0 || p[1] < 0 || p[0] >= source.source.width || p[1] >= source.source.height) throw new Error('Garment endpoint outside source')
    const [a, b] = measurement.points
    const axis = measurement.axis ?? metric.axis
    if (!['x', 'y', 'distance'].includes(axis)) throw new Error('Invalid garment measurement axis')
    if (axis === 'x' && a[1] !== b[1]) throw new Error('Horizontal width must name one exact image section')
    let px = axis === 'distance' ? distance(a, b) : b[axis === 'x' ? 0 : 1] - a[axis === 'x' ? 0 : 1]
    if (!metric.signed) px = Math.abs(px)
    const tolerance = measurement.tolerancePx
    if (!Array.isArray(tolerance) || tolerance.length !== 2 || !tolerance.every((v) => finite(v) && v >= 0)) throw new Error('Garment endpoint tolerances required')
    const interval = normalizedInterval(px, tolerance[0] + tolerance[1], registration.scaleRange, unit, metric.signed)
    const normalized = registration.scale === null ? null : px * registration.scale / unit
    let status = 'uncertain'
    if (!target || target.status !== 'accepted') status = 'unrated'
    else if (registration.status === 'registered' && interval) {
      if (interval[0] >= bounds[0] && interval[1] <= bounds[1]) status = 'pass'
      else if (interval[1] < bounds[0] || interval[0] > bounds[1]) status = 'fail'
    }
    return { ...common, px, normalized, interval, status, statusLabel: statusLabels[status], points: measurement.points, axis, tolerancePx: tolerance,
      guideX: measurement.guideX ?? 54 + (index % 3) * 46 }
  })
  const derived = (source.referenceDerivedMetrics ?? []).map((item) => referenceDerivedMetric(data, id, item, registration))
  return { id, label: source.label ?? id, view: source.view, layer: source.layer, source: source.source, resources: resources(source), registration, rows, derived, unit }
}

function visibleEndpoint(source, link) {
  const measurement = source.measurements.find((m) => m.metricId === link.metricId)
  if (![0, 1].includes(link.endpoint) || !measurement || !['visible', 'estimated'].includes(measurement.visibility) || !measurement.points?.every(point)) throw new Error('Derived comparison must link a measured visible endpoint')
  const tolerance = measurement.tolerancePx?.[link.endpoint]
  if (!finite(tolerance) || tolerance < 0) throw new Error('Derived endpoint tolerance required')
  return { point: measurement.points[link.endpoint], tolerance }
}

function registeredPosition(endpoint, registration) {
  if (registration.scale === null || !registration.scaleRange || registration.anchors.some((a) => a.tolerance === null)) return null
  const y = registration.scale * endpoint.point[1] + registration.translation[1]
  const x = registration.scale * endpoint.point[0] + registration.translation[0]
  const scaleError = Math.max(Math.abs(registration.scale - registration.scaleRange[0]), Math.abs(registration.scaleRange[1] - registration.scale))
  // This is a conservative pick-error envelope, not a statistical confidence interval.
  const uncertainty = endpoint.tolerance * registration.scaleRange[1]
    + Math.max(...registration.anchors.map((a) => a.tolerance)) + registration.maxResidual
    + Math.abs(endpoint.point[1] - registration.centerSource[1]) * scaleError
  return { x, y, uncertainty, pickTolerance: endpoint.tolerance * registration.scaleRange[1] }
}

/** Cross-image reference estimate is kept separate from observed same-image measurements. */
export function referenceDerivedMetric(data, sourceId, item, registration = fitRegistration(data.sources[sourceId].registration)) {
  const source = data.sources[sourceId]; const reference = data.sources[item.reference?.sourceId]
  const metric = data.metrics[item.metricId]
  if (!source || !reference || !metric || reference.view !== source.view || item.reference.sha256 !== reference.source.sha256) throw new Error('Derived comparison reference must be the exact same-view source')
  const currentPoint = visibleEndpoint(source, item.current)
  const referencePoint = visibleEndpoint(reference, item.reference)
  const referenceRegistration = fitRegistration(reference.registration)
  const currentPosition = registeredPosition(currentPoint, registration)
  const referencePosition = registeredPosition(referencePoint, referenceRegistration)
  const target = data.targets?.[source.view]?.[item.metricId] ?? null
  const bounds = target ? targetBounds(target) : null
  const unit = data.designUnit.px
  // A nearby point on a curved hem is not automatically the same station.
  const stationDeltaPx = currentPosition && referencePosition ? Math.abs(currentPosition.x - referencePosition.x) : null
  const stationTolerancePx = currentPosition && referencePosition ? currentPosition.pickTolerance + referencePosition.pickTolerance : null
  const stationMatched = stationDeltaPx !== null && stationDeltaPx <= stationTolerancePx
  const normalized = stationMatched ? (currentPosition.y - referencePosition.y) / unit : null
  const error = stationMatched ? (currentPosition.uncertainty + referencePosition.uncertainty) / unit : null
  const interval = error === null ? null : [normalized - error, normalized + error]
  let indication = 'unavailable'
  if (!target && interval && registration.status !== 'failed' && referenceRegistration.status !== 'failed') indication = 'reference'
  if (target?.status === 'accepted' && interval && registration.status !== 'failed' && referenceRegistration.status !== 'failed') {
    indication = interval[0] >= bounds[0] && interval[1] <= bounds[1] ? 'inside'
      : interval[1] < bounds[0] || interval[0] > bounds[1] ? 'outside' : 'overlap'
  }
  return { id: item.metricId, label: metric.label, definition: metric.definition, evidenceKind: 'reference-derived', status: 'limited',
    normalized, interval, target, indication, stationMatched, stationDeltaPx, stationTolerancePx,
    indicationLabel: stationDeltaPx !== null && !stationMatched ? '横向站位未匹配' : { inside: '推算区间内', outside: '推算超出区间', overlap: '推算待复核', reference: '推算参照 · 无硬规范', unavailable: '推算依据不足' }[indication],
    currentPoint: currentPoint.point, referencePoint: referencePoint.point,
    referenceSourceId: item.reference.sourceId, referenceSourceLabel: reference.label, referenceSourceSha256: reference.source.sha256,
    referenceOriginal: resources(reference).original, observedCoverage: item.observedCoverage ?? 'unknown',
    currentRegistration: registration.status, referenceRegistration: referenceRegistration.status, notes: item.notes ?? '' }
}

export function garmentCanvasSize(model) {
  return { width: model.source.width, height: model.source.height + 180 + (model.rows.length + model.derived.length) * 29 }
}

/** Annotation export embeds the original WebP unchanged; it is not a new character artwork. */
export function renderGarmentSvg(data, id, imageHref) {
  if (!/^(?:\/(?!\/)|data:image\/webp;base64,)/.test(imageHref)) throw new Error('Unsupported garment image source')
  const model = garmentModel(data, id)
  const { width, height } = model.source
  const colors = { pass: '#24795c', fail: '#c23c36', uncertain: '#9b681e', unrated: '#17699c' }
  const measured = model.rows.filter((r) => r.px !== null)
  const lines = measured.map((r) => {
    const [a, b] = r.points; const color = colors[r.status]
    const x1 = r.axis === 'y' ? r.guideX : a[0]; const x2 = r.axis === 'y' ? r.guideX : b[0]
    const y1 = a[1]; const y2 = b[1]
    const textX = r.axis === 'y' ? r.guideX - 9 : (x1 + x2) / 2
    const textY = r.axis === 'y' ? (y1 + y2) / 2 : (y1 + y2) / 2 - 12
    const rotation = r.axis === 'y' ? ` transform="rotate(-90 ${textX} ${textY})"` : ''
    return `<g data-measurement="${escape(r.id)}" stroke="${color}" fill="${color}"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><circle cx="${a[0]}" cy="${a[1]}" r="3.5"/><circle cx="${b[0]}" cy="${b[1]}" r="3.5"/>${r.axis === 'y' ? `<path d="M${a[0]},${y1}H${x1} M${b[0]},${y2}H${x2}" stroke-width="1" stroke-dasharray="5 5" fill="none"/>` : ''}<text x="${textX}" y="${textY}" text-anchor="middle"${rotation}>${escape(r.symbol)}</text></g>`
  }).join('')
  const rowTexts = [
    ...model.rows.map((r) => `${r.symbol} ${r.label} · ${r.normalized === null ? '—' : formatNumber(r.normalized, 3) + ' h₀'} · ${r.statusLabel}`),
    ...model.derived.map((r) => `基准推算（非同图实测）${r.label} · ${r.normalized === null ? '—' : formatNumber(r.normalized, 3) + ' h₀'} · ${r.indicationLabel}`),
  ]
  const rows = rowTexts.map((text, index) => `<text x="28" y="${height + 36 + index * 29}">${escape(text)}</text>`).join('')
  const fullHeight = garmentCanvasSize(model).height
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -100 ${width} ${fullHeight}" width="${width}" height="${fullHeight}" role="img" aria-label="${escape(model.label)}服装标尺"><title>${escape(model.label)} · 服装图面标尺</title><desc>原图保持不变，叠加可见取点。h₀为固定设计头单位，不是厘米、围度或裁片纸样。遮挡位置不赋值。</desc><rect x="0" y="-100" width="${width}" height="${fullHeight}" fill="white"/><image href="${escape(imageHref)}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/><g stroke-width="2.5" font-family="system-ui,sans-serif" font-size="22" font-weight="600"><style>text{stroke:white;stroke-width:5px;paint-order:stroke fill;stroke-linejoin:round}</style>${lines}</g><g font-family="system-ui,sans-serif" font-size="22" fill="#273344"><text x="28" y="-60">${escape(model.label)} · 图面尺寸观察</text><text x="28" y="-24">${escape(`h₀ = ${formatNumber(model.unit, 1)} 基准px；${model.registration.label ?? '标定依据有限'}`)}</text>${rows}<text x="28" y="${height + 65 + rowTexts.length * 29}">绿色符合 · 红色超出 · 橙色待复核 · 遮挡不补值</text></g></svg>`
}
