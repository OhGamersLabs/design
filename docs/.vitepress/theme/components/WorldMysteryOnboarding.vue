<script setup lang="ts">
import { computed, ref } from 'vue'

const activeMystery = ref(0)
const activeOnboarding = ref(0)

const mysteryStages = [
  {
    cap: '肉眼视角：印着 OG 字样的黄铜街机代币',
    badge: '探测仪读数：0.00（灯下黑）',
    title: '谜题 01 · 十年灯下黑：只有外层人类铜壳才是「OG 街机币」',
    how: '父母提前给先驱无字「炽环母核」裹上惰性屏蔽黄铜皮，压印成廉价的「OhGamers（OG）街机游戏代币」，骗过叛徒索伦十年前的亲自搜身。兄妹俩十年间拿它当普通护身铜板，养成凡事抛正反拍板的习惯。',
    solve: '为何十年抛掷上千次皆无异象？因黄铜外皮隔绝了一切辐射！直至首战撞上财团高功率「锁印伪币」共振裂壳，显露出内部无字无槽的铂乌镜面母核；克露丝随即把裂开的 OG 黄铜皮精工重塑为卡扣式屏蔽暗壳，供日常合壳防雷达锁定。',
    foot: '一石三鸟：同时圆死「十年为何没被抢」、「为何只有外皮印 OG」与「为何立绘腰匣平时仍露金黄 OG 币面」。',
  },
  {
    cap: '克露丝高倍相干干涉仪 · 原子级透视',
    badge: '浅层活跃晶胞：共 9 颗（余 7）',
    title: '谜题 02 · 表层浑然无孔：容量深藏内部「高维准晶点阵」',
    how: '母核表层光滑无缝、不设任何外露凹槽或发光刻度；直至克露丝将探测波打入母核内部，全员看着干涉仪屏幕倒吸一口凉气——',
    solve: '看似死寂的圆盘内部竟悬浮着亿万高维准晶胞！因断环后零点能枯竭，初始仅有浅层九颗晶胞处于活跃态（连上邦妮与克露丝后已绑定两颗，仅余七次初始额度）。战时凭执核人拇指弹击的生物电谐振频率即可精准唤醒对应伙伴的晶胞！',
    foot: '高维极简造物：表层不留任何固定槽位痕迹，机制全藏于微观晶格，为后续资料片留出无限扩容空间。',
  },
  {
    cap: '归航号舰桥半深凹槽实验 · 阴阳分核',
    badge: '对齐双人立绘：各配半副 OG 壳',
    title: '谜题 03 · 暗缝旋开：无痕圆核拧成阴阳双片，各覆半副屏蔽铜盖',
    how: '天秤财团焊死本地频段围剿暗礁，克露丝脱去铜壳将母核按入归航号舰桥主控台的远古圆槽，却惊觉凹槽深度只有母核厚度的一半！',
    solve: '千钧一发之际兄妹合力一拧，十年来连刀片都插不进暗缝的浑然母核竟沿原子级相位面旋开为「开拓阳核」与「锚定阴核」；克露丝同步将 OG 黄铜壳对半制成两只屏蔽护套——兄妹分佩角色右腰磁吸匣时，匣口外露依然皆为金黄 OG 币面！',
    foot: '严丝合缝：既确立了从小只有唯一一枚信物，又完整解释了兄妹双人造型各自角色右腰磁吸匣均插有 OG 金币的来由。',
  },
  {
    cap: '维琳无损高能透视 · 深层休眠准晶群',
    badge: '扩容零外观负担：燃门辐射相变',
    title: '谜题 04 · 无限扩容：重燃星门唤醒深层晶胞，外观万古不变',
    how: '当浅层九颗活跃晶胞随第九位同伴维琳入列而全部绑定，母核初始结契额度彻底归零。',
    solve: '精通高维能谱的硅碳学者维琳与克露丝联手深度透视，证实母核深处仍沉睡着成百上千颗未激活的准晶胞——常规电力丝毫无用，唯有抵近熄灭断联的主炽环门、沐浴星门重燃瞬间的原初炉心辐射，深层晶胞便会成片相变苏醒！',
    foot: '无限扩展闭环：无论未来资料片横跨多少世代、接纳多少位新同伴，母核极简纯粹的外观永远无需改动丝毫。',
  },
]

const onboardingSteps = [
  {
    rangeBadge: '共鸣半径：数公里（同港区）',
    radarCaption: '无外接天线 · 肉身裸抛',
    title: '新手第 01 步（同港区）：邦妮 · 肉眼可见的初醒',
    why: '为何只飞这么近：开局未搭接任何中继设备，仅凭罗伊手抛的自然感应半径，只能扫过同一座索道港区的邻近街区。',
    plot: '揭秘职责：兄妹在摩天索道遭财团堵截，本能弹出刚被伪币撞裂铜壳的信物——金光虚影拐过两条街被跑酷经过的邦妮抄住，当场揭秘「触影立契 + 正面视野共链」。',
    foot: '认知一阶：此时三人以为这枚奇物只是个能在附近几条街找帮手的近距战术信标。',
  },
  {
    rangeBadge: '共鸣半径：千万公里（跨轨道卫星）',
    radarCaption: '搭接暗礁残破轨道信标',
    title: '新手第 02 步（不同卫星）：克露丝 · 首次跨空间拉人与干涉仪破译',
    why: '为何射程变远了：三人退回零九号暗礁面对瘫痪的归航号束手无策，罗伊尝试将母核贴在暗礁残存的区间轨道信标上再弹一次，搜索半径跃升至邻近工业卫星！',
    plot: '揭秘职责：金影飞入三号船坞工业卫星落在克露丝台面，触碰瞬间将她跨深空折跃拉至暗礁！首次揭秘「空间折跃召遣」，并由克露丝重塑 OG 屏蔽壳、以干涉仪测出内部浅层九颗活跃晶胞。',
    foot: '认知二阶：四人小班底成型，但大家仍以为母核顶多只能在白塔星域内部寻找人类同胞。',
  },
  {
    rangeBadge: '共鸣半径：数百光年（跨恒星系破壁）',
    radarCaption: '强接归航号主天线 + 阴阳双核合鸣',
    title: '正轨破壁战（封网危机触发）：冈纳 · 跨百光年神兵天降！',
    why: '危机如何逼出远距：天秤财团重甲队合围暗礁，并彻底焊死白塔星域全部本地轨道频段，断绝在星域内摇人的可能！',
    plot: '破壁高潮：绝境下克露丝强行接通归航号舰桥第一层远古天线，兄妹首次拧开阴阳双核合鸣，将第三道金影轰入主炽环门波段——跨越数百光年砸在北境边防要塞星冈纳枪前！重装老兵踏火降临一枪轰碎包围网。',
    foot: '新手村正式毕业：全员震骇意识到——只要天线功率足够，这枚母核竟能跨越光年连向全宇宙！',
  },
  {
    rangeBadge: '共鸣半径：全内环航网（跨物种盲盒）',
    radarCaption: '主炽环航网全频段洞开',
    title: '全面进入正轨（第 04 至 09 席）：非人异族盲盒大爆发！',
    why: '认知彻底颠覆：接入主炽环航网后，母核脱离人类聚居圈限制，开始纯粹按「灵魂特质波长」在浩瀚星海锁定异类！',
    plot: '反差名场面：紧接着第四席罗伊本想再摇一位像冈纳那样的人类重装巨汉，结果折跃光柱里摇摇晃晃走出一只戴毛线帽的两头身小柴犬（多吉）——全队傻眼三秒后，小柴犬展开成七头身双盾重坦硬接主炮！随后弥羽、安洁、久藏、罗克、维琳依次跨星域入列。',
    foot: '节奏闭环：同港邦妮 → 跨卫克露丝 → 危机破壁冈纳 → 柴犬多吉引爆异族狂欢，层层递进毫无断档。',
  },
]

const currentMystery = computed(() => mysteryStages[activeMystery.value])
const currentStep = computed(() => onboardingSteps[activeOnboarding.value])
</script>

<template>
  <div class="coin-viz-stack">
    <!-- DIAGRAM 03: REVERSE-ENGINEERING THE SINGLE RELIC -->
    <section class="coin-viz-box" aria-label="唯一传家信物四步科学逆向解谜交互图解">
      <header class="coin-viz-box__head">
        <div>
          <span class="coin-viz-box__eyebrow">INTERACTIVE DIAGRAM 03</span>
          <h3 class="coin-viz-box__title">凡物藏神技：从小抛正反的「唯一街机币」如何被一步步科学破译</h3>
        </div>
        <div class="coin-viz-tabs" role="tablist" aria-label="母核逆向解谜四步切换">
          <button
            type="button"
            role="tab"
            :aria-selected="activeMystery === 0"
            class="coin-viz-tab"
            :class="{ 'is-active': activeMystery === 0 }"
            @click="activeMystery = 0"
          >
            01 铜皮伪装与暗壳
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeMystery === 1"
            class="coin-viz-tab"
            :class="{ 'is-active': activeMystery === 1 }"
            @click="activeMystery = 1"
          >
            02 干涉仪测晶格
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeMystery === 2"
            class="coin-viz-tab"
            :class="{ 'is-active': activeMystery === 2 }"
            @click="activeMystery = 2"
          >
            03 危机旋开双核
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeMystery === 3"
            class="coin-viz-tab"
            :class="{ 'is-active': activeMystery === 3 }"
            @click="activeMystery = 3"
          >
            04 燃门相变扩容
          </button>
        </div>
      </header>

      <div class="coin-viz-body coin-map-grid">
        <div class="coin-map-stage">
          <div class="coin-map-stage__top">
            <b>{{ currentMystery.cap }}</b>
            <span>{{ currentMystery.badge }}</span>
          </div>

          <!-- Stage 0 SVG -->
          <svg v-if="activeMystery === 0" class="coin-map-svg" viewBox="0 0 360 164" aria-hidden="true">
            <circle cx="180" cy="76" r="52" fill="var(--bunny-paper)" stroke="var(--bunny-orange)" stroke-width="3.2" />
            <circle cx="180" cy="76" r="42" fill="none" stroke="var(--bunny-ink-3)" stroke-width="1.4" stroke-dasharray="3 3" />
            <text x="180" y="84" text-anchor="middle" font-size="22" font-weight="700" fill="var(--bunny-orange)">OG</text>
            <text x="180" y="150" text-anchor="middle" font-size="12.5" font-weight="600" fill="var(--bunny-ink-2)">
              外覆人类 OG 黄铜屏蔽壳 · 合壳潜伏归零，弹壳显露无字神核
            </text>
          </svg>

          <!-- Stage 1 SVG: Internal Quasicrystal Lattice (NO surface notches!) -->
          <svg v-else-if="activeMystery === 1" class="coin-map-svg" viewBox="0 0 360 164" aria-hidden="true">
            <rect x="64" y="14" width="232" height="118" rx="6" fill="var(--bunny-fabric)" stroke="var(--bunny-ink)" stroke-width="1.8" />
            <circle cx="180" cy="73" r="44" fill="var(--bunny-paper)" stroke="var(--bunny-ink)" stroke-width="2.4" />
            <circle cx="180" cy="73" r="30" fill="none" stroke="var(--bunny-ink-3)" stroke-width="1.2" stroke-dasharray="2 3" />
            <circle cx="180" cy="73" r="16" fill="none" stroke="var(--bunny-ink-3)" stroke-width="1.2" stroke-dasharray="2 3" />
            <circle cx="162" cy="52" r="4" fill="var(--coin-green)" />
            <circle cx="201" cy="57" r="4" fill="var(--coin-green)" />
            <circle cx="194" cy="94" r="3.5" fill="var(--bunny-orange)" />
            <circle cx="154" cy="86" r="3.5" fill="var(--bunny-orange)" />
            <text x="180" y="152" text-anchor="middle" font-size="12.5" font-weight="600" fill="var(--coin-green)">
              表层光滑零凹槽 · 唯干涉仪屏幕可见内部活跃准晶胞
            </text>
          </svg>

          <!-- Stage 2 SVG: Split Interlocking Halves -->
          <svg v-else-if="activeMystery === 2" class="coin-map-svg" viewBox="0 0 360 164" aria-hidden="true">
            <ellipse cx="122" cy="74" rx="44" ry="50" fill="var(--bunny-paper)" stroke="var(--bunny-ink)" stroke-width="2.8" />
            <text x="122" y="70" text-anchor="middle" font-size="14" font-weight="700" fill="var(--bunny-ink)">开拓阳核</text>
            <text x="122" y="90" text-anchor="middle" font-size="12" fill="var(--bunny-ink-2)">罗伊角色右腰匣</text>

            <line x1="168" y1="58" x2="192" y2="58" stroke="var(--bunny-orange)" stroke-width="2.2" class="coin-dash-anim" />
            <line x1="168" y1="90" x2="192" y2="90" stroke="var(--bunny-orange)" stroke-width="2.2" class="coin-dash-anim" />

            <ellipse cx="238" cy="74" rx="44" ry="50" fill="var(--bunny-paper)" stroke="var(--bunny-orange)" stroke-width="2.8" />
            <text x="238" y="70" text-anchor="middle" font-size="14" font-weight="700" fill="var(--bunny-orange)">锚定阴核</text>
            <text x="238" y="90" text-anchor="middle" font-size="12" fill="var(--bunny-ink-2)">罗娅角色右腰匣</text>

            <text x="180" y="150" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--bunny-orange)">
              沿原子无痕暗缝旋开阴阳双核 · 各自外覆半副 OG 屏蔽壳！
            </text>
          </svg>

          <!-- Stage 3 SVG: Deep Quasicrystal Phase Awakening -->
          <svg v-else class="coin-map-svg" viewBox="0 0 360 164" aria-hidden="true">
            <circle cx="180" cy="74" r="52" fill="var(--bunny-paper)" stroke="var(--bunny-ink)" stroke-width="2.2" />
            <circle cx="180" cy="74" r="36" fill="none" stroke="var(--coin-green)" stroke-width="2.4" class="coin-dash-anim" />
            <circle cx="180" cy="74" r="20" fill="none" stroke="var(--bunny-orange)" stroke-width="2" stroke-dasharray="3 3" />
            <text x="180" y="78" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--coin-green)">深层晶胞相变</text>
            <text x="180" y="150" text-anchor="middle" font-size="12.5" font-weight="600" fill="var(--coin-green)">
              沐浴主炽环门重燃辐射 → 深层晶胞成片苏醒，母核外观永不改变！
            </text>
          </svg>
        </div>

        <div class="coin-vault-col">
          <div class="coin-vault-card">
            <p class="coin-rule-title">{{ currentMystery.title }}</p>
            <p class="coin-rule-desc">{{ currentMystery.how }}</p>
            <p class="coin-rule-desc world-mt-sm">{{ currentMystery.solve }}</p>
          </div>
          <div class="coin-vault-card coin-vault-card--rule">
            <p class="coin-rule-desc"><b>核心设计意图：</b>{{ currentMystery.foot }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- DIAGRAM 04: 3-STAGE ONBOARDING ROCKET -->
    <section class="coin-viz-box" aria-label="新手村三级跳射程递进交互图解">
      <header class="coin-viz-box__head">
        <div>
          <span class="coin-viz-box__eyebrow">INTERACTIVE DIAGRAM 04</span>
          <h3 class="coin-viz-box__title">开篇射程三级跳：从同港初醒、跨卫星修船到封网危机跨百光年破壁</h3>
        </div>
        <div class="coin-viz-tabs" role="tablist" aria-label="开篇射程递进切换">
          <button
            type="button"
            role="tab"
            :aria-selected="activeOnboarding === 0"
            class="coin-viz-tab"
            :class="{ 'is-active': activeOnboarding === 0 }"
            @click="activeOnboarding = 0"
          >
            第 01 席 · 同港邦妮
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeOnboarding === 1"
            class="coin-viz-tab"
            :class="{ 'is-active': activeOnboarding === 1 }"
            @click="activeOnboarding = 1"
          >
            第 02 席 · 跨卫克露丝
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeOnboarding === 2"
            class="coin-viz-tab"
            :class="{ 'is-active': activeOnboarding === 2 }"
            @click="activeOnboarding = 2"
          >
            第 03 席 · 百光年冈纳
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeOnboarding === 3"
            class="coin-viz-tab"
            :class="{ 'is-active': activeOnboarding === 3 }"
            @click="activeOnboarding = 3"
          >
            第 04 至 09 席 · 异族全开
          </button>
        </div>
      </header>

      <div class="coin-viz-body coin-map-grid">
        <div class="coin-map-stage">
          <div class="coin-map-stage__top">
            <b>白塔星域至全星海 · 谐振射程雷达</b>
            <span>{{ currentStep.rangeBadge }}</span>
          </div>

          <svg class="coin-map-svg" viewBox="0 0 360 172" aria-hidden="true">
            <circle
              cx="180"
              cy="82"
              r="74"
              fill="none"
              :stroke="activeOnboarding === 3 ? 'var(--coin-green)' : 'var(--bunny-rule-strong)'"
              :stroke-width="activeOnboarding === 3 ? 3 : 1.4"
              :stroke-dasharray="activeOnboarding === 3 ? undefined : '4 4'"
            />
            <circle
              cx="180"
              cy="82"
              r="52"
              fill="none"
              :stroke="activeOnboarding === 2 ? 'var(--bunny-orange)' : (activeOnboarding > 2 ? 'var(--bunny-ink-3)' : 'var(--bunny-rule-strong)')"
              :stroke-width="activeOnboarding === 2 ? 3 : 1.4"
              :stroke-dasharray="activeOnboarding >= 2 ? undefined : '4 4'"
            />
            <circle
              cx="180"
              cy="82"
              r="32"
              fill="none"
              :stroke="activeOnboarding === 1 ? 'var(--bunny-ink)' : (activeOnboarding > 1 ? 'var(--bunny-ink-3)' : 'var(--bunny-rule-strong)')"
              :stroke-width="activeOnboarding === 1 ? 3 : 1.4"
              :stroke-dasharray="activeOnboarding >= 1 ? undefined : '4 4'"
            />
            <circle
              cx="180"
              cy="82"
              r="14"
              fill="none"
              :stroke="activeOnboarding === 0 ? 'var(--bunny-orange)' : 'var(--bunny-ink-3)'"
              :stroke-width="activeOnboarding === 0 ? 3 : 1.6"
            />
            <circle cx="180" cy="82" r="5" fill="var(--bunny-orange)" />
            <text x="180" y="166" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--bunny-ink)">
              {{ currentStep.radarCaption }}
            </text>
          </svg>
        </div>

        <div class="coin-vault-col">
          <div class="coin-vault-card">
            <p class="coin-rule-title">{{ currentStep.title }}</p>
            <p class="coin-rule-desc">{{ currentStep.why }}</p>
            <p class="coin-rule-desc world-mt-sm">{{ currentStep.plot }}</p>
          </div>
          <div class="coin-vault-card coin-vault-card--rule">
            <p class="coin-rule-desc"><b>叙事递进：</b>{{ currentStep.foot }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
