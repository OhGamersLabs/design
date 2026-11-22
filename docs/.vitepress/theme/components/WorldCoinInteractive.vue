<script setup lang="ts">
import { computed, ref } from 'vue'
import { withBase } from 'vitepress'
import { data as site } from '../../data/site.data.mjs'

const activeTab = ref(0)
const activeTraitIdx = ref(0)
const activePartnerIdx = ref(0)
const isHeads = ref(true)
const isFlipping = ref(false)
const activeEra = ref(0)
const activeDropRule = ref(0)

const traitExamples = [
  {
    id: 'doge',
    badge: '多吉 · 柴犬重坦',
    desire: '渴求「死战不退的护盾」',
    outcome: '胚币越过内环人类军营，停在正以约 2 头身躯体替难民舱硬抗炮火的毛线帽小柴犬鼻尖前——多吉抬爪拍币，瞬时重构为约 7 头身双盾重坦。',
  },
  {
    id: 'samurai',
    badge: '久藏 · 智械武士',
    desire: '渴求「不受强权驱使的孤刃」',
    outcome: '胚币穿透边疆沙暴悬停在荒铁·久藏刀前；久藏以热能正宗刀背接币，母币法则当场斩断军工回收部队的远程格式化信号。',
  },
  {
    id: 'wizard',
    badge: '维琳 · 硅碳雷法',
    desire: '渴求「撕裂封锁的高压雷霆」',
    outcome: '维琳自行斩断高轨遥控链路坠向星港空域时，以跃动电弧的指尖夹住迎面飞来的第九枚胚币，高轨追踪信标随之湮灭。',
  },
  {
    id: 'angel',
    badge: '安洁 · 天羽医者',
    desire: '渴求「守住众生呼吸的羽翼」',
    outcome: '安洁摘下云塔中立印记俯冲救援泄漏区船员的刹那，胚币穿过气旋停在眉前，轻触立契后隔绝了云塔圣殿的禁足召回令。',
  },
]

const combatPartners = [
  {
    name: '安洁铭纹币',
    role: '治疗师',
    headsEffect: '光翼护盾增幅 · 全队生命体征直连罗伊目镜',
    tailsEffect: '结晶飞羽超载群疗 · 瞬时铺开高密度治愈光幕',
  },
  {
    name: '罗克铭纹币',
    role: '重火机甲',
    headsEffect: '三十二联导弹与双炮弹道共享 · 零延迟火力封锁',
    tailsEffect: '引爆琥珀快拆栓径向脱壳 · 纤细高机动本体贴脸反杀',
  },
  {
    name: '弥羽铭纹币',
    role: '格斗士',
    headsEffect: '双矢量背翼包协同变向 · 精准切碎敌阵侧翼',
    tailsEffect: '极限纳构过载突袭 · 无重力高频连击破除重甲',
  },
  {
    name: '冈纳铭纹币',
    role: '重装步兵',
    headsEffect: '绿光目镜跨场共享 · 超远距死角精准压制',
    tailsEffect: '重型科幻能量步枪全功率贯通射击 · 洞穿能量壁垒',
  },
]

const dropRules = [
  {
    tag: '定案法则 · 燃门析币',
    title: '重燃断联主炽环门 = 炉心析出稀缺新胚币 + 门后新种族并网',
    desc: '空白胚币无法人工制造。唯有打穿篇章级危机、重新点燃熄灭断联的主星门，炉心才会析出二至三枚新胚币，同时把门后失落星域与新物种首次并入抛币共鸣池。',
  },
  {
    tag: '辅助途径 · 绝境赌局',
    title: '完成星渊级委托 = 因果潮汐凝聚额外契机',
    desc: '日常委托仅产出通用信用点用于修舰补给；唯有改写整条航道命运的绝境对赌，方能令双生主币汲取裂隙潮汐凝练珍稀火种。',
  },
  {
    tag: '辅助途径 · 环金熔铸',
    title: '深潜高危裂隙 = 收集远古星门崩碎环金',
    desc: '极少数高危裂隙核心伴生远古环金残片，须由总工克露丝配合达罗兄妹双币合鸣，方可在船坞熔铸成完整胚币。',
  },
]

const eraStates = [
  {
    sectorBadge: '已联网：1 / 3 星域',
    dlcBadge: '空白胚币余量：0 枚（买不到造不出）',
    unlockedSlots: 0,
    summary: '序章状态：达罗祖传十槽匣仅存的 9 枚古胚币全部用尽，召齐内环五大种族初代十人后库存归零；外环星门处于断网黑障，概率波无法抵达。',
  },
  {
    sectorBadge: '已联网：2 / 3 星域',
    dlcBadge: '析出新币：+3 枚北渊契印',
    unlockedSlots: 3,
    summary: '资料片一推进：小队重燃断联的北渊主炽环门，星门炉心析出 3 枚稀缺新胚币，门后未知星系与全新种族正式接入母币共鸣射程。',
  },
  {
    sectorBadge: '已联网：3 / 3 星域（舰队级）',
    dlcBadge: '析出新币：+6 枚特遣分匣契印',
    unlockedSlots: 6,
    summary: '资料片二推进：多座远古星门重燃联网，罗伊升级旗舰主脑正式晋升「星环舰队指挥官」——初代十人永驻旗舰核心席，新伙伴编入特遣分匣。',
  },
]

const shortSlotNames: Record<string, string> = {
  'gold-hunter': '双生主币',
  bunny: '邦妮',
  angel: '安洁',
  crew: '克露丝',
  gunman: '冈纳',
  doge: '多吉',
  mew: '弥羽',
  samurai: '久藏',
  robot: '罗克',
  wizard: '维琳',
}

const foundingSlots = computed(() =>
  site.roster.slice(0, 10).map((entry, idx) => ({
    id: entry.id,
    home: entry.home,
    isMaster: idx === 0,
    shortLabel: shortSlotNames[entry.id] ?? entry.name.split('·')[0],
    fullName: entry.name,
  })),
)

const currentPartner = computed(() => combatPartners[activePartnerIdx.value])
const currentEra = computed(() => eraStates[activeEra.value])
const currentRule = computed(() => dropRules[activeDropRule.value])

function triggerCoinFlip() {
  if (isFlipping.value) return
  isFlipping.value = true
  setTimeout(() => {
    isHeads.value = !isHeads.value
  }, 220)
  setTimeout(() => {
    isFlipping.value = false
  }, 520)
}
</script>

<template>
  <div class="coin-viz-stack">
    <!-- DIAGRAM 1: CAST VS DISPATCH & 3 LOCKS -->
    <section class="coin-viz-box" aria-label="抛币结契双轨运作交互图解">
      <header class="coin-viz-box__head">
        <div>
          <span class="coin-viz-box__eyebrow">INTERACTIVE DIAGRAM 01</span>
          <h3 class="coin-viz-box__title">一枚金币的两种用法：拆开「开荒招新」与「老队打架」</h3>
        </div>
        <div class="coin-viz-tabs" role="tablist" aria-label="抛币运作模式切换">
          <button
            type="button"
            role="tab"
            :aria-selected="activeTab === 0"
            class="coin-viz-tab"
            :class="{ 'is-active': activeTab === 0 }"
            @click="activeTab = 0"
          >
            01 招新伙伴 · 抛空白胚币
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeTab === 1"
            class="coin-viz-tab"
            :class="{ 'is-active': activeTab === 1 }"
            @click="activeTab = 1"
          >
            02 战时调遣 · 抛实名伙伴币
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeTab === 2"
            class="coin-viz-tab"
            :class="{ 'is-active': activeTab === 2 }"
            @click="activeTab = 2"
          >
            03 三把防崩锁 · 堵死漏洞
          </button>
        </div>
      </header>

      <!-- TAB 0: BLANK COIN FORGING -->
      <div v-if="activeTab === 0" class="coin-viz-body">
        <div class="coin-step-grid">
          <div class="coin-step-card">
            <div class="coin-step-card__meta">
              <b>STEP 01</b>
              <span>一生一次</span>
            </div>
            <svg class="coin-step-svg" viewBox="0 0 120 60" aria-hidden="true">
              <circle cx="44" cy="30" r="20" fill="none" stroke="var(--bunny-orange)" stroke-width="2.5" />
              <text x="44" y="34" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bunny-orange)">OG</text>
              <circle cx="76" cy="30" r="20" fill="var(--bunny-paper)" stroke="var(--bunny-ink-2)" stroke-width="2" stroke-dasharray="4 3" />
              <text x="76" y="34" text-anchor="middle" font-size="12" font-weight="600" fill="var(--bunny-ink-2)">胚币</text>
            </svg>
            <h4>双生主币 + 空白胚币</h4>
            <p>兄妹双币合鸣校准，只向胚币注入破局特质渴求，主动放弃筛选星系与物种形态。</p>
          </div>

          <div class="coin-step-card">
            <div class="coin-step-card__meta">
              <b>STEP 02</b>
              <span>等价交换</span>
            </div>
            <svg class="coin-step-svg" viewBox="0 0 120 60" aria-hidden="true">
              <circle cx="60" cy="30" r="23" fill="none" stroke="var(--bunny-orange)" stroke-width="3" />
              <circle cx="60" cy="30" r="16" fill="none" stroke="var(--bunny-ink)" stroke-width="1.5" class="coin-dash-anim" />
              <line x1="14" y1="30" x2="106" y2="30" stroke="var(--bunny-orange)" stroke-width="2" class="coin-dash-anim" />
            </svg>
            <h4>穿透炽环门 · 概率折跃</h4>
            <p>正因放弃人为指定权、交给硬币旋转概率，才换来凿穿数千光年航网的折跃权能。</p>
          </div>

          <div class="coin-step-card">
            <div class="coin-step-card__meta">
              <b>STEP 03</b>
              <span>波长共鸣</span>
            </div>
            <svg class="coin-step-svg" viewBox="0 0 120 60" aria-hidden="true">
              <circle cx="28" cy="18" r="4" fill="var(--bunny-ink-3)" opacity="0.45" />
              <circle cx="34" cy="44" r="4" fill="var(--bunny-ink-3)" opacity="0.45" />
              <circle cx="92" cy="16" r="4" fill="var(--bunny-ink-3)" opacity="0.45" />
              <circle cx="88" cy="44" r="4" fill="var(--bunny-ink-3)" opacity="0.45" />
              <circle cx="60" cy="30" r="15" fill="none" stroke="var(--bunny-ink)" stroke-width="2" />
              <circle cx="60" cy="30" r="6.5" fill="var(--bunny-orange)" />
            </svg>
            <h4>精准锚定「破格异类」</h4>
            <p>无视体型与出身，硬币专挑已联网星域里拒绝屈从命运剧本的极致特质者落下。</p>
          </div>

          <div class="coin-step-card coin-step-card--highlight">
            <div class="coin-step-card__meta">
              <b>STEP 04</b>
              <span>盲盒终结</span>
            </div>
            <svg class="coin-step-svg" viewBox="0 0 120 60" aria-hidden="true">
              <circle cx="60" cy="30" r="21" fill="none" stroke="var(--coin-green)" stroke-width="2.5" />
              <circle cx="60" cy="30" r="15" fill="none" stroke="var(--bunny-orange)" stroke-width="1.5" />
              <text x="60" y="34" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bunny-ink)">实名</text>
            </svg>
            <h4>伸手接币 = 化作实名币</h4>
            <p>对方自愿接币才完成立契！装备浮现 OG 契印，空白币自此定型为该伙伴专属铭纹币。</p>
          </div>
        </div>

        <div class="coin-trait-bar">
          <div class="coin-trait-bar__pills">
            <span class="coin-trait-bar__label">点击查看结契实例：</span>
            <button
              v-for="(item, idx) in traitExamples"
              :key="item.id"
              type="button"
              class="coin-pill-btn"
              :class="{ 'is-active': activeTraitIdx === idx }"
              @click="activeTraitIdx = idx"
            >
              {{ item.badge }}
            </button>
          </div>
          <p class="coin-trait-bar__copy">
            <b>{{ traitExamples[activeTraitIdx].desire }}：</b>{{ traitExamples[activeTraitIdx].outcome }}
          </p>
        </div>
      </div>

      <!-- TAB 1: COMBAT DISPATCH -->
      <div v-else-if="activeTab === 1" class="coin-viz-body">
        <div class="coin-combat-grid">
          <div class="coin-combat-pick">
            <p class="coin-panel-kicker">第一步 · 抽取指定实名币（百分百点将，绝不叫错人）</p>
            <div class="coin-partner-list">
              <button
                v-for="(partner, idx) in combatPartners"
                :key="partner.name"
                type="button"
                class="coin-partner-btn"
                :class="{ 'is-active': activePartnerIdx === idx }"
                @click="activePartnerIdx = idx"
              >
                <b>{{ partner.name }}</b>
                <span>{{ partner.role }}</span>
              </button>
            </div>
          </div>

          <div class="coin-combat-flip">
            <p class="coin-panel-kicker">第二步 · 抛币判定正反态</p>
            <button
              type="button"
              class="coin-disc"
              :class="[
                isHeads ? 'is-heads' : 'is-tails',
                { 'is-flipping': isFlipping },
              ]"
              aria-label="抛起硬币切换正反面"
              @click="triggerCoinFlip"
            >
              <span class="coin-disc__face">{{ isHeads ? '正面' : '反面' }}</span>
              <span class="coin-disc__sub">{{ isHeads ? '环冠共链' : '裂星狂飙' }}</span>
            </button>
            <button type="button" class="coin-action-btn" @click="triggerCoinFlip">
              点击抛起「{{ currentPartner.name }}」
            </button>
          </div>

          <div class="coin-combat-outcomes">
            <div class="coin-outcome-card coin-outcome-card--heads" :class="{ 'is-dim': !isHeads }">
              <div class="coin-outcome-card__head">
                <b>正面 · 环冠面（稳定共链态）</b>
                <span>零反噬代价</span>
              </div>
              <p>{{ currentPartner.headsEffect }}</p>
            </div>

            <div class="coin-outcome-card coin-outcome-card--tails" :class="{ 'is-dim': isHeads }">
              <div class="coin-outcome-card__head">
                <b>反面 · 裂星面（超载狂飙态）</b>
                <span>高风险博弈</span>
              </div>
              <p>{{ currentPartner.tailsEffect }}</p>
              <small>代价：罗伊承受神经元灼烧负荷，战后该枚硬币进入过热冷却期。</small>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: THREE LOCKS -->
      <div v-else class="coin-viz-body">
        <div class="coin-locks-grid">
          <article class="coin-lock-card">
            <div class="coin-step-card__meta">
              <b>防崩锁 01</b>
              <span>杜绝无脑群殴</span>
            </div>
            <svg class="coin-lock-svg" viewBox="0 0 200 44" aria-hidden="true">
              <rect x="10" y="10" width="38" height="24" fill="var(--bunny-orange)" />
              <rect x="56" y="10" width="38" height="24" fill="var(--bunny-orange)" />
              <rect x="102" y="10" width="38" height="24" fill="none" stroke="var(--bunny-ink-3)" stroke-dasharray="4 3" stroke-width="1.5" />
              <rect x="148" y="10" width="38" height="24" fill="none" stroke="var(--bunny-ink-3)" stroke-dasharray="4 3" stroke-width="1.5" />
            </svg>
            <h4>带宽锁与信标锁</h4>
            <p>同伴同船参战不占带宽；跨星门异地折跃初期同场限拉 <b>2 至 3 枚</b>。在黑域屏蔽区无法凭空开门，必须由克露丝架设中继环、邦妮潜入破除干扰。</p>
          </article>

          <article class="coin-lock-card">
            <div class="coin-step-card__meta">
              <b>防崩锁 02</b>
              <span>杜绝单线瘫痪</span>
            </div>
            <svg class="coin-lock-svg" viewBox="0 0 200 44" aria-hidden="true">
              <circle cx="52" cy="22" r="16" fill="none" stroke="var(--bunny-ink)" stroke-width="2.2" />
              <text x="52" y="26" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bunny-ink)">阳币</text>
              <line x1="78" y1="22" x2="122" y2="22" stroke="var(--bunny-orange)" stroke-width="2" stroke-dasharray="4 3" />
              <circle cx="148" cy="22" r="16" fill="none" stroke="var(--bunny-orange)" stroke-width="2.2" />
              <text x="148" y="26" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bunny-orange)">阴币</text>
            </svg>
            <h4>单币可战 · 双币开疆</h4>
            <p>罗伊与罗娅分执同源双生主币，<b>单人即可独立调遣全部老队友</b>，分兵历险绝不瘫痪；唯有抛空白胚币招新伙伴或开舰队级远距星门时，方需兄妹合鸣。</p>
          </article>

          <article class="coin-lock-card">
            <div class="coin-step-card__meta">
              <b>防崩锁 03</b>
              <span>杜绝奴隶契约</span>
            </div>
            <svg class="coin-lock-svg" viewBox="0 0 200 44" aria-hidden="true">
              <circle cx="56" cy="22" r="16" fill="none" stroke="var(--coin-green)" stroke-width="2.2" />
              <text x="56" y="26" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bunny-ink)">对等</text>
              <line x1="100" y1="8" x2="100" y2="36" stroke="var(--bunny-rule-strong)" stroke-width="1.5" />
              <circle cx="144" cy="22" r="16" fill="none" stroke="var(--bunny-red)" stroke-width="2" stroke-dasharray="4 2" />
              <text x="144" y="26" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bunny-red)">三拒碎</text>
            </svg>
            <h4>只锁召集 · 不控心智</h4>
            <p>契印保有伙伴百分百独立人格与私生活；双方凭对赌信诺同行，若硬币发烫连续拒召满 <b>3 次</b> 或自愿解契，硬币当场崩碎、星环庇护同步失效。</p>
          </article>
        </div>
      </div>
    </section>

    <!-- DIAGRAM 2: EXPANSION STAR MAP & COIN VAULT -->
    <section class="coin-viz-box" aria-label="资料片星门扩容与胚币稀缺机制交互图解">
      <header class="coin-viz-box__head">
        <div>
          <span class="coin-viz-box__eyebrow">INTERACTIVE DIAGRAM 02</span>
          <h3 class="coin-viz-box__title">资料片怎么加新角色还不通货膨胀：燃门析币与双匣编制</h3>
        </div>
        <div class="coin-viz-tabs" role="tablist" aria-label="剧情篇章推进切换">
          <button
            type="button"
            role="tab"
            :aria-selected="activeEra === 0"
            class="coin-viz-tab"
            :class="{ 'is-active': activeEra === 0 }"
            @click="activeEra = 0"
          >
            序章 · 初代十人
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeEra === 1"
            class="coin-viz-tab"
            :class="{ 'is-active': activeEra === 1 }"
            @click="activeEra = 1"
          >
            资料片一 · 重燃北渊门
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeEra === 2"
            class="coin-viz-tab"
            :class="{ 'is-active': activeEra === 2 }"
            @click="activeEra = 2"
          >
            资料片二 · 舰队指挥官
          </button>
        </div>
      </header>

      <div class="coin-viz-body coin-map-grid">
        <!-- Star Map Panel -->
        <div class="coin-map-stage">
          <div class="coin-map-stage__top">
            <b>炽环航网共鸣射程图</b>
            <span>{{ currentEra.sectorBadge }}</span>
          </div>

          <svg class="coin-map-svg" viewBox="0 0 460 196" aria-label="炽环航网星域连接示意图">
            <line
              x1="142"
              y1="92"
              x2="292"
              y2="54"
              :stroke="activeEra >= 1 ? 'var(--bunny-orange)' : 'var(--bunny-ink-3)'"
              stroke-width="2.4"
              :stroke-dasharray="activeEra >= 1 ? '6 4' : '4 4'"
              :opacity="activeEra >= 1 ? 1 : 0.35"
              :class="{ 'coin-dash-anim': activeEra >= 1 }"
            />
            <line
              x1="142"
              y1="108"
              x2="298"
              y2="146"
              :stroke="activeEra >= 2 ? 'var(--bunny-orange)' : 'var(--bunny-ink-3)'"
              stroke-width="2.4"
              :stroke-dasharray="activeEra >= 2 ? '6 4' : '4 4'"
              :opacity="activeEra >= 2 ? 1 : 0.35"
              :class="{ 'coin-dash-anim': activeEra >= 2 }"
            />

            <!-- Inner Ring -->
            <g>
              <circle cx="96" cy="100" r="48" fill="var(--bunny-paper)" stroke="var(--bunny-orange)" stroke-width="3" />
              <circle cx="96" cy="100" r="38" fill="none" stroke="var(--bunny-ink)" stroke-width="1.4" stroke-dasharray="5 3" />
              <text x="96" y="96" text-anchor="middle" font-size="13" font-weight="700" fill="var(--bunny-ink)">白塔内环</text>
              <text x="96" y="114" text-anchor="middle" font-size="12" font-weight="600" fill="var(--bunny-orange)">五大种族在线</text>
            </g>

            <!-- Sector 1 -->
            <g :opacity="activeEra >= 1 ? 1 : 0.48">
              <circle
                cx="346"
                cy="50"
                r="38"
                fill="var(--bunny-paper)"
                :stroke="activeEra >= 1 ? 'var(--bunny-orange)' : 'var(--bunny-ink-3)'"
                stroke-width="2.6"
                :stroke-dasharray="activeEra >= 1 ? undefined : '5 4'"
              />
              <text x="346" y="46" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--bunny-ink)">北渊主星门</text>
              <text
                x="346"
                y="64"
                text-anchor="middle"
                font-size="12"
                font-weight="600"
                :fill="activeEra >= 1 ? 'var(--coin-green)' : 'var(--bunny-ink-2)'"
              >
                {{ activeEra >= 1 ? '炉心析币 +3' : '断网黑障' }}
              </text>
            </g>

            <!-- Sector 2 -->
            <g :opacity="activeEra >= 2 ? 1 : 0.48">
              <circle
                cx="352"
                cy="146"
                r="38"
                fill="var(--bunny-paper)"
                :stroke="activeEra >= 2 ? 'var(--bunny-orange)' : 'var(--bunny-ink-3)'"
                stroke-width="2.6"
                :stroke-dasharray="activeEra >= 2 ? undefined : '5 4'"
              />
              <text x="352" y="142" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--bunny-ink)">深海主星门</text>
              <text
                x="352"
                y="160"
                text-anchor="middle"
                font-size="12"
                font-weight="600"
                :fill="activeEra >= 2 ? 'var(--coin-green)' : 'var(--bunny-ink-2)'"
              >
                {{ activeEra >= 2 ? '炉心析币 +3' : '断网黑障' }}
              </text>
            </g>
          </svg>

          <p class="coin-map-stage__caption">{{ currentEra.summary }}</p>
        </div>

        <!-- Coin Cases Panel -->
        <div class="coin-vault-col">
          <div class="coin-vault-card">
            <div class="coin-vault-card__head">
              <b>角色右腰原初十槽匣（旗舰元老席）</b>
              <span>10 / 10 满编常驻</span>
            </div>
            <div class="coin-slot-grid coin-slot-grid--ten">
              <a
                v-for="slot in foundingSlots"
                :key="slot.id"
                class="coin-slot"
                :class="{ 'coin-slot--master': slot.isMaster }"
                :href="withBase(slot.home)"
                :title="slot.fullName"
              >
                {{ slot.shortLabel }}
              </a>
            </div>
          </div>

          <div class="coin-vault-card">
            <div class="coin-vault-card__head">
              <b>星环特遣分匣（资料片扩容席）</b>
              <span>{{ currentEra.dlcBadge }}</span>
            </div>
            <div class="coin-slot-grid coin-slot-grid--six">
              <div
                v-for="n in 6"
                :key="n"
                class="coin-slot coin-slot--dlc"
                :class="{ 'is-unlocked': n <= currentEra.unlockedSlots }"
              >
                {{ n <= currentEra.unlockedSlots ? `新契 0${n}` : '未开启' }}
              </div>
            </div>
          </div>

          <div class="coin-vault-card coin-vault-card--rule">
            <div class="coin-rule-pills">
              <button
                type="button"
                class="coin-pill-btn"
                :class="{ 'is-active': activeDropRule === 0 }"
                @click="activeDropRule = 0"
              >
                燃门析币（主轴）
              </button>
              <button
                type="button"
                class="coin-pill-btn"
                :class="{ 'is-active': activeDropRule === 1 }"
                @click="activeDropRule = 1"
              >
                绝境赌局
              </button>
              <button
                type="button"
                class="coin-pill-btn"
                :class="{ 'is-active': activeDropRule === 2 }"
                @click="activeDropRule = 2"
              >
                环金熔铸
              </button>
            </div>
            <p class="coin-rule-title">{{ currentRule.title }}</p>
            <p class="coin-rule-desc">{{ currentRule.desc }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
