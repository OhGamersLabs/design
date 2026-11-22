<script setup lang="ts">
import { ref } from 'vue'

const activeTab = ref(0)
const selectedZone = ref(0)

const shipZones = [
  {
    code: '01 六席子母双片舰桥',
    summary:
      '位于舰体中后段上方，设紧凑六席主控台与半深圆形母币槽。正是这道半深凹槽促使兄妹拧开了陪伴十年的唯一厚金币；阳阴双片合鸣即可逐阶扩充折跃带宽，并在跨代远征中传予新一代达罗指挥官。',
  },
  {
    code: '02 侧舷出击与回收双港',
    summary:
      '舰体中段侧舷并列两座独立舱门（前出击口与后回收口），内部连接缓冲夹持架与转运轨道。挑高空间专门容纳逾三点五米高的双粉重炮机甲罗克、弥羽的球形太空舱，以及小型无人探路艇「巡隼」与采矿工程车「砺石」。',
  },
  {
    code: '03 八席餐舱与封存街廊',
    summary:
      '上层暖光区包含八席公共交班餐厅、安洁主理的医疗培养舱与日常住舱；舰体深处仍有大片安静封存的街廊舱段——随历代达罗传人点亮新星门、唤醒母币深层晶环接纳新伙伴而逐段苏醒。',
  },
  {
    code: '04 暗礁搁浅与终章升空',
    summary:
      '舰体采用暖灰白外板、蓝灰承力结构与砖红识别色块，舰艏内嵌星门谐振校准仪，艉部排布两列三层共六具大推力主喷口。内环篇隐匿搁浅于边缘零九号暗礁，经克露丝修复后于终章破封升空驶向无门深空。',
  },
]
</script>

<template>
  <section class="coin-viz-box world-single-viz" aria-label="归航号母舰与跨代回响交互图解">
    <header class="coin-viz-box__head">
      <div>
        <span class="coin-viz-box__eyebrow">INTERACTIVE DIAGRAM 06</span>
        <h3 class="coin-viz-box__title">群星回响与母舰「归航号」：门外百年代际接力，燃门一瞬重回当下</h3>
      </div>
      <div class="coin-viz-tabs" role="tablist" aria-label="归航号与跨代远征视图切换">
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 0"
          class="coin-viz-tab"
          :class="{ 'is-active': activeTab === 0 }"
          @click="activeTab = 0"
        >
          01 门外百年代际 · 燃门一瞬归乡
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 1"
          class="coin-viz-tab"
          :class="{ 'is-active': activeTab === 1 }"
          @click="activeTab = 1"
        >
          02 归航号舱室透视图（点选舱段）
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 2"
          class="coin-viz-tab"
          :class="{ 'is-active': activeTab === 2 }"
          @click="activeTab = 2"
        >
          03 达罗后裔资料片三大母题
        </button>
      </div>
    </header>

    <!-- TAB 0: GENERATIONAL VOYAGE VS INSTANT GATE -->
    <div v-if="activeTab === 0" class="coin-viz-body">
      <svg class="world-split-svg" viewBox="0 0 680 156" aria-label="跨光年代际航程与星门瞬时连接对照图">
        <circle cx="64" cy="78" r="42" fill="var(--bunny-paper)" stroke="var(--bunny-orange)" stroke-width="2.8" />
        <text x="64" y="74" text-anchor="middle" font-size="13" font-weight="700" fill="var(--bunny-ink)">白塔星域</text>
        <text x="64" y="92" text-anchor="middle" font-size="12" font-weight="600" fill="var(--bunny-orange)">初代启航地</text>

        <path
          d="M108,52 Q340,2 572,52"
          fill="none"
          stroke="var(--bunny-ink-2)"
          stroke-width="2.2"
          class="world-slow-dash"
        />
        <rect x="144" y="10" width="118" height="26" fill="var(--bunny-fabric)" stroke="var(--bunny-rule-strong)" />
        <text x="203" y="27" text-anchor="middle" font-size="12" font-weight="600" fill="var(--bunny-ink)">初代：罗伊与罗娅启航</text>

        <rect x="281" y="4" width="118" height="26" fill="var(--bunny-fabric)" stroke="var(--bunny-rule-strong)" />
        <text x="340" y="21" text-anchor="middle" font-size="12" font-weight="600" fill="var(--bunny-ink)">深空航途：双片传子孙</text>

        <rect x="418" y="10" width="118" height="26" fill="var(--bunny-fabric)" stroke="var(--bunny-orange)" />
        <text x="477" y="27" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bunny-orange)">资料片：达罗后裔抵门</text>

        <line x1="110" y1="106" x2="570" y2="106" stroke="var(--coin-green)" stroke-width="3.2" class="coin-dash-anim" />
        <rect x="206" y="92" width="268" height="28" fill="var(--bunny-paper)" stroke="var(--coin-green)" stroke-width="1.8" />
        <text x="340" y="110" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--coin-green)">
          星门重燃那一秒 = 数十年跨代距离折叠为一步！
        </text>

        <circle cx="616" cy="78" r="42" fill="var(--bunny-paper)" stroke="var(--coin-green)" stroke-width="2.8" />
        <text x="616" y="74" text-anchor="middle" font-size="13" font-weight="700" fill="var(--bunny-ink)">遥远星域</text>
        <text x="616" y="92" text-anchor="middle" font-size="12" font-weight="600" fill="var(--coin-green)">守门第三代</text>
      </svg>

      <p class="coin-map-stage__caption">
        <b>为什么必须肉身远征：</b>熄灭的星门无法从内环隔空瞬移点亮，必须由归航号横渡漫长光年抵达对岸。门亮之前，两地隔着几代人的生老病死与迟到数十年的「回响信使」；门亮之后，后来者一步即可跨回故土。
      </p>
    </div>

    <!-- TAB 1: GUIHANG CUTAWAY -->
    <div v-else-if="activeTab === 1" class="coin-viz-body coin-map-grid">
      <div class="coin-map-stage">
        <div class="coin-map-stage__top">
          <b>百米级远征母舰「归航号（GUIHANG）」工业剖面</b>
          <span>点击船体各区查看职责</span>
        </div>

        <svg class="coin-map-svg" viewBox="0 0 480 176" aria-label="归航号母舰四分区可交互示意图">
          <polygon
            points="24,66 92,40 392,40 434,52 434,126 392,136 62,138 16,98"
            fill="var(--bunny-paper)"
            stroke="var(--bunny-ink)"
            stroke-width="2.2"
          />
          <polygon points="22,98 62,138 134,137 150,102 74,102" fill="var(--bunny-red)" opacity="0.72" />
          <rect x="344" y="106" width="42" height="29" fill="var(--bunny-red)" opacity="0.72" />
          <polygon points="98,40 126,40 108,137 80,137" fill="var(--bunny-ink-2)" opacity="0.28" />
          <rect x="234" y="40" width="18" height="96" fill="var(--bunny-ink-2)" opacity="0.28" />

          <g class="world-zone-hit" @click="selectedZone = 3">
            <polygon
              points="26,68 90,44 90,98 22,96"
              :fill="selectedZone === 3 ? 'var(--bunny-bone)' : 'transparent'"
              :stroke="selectedZone === 3 ? 'var(--bunny-orange)' : 'var(--bunny-rule-strong)'"
              stroke-width="2"
            />
            <text x="58" y="78" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bunny-ink)">04 舰艏</text>
            <circle cx="448" cy="64" r="11" fill="var(--bunny-fabric)" :stroke="selectedZone === 3 ? 'var(--bunny-orange)' : 'var(--bunny-ink)'" stroke-width="2.4" />
            <circle cx="448" cy="90" r="11" fill="var(--bunny-fabric)" :stroke="selectedZone === 3 ? 'var(--bunny-orange)' : 'var(--bunny-ink)'" stroke-width="2.4" />
            <circle cx="448" cy="116" r="11" fill="var(--bunny-fabric)" :stroke="selectedZone === 3 ? 'var(--bunny-orange)' : 'var(--bunny-ink)'" stroke-width="2.4" />
          </g>

          <g class="world-zone-hit" @click="selectedZone = 2">
            <rect
              x="132"
              y="45"
              width="206"
              height="24"
              :fill="selectedZone === 2 ? 'var(--bunny-bone)' : 'var(--bunny-fabric)'"
              :stroke="selectedZone === 2 ? 'var(--bunny-orange)' : 'var(--bunny-rule-strong)'"
              stroke-width="2"
            />
            <text x="235" y="61" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bunny-ink)">03 八席餐舱与封存居住街廊</text>
          </g>

          <g class="world-zone-hit" @click="selectedZone = 1">
            <rect
              x="148"
              y="76"
              width="80"
              height="48"
              :fill="selectedZone === 1 ? 'var(--bunny-bone)' : 'var(--bunny-fabric)'"
              :stroke="selectedZone === 1 ? 'var(--bunny-orange)' : 'var(--bunny-ink)'"
              stroke-width="2.2"
            />
            <text x="188" y="98" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bunny-ink)">02 出击港</text>
            <text x="188" y="114" text-anchor="middle" font-size="12" fill="var(--bunny-orange)">3.5m 罗克库位</text>

            <rect
              x="258"
              y="76"
              width="80"
              height="48"
              :fill="selectedZone === 1 ? 'var(--bunny-bone)' : 'var(--bunny-fabric)'"
              :stroke="selectedZone === 1 ? 'var(--bunny-orange)' : 'var(--bunny-ink)'"
              stroke-width="2.2"
            />
            <text x="298" y="98" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bunny-ink)">02 回收港</text>
            <text x="298" y="114" text-anchor="middle" font-size="12" fill="var(--bunny-ink-2)">猫舱与巡隼艇</text>
          </g>

          <g class="world-zone-hit" @click="selectedZone = 0">
            <polygon
              points="308,40 364,22 390,40"
              :fill="selectedZone === 0 ? 'var(--bunny-orange)' : 'var(--bunny-bone)'"
              stroke="var(--bunny-ink)"
              stroke-width="2.2"
            />
            <text
              x="354"
              y="36"
              text-anchor="middle"
              font-size="12"
              font-weight="700"
              :fill="selectedZone === 0 ? 'var(--bunny-paper)' : 'var(--bunny-ink)'"
            >
              01 舰桥
            </text>
          </g>
        </svg>
      </div>

      <div class="coin-vault-col">
        <div class="coin-vault-card">
          <div class="coin-vault-card__head">
            <b>点选切换四个核心分区</b>
            <span>百米级十人编制</span>
          </div>
          <div class="coin-partner-list">
            <button
              v-for="(zone, idx) in shipZones"
              :key="zone.code"
              type="button"
              class="coin-partner-btn"
              :class="{ 'is-active': selectedZone === idx }"
              @click="selectedZone = idx"
            >
              <b>{{ zone.code }}</b>
              <span>查看详情</span>
            </button>
          </div>
        </div>

        <div class="coin-vault-card coin-vault-card--rule">
          <p class="coin-rule-title">{{ shipZones[selectedZone].code }}</p>
          <p class="coin-rule-desc">{{ shipZones[selectedZone].summary }}</p>
        </div>
      </div>
    </div>

    <!-- TAB 2: THREE GENERATIONAL SAGA THEMES -->
    <div v-else class="coin-viz-body">
      <div class="coin-locks-grid">
        <article class="coin-lock-card">
          <div class="coin-step-card__meta">
            <b>母题 01</b>
            <span>时空回响</span>
          </div>
          <h4>祖辈发信 · 孙辈触印</h4>
          <p>白塔截获一艘在黑域漂流七十载的无人求救信使，发信老船长早已离世；当达罗传人顺着回响投出母币金影，在对岸废墟伸手触碰立契的已是苦守三代人的年轻继承者。</p>
        </article>

        <article class="coin-lock-card">
          <div class="coin-step-card__meta">
            <b>母题 02</b>
            <span>寿命差美学</span>
          </div>
          <h4>长生机魂守望达罗数代人</h4>
          <p>纯碳基的罗伊与罗娅终会随岁月老去，将阳阴双片交予子孙；而智械族久藏、罗克与硅碳族维琳跨越数个世纪驻守归航号，亲眼见证一代代琥珀金眸的达罗后人接过帅印。</p>
        </article>

        <article class="coin-lock-card">
          <div class="coin-step-card__meta">
            <b>母题 03</b>
            <span>克制裁剪边界</span>
          </div>
          <h4>百米级精悍尺度 · 保罗克唯一机甲排面</h4>
          <p>严格定标百米级十人母舰，不引入二十米巨型机甲或千人难民账本——全舰重火力王牌唯三点五米高的罗克一人，辅以小型无人艇「巡隼」探路、「砺石」采矿补给。</p>
        </article>
      </div>
    </div>
  </section>
</template>
