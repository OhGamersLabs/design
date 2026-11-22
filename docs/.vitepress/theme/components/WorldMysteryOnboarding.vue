<script setup lang="ts">
import { computed, ref } from 'vue'

const activeMystery = ref(0)
const activeOnboarding = ref(0)

const mysteryStages = [
  {
    cap: '肉眼视角：裹着街机厅黄铜皮的寻常铜板',
    badge: '探测仪读数：0.00（灯下黑）',
    title: '谜题 01 · 十年灯下黑：伪装成「OhGamers 街机币」骗过反派搜身',
    how: '父母提前给唯一真母币（Orbit Gate）裹上惰性屏蔽黄铜皮，压成廉价的「OhGamers 街机游戏代币」，骗过叛徒索伦十年前的亲自搜身。兄妹俩十年间拿它当普通护身铜板，养成凡事抛正反拍板的习惯。',
    solve: '为何十年抛掷上千次皆无异象？因黄铜外皮隔绝了一切辐射！直至日复一日把外皮磨薄，又在首战撞上财团高功率「锁印伪币」共振，铜皮轰然崩裂露出真金内核，罗伊随手一弹竟连上了数条街外的邦妮！',
    foot: '一石三鸟：同时圆死「十年为何没被抢」、「为何前十年没反应」与「OhGamers 名字双关由来」。',
  },
  {
    cap: '克露丝工业电子显微镜 · 放大一万倍',
    badge: '破译初始额度：共 9 齿（余 7）',
    title: '谜题 02 · 放大一万倍：币边「防滑滚花齿纹」实为九道纳米超导槽',
    how: '借暗礁残破信标意外将三号船坞卫星的工程师克露丝折跃拉来后，克露丝将这枚看似寻常的金币塞进工业电子显微镜，全员倒吸一口凉气——',
    solve: '硬币边缘那圈看似防滑的普通齿轮纹，放大一万倍后竟是九段精密的纳米超导晶槽！连上邦妮与克露丝后已有两格烧结常亮（并在队友随身装备投射出量子子契印），初始仅余最后七次结契机会，盲目乱抛一次便少一格！',
    foot: '单币统御全队：真币自始至终只有这一枚！战时拇指轻搓对应币齿即可定向点名已结契伙伴。',
  },
  {
    cap: '归航号舰桥半深凹槽实验 · 子母旋开',
    badge: '对齐双人立绘：阳阴双片',
    title: '谜题 03 · 子母旋开：陪伴十年的唯一厚币，沿原子暗缝拧成两片',
    how: '天秤财团焊死本地频段围剿暗礁，克露丝将硬币按入归航号舰桥主控台的远古圆槽，却惊觉凹槽深度只有硬币厚度的一半！',
    solve: '千钧一发之际兄妹合力一拧，十年来以为实心一体的厚金币竟沿肉眼不可见的原子级咬合缝旋开为两片：阴片镇守舰桥稳住坐标（日常归妹妹罗娅角色右腰磁吸匣），阳片由罗伊抛空轰入主星门波段（日常归哥哥罗伊角色右腰磁吸匣）！',
    foot: '严丝合缝：既确立了从小只有唯一一枚硬币，又完整解释了兄妹双人造型中各自角色右腰磁吸匣均插有一枚金币的来由。',
  },
  {
    cap: '维琳无损高能透视 · 深层休眠同心晶环',
    badge: '破译扩容条件：燃门辐射淬炼',
    title: '谜题 04 · 次数怎么加：内层潜藏休眠晶环，唯星门重燃辐射可唤醒',
    how: '当外圈九道纳米齿槽随第九位同伴维琳入列而全部烧满，母币结契次数彻底归零锁死。',
    solve: '精通高维能谱的硅碳学者维琳与克露丝联手对子母双片进行无损透视，发现硬币夹层深处还潜藏着多圈未激活的同心晶环——常规电力丝毫无用，唯有抵近熄灭断联的主炽环门、沐浴星门重燃瞬间的原初炉心辐射，内层晶环方会裂解出二至三道全新齿槽！',
    foot: '远征驱动力闭环：从探索用法、发现九格上限到破译燃门扩容，全程由科学观察与试错推演驱动。',
  },
]

const onboardingSteps = [
  {
    rangeBadge: '共鸣半径：数公里（同港区）',
    radarCaption: '无外接天线 · 肉身裸抛',
    title: '新手第 01 步（同港区）：邦妮 · 肉眼可见的初醒',
    why: '为何只飞这么近：开局未搭接任何中继设备，仅凭罗伊手抛的自然感应半径，只能扫过同一座索道港区的邻近街区。',
    plot: '揭秘职责：兄妹在摩天索道遭财团堵截，本能弹出刚被伪币撞醒的纪念币——金光虚影拐过两条街被跑酷经过的邦妮抄住，当场揭秘「触影立契 + 正面视野共链」。',
    foot: '认知阶段一：此时三人以为这枚硬币只是个能在附近几条街找帮手的近距战术奇物。',
  },
  {
    rangeBadge: '共鸣半径：千万公里（跨轨道卫星）',
    radarCaption: '搭接暗礁残破轨道信标',
    title: '新手第 02 步（不同卫星）：克露丝 · 首次跨空间拉人与电镜破译',
    why: '为何射程变远了：三人退回零九号暗礁面对瘫痪的归航号束手无策，罗伊尝试将硬币贴在暗礁残存的区间轨道信标上再弹一次，搜索半径跃升至邻近工业卫星！',
    plot: '揭秘职责：金影飞入三号船坞工业卫星落在克露丝台面，触碰瞬间将她跨深空折跃拉至暗礁！首次揭秘「空间折跃召遣」，并由克露丝用电镜破译出币边九道纳米齿槽。',
    foot: '认知阶段二：四人小班底成型，但大家仍以为硬币顶多只能在白塔星域内部寻找人类同胞。',
  },
  {
    rangeBadge: '共鸣半径：数百光年（跨恒星系破壁）',
    radarCaption: '强接归航号主天线 + 阳阴双片合鸣',
    title: '正轨破壁战（封网危机触发）：冈纳 · 跨百光年神兵天降！',
    why: '危机如何逼出远距：天秤财团重甲队合围暗礁，并彻底焊死白塔星域全部本地轨道频段，断绝在星域内摇人的可能！',
    plot: '破壁高潮：绝境下克露丝强行接通归航号舰桥第一层远古天线，兄妹首次拧开阳阴双片合鸣，将第三道金影轰入主炽环门波段——跨越数百光年砸在北境边防要塞星冈纳枪前！重装老兵踏火降临一枪轰碎包围网。',
    foot: '新手村正式毕业：全员震骇意识到——只要天线功率足够，这枚硬币竟能跨越光年连向全宇宙！',
  },
  {
    rangeBadge: '共鸣半径：全内环航网（跨物种盲盒）',
    radarCaption: '主炽环航网全频段洞开',
    title: '全面进入正轨（第 04 至 09 齿槽）：非人异族盲盒大爆发！',
    why: '认知彻底颠覆：接入主炽环航网后，硬币脱离人类聚居圈限制，开始纯粹按「灵魂特质波长」在浩瀚星海锁定异类！',
    plot: '反差名场面：紧接着第四格罗伊本想再摇一位像冈纳那样的人类重装巨汉，结果折跃光柱里摇摇晃晃走出一只戴毛线帽的两头身小柴犬（多吉）——全队傻眼三秒后，小柴犬展开成七头身双盾重坦硬接主炮！随后弥羽、安洁、久藏、罗克、维琳依次跨星域入列。',
    foot: '节奏闭环：同港邦妮 → 跨卫克露丝 → 危机破壁冈纳 → 柴犬多吉引爆异族狂欢，层层递进毫无断档。',
  },
]

const currentMystery = computed(() => mysteryStages[activeMystery.value])
const currentStep = computed(() => onboardingSteps[activeOnboarding.value])
</script>

<template>
  <div class="coin-viz-stack">
    <!-- DIAGRAM 02: REVERSE-ENGINEERING THE SINGLE COIN -->
    <section class="coin-viz-box" aria-label="唯一传家纪念币四步逆向解谜交互图解">
      <header class="coin-viz-box__head">
        <div>
          <span class="coin-viz-box__eyebrow">INTERACTIVE DIAGRAM 02</span>
          <h3 class="coin-viz-box__title">凡物藏神技：从小抛正反的「唯一纪念币」如何被一步步科学破译</h3>
        </div>
        <div class="coin-viz-tabs" role="tablist" aria-label="硬币逆向解谜四阶段切换">
          <button
            type="button"
            role="tab"
            :aria-selected="activeMystery === 0"
            class="coin-viz-tab"
            :class="{ 'is-active': activeMystery === 0 }"
            @click="activeMystery = 0"
          >
            01 十年凡物习惯
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeMystery === 1"
            class="coin-viz-tab"
            :class="{ 'is-active': activeMystery === 1 }"
            @click="activeMystery = 1"
          >
            02 电镜破译九齿
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeMystery === 2"
            class="coin-viz-tab"
            :class="{ 'is-active': activeMystery === 2 }"
            @click="activeMystery = 2"
          >
            03 危机旋开双片
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeMystery === 3"
            class="coin-viz-tab"
            :class="{ 'is-active': activeMystery === 3 }"
            @click="activeMystery = 3"
          >
            04 透视内环扩容
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
            <text x="180" y="83" text-anchor="middle" font-size="22" font-weight="700" fill="var(--bunny-orange)">OG</text>
            <text x="180" y="150" text-anchor="middle" font-size="12.5" font-weight="600" fill="var(--bunny-ink-2)">
              十年抛掷上千次皆处于惰性休眠态 · 直至被伪币高频场撞醒
            </text>
          </svg>

          <!-- Stage 1 SVG: 9 Micro-Notches -->
          <svg v-else-if="activeMystery === 1" class="coin-map-svg" viewBox="0 0 360 164" aria-hidden="true">
            <circle cx="180" cy="74" r="46" fill="var(--bunny-paper)" stroke="var(--bunny-ink)" stroke-width="2" />
            <circle cx="180" cy="20" r="7" fill="var(--coin-green)" />
            <circle cx="215" cy="33" r="7" fill="var(--coin-green)" />
            <circle cx="233" cy="65" r="7" fill="var(--bunny-paper)" stroke="var(--bunny-orange)" stroke-width="2.2" />
            <circle cx="226" cy="101" r="7" fill="var(--bunny-paper)" stroke="var(--bunny-orange)" stroke-width="2.2" />
            <circle cx="198" cy="124" r="7" fill="var(--bunny-paper)" stroke="var(--bunny-orange)" stroke-width="2.2" />
            <circle cx="162" cy="124" r="7" fill="var(--bunny-paper)" stroke="var(--bunny-orange)" stroke-width="2.2" />
            <circle cx="134" cy="101" r="7" fill="var(--bunny-paper)" stroke="var(--bunny-orange)" stroke-width="2.2" />
            <circle cx="127" cy="65" r="7" fill="var(--bunny-paper)" stroke="var(--bunny-orange)" stroke-width="2.2" />
            <circle cx="145" cy="33" r="7" fill="var(--bunny-paper)" stroke="var(--bunny-orange)" stroke-width="2.2" />
            <text x="180" y="71" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--bunny-ink)">币边防滑齿纹</text>
            <text x="180" y="88" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bunny-orange)">实为 9 道超导晶槽</text>
            <text x="180" y="152" text-anchor="middle" font-size="12.5" font-weight="600" fill="var(--coin-green)">
              已烧亮 2 格（邦妮 / 克露丝）· 仅余 7 次初始额度
            </text>
          </svg>

          <!-- Stage 2 SVG: Split Interlocking Halves -->
          <svg v-else-if="activeMystery === 2" class="coin-map-svg" viewBox="0 0 360 164" aria-hidden="true">
            <ellipse cx="122" cy="74" rx="44" ry="50" fill="var(--bunny-paper)" stroke="var(--bunny-ink)" stroke-width="2.8" />
            <text x="122" y="70" text-anchor="middle" font-size="14" font-weight="700" fill="var(--bunny-ink)">开拓阳片</text>
            <text x="122" y="90" text-anchor="middle" font-size="12" fill="var(--bunny-ink-2)">罗伊角色右腰匣</text>

            <line x1="168" y1="58" x2="192" y2="58" stroke="var(--bunny-orange)" stroke-width="2.2" class="coin-dash-anim" />
            <line x1="168" y1="90" x2="192" y2="90" stroke="var(--bunny-orange)" stroke-width="2.2" class="coin-dash-anim" />

            <ellipse cx="238" cy="74" rx="44" ry="50" fill="var(--bunny-paper)" stroke="var(--bunny-orange)" stroke-width="2.8" />
            <text x="238" y="70" text-anchor="middle" font-size="14" font-weight="700" fill="var(--bunny-orange)">锚定阴片</text>
            <text x="238" y="90" text-anchor="middle" font-size="12" fill="var(--bunny-ink-2)">罗娅角色右腰匣</text>

            <text x="180" y="150" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--bunny-orange)">
              适配舰桥半深凹槽 · 一枚厚币沿原子级暗缝旋开为子母双片！
            </text>
          </svg>

          <!-- Stage 3 SVG: Dormant Concentric Rings -->
          <svg v-else class="coin-map-svg" viewBox="0 0 360 164" aria-hidden="true">
            <circle cx="180" cy="74" r="52" fill="var(--bunny-paper)" stroke="var(--bunny-ink-3)" stroke-width="1.8" />
            <circle cx="180" cy="74" r="36" fill="none" stroke="var(--coin-green)" stroke-width="2.8" class="coin-dash-anim" />
            <circle cx="180" cy="74" r="20" fill="none" stroke="var(--bunny-orange)" stroke-width="2" stroke-dasharray="4 3" />
            <text x="180" y="78" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--coin-green)">深层晶环苏醒</text>
            <text x="180" y="150" text-anchor="middle" font-size="12.5" font-weight="600" fill="var(--coin-green)">
              沐浴断联主炽环门重燃辐射 → 内层晶环裂解出全新齿槽刻度！
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

    <!-- DIAGRAM 03: 3-STAGE ONBOARDING ROCKET -->
    <section class="coin-viz-box" aria-label="新手村三级跳射程递进交互图解">
      <header class="coin-viz-box__head">
        <div>
          <span class="coin-viz-box__eyebrow">INTERACTIVE DIAGRAM 03</span>
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
            第 01 齿 · 同港邦妮
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeOnboarding === 1"
            class="coin-viz-tab"
            :class="{ 'is-active': activeOnboarding === 1 }"
            @click="activeOnboarding = 1"
          >
            第 02 齿 · 跨卫克露丝
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeOnboarding === 2"
            class="coin-viz-tab"
            :class="{ 'is-active': activeOnboarding === 2 }"
            @click="activeOnboarding = 2"
          >
            第 03 齿 · 百光年冈纳
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeOnboarding === 3"
            class="coin-viz-tab"
            :class="{ 'is-active': activeOnboarding === 3 }"
            @click="activeOnboarding = 3"
          >
            第 04 至 09 齿 · 异族全开
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
