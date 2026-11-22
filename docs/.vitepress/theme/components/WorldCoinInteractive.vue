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

const traitExamples = [
  {
    id: 'doge',
    badge: '第 04 齿 · 多吉',
    desire: '渴求「死战不退的护盾」',
    outcome: '母币金影越过人类军营，停在正以约 2 头身躯体替难民舱硬抗炮火的毛线帽小柴犬鼻尖前——多吉抬爪拍印，瞬时重构为约 7 头身双盾重坦。',
  },
  {
    id: 'samurai',
    badge: '第 07 齿 · 久藏',
    desire: '渴求「不受强权驱使的孤刃」',
    outcome: '金影穿透边疆沙暴悬停在荒铁·久藏刀前；久藏以热能正宗刀背接印，母币法则当场斩断天秤财团回收部队的远程格式化信号。',
  },
  {
    id: 'wizard',
    badge: '第 09 齿 · 维琳',
    desire: '渴求「撕裂封锁的高压雷霆」',
    outcome: '维琳自行斩断高轨遥控链路坠向空域时，以电弧指尖夹住外圈最后一道空白金影，高轨信标随之湮灭，入队后更破译出母币内层晶环之谜。',
  },
  {
    id: 'angel',
    badge: '第 06 齿 · 安洁',
    desire: '渴求「守住众生呼吸的羽翼」',
    outcome: '安洁摘下云环中立印记俯冲救人的刹那，母币金影穿过气旋停在眉前，轻触凝成子契印后隔绝了云塔圣殿的禁足召回令。',
  },
]

const combatPartners = [
  {
    name: '第 06 齿 · 安洁',
    role: '治疗师',
    headsEffect: '光翼护盾增幅 · 全队生命体征直连执币人目镜',
    tailsEffect: '结晶飞羽超载群疗 · 瞬时铺开高密度治愈光幕',
  },
  {
    name: '第 08 齿 · 罗克',
    role: '重火机甲',
    headsEffect: '三十二联导弹与双炮弹道共享 · 零延迟火力封锁',
    tailsEffect: '引爆琥珀快拆栓径向脱壳 · 纤细高机动本体贴脸反杀',
  },
  {
    name: '第 05 齿 · 弥羽',
    role: '格斗士',
    headsEffect: '双矢量背翼包协同变向 · 精准切碎敌阵侧翼',
    tailsEffect: '极限纳构过载突袭 · 无重力高频连击破除重甲',
  },
  {
    name: '第 03 齿 · 冈纳',
    role: '重装步兵',
    headsEffect: '绿光目镜跨场共享 · 超远距死角精准压制',
    tailsEffect: '重型科幻能量步枪全功率贯通射击 · 洞穿能量壁垒',
  },
]

const eraStates = [
  {
    sectorBadge: '初代本篇 · 已联网：1 / 3 星域',
    dlcBadge: '内层同心晶环：休眠未醒（余量 0）',
    unlockedSlots: 0,
    summary: '初代本篇（罗伊与罗娅）：外圈 9 道纳米齿槽全部烧满，聚齐内环五大种族初代十人后结契次数彻底归零，终章点燃归航号驶向断联黑域。',
  },
  {
    sectorBadge: '资料片一 · 已联网：2 / 3 星域',
    dlcBadge: '内层一环苏醒：裂解 +3 道新齿槽',
    unlockedSlots: 3,
    summary: '资料片一（达罗二代传人）：横渡数十年黑域重燃首座断联主炽环门，母币沐浴原初炉心辐射唤醒内层第一圈晶环，裂解出 3 道新齿槽并解锁门后新种族！',
  },
  {
    sectorBadge: '资料片二 · 已联网：3 / 3 星域',
    dlcBadge: '深层晶环苏醒：累计 +6 道新齿槽',
    unlockedSlots: 6,
    summary: '资料片二（历代达罗舰队）：多座星门跨世代重燃，长生机魂元老坐镇外圈九齿旗舰核心，历代新伙伴刻入内层同心晶环，集结星环总舰队决战噬环天灾。',
  },
]

const shortSlotNames: Record<string, string> = {
  'gold-hunter': '子母双片',
  bunny: '01 邦妮',
  crew: '02 克露丝',
  gunman: '03 冈纳',
  doge: '04 多吉',
  mew: '05 弥羽',
  angel: '06 安洁',
  samurai: '07 久藏',
  robot: '08 罗克',
  wizard: '09 维琳',
}

const slotOrderIds = ['gold-hunter', 'bunny', 'crew', 'gunman', 'doge', 'mew', 'angel', 'samurai', 'robot', 'wizard']

const foundingSlots = computed(() => {
  const byId = Object.fromEntries(site.roster.map((entry) => [entry.id, entry]))
  const ordered = slotOrderIds.map((id) => byId[id]).filter(Boolean)
  const listToUse = ordered.length === 10 ? ordered : site.roster.slice(0, 10)
  return listToUse.map((entry, idx) => ({
    id: entry.id,
    home: entry.home,
    isMaster: idx === 0,
    shortLabel: shortSlotNames[entry.id] ?? entry.name.split('·')[0],
    fullName: entry.name,
  }))
})

const currentPartner = computed(() => combatPartners[activePartnerIdx.value])
const currentEra = computed(() => eraStates[activeEra.value])

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
    <!-- DIAGRAM 04: CAST VS DISPATCH & 3 LOCKS -->
    <section class="coin-viz-box" aria-label="单币双轨运作与抛币正反面交互图解">
      <header class="coin-viz-box__head">
        <div>
          <span class="coin-viz-box__eyebrow">INTERACTIVE DIAGRAM 04</span>
          <h3 class="coin-viz-box__title">唯一母币的两种战法：拆开「激活空白齿槽」与「搓齿定向点将」</h3>
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
            01 招新伙伴 · 激活空白齿槽
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeTab === 1"
            class="coin-viz-tab"
            :class="{ 'is-active': activeTab === 1 }"
            @click="activeTab = 1"
          >
            02 战时调遣 · 搓齿抛币赌正反
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

      <!-- TAB 0: BLANK NOTCH FORGING -->
      <div v-if="activeTab === 0" class="coin-viz-body">
        <div class="coin-step-grid">
          <div class="coin-step-card">
            <div class="coin-step-card__meta">
              <b>STEP 01</b>
              <span>消耗一齿</span>
            </div>
            <svg class="coin-step-svg" viewBox="0 0 120 60" aria-hidden="true">
              <circle cx="60" cy="30" r="21" fill="none" stroke="var(--bunny-orange)" stroke-width="2.5" />
              <circle cx="60" cy="9" r="4.5" fill="var(--bunny-paper)" stroke="var(--bunny-ink)" stroke-width="2" />
              <text x="60" y="34" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bunny-orange)">OG</text>
            </svg>
            <h4>唤醒一道空白纳米齿槽</h4>
            <p>注入破局特质渴求并将母币抛空，主动放弃筛选星系与物种形态。</p>
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
            <h4>投射跨空金光虚影</h4>
            <p>借随机概率等价法则，母币顺着当前天线覆盖网投出量子金光虚影。</p>
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
            <p>无视体型与出身，金影专挑射程内拒绝屈从命运剧本的极致特质者悬停。</p>
          </div>

          <div class="coin-step-card coin-step-card--highlight">
            <div class="coin-step-card__meta">
              <b>STEP 04</b>
              <span>齿槽定型</span>
            </div>
            <svg class="coin-step-svg" viewBox="0 0 120 60" aria-hidden="true">
              <circle cx="60" cy="30" r="21" fill="none" stroke="var(--coin-green)" stroke-width="2.5" />
              <circle cx="60" cy="9" r="4.5" fill="var(--coin-green)" />
              <text x="60" y="34" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bunny-ink)">定型</text>
            </svg>
            <h4>触影立契 = 烧结专属齿槽</h4>
            <p>对方自愿触碰金影即烙下 OG 子契印，母币该格齿槽永久绑定其波谱！</p>
          </div>
        </div>

        <div class="coin-trait-bar">
          <div class="coin-trait-bar__pills">
            <span class="coin-trait-bar__label">点击查看异族盲盒实例：</span>
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
            <p class="coin-panel-kicker">第一步 · 拇指搓动对应币齿（百分百定向，绝不叫错人）</p>
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
            <p class="coin-panel-kicker">第二步 · 抛起母币判定正反态</p>
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
              抛币调遣「{{ currentPartner.name }}」
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
              <small>代价：执币人承受神经元灼烧负荷，战后该道币齿进入过热冷却期。</small>
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
            <p>同伴同船参战不占带宽；跨星门异地折跃初期同场限维持 <b>2 至 3 道</b>子契印。黑域屏蔽区无法凭空开门，须由克露丝架设中继环、邦妮潜入破除干扰。</p>
          </article>

          <article class="coin-lock-card">
            <div class="coin-step-card__meta">
              <b>防崩锁 02</b>
              <span>杜绝单线瘫痪</span>
            </div>
            <svg class="coin-lock-svg" viewBox="0 0 200 44" aria-hidden="true">
              <circle cx="52" cy="22" r="16" fill="none" stroke="var(--bunny-ink)" stroke-width="2.2" />
              <text x="52" y="26" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bunny-ink)">阳片</text>
              <line x1="78" y1="22" x2="122" y2="22" stroke="var(--bunny-orange)" stroke-width="2" stroke-dasharray="4 3" />
              <circle cx="148" cy="22" r="16" fill="none" stroke="var(--bunny-orange)" stroke-width="2.2" />
              <text x="148" y="26" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bunny-orange)">阴片</text>
            </svg>
            <h4>单片可战 · 双片开疆</h4>
            <p>母币旋开后阳片与阴片同源纠缠，<b>单片即可独立调遣全部老队友</b>，分兵历险绝不瘫痪；唯有跨光年激活新齿槽或开启舰队级星门时，方需双片合鸣。</p>
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
              <text x="144" y="26" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bunny-red)">三拒散</text>
            </svg>
            <h4>只锁召集 · 不控心智</h4>
            <p>子契印保有伙伴百分百独立人格与私生活；双方凭对赌信诺同行，若契印发烫连续拒召满 <b>3 次</b> 或自愿解契，印记自动消散、星环庇护同步失效。</p>
          </article>
        </div>
      </div>
    </section>

    <!-- DIAGRAM 05: EXPANSION STAR MAP & INNER CRYSTAL RINGS -->
    <section class="coin-viz-box" aria-label="资料片星门淬炼扩容交互图解">
      <header class="coin-viz-box__head">
        <div>
          <span class="coin-viz-box__eyebrow">INTERACTIVE DIAGRAM 05</span>
          <h3 class="coin-viz-box__title">资料片跨世代扩容：燃门辐射唤醒内层晶环、达罗传人接力</h3>
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
            本篇 · 初代九齿满格
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeEra === 1"
            class="coin-viz-tab"
            :class="{ 'is-active': activeEra === 1 }"
            @click="activeEra = 1"
          >
            资料片一 · 二代燃门醒环
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeEra === 2"
            class="coin-viz-tab"
            :class="{ 'is-active': activeEra === 2 }"
            @click="activeEra = 2"
          >
            资料片二 · 历代星环舰队
          </button>
        </div>
      </header>

      <div class="coin-viz-body coin-map-grid">
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

            <g>
              <circle cx="96" cy="100" r="48" fill="var(--bunny-paper)" stroke="var(--bunny-orange)" stroke-width="3" />
              <circle cx="96" cy="100" r="38" fill="none" stroke="var(--bunny-ink)" stroke-width="1.4" stroke-dasharray="5 3" />
              <text x="96" y="96" text-anchor="middle" font-size="13" font-weight="700" fill="var(--bunny-ink)">白塔内环星域</text>
              <text x="96" y="114" text-anchor="middle" font-size="12" font-weight="600" fill="var(--bunny-orange)">五大种族在线</text>
            </g>

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
              <text x="346" y="46" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--bunny-ink)">外环一号星门</text>
              <text
                x="346"
                y="64"
                text-anchor="middle"
                font-size="12"
                font-weight="600"
                :fill="activeEra >= 1 ? 'var(--coin-green)' : 'var(--bunny-ink-2)'"
              >
                {{ activeEra >= 1 ? '唤醒内环 +3齿' : '断网黑障' }}
              </text>
            </g>

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
              <text x="352" y="142" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--bunny-ink)">深空远端星门</text>
              <text
                x="352"
                y="160"
                text-anchor="middle"
                font-size="12"
                font-weight="600"
                :fill="activeEra >= 2 ? 'var(--coin-green)' : 'var(--bunny-ink-2)'"
              >
                {{ activeEra >= 2 ? '唤醒内环 +3齿' : '断网黑障' }}
              </text>
            </g>
          </svg>

          <p class="coin-map-stage__caption">{{ currentEra.summary }}</p>
        </div>

        <div class="coin-vault-col">
          <div class="coin-vault-card">
            <div class="coin-vault-card__head">
              <b>母币外圈九道齿槽（按入队序 · 旗舰元老席）</b>
              <span>点击跳转档案</span>
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
              <b>母币深层同心晶环（资料片后裔扩容齿）</b>
              <span>{{ currentEra.dlcBadge }}</span>
            </div>
            <div class="coin-slot-grid coin-slot-grid--six">
              <div
                v-for="n in 6"
                :key="n"
                class="coin-slot coin-slot--dlc"
                :class="{ 'is-unlocked': n <= currentEra.unlockedSlots }"
              >
                {{ n <= currentEra.unlockedSlots ? `新齿 0${n}` : '休眠中' }}
              </div>
            </div>
          </div>

          <div class="coin-vault-card coin-vault-card--rule">
            <p class="coin-rule-title">燃门淬炼扩容原理（维琳与克露丝破译）</p>
            <p class="coin-rule-desc">
              单枚母币外圈 9 齿锁满后，唯有沐浴<b>断联主炽环门重燃瞬间的原初炉心辐射</b>，夹层深处的同心晶环才会裂解出新齿槽，同步把门后新种族并入共鸣池。
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
