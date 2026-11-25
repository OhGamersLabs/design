<script setup lang="ts">
import { computed, ref } from 'vue'
import { withBase } from 'vitepress'
import ReleaseImage from './ReleaseImage.vue'
import WorldImage from './WorldImage.vue'
import spec from '../../../../catalog/world/coin-core-dimensions.json'

type FilterMode = 'ruler' | 'shell' | 'yangyin' | 'carry' | 'clean'

const activeMode = ref<FilterMode>('ruler')

const modes: Array<{ id: FilterMode; label: string }> = [
  { id: 'ruler', label: '全图正交三视标尺' },
  { id: 'shell', label: '初代与二代透波外皮' },
  { id: 'yangyin', label: '开拓阳片与锚定阴片' },
  { id: 'carry', label: '人物携行配准核对' },
  { id: 'clean', label: '纯净正交三视母版' },
]

const fmt = (val: number | null | undefined, digits = 1): string =>
  typeof val === 'number' && Number.isFinite(val) ? Number(val.toFixed(digits)).toString() : '—'

const filteredRows = computed(() => {
  if (activeMode.value === 'shell') return spec.rows.filter((r) => r.group === 'shell')
  if (activeMode.value === 'yangyin') return spec.rows.filter((r) => r.group === 'core' || r.group === 'yang' || r.group === 'yin')
  return spec.rows
})

const showFigureCheck = computed(() => activeMode.value === 'ruler' || activeMode.value === 'carry')
</script>

<template>
  <section id="relic-dimensions" class="relic-measurements" aria-label="核心信物标准正投影三视图与尺寸标尺">
    <header class="relic-measurements__head">
      <div>
        <span class="world-pillar-card__code">ORTHOGRAPHIC MASTER &amp; SCALE RULER</span>
        <h3 class="relic-measurements__title">两代外皮与可分体阴阳星榫母核：统一比例标准正投影三视母版与全剖视标尺</h3>
      </div>
      <div class="relic-measurements__views" role="group" aria-label="选择测量分组或母版视图">
        <button
          v-for="m in modes"
          :key="m.id"
          type="button"
          :aria-pressed="activeMode === m.id"
          @click="activeMode = m.id"
        >
          {{ m.label }}
        </button>
      </div>
    </header>

    <p class="relic-measurements__lead">
      全板四象限十二组正交视图采用统一比例尺同图绘制：画面左侧上下对齐展示「初代三周年阻波黄铜币」与克露丝重制的「二代零点全透波金瓷壳」正视、侧视、全剖视及背视；画面右侧上下对齐展示可分体母核「开拓阳片（凸阶十重星榫）」与「锚定阴片（凹阶十重星卯）」的外表面、阶梯侧剖视、合体咬合剖视及内耦合面。整件尺度以罗伊正面身体基准高度 <b>H0 = {{ spec.designUnit.H0Px }} px</b> 为统一锚点（厘米身高未设定），各部按外皮外径 <b>D0 = {{ fmt(spec.masterScale.D0Px, 1) }} px</b> 归一换算。
    </p>

    <div class="relic-measurements__summary" aria-live="polite">
      <strong>两代外皮外径 D0 = {{ fmt(spec.masterScale.D0Px, 1) }} px（设计目标 {{ fmt(spec.masterScale.D0_H0, 3) }} H0）</strong>
      <span>阴阳双片外径 Dc = {{ fmt(spec.masterScale.DcPx, 1) }} px（{{ fmt(spec.masterScale.Dc_D0, 3) }} D0）</span>
      <span>十重星榫跨度 Ds = {{ fmt(spec.masterScale.DsPx, 1) }} px · 合体厚 Tc = {{ fmt(spec.masterScale.TcPx, 1) }} px</span>
    </div>

    <div class="relic-measurements__layout">
      <div class="relic-measurements__figure">
        <WorldImage
          v-if="activeMode === 'clean'"
          id="coin-core-orthographic-board-latest"
          caption="核心信物正交三视母版 · 无标尺纯净正投影与包芯剖面原图"
          detail="外币正侧背三视 · 母核正侧背三视与 A-A 包芯全剖视 · 角色右腰匣正侧背三视"
          group="world-relic-props"
        />
        <ReleaseImage
          v-else
          :src="spec.resources.ruler"
          :original="spec.resources.ruler"
          :width="spec.rulerCanvas.width"
          :height="spec.rulerCanvas.height"
          alt="核心信物标准正投影三视与包芯剖面图面尺寸标尺"
          caption="正交三视与 A-A 包芯剖面矢量尺寸标尺 · 点击可全屏放大核对端点"
        />
        <div class="relic-measurements__files">
          <a :href="withBase(spec.resources.ruler)" download>下载正交三视标尺 SVG</a>
          <a :href="withBase(spec.resources.original)" target="_blank" rel="noopener noreferrer">查看原始正交三视 PNG ↗</a>
          <a :href="withBase(spec.resources.json)" download>下载核心信物尺寸 JSON</a>
        </div>

        <div v-if="showFigureCheck" class="relic-measurements__check">
          <h4>人物携行三视图面核对（罗伊角色右腰匣）</h4>
          <p>
            配准基准取罗伊正面身体图（{{ spec.characterCheck.bodyCanvas }}，可见发冠至赤脚地面 H0 = {{ spec.designUnit.H0Px }} px）；在罗伊护具角色右侧面携行图中读取半露纪念币弦宽与斜挂腰匣包络，属二维投影估读而非三维装配验收：
          </p>
          <table>
            <thead>
              <tr>
                <th scope="col">人物图携行核对项</th>
                <th scope="col">原生像素区间</th>
                <th scope="col">图面读数</th>
                <th scope="col">占 H0 比例</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="obs in spec.characterCheck.observations" :key="obs.id">
                <th scope="row">{{ obs.label }}</th>
                <td>{{ obs.coords }}</td>
                <td>{{ fmt(obs.px, 1) }} px</td>
                <td>约 {{ fmt(obs.ratioH0, 3) }} H0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="relic-measurements__readings">
        <table>
          <caption>正交三视母版图面读数（{{ spec.source.width }}×{{ spec.source.height }} 原生像素）</caption>
          <thead>
            <tr>
              <th scope="col">代号与指标</th>
              <th scope="col">母版像素</th>
              <th scope="col">占 D0</th>
              <th scope="col">占 H0 目标</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredRows" :key="row.id">
              <th scope="row">
                <span class="relic-measurements__symbol">{{ row.symbol }}</span>{{ row.label }}
              </th>
              <td>{{ fmt(row.px, 1) }}</td>
              <td>{{ fmt(row.ratioD0, 3) }}</td>
              <td>{{ row.targetH0 === null ? '—' : fmt(row.targetH0, 4) }}</td>
            </tr>
          </tbody>
        </table>

        <dl>
          <template v-for="row in filteredRows" :key="`def-${row.id}`">
            <dt>{{ row.symbol }} · {{ row.label }} <span>{{ row.viewTag }}</span></dt>
            <dd>
              {{ row.definition }}
              <small>{{ row.coordinates }} · 取点容差约 ±{{ fmt(row.tolerancePx, 1) }} px</small>
            </dd>
          </template>
        </dl>
      </div>
    </div>
  </section>
</template>

<style scoped>
.relic-measurements {
  margin: 24px 0 32px;
  padding: 20px 22px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
  container-type: inline-size;
}
.relic-measurements__head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px 20px;
}
.relic-measurements__title {
  margin: 4px 0 0 !important;
  font-size: 18px !important;
  line-height: 1.4 !important;
}
.relic-measurements__views {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.relic-measurements__views button {
  min-height: 34px;
  padding: 4px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  background: var(--vp-c-bg);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
}
.relic-measurements__views button[aria-pressed="true"] {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
}
.relic-measurements__views button:focus-visible {
  outline: 3px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}
.relic-measurements__lead {
  margin: 12px 0 10px !important;
  font-size: 13.5px;
  line-height: 1.65;
  color: var(--vp-c-text-2);
}
.relic-measurements__summary {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 20px;
  margin: 12px 0 16px;
  padding: 8px 12px;
  border-radius: 6px;
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  font-size: 13px;
}
.relic-measurements__layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 22px;
  align-items: start;
}
.relic-measurements__figure {
  min-width: 0;
}
.relic-measurements__figure :deep(.release-image) {
  margin: 0;
}
.relic-measurements__figure :deep(.release-image__trigger img) {
  max-height: none;
}
.relic-measurements__files {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-top: 10px;
  font-size: 13px;
}
.relic-measurements__check {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px solid var(--vp-c-divider);
}
.relic-measurements__check h4 {
  margin: 0 0 6px !important;
  font-size: 14px !important;
}
.relic-measurements__check p {
  margin: 0 0 10px !important;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}
.relic-measurements__readings {
  min-width: 0;
}
.relic-measurements table {
  display: table;
  width: 100%;
  margin: 0;
  font-size: 12.5px;
}
.relic-measurements caption {
  margin-bottom: 8px;
  text-align: left;
  font-weight: 600;
  font-size: 13px;
}
.relic-measurements th,
.relic-measurements td {
  padding: 6px 8px;
}
.relic-measurements tbody th {
  text-align: left;
  font-weight: 500;
}
.relic-measurements td {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.relic-measurements__symbol {
  display: inline-block;
  min-width: 30px;
  color: var(--vp-c-text-2);
  font-weight: 700;
  font-size: 12px;
}
.relic-measurements dl {
  margin: 14px 0 0;
  font-size: 12.5px;
  line-height: 1.6;
}
.relic-measurements dt {
  margin-top: 9px;
  font-weight: 600;
}
.relic-measurements dt span {
  margin-left: 6px;
  color: var(--vp-c-text-2);
  font-size: 11.5px;
  font-weight: 400;
}
.relic-measurements dd {
  margin: 2px 0 0;
  color: var(--vp-c-text-2);
}
.relic-measurements dd small {
  display: block;
  margin-top: 2px;
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
}
@container (min-width: 920px) {
  .relic-measurements__layout {
    grid-template-columns: minmax(0, 1.28fr) minmax(0, 1fr);
  }
}

</style>
