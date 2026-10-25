<script setup>
import { computed, ref } from 'vue'
import { withBase } from 'vitepress'
import ReleaseImage from './ReleaseImage.vue'
import { formatNumber, formatTarget, garmentCanvasSize, garmentModel } from './garment-measurements.mjs'

const props = defineProps({ data: { type: Object, required: true } })
const models = computed(() => Object.keys(props.data.sources).map((id) => garmentModel(props.data, id)))
const primary = computed(() => models.value.filter((model) => model.resources.ruler))
const selected = ref('')
const current = computed(() => models.value.find((model) => model.id === selected.value) ?? primary.value.find((model) => model.id === props.data.defaultSourceId) ?? primary.value.find((model) => model.layer === 'jacket' && model.view === 'front') ?? primary.value[0])
const showRuler = ref(true)
const imageSize = computed(() => showRuler.value ? garmentCanvasSize(current.value) : current.value.source)
const metricId = ref('')
const metrics = computed(() => Object.entries(props.data.metrics).map(([id, metric]) => ({ id, ...metric })))
const standards = computed(() => {
  const groups = new Map()
  const viewNames = { front: '正面', side: '侧面', back: '背面' }
  for (const [view, targets] of Object.entries(props.data.targets)) for (const [id, target] of Object.entries(targets)) {
    if (target.status !== 'accepted') continue
    const key = JSON.stringify([id, target.min, target.max, target.nominal ?? null])
    const isExposure = id === 'jacketWhiteOffset' && view === 'back'
    const label = id === 'jacketWhiteOffset' ? (isExposure ? '后中露白' : '前襟盖过白衣') : props.data.metrics[id].label
    const displayed = isExposure ? { ...target, min: -target.max, max: -target.min, nominal: -target.nominal } : target
    if (!groups.has(key)) groups.set(key, { key, id, label, metric: props.data.metrics[id], target, displayed, views: [] })
    groups.get(key).views.push(viewNames[view] ?? view)
  }
  const order = props.data.summaryMetricIds ?? metrics.value.map((m) => m.id)
  return [...groups.values()].sort((a, b) => {
    const ai = order.indexOf(a.id); const bi = order.indexOf(b.id)
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })
})
const mainStandards = computed(() => standards.value.filter((row) => !props.data.summaryMetricIds || props.data.summaryMetricIds.includes(row.id)))
const otherStandards = computed(() => standards.value.filter((row) => props.data.summaryMetricIds && !props.data.summaryMetricIds.includes(row.id)))
const comparedMetric = computed(() => metricId.value || metrics.value[0]?.id)
const comparison = computed(() => models.value.flatMap((model) => {
  const row = model.rows.find((item) => item.id === comparedMetric.value)
  const derived = model.derived.find((item) => item.id === comparedMetric.value)
  return [...(row ? [{ model, row, kind: 'observed' }] : []), ...(derived ? [{ model, kind: 'derived', row: { ...derived, statusLabel: derived.indicationLabel, targetText: formatTarget(derived.target) } }] : [])]
}))
const ratio = (value) => value === null ? '—' : `${formatNumber(value, 3)} h₀`
const interval = (value) => value ? `${formatNumber(value[0], 3)}–${formatNumber(value[1], 3)} h₀` : '—'
const points = (value) => value?.map((p) => `(${p[0]}, ${p[1]})`).join(' → ') ?? '—'
const derivedNote = (sourceId, row) => props.data.displayNotes?.derived?.[sourceId]?.[row.id] ?? row.notes
const coverage = (id) => ({ core_native_read_points: '原尺寸取点', provisional_full_view_estimates: '完整图筛查估读', no_reliable_torso_measurements: '遮挡或标定有限' }[props.data.sources[id]?.quantitativeCoverage] ?? '图面记录')
</script>

<template>
  <section class="garment-measurements" aria-label="服装尺寸规范与原图核对">
    <div class="garment-measurements__rule">
      <strong>固定设计单位 h₀ = {{ formatNumber(data.designUnit.px, 1) }} 基准 px</strong>
      <p>以正面基模的含发头高为单位。表内是衣物的二维投影尺寸，未设厘米或围度。</p>
    </div>
    <div class="garment-measurements__standards">
      <table>
        <caption>固定设计尺寸 · 用于后续绘制</caption>
        <thead><tr><th>尺寸</th><th>设计值与范围</th><th>适用视角</th></tr></thead>
        <tbody><tr v-for="row in mainStandards" :key="row.key"><th>{{ row.label }}</th><td><strong>{{ row.displayed.nominal === undefined ? formatTarget(row.displayed) : ratio(row.displayed.nominal) }}</strong><small v-if="row.displayed.nominal !== undefined">范围 {{ formatTarget(row.displayed) }}</small></td><td>{{ row.views.join(' / ') }}</td></tr></tbody>
      </table>
      <details v-if="otherStandards.length">
        <summary>其余衣物投影尺寸</summary>
        <table><thead><tr><th>尺寸</th><th>设计范围</th><th>适用视角</th></tr></thead><tbody><tr v-for="row in otherStandards" :key="row.key"><th>{{ row.metric.label }}</th><td>{{ formatTarget(row.target) }}</td><td>{{ row.views.join(' / ') }}</td></tr></tbody></table>
      </details>
      <p class="garment-measurements__note">以上是选定款式的目标。下面记录当前及历史原图的实际偏差，读数不会反过来修改标准。</p>
      <p v-if="data.scopeSummary" class="garment-measurements__note">标尺覆盖白衣红裤和新夹克共六张当前原图。其他衣层用于漂移筛查，估读不代表逐点测量已通过；既有衣层没有在本轮全部重绘。</p>
    </div>
    <h3 class="garment-measurements__subtitle">原图标尺与偏差核对</h3>
    <div class="garment-measurements__views" role="group" aria-label="选择服装标尺原图">
      <button v-for="model in primary" :key="model.id" type="button" :aria-pressed="current.id === model.id" @click="selected = model.id">{{ model.label }}</button>
    </div>
    <div class="garment-measurements__summary" aria-live="polite">
      <strong>{{ current.label }}</strong>
      <span>{{ current.registration.label || '标定依据有限' }}</span>
      <label><input v-model="showRuler" type="checkbox"> 显示测量叠线</label>
    </div>
    <div class="garment-measurements__layout">
      <div class="garment-measurements__figure">
        <ReleaseImage :key="`${current.id}-${showRuler}`" :src="showRuler ? current.resources.ruler : current.resources.web" :original="showRuler ? current.resources.ruler : current.resources.original" :width="imageSize.width" :height="imageSize.height" :alt="`${current.label}${showRuler ? '服装尺寸标尺' : '未经改动的完整人物原图'}`" :caption="`${current.label} · ${showRuler ? '原图上的可见取点' : '完整原图'}`" />
        <div class="garment-measurements__links">
          <a :href="withBase(current.resources.ruler)" download>下载本视角标尺 SVG</a>
          <a :href="withBase(current.resources.original)" target="_blank" rel="noopener noreferrer">查看原始 PNG ↗</a>
        </div>
      </div>
      <div class="garment-measurements__readings">
        <table>
          <caption>{{ current.label }} · 规范与观测分列</caption>
          <thead><tr><th scope="col">尺寸</th><th scope="col">规范区间</th><th scope="col">原图观测</th><th scope="col">核对</th></tr></thead>
          <tbody>
            <tr v-for="row in current.rows" :key="row.id">
              <th scope="row"><small>{{ row.symbol }}</small>{{ row.label }}</th>
              <td>{{ row.targetText }}</td>
              <td>{{ ratio(row.normalized) }}<small>{{ row.px === null ? row.reason : `${formatNumber(row.px, 1)} 原图 px` }}</small></td>
              <td><span class="garment-measurements__status" :data-status="row.status">{{ row.statusLabel }}</span></td>
            </tr>
          </tbody>
        </table>
        <p class="garment-measurements__note">判定采用含取点与标定尺度误差的区间。区间跨过规范边界时保留“待复核”；遮挡不从其他视角补值。</p>
        <div v-if="current.derived.length" class="garment-measurements__derived">
          <strong>基准推算 · 非同图实测</strong>
          <p>白衣边缘被外套挡住时，下面只使用内层原图的真实边点作参考。它与上表的遮挡状态分别记录。</p>
          <dl>
            <template v-for="row in current.derived" :key="row.id">
              <dt>{{ row.label }}：{{ ratio(row.normalized) }} · {{ row.indicationLabel }}</dt>
              <dd>含误差区间 {{ interval(row.interval) }}。<span v-if="row.observedCoverage === 'covered'">图面可见前襟已盖住白衣边缘。</span><span v-else-if="row.observedCoverage === 'visible'">图面可见白衣露边。</span><small>同标定平面横向站位差 {{ formatNumber(row.stationDeltaPx, 2) }} px；两端取点容差合计 {{ formatNumber(row.stationTolerancePx, 2) }} px。未匹配时不计算下摆差。</small><small>参考：<a :href="withBase(row.referenceOriginal)" target="_blank" rel="noopener noreferrer">{{ row.referenceSourceLabel }} ↗</a> · {{ derivedNote(current.id, row) }}</small></dd>
            </template>
          </dl>
        </div>
        <details>
          <summary>取点定义、误差与源图记录</summary>
          <p>{{ data.designUnit.definition }}{{ data.exposureRule }}</p>
          <dl>
            <template v-for="row in current.rows" :key="row.id">
              <dt>{{ row.symbol }} · {{ row.label }}</dt>
              <dd>{{ row.definition }}<span v-if="row.reason"> {{ row.reason }}</span><small v-if="row.referencePosition">参照位置 {{ ratio(row.referencePosition.nominal) }}：{{ row.referencePosition.basis }} 不作硬规范或自动合格判定。</small><small>{{ points(row.points) }}<span v-if="row.tolerancePx"> · 两端各约 ±{{ row.tolerancePx.join(' / ±') }} px</span></small><small>归一观测区间：{{ interval(row.interval) }}<span v-if="row.notes"> · {{ row.notes }}</span></small></dd>
            </template>
          </dl>
          <p>统一缩放 s = {{ formatNumber(current.registration.scale, 5) }}；取点范围对应 s ∈ {{ current.registration.scaleRange ? current.registration.scaleRange.map((n) => formatNumber(n, 5)).join('–') : '—' }}；残差 RMS = {{ formatNumber(current.registration.rms, 2) }} 基准 px。</p>
          <p>{{ current.registration.reason }}</p>
          <table class="garment-measurements__anchors">
            <caption>同视角身体锚点 · 统一缩放和平移</caption>
            <thead><tr><th>锚点</th><th>原图 → 身体基准</th><th>残差 / 自身容差</th></tr></thead>
            <tbody><tr v-for="anchor in current.registration.anchors" :key="anchor.id"><th>{{ anchor.label || anchor.id }}</th><td>{{ points([anchor.source, anchor.reference]) }}</td><td>{{ formatNumber(anchor.residual, 2) }} / {{ formatNumber(anchor.tolerance, 2) }} px</td></tr></tbody>
          </table>
          <p class="garment-measurements__hash">源图 SHA-256：{{ current.source.sha256 }}</p>
        </details>
      </div>
    </div>
    <div class="garment-measurements__comparison">
      <label for="garment-comparison-metric">同一尺寸跨图核对</label>
      <select id="garment-comparison-metric" :value="comparedMetric" @change="metricId = $event.target.value">
        <option v-for="metric in metrics" :key="metric.id" :value="metric.id">{{ metric.label }}</option>
      </select>
      <div class="garment-measurements__scroll">
        <table>
          <caption>每张图使用自己的可见取点与同视角规范</caption>
          <thead><tr><th>原图</th><th>观测</th><th>含误差区间</th><th>规范区间</th><th>核对</th></tr></thead>
          <tbody><tr v-for="item in comparison" :key="`${item.model.id}-${item.kind}`"><th><a :href="withBase(item.model.resources.original)" target="_blank" rel="noopener noreferrer">{{ item.model.label }} ↗</a><small>{{ item.kind === 'derived' ? '基准推算 · 非同图实测' : coverage(item.model.id) }}</small></th><td>{{ ratio(item.row.normalized) }}</td><td>{{ interval(item.row.interval) }}</td><td>{{ item.row.targetText }}</td><td><span class="garment-measurements__status" :data-status="item.row.status">{{ item.row.statusLabel }}</span><small v-if="item.row.reason">{{ item.row.reason }}</small></td></tr></tbody>
        </table>
      </div>
    </div>
  </section>
</template>

<style scoped>
.garment-measurements { margin: 24px 0 40px; container-type: inline-size; }
.garment-measurements__rule { padding: 16px 20px; border-left: 3px solid var(--vp-c-brand-1); background: var(--vp-c-bg-soft); font-size: 14px; }
.garment-measurements__rule p { margin: 8px 0 0; }
.garment-measurements__standards { margin-top: 20px; }
.garment-measurements__subtitle { margin-top: 30px; }
.garment-measurements__views { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 22px; }
.garment-measurements__views button { padding: 8px 14px; min-height: 40px; border: 1px solid var(--vp-c-divider); border-radius: 6px; font-weight: 600; cursor: pointer; }
.garment-measurements__views button[aria-pressed="true"] { border-color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); }
.garment-measurements__summary { display: flex; flex-wrap: wrap; gap: 8px 20px; align-items: center; margin: 16px 0; font-size: 14px; }
.garment-measurements__summary label { display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }
.garment-measurements__layout { display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px; align-items: start; }
.garment-measurements__figure { width: min(100%, 620px); margin: 0 auto; }
.garment-measurements__figure :deep(.release-image) { margin: 0; }
.garment-measurements__figure :deep(.release-image__trigger img) { max-height: none; }
.garment-measurements__links { display: flex; flex-wrap: wrap; gap: 8px 16px; margin-top: 10px; font-size: 13px; }
.garment-measurements__readings { min-width: 0; }
.garment-measurements table { display: table; width: 100%; margin: 0; font-size: 13px; }
.garment-measurements caption { text-align: left; margin-bottom: 8px; font-weight: 600; }
.garment-measurements th, .garment-measurements td { padding: 8px; text-align: left; font-variant-numeric: tabular-nums; }
.garment-measurements tbody th { font-weight: 500; }
.garment-measurements small { display: block; font-size: 11px; line-height: 1.6; color: var(--vp-c-text-2); }
.garment-measurements__status { font-size: 12px; font-weight: 600; white-space: nowrap; }
.garment-measurements__status[data-status="pass"] { color: #24795c; }
.garment-measurements__status[data-status="fail"] { color: #b63530; }
.garment-measurements__status[data-status="uncertain"] { color: #926017; }
.garment-measurements__status[data-status="limited"] { color: #926017; }
.garment-measurements__derived { margin: 18px 0; padding: 12px 14px; background: var(--vp-c-bg-soft); border-left: 3px solid #b27b2b; font-size: 13px; }
.garment-measurements__derived p { margin: 6px 0; }
.garment-measurements__note, .garment-measurements details { font-size: 13px; color: var(--vp-c-text-2); }
.garment-measurements details { margin-top: 18px; }
.garment-measurements summary { cursor: pointer; color: var(--vp-c-text-1); font-weight: 600; }
.garment-measurements dt { margin-top: 14px; font-weight: 600; color: var(--vp-c-text-1); }
.garment-measurements dd { margin: 4px 0 0; }
.garment-measurements__hash { overflow-wrap: anywhere; font-size: 11px; }
.garment-measurements__comparison { margin-top: 28px; }
.garment-measurements__comparison label { font-weight: 600; margin-right: 14px; }
.garment-measurements__comparison select { padding: 7px 30px 7px 10px; border: 1px solid var(--vp-c-divider); border-radius: 4px; min-height: 38px; background: var(--vp-c-bg); }
.garment-measurements__scroll { margin-top: 16px; overflow-x: auto; }
.garment-measurements__scroll table { min-width: 590px; }
.garment-measurements :is(button, input, select):focus-visible { outline: 3px solid var(--vp-c-brand-1); outline-offset: 3px; }
@container (min-width: 900px) { .garment-measurements__layout { grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); } }
</style>
