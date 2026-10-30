<script setup>
import { computed, ref } from 'vue'
import { withBase } from 'vitepress'
import ReleaseImage from './ReleaseImage.vue'
import { formatNumber } from './body-measurements.mjs'
import { data as siteData } from '../../data/bunny-site.data.mjs'
import { bodyMeasurementScope, createDisplayTextLookup, selectMeasurementSource } from '../bunny-site.mjs'

const props = defineProps({
  data: { type: Object, required: true },
  scope: { type: String, default: 'current' },
})
const display = createDisplayTextLookup(siteData.displayText)
const scoped = computed(() => bodyMeasurementScope(props.data, siteData.assets, props.scope))
const selected = ref('')
const views = computed(() => scoped.value.models)
const current = computed(() => selectMeasurementSource(views.value, selected.value, scoped.value.defaultSourceId))
function viewLabel(id) {
  const label = siteData.displayText['@labels'][`body.${id}`]
  if (!label) throw new Error(`Missing body view label: ${id}`)
  return label
}
// Reserve the existing SVG's full canvas before its lazy image loads.
const rulerHeight = computed(() => current.value.source.height + 245 + Math.ceil(current.value.rows.filter((row) => typeof row.px === 'number').length / 3) * 35)
</script>

<template>
  <section v-if="views.length" class="body-measurements" aria-label="身体图面尺寸">
    <div class="body-measurements__views" role="group" aria-label="选择测量视角">
      <button v-for="view in views" :key="view.id" type="button" :aria-pressed="current.id === view.id" @click="selected = view.id">{{ viewLabel(view.id) }}</button>
    </div>
    <div class="body-measurements__summary" aria-live="polite">
      <strong>{{ viewLabel(current.id) }}：H = {{ formatNumber(current.H, 1) }} px</strong>
      <span v-if="current.headCount !== null">含发头身比 ≈ {{ formatNumber(current.headCount, 1) }} 头</span>
      <span v-if="current.widthRatio">肩 : 腰 : 胯 ≈ {{ current.widthRatio }}</span>
    </div>
    <div class="body-measurements__layout">
      <div class="body-measurements__figure">
        <ReleaseImage :src="current.resources.ruler" :original="current.resources.ruler" :width="current.source.width" :height="rulerHeight" :alt="`${viewLabel(current.id)}图面尺寸标尺`" :caption="`${viewLabel(current.id)}标尺 · 可放大或查看原始尺寸`" />
        <div class="body-measurements__files">
          <a :href="withBase(current.resources.ruler)" download>下载{{ viewLabel(current.id) }}标尺 SVG</a>
          <a :href="withBase(current.resources.original)" target="_blank" rel="noopener noreferrer">查看原始人物 PNG ↗</a>
        </div>
      </div>
      <div class="body-measurements__readings">
        <table>
          <caption>{{ viewLabel(current.id) }}图面读数</caption>
          <thead><tr><th scope="col">指标</th><th scope="col">像素</th><th scope="col">占 H</th></tr></thead>
          <tbody>
            <tr v-for="row in current.rows" :key="row.id">
              <th scope="row"><span class="body-measurements__symbol">{{ display(row.symbol) }}</span>{{ display(row.label) }}</th>
              <td>{{ formatNumber(row.px, 1) }}</td>
              <td>{{ row.ratio === null ? '—' : formatNumber(row.ratio, 3) }}</td>
            </tr>
          </tbody>
        </table>
        <dl>
          <template v-for="row in current.rows" :key="row.id">
            <dt>{{ display(row.symbol) }} · {{ display(row.label) }} <span>{{ display(row.status) }}</span></dt>
            <dd>{{ display(row.px === null ? row.reason : row.definition) }}<small v-if="row.px !== null">{{ display(row.coordinates) }}<span v-if="row.uncertainty"> · {{ display(row.uncertainty) }}</span><span v-if="row.endpointNotes"> · {{ display(row.endpointNotes) }}</span></small></dd>
          </template>
        </dl>
      </div>
    </div>
  </section>
</template>

<style scoped>
.body-measurements { margin: 24px 0 36px; container-type: inline-size; }
.body-measurements__views { display: flex; gap: 8px; }
.body-measurements__views button { min-height: 40px; padding: 6px 24px; border: 1px solid var(--vp-c-divider); border-radius: 6px; font-weight: 600; cursor: pointer; }
.body-measurements__views button[aria-pressed="true"] { border-color: var(--vp-c-brand-1); background: var(--vp-c-brand-soft); color: var(--vp-c-brand-1); }
.body-measurements__views button:focus-visible { outline: 3px solid var(--vp-c-brand-1); outline-offset: 3px; }
.body-measurements__summary { display: flex; flex-wrap: wrap; gap: 6px 20px; margin: 16px 0; font-size: 14px; }
.body-measurements__layout { display: grid; grid-template-columns: 1fr; gap: 24px; align-items: start; }
.body-measurements__figure { width: min(100%, 620px); min-width: 0; margin: 0 auto; }
.body-measurements__figure :deep(.release-image) { margin: 0; }
.body-measurements__figure :deep(.release-image__trigger img) { max-height: none; }
.body-measurements__files { display: flex; flex-wrap: wrap; gap: 8px 16px; margin-top: 10px; font-size: 13px; }
.body-measurements__readings { min-width: 0; }
.body-measurements table { display: table; width: 100%; margin: 0; font-size: 13px; }
.body-measurements caption { margin-bottom: 8px; text-align: left; font-weight: 600; }
.body-measurements th, .body-measurements td { padding: 8px 10px; }
.body-measurements tbody th { text-align: left; font-weight: 500; }
.body-measurements td { white-space: nowrap; font-variant-numeric: tabular-nums; }
.body-measurements__symbol { display: inline-block; min-width: 28px; color: var(--vp-c-text-2); font-size: 12px; }
.body-measurements dl { margin: 20px 0 0; font-size: 13px; line-height: 1.7; }
.body-measurements dt { margin-top: 12px; font-weight: 600; }
.body-measurements dt span { margin-left: 6px; color: var(--vp-c-text-2); font-size: 12px; font-weight: 400; }
.body-measurements dd { margin: 3px 0 0; color: var(--vp-c-text-2); }
.body-measurements dd small { display: block; margin-top: 3px; font-size: 12px; font-variant-numeric: tabular-nums; }
@container (min-width: 900px) { .body-measurements__layout { grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); } }
</style>
