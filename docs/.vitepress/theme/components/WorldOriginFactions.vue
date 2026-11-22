<script setup lang="ts">
import { ref } from 'vue'
import { withBase } from 'vitepress'

const activeTab = ref(0)

const castLinks = [
  { id: 'samurai', label: '久藏：抗拒旗下军工格式化', href: '/characters/samurai/' },
  { id: 'wizard', label: '维琳：斩断旗下高轨遥控链', href: '/characters/wizard/' },
  { id: 'crew', label: '克露丝：反抗旗下船坞封厂令', href: '/characters/crew/' },
  { id: 'gold-hunter', label: '达罗兄妹：重夺家族自由航线', href: '/characters/gold-hunter/' },
]
</script>

<template>
  <section class="coin-viz-box world-single-viz" aria-label="创世原点与三大宿敌交互图解">
    <header class="coin-viz-box__head">
      <div>
        <span class="coin-viz-box__eyebrow">INTERACTIVE DIAGRAM 01</span>
        <h3 class="coin-viz-box__title">创世原点与三阶段宿敌：一场科考火并裂出整座星海格局</h3>
      </div>
      <div class="coin-viz-tabs" role="tablist" aria-label="创世与宿敌视图切换">
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 0"
          class="coin-viz-tab"
          :class="{ 'is-active': activeTab === 0 }"
          @click="activeTab = 0"
        >
          01 零号母门 · 一匣裂三方
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 1"
          class="coin-viz-tab"
          :class="{ 'is-active': activeTab === 1 }"
          @click="activeTab = 1"
        >
          02 真币对决天秤伪币
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 2"
          class="coin-viz-tab"
          :class="{ 'is-active': activeTab === 2 }"
          @click="activeTab = 2"
        >
          03 暗环竞速与噬环天灾
        </button>
      </div>
    </header>

    <!-- TAB 0: O1 ONE RELIC SPLIT INTO THREE -->
    <div v-if="activeTab === 0" class="coin-viz-body">
      <div class="world-genesis-strip">
        <b>远古断环熔断：</b>
        <span>01 先驱修筑炽环航网连通群星</span>
        <span class="world-genesis-arrow">→</span>
        <span>02 噬环古械群顺航网啃食炉心</span>
        <span class="world-genesis-arrow">→</span>
        <span>03 先驱主动熄灭外环星门熔断，留「OG 原初圣匣」封于零号母门</span>
      </div>

      <svg class="world-split-svg" viewBox="0 0 680 148" aria-label="零号母门一匣裂三方因果图">
        <rect x="10" y="46" width="184" height="56" fill="var(--bunny-fabric)" stroke="var(--bunny-orange)" stroke-width="2.5" />
        <text x="102" y="70" text-anchor="middle" font-size="13" font-weight="700" fill="var(--bunny-ink)">十年前「零号母门」出土</text>
        <text x="102" y="90" text-anchor="middle" font-size="12" font-weight="600" fill="var(--bunny-orange)">科考队遭背叛 · 圣匣一分为三</text>

        <line x1="194" y1="58" x2="298" y2="26" stroke="var(--bunny-red)" stroke-width="2.2" class="coin-dash-anim" />
        <line x1="194" y1="74" x2="298" y2="74" stroke="var(--coin-green)" stroke-width="2.6" class="coin-dash-anim" />
        <line x1="194" y1="90" x2="298" y2="122" stroke="var(--bunny-orange)" stroke-width="2.2" class="coin-dash-anim" />

        <rect x="300" y="6" width="370" height="38" fill="var(--bunny-paper)" stroke="var(--bunny-red)" stroke-width="1.8" />
        <text x="485" y="30" text-anchor="middle" font-size="12.5" font-weight="600" fill="var(--bunny-ink)">
          叛变高层夺「外层铸模」→ 创立白塔天秤财团量产锁印伪币
        </text>

        <rect x="300" y="55" width="370" height="38" fill="var(--bunny-paper)" stroke="var(--coin-green)" stroke-width="2.4" />
        <text x="485" y="79" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--coin-green)">
          父母断后令归航号携「双生主币+9胚币」归港 → 达罗兄妹开局
        </text>

        <rect x="300" y="104" width="370" height="38" fill="var(--bunny-paper)" stroke="var(--bunny-orange)" stroke-width="1.8" />
        <text x="485" y="128" text-anchor="middle" font-size="12.5" font-weight="600" fill="var(--bunny-ink)">
          随行佣兵首领夺「半枚裂币」→ 组建暗环私掠团截胡外环星门
        </text>
      </svg>

      <p class="coin-map-stage__caption">
        <b>因果闭环：</b>同一场零号母门惨案，同步交代了达罗兄妹真币的由来、天秤财团伪币模具的源头、暗环船长半枚裂币的来历，以及跨越世代重返零号母门的终极悬念。
      </p>
    </div>

    <!-- TAB 1: TRUE COIN VS COUNTERFEIT COIN -->
    <div v-else-if="activeTab === 1" class="coin-viz-body">
      <div class="world-vs-grid">
        <div class="world-vs-card world-vs-card--true">
          <svg class="world-vs-svg" viewBox="0 0 72 72" aria-hidden="true">
            <circle cx="36" cy="36" r="28" fill="none" stroke="var(--bunny-orange)" stroke-width="3" />
            <circle cx="36" cy="36" r="20" fill="none" stroke="var(--coin-green)" stroke-width="1.6" />
            <text x="36" y="41" text-anchor="middle" font-size="14" font-weight="700" fill="var(--bunny-orange)">OG</text>
          </svg>
          <div class="world-vs-copy">
            <h4>主角方 · 原初真币（对等盟约）</h4>
            <ul>
              <li>对方<b>主动伸手接币</b>方才立契</li>
              <li>保有真名、氏族姓氏与独立人格</li>
              <li>超载反噬由执币人亲自承担</li>
            </ul>
          </div>
        </div>

        <div class="world-vs-badge">镜像死敌</div>

        <div class="world-vs-card world-vs-card--fake">
          <svg class="world-vs-svg" viewBox="0 0 72 72" aria-hidden="true">
            <polygon points="36,6 63,21 63,51 36,66 9,51 9,21" fill="none" stroke="var(--bunny-red)" stroke-width="3" />
            <line x1="20" y1="20" x2="52" y2="52" stroke="var(--bunny-red)" stroke-width="1.8" stroke-dasharray="4 3" />
            <text x="36" y="41" text-anchor="middle" font-size="13" font-weight="700" fill="var(--bunny-red)">锁印</text>
          </svg>
          <div class="world-vs-copy">
            <h4>白塔天秤财团 · 工业伪币（奴役枷锁）</h4>
            <ul>
              <li>凭外层铸模批量压制，<b>强行钉入异族躯体</b></li>
              <li>抹去姓氏改刻产线编号，视生命为耗材</li>
              <li>超载负荷全数转嫁受控者直至报废</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="coin-trait-bar">
        <div class="coin-trait-bar__pills">
          <span class="coin-trait-bar__label">一线串起队员宿怨（点击跳转档案）：</span>
          <a
            v-for="item in castLinks"
            :key="item.id"
            class="world-member-pill"
            :href="withBase(item.href)"
          >
            {{ item.label }}
          </a>
        </div>
      </div>
    </div>

    <!-- TAB 2: RIVAL PIRATES & COSMIC DEVOURERS -->
    <div v-else class="coin-viz-body">
      <div class="world-rival-grid">
        <div class="coin-step-card">
          <div class="coin-step-card__meta">
            <b>外环竞速劲敌</b>
            <span>各部资料片对位战</span>
          </div>
          <svg class="world-rival-svg" viewBox="0 0 300 96" aria-hidden="true">
            <rect x="8" y="12" width="108" height="28" fill="var(--bunny-paper)" stroke="var(--coin-green)" stroke-width="2" />
            <text x="62" y="30" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bunny-ink)">归航号（校准燃门）</text>
            <rect x="8" y="56" width="108" height="28" fill="var(--bunny-paper)" stroke="var(--bunny-red)" stroke-width="2" />
            <text x="62" y="74" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bunny-red)">暗环团（炸炉夺币）</text>
            <line x1="118" y1="26" x2="206" y2="42" stroke="var(--coin-green)" stroke-width="2" class="coin-dash-anim" />
            <line x1="118" y1="70" x2="206" y2="54" stroke="var(--bunny-red)" stroke-width="2" class="coin-dash-anim" />
            <circle cx="248" cy="48" r="34" fill="var(--bunny-paper)" stroke="var(--bunny-orange)" stroke-width="2.8" />
            <text x="248" y="45" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bunny-ink)">断联星门</text>
            <text x="248" y="61" text-anchor="middle" font-size="12" font-weight="600" fill="var(--bunny-orange)">新析胚币</text>
          </svg>
          <h4>暗环私掠团 · 同赛道恶徒猎犬</h4>
          <p>首领手握半枚裂币，每逢新星门即将重燃便现身截胡新胚币，展开刺客对刺客、刀客对刀客、指挥官赌指挥官的王牌死斗。</p>
        </div>

        <div class="coin-step-card">
          <div class="coin-step-card__meta">
            <b>深空灭门真凶</b>
            <span>跨世代终局大敌</span>
          </div>
          <svg class="world-rival-svg" viewBox="0 0 300 96" aria-hidden="true">
            <circle cx="150" cy="48" r="36" fill="none" stroke="var(--bunny-ink-3)" stroke-width="2.5" stroke-dasharray="5 4" />
            <polygon points="96,26 150,10 204,26 184,48 204,70 150,86 96,70 116,48" fill="none" stroke="var(--bunny-red)" stroke-width="2.2" />
            <circle cx="150" cy="48" r="13" fill="var(--bunny-red)" />
            <text x="150" y="52" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bunny-paper)">噬核</text>
          </svg>
          <h4>噬环古械群 · 星门熄灭元凶</h4>
          <p>啃食星门炉心的远古失控清道夫。单支小队无法抗衡，唯有历代达罗传人点亮多片星域、集结星环总舰队方能决一死战。</p>
        </div>
      </div>
    </div>
  </section>
</template>
