const labels = { front: '正面', side: '侧面', back: '背面' }
const widthLabels = { shoulder: ['S', '肩宽'], chest: ['C', '衣物胸宽'], waist: ['W', '腰宽'], hip: ['P', '胯宽'] }
const pointLabels = { crown: '可见发冠', chin: '下颏', shoulder: '肩参考线', chest: '胸部参考线', waist: '自然腰', crotch: '腿间隙起点', knee: '膝参考线', ankle: '踝参考线', floor: '赤脚地面' }
const lengthDisplay = {
  shoulderToCrotch: ['T', '图面躯干段', 840],
  shoulderToWaist: ['U', '肩线至自然腰', 920],
  waistToCrotch: ['V', '自然腰至裆下', 920],
  visibleLeg: ['L', '图面腿长', 840],
  crotchToKnee: ['L1', '裆下至膝线', 920],
  kneeToAnkle: ['L2', '膝线至踝线', 920],
}
const number = (value) => typeof value === 'number' && Number.isFinite(value)
const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]))

export const formatNumber = (value, digits = 2) => number(value) ? Number(value.toFixed(digits)).toString() : '—'

function measurementResources(view, id) {
  const resources = view.resources === undefined ? {
    original: `/media/bunny/body-${id}-latest.png`,
    web: `/characters/bunny/body-${id}-latest.webp`,
    ruler: `/characters/bunny/body-${id}-ruler-latest.svg`,
  } : view.resources
  const patterns = {
    original: /^\/media\/bunny\/[a-z0-9]+(?:-[a-z0-9]+)*-latest\.png$/,
    web: /^\/characters\/bunny\/[a-z0-9]+(?:-[a-z0-9]+)*-latest\.webp$/,
    ruler: /^\/characters\/bunny\/[a-z0-9]+(?:-[a-z0-9]+)*-latest\.svg$/,
  }
  for (const [name, pattern] of Object.entries(patterns)) {
    if (typeof resources?.[name] !== 'string' || !pattern.test(resources[name])) throw new Error(`Invalid measurement resource: ${id}.${name}`)
  }
  return { original: resources.original, web: resources.web, ruler: resources.ruler }
}

function uncertainty(value) {
  if (number(value)) return `取点约 ±${formatNumber(value, 1)} px`
  if (Array.isArray(value) && value.every(number)) return `取点约 ±${value.map((n) => formatNumber(n, 1)).join('–')} px`
  return ''
}

function isEstimated(item) {
  return /estimat|approx|proxy|参考|估计/.test(item?.visibility ?? '')
}

export function measurementModel(data, id) {
  const view = data.views[id]
  if (!view) throw new Error(`Unknown body view: ${id}`)
  const { crownY, floorY } = view.height
  if (!number(crownY) || !number(floorY) || floorY <= crownY) throw new Error(`Invalid image height: ${id}`)
  const H = floorY - crownY
  const points = { ...view.landmarks, crown: { y: crownY }, floor: { y: floorY } }
  const rows = []
  function add(row, item) {
    const available = number(row.px)
    const coordinates = available ? (row.kind === 'horizontal' ? `(${row.x1}, ${row.y}) → (${row.x2}, ${row.y})` : `y = ${row.y1} → ${row.y2}`) : ''
    rows.push({ ...row, coordinates, ratio: available ? row.px / H : null, status: available ? (isEstimated(item) ? '近似取点' : '可见取点') : '不赋值', uncertainty: uncertainty(item?.tolerancePx) })
  }
  add({ id: 'height', symbol: 'H', label: '图面总高', px: H, definition: view.height.definition, kind: 'vertical', y1: crownY, y2: floorY, guideX: 72 }, view.height)
  const chin = points.chin
  const head = chin && number(chin.y) && chin.y > crownY ? chin.y - crownY : null
  add({ id: 'head', symbol: 'h', label: '含发头高', px: head, definition: '可见发冠最高点至下颏，包含发量。', reason: chin?.reason ?? chin?.definition ?? '本视角不能可靠观察下颏，不计算头单位。', kind: 'vertical', y1: crownY, y2: chin?.y, guideX: 168 }, chin)
  for (const [key, [symbol, label]] of Object.entries(widthLabels)) {
    const width = view.widths?.[key]
    if (!width) continue
    if (id === 'side' && key === 'waist' && view.depths?.waist) continue
    const px = number(width.xLeft) && number(width.xRight) && number(width.y) && width.xRight > width.xLeft ? width.xRight - width.xLeft : null
    add({ id: key, symbol, label: width.label ?? (id === 'side' && key === 'waist' ? '侧腰厚' : label), px, definition: width.definition, reason: width.reason, kind: 'horizontal', x1: width.xLeft, x2: width.xRight, y: width.y }, width)
  }
  for (const [key, label] of Object.entries({ chest: '侧胸深度', waist: '侧腰厚', hip: '侧臀指定截面' })) {
    const depth = view.depths?.[key]
    if (!depth) continue
    const px = number(depth.xLeft) && number(depth.xRight) && number(depth.y) && depth.xRight > depth.xLeft ? depth.xRight - depth.xLeft : null
    add({ id: `${key}Depth`, symbol: key === 'hip' ? 'D' : `D${key === 'chest' ? 'c' : 'w'}`, label: key === 'hip' && px !== null ? `侧臀截面 y${depth.y}` : label, px, definition: depth.definition, reason: depth.reason, kind: 'horizontal', x1: depth.xLeft, x2: depth.xRight, y: depth.y }, depth)
  }
  let lengthIndex = 0
  for (const [key, length] of Object.entries(view.lengths ?? {})) {
    if (length.from === 'crown' && length.to === 'chin') continue
    const from = points[length.from]
    const to = points[length.to]
    const px = number(from?.y) && number(to?.y) && to.y > from.y ? to.y - from.y : null
    lengthIndex += 1
    const [symbol, label, guideX] = lengthDisplay[key] ?? [`L${lengthIndex}`, `${pointLabels[length.from] ?? length.from}至${pointLabels[length.to] ?? length.to}`, 840]
    const endpointNotes = [[length.from, from], [length.to, to]].filter(([, point]) => isEstimated(point) && number(point?.y) && number(point?.tolerancePx)).map(([name, point]) => `${pointLabels[name] ?? name} y${point.y}，取点约 ±${point.tolerancePx} px`).join('；')
    add({ id: key, symbol, label: length.label ?? label, px, definition: length.definition, reason: length.reason ?? from?.reason ?? to?.reason, kind: 'vertical', y1: from?.y, y2: to?.y, guideX, endpointNotes }, { ...length, visibility: length.visibility ?? (isEstimated(from) || isEstimated(to) ? 'estimated' : 'visible') })
  }
  const widths = ['shoulder', 'waist', 'hip'].map((key) => rows.find((row) => row.id === key)?.px)
  return {
    id, label: labels[id] ?? id, source: view.source, resources: measurementResources(view, id), H, rows,
    headCount: number(head) && head > 0 ? H / head : null,
    widthRatio: widths.every((value) => number(value) && value > 0) ? `${formatNumber(widths[0] / widths[1])} : 1 : ${formatNumber(widths[2] / widths[1])}` : null,
  }
}

/** The page and downloadable sheet share these exact lines and computed labels. */
export function renderMeasurementSvg(data, id, imageHref) {
  if (!/^(?:\/(?!\/)|data:image\/webp;base64,)/.test(imageHref)) throw new Error('Unsupported measurement image source')
  const model = measurementModel(data, id)
  const { width, height } = model.source
  const strokes = model.rows.filter((row) => number(row.px)).map((row) => {
    const color = row.status === '近似取点' ? '#b96519' : '#17699c'
    const dash = row.status === '近似取点' ? ' stroke-dasharray="10 7"' : ''
    const text = `${row.symbol} ${formatNumber(row.px, 1)} px${row.id === 'hipDepth' ? ` · y${row.y}` : ''}`
    if (row.kind === 'horizontal') {
      return `<g data-measurement="${escape(row.id)}" stroke="${color}" fill="${color}"><line x1="${row.x1}" y1="${row.y}" x2="${row.x2}" y2="${row.y}"${dash}/><path d="M${row.x1},${row.y - 10}v20 M${row.x2},${row.y - 10}v20"/><circle cx="${row.x1}" cy="${row.y}" r="4"/><circle cx="${row.x2}" cy="${row.y}" r="4"/><text x="${(row.x1 + row.x2) / 2}" y="${row.y - 15}" text-anchor="middle">${escape(text)}</text></g>`
    }
    return `<g data-measurement="${escape(row.id)}" stroke="${color}" fill="${color}"><line x1="${row.guideX}" y1="${row.y1}" x2="${row.guideX}" y2="${row.y2}"${dash}/><path d="M${row.guideX - 10},${row.y1}h20 M${row.guideX - 10},${row.y2}h20"/><text x="${row.guideX - 13}" y="${(row.y1 + row.y2) / 2}" text-anchor="middle" transform="rotate(-90 ${row.guideX - 13} ${(row.y1 + row.y2) / 2})">${escape(text)}</text></g>`
  }).join('')
  const visiblePoints = [data.views[id].height.crownY, data.views[id].height.floorY, ...Object.values(data.views[id].landmarks ?? {}).map((point) => point?.y)].filter(number)
  const guides = [...new Set(visiblePoints)].map((y) => `<line x1="192" y1="${y}" x2="${width - 192}" y2="${y}"/>`).join('')
  const measured = model.rows.filter((row) => number(row.px))
  const legend = measured.map((row, index) => `<text x="${32 + (index % 3) * 330}" y="${height + 45 + Math.floor(index / 3) * 35}">${escape(row.symbol + ' ' + row.label)}</text>`).join('')
  const legendEnd = height + 45 + Math.ceil(measured.length / 3) * 35
  const summary = [model.headCount === null ? '下颏不可见，不计算头身比' : `含发头身比约 ${formatNumber(model.headCount, 1)} 头`, model.widthRatio ? `肩 : 腰 : 胯约 ${model.widthRatio}` : '只记录本视角可靠可见的尺寸'].join('　·　')
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -110 ${width} ${legendEnd + 200}" width="${width}" height="${legendEnd + 200}" role="img" aria-label="${escape(model.label)}图面尺寸标尺"><title>${escape(model.label)} · 当前 v2 工作稿图面尺寸</title><desc>H 为可见发冠至赤脚地面的图面高度，h 包含发量。线段标号对应尺寸表；不是厘米或围度。</desc><rect x="0" y="-110" width="${width}" height="${legendEnd + 200}" fill="white"/><image href="${escape(imageHref)}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid meet"/><g stroke="#17699c" stroke-width="1.5" opacity="0.35" stroke-dasharray="8 8">${guides}</g><g stroke-width="3" font-family="system-ui, sans-serif" font-size="27" font-weight="600"><style>text{stroke:white;stroke-width:6px;paint-order:stroke fill;stroke-linejoin:round}</style>${strokes}</g><g fill="#273344" font-family="system-ui, sans-serif" font-size="24"><text x="32" y="-65">${escape(model.label)} · 图面观测 · 当前工作稿</text><text x="32" y="-24">${escape(summary)}</text>${legend}<text x="32" y="${legendEnd + 15}">H 从可见发冠至赤脚地面；h 包含发量。未设厘米身高，不推围度。</text><text x="32" y="${legendEnd + 52}">蓝色：可见取点　橙色虚线：近似取点　各视角独立记录</text></g></svg>`
}
