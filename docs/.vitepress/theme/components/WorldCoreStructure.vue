<script setup lang="ts">
import { computed, ref } from 'vue'

const activeTab = ref(0)

const states = [
  {
    tab: '01 两代外皮 · 阻波铜币与透波金瓷壳',
    badge: '初代阻波潜伏 → 二代零点全透波谐振',
    tag: '雷恩三周年阻波铜衣 → 克露丝透波金瓷新壳',
    title: '两代外皮细腻演进：从「三周年阻波黄铜币」到克露丝重制「零点全透波金瓷壳」',
    summary:
      '十年前父亲雷恩为隔绝母核零点波，借合体纯平母核作刚性内砧，以零九号船坞波导铋黄铜无缝冲压成手心尺度的「OhGamers 三周年店庆纪念币」（防孩子误投街机口，锁死 0.00 潜伏十年，肉搏撞击钢梁仅在币边撕裂一条细缝）。进入零九号暗礁后，总工克露丝剥下完成潜伏使命的初代软黄铜外衣，采用掺金氮化硅碳复合金瓷为母核重制第二代旋锁式「零点全透波战术壳」——绝不阻挡零点波，平时插回加装波导屏蔽内衬的角色右腰黑橙磁吸匣即锁死 0.00，拔出抛币即全功率无损激振！',
    bullets: [
      { k: '初代阻波黄铜衣', v: '正面素底连体 OG，反面嘉禾绶带与数字 3；波导黄铜全反射锁死零点波，仅靠撞裂的一条币边细缝勉强漏波' },
      { k: '二代透波金瓷壳', v: '延续暖金钛瓷色调与精工 OG 徽记（兼容双主角立绘角色右腰外观），围绕 OG 嵌环形透波暗晶导流窗，外周设四向无损旋锁卡槽' },
      { k: '波导腰匣快抽闭环', v: '二代新外皮对零点波完全透明；潜伏屏蔽职责交由角色右腰波导磁吸快抽匣承担，实现插匣归零、拔币满功率共鸣' },
    ],
  },
  {
    tab: '02 可分体母核 · 阴阳子母星榫双片',
    badge: '外平内扣：阳片凸阶星榫 × 阴片凹阶星卯',
    tag: '合体上下纯平 · 分体凹凸十重星榫互补',
    title: '可分体「炽环母核」本体设计：开拓阳片（凸阶星榫）与锚定阴片（凹阶星卯）',
    summary:
      '先驱「炽环母核」并非不可拆分的单板，而是由「开拓阳片（兄）」与「锚定阴片（妹）」通过内部子母微阶梯十重星榫精密咬合、再经先驱零点场原子级锁死而成的双片复合体。合体时阳片外表面与阴片外表面绝对纯平平行（故十年前能零气隙包进初代纪念币内）；分体后一凸一凹的十重星榫与星卯剖面形成天生一对的互补结构。',
    bullets: [
      { k: '开拓阳片（罗伊）', v: '外表面为纯平环冠面（哑光外环配十重游标微刻）；内耦合面隆起十重微星芒正圆凸阶星榫台，蚀刻暖白金外拓日冕波导轨' },
      { k: '锚定阴片（罗娅）', v: '外表面为纯平同平面偏心月蚀双圆面；内耦合面内沉互补的十重微星芒正圆凹阶星卯槽，蚀刻冰青银内敛月蚀弦波轨' },
      { k: '环冠与蚀日双相', v: '拇指生物电激振瞬间，环冠相亮起闭合冷白金星环建立零反噬共链；蚀日相燃起炽珀赤金贝利珠残弧解开伙伴潜能限制器' },
    ],
  },
  {
    tab: '03 准晶透视 · 极高硬度与无限扩容',
    badge: '极高硬度根源：十重非周期键合无滑移面',
    tag: '相干干涉仪透视 · 零外观枷锁',
    title: '为何切刀崩刃、百吨不弯？高倍干涉仪揭晓「无滑移面十重彭罗斯准晶」',
    summary:
      '克露丝在钨钢切刀触芯崩断后，以高倍相干干涉仪透视揭开阴阳双片极高硬度与无限容量的共同物理根源：常规金属存在周期滑移面故易变形，而母核双片是由高维零点场锁死的十重彭罗斯非周期准晶——内部有序却永不周期重复、不存在任何晶体滑移面，与索伦死板密铺的六角蜂巢锁印形成根本对立。',
    bullets: [
      { k: '浅层九颗激发晶胞', v: '断环后零点能枯竭，初始仅有浅层环带的九颗菱形准晶胞处于激发态，由干涉仪视窗精准测读余量' },
      { k: '生物电指法点将', v: '战时凭执核人拇指弹击瞬间的生物电与谐振指法频率匹配伙伴专属晶胞波谱，无需任何表面物理按键' },
      { k: '燃门相变无限扩容', v: '每重燃一座断联主炽环门，原初炉心辐射便唤醒深层成片休眠准晶胞，超硬双晶片外观万古不变' },
    ],
  },
  {
    tab: '04 双生解耦 · 战后二代阴阳对币',
    badge: '双生血脉唯一解锁：星榫轴向平滑退出',
    tag: '旋拆二代外壳 · 定制兄妹阴阳透波对币',
    title: '舰桥旋壳触发「阴阳子母星榫解耦」· 战后克露丝定制兄妹二代透波对币',
    summary:
      '开篇期唯罗伊执真核，妹妹罗娅在角色右腰匣插二手地摊淘来的同款实心三周年纪念币配成兄妹对装。归航号舰桥破壁战中，克露丝用专用扳手无损旋开二代透波外皮取出合体母核；面对舰桥双圆槽，唯兄妹双手同握谐振解开内部零点锁，阳片凸阶星榫台方从阴片凹阶星卯槽中平滑退出。',
    bullets: [
      { k: '罗伊角色右腰匣', v: '战后装入克露丝定制的「二代透波阳壳」（正面透晶环窗 OG，反面日冕透波环窗），内嵌凸阶星榫开拓阳片，插匣归零、拔币即战' },
      { k: '罗娅角色右腰匣', v: '换下早期普通实心币，装入定制「二代透波阴壳」（正面透晶环窗 OG，反面偏心月蚀弧窗），内嵌凹阶星卯锚定阴片；单核调遣全员，燃门双核合璧' },
      { k: '正邪三碎片对位', v: '真核为阴阳星榫双片配透波金瓷壳（共担），索伦执空腔六角外模冲压白瓷盖四刺伪币（统御），莫罗焊死断裂半圈护环（剥夺）' },
    ],
  },
]

const activeQuasicells = Array.from({ length: 9 }, (_, i) => {
  const rad = ((-90 + i * 40) * Math.PI) / 180
  const r = i % 2 === 0 ? 35 : 31
  return {
    cx: +(180 + Math.cos(rad) * r).toFixed(1),
    cy: +(76 + Math.sin(rad) * r).toFixed(1),
    lit: i < 3,
  }
})

const dormantQuasicells = Array.from({ length: 10 }, (_, i) => {
  const rad = ((18 + i * 36) * Math.PI) / 180
  return {
    cx: +(180 + Math.cos(rad) * 18).toFixed(1),
    cy: +(76 + Math.sin(rad) * 18).toFixed(1),
  }
})

const makeStarPolygon = (cx: number, cy: number, rOuter: number, rInner: number, points = 10) => {
  const pts: string[] = []
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner
    const rad = ((-90 + (i * 180) / points) * Math.PI) / 180
    pts.push(`${(cx + Math.cos(rad) * r).toFixed(1)},${(cy + Math.sin(rad) * r).toFixed(1)}`)
  }
  return pts.join(' ')
}

const decagonStarPath = (() => {
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const idx = (i * 3) % 10
    const rad = ((-90 + idx * 36) * Math.PI) / 180
    const x = (180 + Math.cos(rad) * 42).toFixed(1)
    const y = (76 + Math.sin(rad) * 42).toFixed(1)
    pts.push(`${i === 0 ? 'M' : 'L'}${x},${y}`)
  }
  return `${pts.join(' ')} Z`
})()

const cur = computed(() => states[activeTab.value])
</script>

<template>
  <section class="coin-viz-box world-single-viz" aria-label="两代外皮演进与可分体阴阳子母星榫炽环母核交互图解">
    <header class="coin-viz-box__head">
      <div>
        <span class="coin-viz-box__eyebrow">INTERACTIVE DIAGRAM 02</span>
        <h3 class="coin-viz-box__title">两代外皮与阴阳双片：从「初代阻波铜币」升级「克露丝透波金瓷壳」，内藏「子母星榫阳片与阴片」</h3>
      </div>
      <div class="coin-viz-tabs" role="tablist" aria-label="两代外皮与阴阳母核四态切换">
        <button
          v-for="(item, idx) in states"
          :key="item.tab"
          type="button"
          role="tab"
          :aria-selected="activeTab === idx"
          class="coin-viz-tab"
          :class="{ 'is-active': activeTab === idx }"
          @click="activeTab = idx"
        >
          {{ item.tab }}
        </button>
      </div>
    </header>

    <div class="coin-viz-body coin-map-grid">
      <div class="coin-map-stage">
        <div class="coin-map-stage__top">
          <b>{{ cur.tag }}</b>
          <span>{{ cur.badge }}</span>
        </div>

        <!-- Tab 0: Gen-1 Blocking Brass Medal vs Gen-2 Cruz Transmissive Gold-Cermet Shell -->
        <svg v-if="activeTab === 0" class="coin-map-svg" viewBox="0 0 360 176" aria-hidden="true">
          <!-- Left: Gen-1 Renn Seamless Blocking Brass Medal -->
          <g>
            <circle cx="96" cy="72" r="46" fill="var(--bunny-paper)" stroke="var(--bunny-orange)" stroke-width="3.4" />
            <circle cx="96" cy="72" r="36" fill="var(--bunny-fabric)" stroke="var(--bunny-orange)" stroke-width="1.8" />
            <text x="96" y="80" text-anchor="middle" font-size="22" font-weight="800" fill="var(--bunny-orange)">OG</text>
            <text x="96" y="136" text-anchor="middle" font-size="11" font-weight="700" fill="var(--bunny-ink-2)">初代 · 阻波黄铜三周年币</text>
          </g>

          <!-- Arrow -->
          <line x1="152" y1="72" x2="202" y2="72" stroke="var(--coin-green)" stroke-width="2.2" stroke-dasharray="4 3" />
          <polygon points="204,72 197,68 197,76" fill="var(--coin-green)" />
          <text x="178" y="62" text-anchor="middle" font-size="10" font-weight="700" fill="var(--coin-green)">克露丝重制</text>

          <!-- Right: Gen-2 Cruz Zero-Point Transmissive Gold-Cermet Shell (with dark transmissive ring window!) -->
          <g>
            <circle cx="264" cy="72" r="46" fill="var(--bunny-paper)" stroke="var(--bunny-orange)" stroke-width="3.4" />
            <!-- Dark smoky-crystal transmissive ring window -->
            <circle cx="264" cy="72" r="33" fill="none" stroke="var(--bunny-ink)" stroke-width="8.5" />
            <circle cx="264" cy="72" r="33" fill="none" stroke="var(--coin-green)" stroke-width="1.4" stroke-dasharray="5 3" />
            <circle cx="264" cy="72" r="24" fill="var(--bunny-paper)" stroke="var(--bunny-orange)" stroke-width="1.8" />
            <text x="264" y="80" text-anchor="middle" font-size="20" font-weight="800" fill="var(--bunny-orange)">OG</text>
            <text x="264" y="136" text-anchor="middle" font-size="11" font-weight="700" fill="var(--coin-green)">二代 · 零点全透波金瓷壳</text>
          </g>

          <text x="180" y="164" text-anchor="middle" font-size="11.5" font-weight="700" fill="var(--bunny-ink)">
            二代新壳不阻挡零点波 · 环形暗晶窗全功率透射 · 插回波导腰匣归零
          </text>
        </svg>

        <!-- Tab 1: Separable Yang Tenon Piece & Yin Mortise Piece + Stepped Cross-Section -->
        <svg v-else-if="activeTab === 1" class="coin-map-svg" viewBox="0 0 360 176" aria-hidden="true">
          <!-- Left: Pioneer Yang Piece Inner Mating Face (10-Point Raised Star Tenon Boss) -->
          <g>
            <circle cx="94" cy="62" r="41" fill="var(--bunny-ink)" stroke="var(--bunny-ink-2)" stroke-width="1.5" />
            <polygon :points="makeStarPolygon(94, 62, 29, 24, 10)" fill="var(--bunny-ink-2)" stroke="var(--bunny-orange)" stroke-width="1.5" />
            <circle cx="94" cy="62" r="16" fill="none" stroke="var(--bunny-paper)" stroke-width="1.4" />
            <text x="94" y="118" text-anchor="middle" font-size="11" font-weight="700" fill="var(--bunny-orange)">开拓阳片 · 凸阶十重星榫</text>
          </g>

          <!-- Center: Stepped Mating Cross-Section (`┻` Yang Boss + `┳` Yin Socket = Flat Combined Disc!) -->
          <g>
            <!-- Yang stepped section (`┻` inverted: flat top, raised bottom boss) -->
            <path d="M150,42 H210 V48 H196 V54 H164 V48 H150 Z" fill="var(--bunny-ink)" stroke="var(--bunny-orange)" stroke-width="1.3" />
            <!-- Yin stepped section (`┳`: recessed top socket, flat bottom) -->
            <path d="M150,62 H164 V68 H196 V62 H210 V74 H150 Z" fill="var(--bunny-ink)" stroke="var(--coin-green)" stroke-width="1.3" />
            <text x="180" y="92" text-anchor="middle" font-size="10" font-weight="700" fill="var(--bunny-ink-2)">外平内扣剖面</text>
          </g>

          <!-- Right: Anchor Yin Piece Inner Mating Face (10-Point Recessed Star Mortise Socket) -->
          <g>
            <circle cx="266" cy="62" r="41" fill="var(--bunny-ink-2)" stroke="var(--bunny-ink)" stroke-width="1.5" />
            <polygon :points="makeStarPolygon(266, 62, 29, 24, 10)" fill="var(--bunny-ink)" stroke="var(--coin-green)" stroke-width="1.5" />
            <circle cx="266" cy="62" r="16" fill="none" stroke="var(--coin-green)" stroke-width="1.4" stroke-dasharray="4 2" />
            <text x="266" y="118" text-anchor="middle" font-size="11" font-weight="700" fill="var(--coin-green)">锚定阴片 · 凹阶十重星卯</text>
          </g>

          <text x="180" y="156" text-anchor="middle" font-size="11.5" font-weight="700" fill="var(--bunny-ink)">
            合体上下纯平严密包芯 · 分体一凸一凹十重星榫卯天然互补
          </text>
        </svg>

        <!-- Tab 2: Slip-Plane-Free 10-Fold Aperiodic Quasicrystal Lattice -->
        <svg v-else-if="activeTab === 2" class="coin-map-svg" viewBox="0 0 360 176" aria-hidden="true">
          <rect x="48" y="12" width="264" height="128" rx="8" fill="var(--bunny-fabric)" stroke="var(--bunny-ink)" stroke-width="2" />
          <line x1="48" y1="76" x2="312" y2="76" stroke="var(--bunny-rule-strong)" stroke-width="1" stroke-dasharray="3 3" />
          <line x1="180" y1="12" x2="180" y2="140" stroke="var(--bunny-rule-strong)" stroke-width="1" stroke-dasharray="3 3" />
          <circle cx="180" cy="76" r="48" fill="none" stroke="var(--bunny-ink)" stroke-width="2.2" />
          <path :d="decagonStarPath" fill="none" stroke="var(--bunny-ink-3)" stroke-width="1" opacity="0.55" />
          <circle cx="180" cy="76" r="19" fill="none" stroke="var(--bunny-ink-3)" stroke-width="1.1" stroke-dasharray="2 3" />
          <circle
            v-for="(dc, idx) in dormantQuasicells"
            :key="`d-${idx}`"
            :cx="dc.cx"
            :cy="dc.cy"
            r="2.1"
            fill="var(--bunny-ink-3)"
            opacity="0.55"
          />
          <circle
            v-for="(ac, idx) in activeQuasicells"
            :key="`a-${idx}`"
            :cx="ac.cx"
            :cy="ac.cy"
            r="3.8"
            :fill="ac.lit ? 'var(--bunny-orange)' : 'var(--coin-green)'"
          />
          <circle cx="180" cy="76" r="3" fill="var(--bunny-ink)" />
          <text x="180" y="162" text-anchor="middle" font-size="12" font-weight="700" fill="var(--coin-green)">
            无滑移面十重彭罗斯准晶键合 · 极高硬度根源与浅层九颗激发晶胞
          </text>
        </svg>

        <!-- Tab 3: Twin Bio-Electric Star-Tenon Unlocking & Gen-2 Sibling Pair -->
        <svg v-else class="coin-map-svg" viewBox="0 0 360 176" aria-hidden="true">
          <!-- Left: Roy's Yang Piece + Gen-2 Shell -->
          <g>
            <ellipse cx="106" cy="72" rx="30" ry="44" fill="var(--bunny-ink)" stroke="var(--bunny-orange)" stroke-width="2" />
            <ellipse cx="112" cy="72" rx="18" ry="28" fill="var(--bunny-ink-2)" stroke="var(--bunny-paper)" stroke-width="1.4" />
            <text x="106" y="138" text-anchor="middle" font-size="11" font-weight="700" fill="var(--bunny-orange)">开拓阳片 + 二代透波阳壳</text>
          </g>

          <line x1="142" y1="66" x2="218" y2="66" stroke="var(--bunny-orange)" stroke-width="2" class="coin-dash-anim" />
          <line x1="142" y1="78" x2="218" y2="78" stroke="var(--coin-green)" stroke-width="2" class="coin-dash-anim" />
          <text x="180" y="55" text-anchor="middle" font-size="10.5" font-weight="700" fill="var(--coin-green)">星榫轴向解锁</text>

          <!-- Right: Roya's Yin Piece + Gen-2 Shell -->
          <g>
            <ellipse cx="254" cy="72" rx="30" ry="44" fill="var(--bunny-ink)" stroke="var(--coin-green)" stroke-width="2" />
            <ellipse cx="248" cy="72" rx="18" ry="28" fill="var(--bunny-ink)" stroke="var(--coin-green)" stroke-width="1.4" stroke-dasharray="3 2" />
            <text x="254" y="138" text-anchor="middle" font-size="11" font-weight="700" fill="var(--coin-green)">锚定阴片 + 二代透波阴壳</text>
          </g>

          <text x="180" y="164" text-anchor="middle" font-size="11.5" font-weight="600" fill="var(--bunny-ink-2)">
            双生生物电解锁子母星榫 · 战后分装二代透波对币配入兄妹角色右腰匣
          </text>
        </svg>
      </div>

      <div class="coin-vault-col">
        <div class="coin-vault-card">
          <p class="coin-rule-title">{{ cur.title }}</p>
          <p class="coin-rule-desc">{{ cur.summary }}</p>
        </div>
        <div class="coin-vault-card coin-vault-card--rule">
          <p v-for="b in cur.bullets" :key="b.k" class="coin-rule-desc world-mt-xs">
            <b>{{ b.k }}：</b>{{ b.v }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.world-mt-xs + .world-mt-xs {
  margin-top: 6px;
}
</style>
