<script setup lang="ts">
import { computed, ref } from 'vue'

const activeMystery = ref(0)
const activeOnboarding = ref(0)

const mysteryStages = [
  {
    cap: '肉眼视角：正面素底 OG、反面三周年店庆纹的无缝纪念币',
    badge: '探测仪读数：0.00（无缝紧包死腔）',
    title: '谜题 01 · 十年灯下黑：冲压捶打无缝「三周年店庆纪念币」与币缘细缝',
    how: '父母借极高硬度母核充当刚性内砧，用零九号船坞星门波导废铜将母核捶打收口至完全无缝无空腔，再冲压复原为「OhGamers 三周年店庆纪念币」（背面刻三颗星与数字 3，塞不进投币口不会被孩子花掉），兄妹十年间拿它抛正反拍板日常。',
    solve: '为何十年抛掷上万次皆无异象？因无缝波导黄铜紧包锁死了全部辐射！直至货运走廊肉搏重磕钢梁，内有超硬母核死顶导致币缘侧壁撕裂出一条细窄裂缝漏出一缕零点波；进入暗礁后克露丝剥下初代黄铜皮，以不阻挡零点波的「零点全透波金瓷新材料」重制第二代旋锁式 OG 战术外皮，插回波导腰匣归零、拔出即全功率激振！',
    foot: '细腻进化：从「初代阻波黄铜店庆币（细缝漏波）」平滑升级至「克露丝二代零点全透波金瓷壳 + 波导腰匣」。',
  },
  {
    cap: '克露丝切刀崩刃验证 · 高倍相干干涉仪透视',
    badge: '浅层激发晶胞：共 9 颗（余 7）',
    title: '谜题 02 · 切刀崩刃：极高硬度源于内部「无滑移面十重非周期准晶」',
    how: '克露丝起初试图拿钨钢微切刀沿币缘细缝探入取样，刀尖触及暗乌内芯瞬间火星迸溅当场崩断，而内芯连一道白痕都没留下！她遂剥开初代软黄铜外衣打入相干干涉波——',
    solve: '干涉仪视窗赫然显现出有序却永不周期重复的十重非周期准晶单晶点阵！因内部不存在任何周期晶体滑移面，故具备超越常规物质的极高硬度；初始仅有浅层环带的九颗准晶胞处于激发态，战时凭拇指弹击的生物电频率即可定向点将！',
    foot: '材料学与世界观合一：用「无滑移面非周期准晶」同时解释为何百吨冲压不坏、为何索伦是六角周期晶格、以及如何无限扩容。',
  },
  {
    cap: '归航号舰桥旋壳实验 · 阴阳子母星榫双片解耦',
    badge: '唯一解锁途径：双生生物电星榫分离',
    title: '谜题 03 · 舰桥旋壳分体：双生血脉解锁「阳片凸阶星榫 × 阴片凹阶星卯」',
    how: '天秤财团焊死本地频段围剿暗礁，克露丝用专用扳手无损旋开二代透波外皮取出合体母核，却发现归航号舰桥主控台设有一阳一阴两处浅圆槽！',
    solve: '任何重锤与激光切割皆无法撬开母核内部咬合分界面分毫；生死关头罗伊与罗娅双手同握母核，达罗双生生物电解锁内部零点锁，阳片「十重凸阶星榫台」无声从阴片「十重凹阶星卯槽」中平滑退出（战后克露丝为阳片、阴片各定制一套二代零点透波金瓷 OG 壳配入兄妹各自角色右腰波导磁吸匣）！',
    foot: '神性与工程双闭环：合体上下纯平、分体一凸一凹星榫互补，战后升级为兄妹一人一枚二代透波 OG 战术币。',
  },
  {
    cap: '维琳无损高能透视 · 深层休眠准晶海',
    badge: '扩容零外观负担：燃门辐射相变',
    title: '谜题 04 · 无限扩容：重燃星门唤醒深层准晶胞，超硬单晶万古不变',
    how: '当浅层九颗激发态准晶胞随第九位同伴维琳入列而全部绑定，母核初始结契额度彻底归零。',
    solve: '精通高维能谱的硅碳学者维琳与克露丝联手深度透视，证实超硬单晶深处仍层层嵌套着成百上千颗未激活的休眠准晶胞——常规电力丝毫无用，唯有抵近熄灭断联的主炽环门、沐浴星门重燃瞬间的原初炉心辐射，深层晶胞便会成片相变苏醒！',
    foot: '跨世代扩展闭环：无论未来资料片横跨多少世代、接纳多少位新同伴，一体超硬暗乌单晶的纯粹外观永远无需改动丝毫。',
  },
]

const onboardingSteps = [
  {
    rangeBadge: '共鸣半径：数公里（同港区）',
    radarCaption: '无外接天线 · 币缘细缝裸抛',
    title: '新手第 01 步（同港区）：邦妮 · 零前兆贴脸大变活人',
    why: '为何只飞这么近：开局未搭接任何中继设备，仅靠重磕钢梁在币缘撕裂出的那条细窄裂缝自然逸散功率，只能扫过数公里内的同城高塔空域。',
    plot: '揭秘职责：兄妹救下洛恩退入三岔死角，罗伊冷汗弹出带边缘细缝的三周年 OG 纪念币赌逃跑路线（肉眼无浮夸光环）——细缝逸出的一缕无字细光环突现上层高塔坠空绝境的邦妮鼻尖前，邦妮本能一抓即触发零传送门前兆水波折裂，直接跨空贴脸降临兄妹面前！',
    foot: '认知一阶：三人面面相觑一头雾水，起初只当这枚裂了一条边缝的纪念币触发了某种短距保命传送奇观。',
  },
  {
    rangeBadge: '共鸣半径：千万公里（跨轨道卫星）',
    radarCaption: '搭接暗礁残破轨道信标',
    title: '新手第 02 步（不同卫星）：克露丝 · 跨卫拉人、剥除铜衣换装「二代零点全透波金瓷壳」',
    why: '为何射程变远了：退回零九号暗礁面对瘫痪的归航号与细缝漏波危机，罗伊将初代硬币裂口贴在暗礁残存的区间轨道信标上弹射，搜索半径跃升至邻近工业卫星！',
    plot: '揭秘职责：无字光环飞入三号船坞工业卫星落在克露丝台面，扳手敲击瞬间将她跨深空折跃拉至暗礁！克露丝切刀探缝崩刃后剥下初代阻波黄铜皮，测出十重准晶与九颗浅层晶胞，并用不阻挡零点波的掺金氮化硅碳复合金瓷重制「第二代透波 OG 外皮」，配入加装波导屏蔽内衬的角色右腰黑橙磁吸匣。',
    foot: '认知二阶：换上二代透波新外皮后，罗伊拔出 OG 战术币一抛即可全功率无损释放母核共鸣，插回腰匣即归零隐身。',
  },
  {
    rangeBadge: '共鸣半径：数百光年（跨恒星系破壁）',
    radarCaption: '旋拆二代外壳 + 阴阳子母星榫解耦合鸣',
    title: '正轨破壁战（封网危机触发）：冈纳 · 阴阳分体跨百光年神兵天降！',
    why: '危机如何逼出远距：天秤财团重甲队合围暗礁，并彻底焊死白塔星域全部本地轨道频段，断绝在星域内摇人的可能！',
    plot: '破壁高潮：绝境下克露丝旋开二代透波外皮取出母核，兄妹双手同握触发双生生物电解锁内部子母微阶梯星榫，分离为「开拓阳片」与「锚定阴片」嵌入舰桥双槽接通主天线——第三道光环跨越数百光年砸在北境边防要塞星冈纳枪前，重装老兵踏火降临轰碎包围网（战后克露丝为兄妹阳片、阴片各定制一套二代透波外皮）！',
    foot: '新手村正式毕业：全员震骇意识到——只要天线功率足够，这枚超硬无字母核竟能跨越光年连向全宇宙！',
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
          <h3 class="coin-viz-box__title">凡物藏神技：无缝冲压的「三周年店庆纪念币」如何被一步步科学破译</h3>
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
            01 无缝铜皮与边缝腰匣
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeMystery === 1"
            class="coin-viz-tab"
            :class="{ 'is-active': activeMystery === 1 }"
            @click="activeMystery = 1"
          >
            02 切刀崩刃测十重准晶
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeMystery === 2"
            class="coin-viz-tab"
            :class="{ 'is-active': activeMystery === 2 }"
            @click="activeMystery = 2"
          >
            03 重工剥皮量子解耦
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

          <!-- Stage 0 SVG: Seamless Coin + Hairline Rim Crack + Waveguide Holster -->
          <svg v-if="activeMystery === 0" class="coin-map-svg" viewBox="0 0 360 164" aria-hidden="true">
            <circle cx="132" cy="74" r="45" fill="var(--bunny-paper)" stroke="var(--bunny-orange)" stroke-width="3.4" />
            <circle cx="132" cy="74" r="35" fill="none" stroke="var(--bunny-ink-3)" stroke-width="1.3" />
            <text x="132" y="82" text-anchor="middle" font-size="20" font-weight="800" fill="var(--bunny-orange)">OG</text>
            <!-- Thin hairline crack right on the right cylindrical rim -->
            <line x1="176" y1="64" x2="176" y2="84" stroke="var(--bunny-ink)" stroke-width="2.2" />
            <rect x="214" y="34" width="64" height="80" rx="8" fill="var(--bunny-ink)" stroke="var(--bunny-orange)" stroke-width="2.4" />
            <text x="246" y="78" text-anchor="middle" font-size="11.5" font-weight="700" fill="var(--bunny-paper)">波导腰匣</text>
            <text x="180" y="148" text-anchor="middle" font-size="12" font-weight="600" fill="var(--bunny-ink-2)">
              前中期不剥无缝铜皮 · 拔币借边缘细缝透波，插回波导腰匣封缝归零
            </text>
          </svg>

          <!-- Stage 1 SVG: Internal Quasicrystal Lattice -->
          <svg v-else-if="activeMystery === 1" class="coin-map-svg" viewBox="0 0 360 164" aria-hidden="true">
            <rect x="64" y="14" width="232" height="118" rx="6" fill="var(--bunny-fabric)" stroke="var(--bunny-ink)" stroke-width="1.8" />
            <circle cx="180" cy="73" r="44" fill="var(--bunny-ink)" />
            <circle cx="180" cy="73" r="31" fill="none" stroke="var(--bunny-ink-3)" stroke-width="1.2" stroke-dasharray="2 3" />
            <circle cx="180" cy="73" r="17" fill="none" stroke="var(--bunny-ink-3)" stroke-width="1.2" stroke-dasharray="2 3" />
            <circle cx="162" cy="49" r="3.8" fill="var(--bunny-orange)" />
            <circle cx="198" cy="51" r="3.8" fill="var(--bunny-orange)" />
            <circle cx="209" cy="75" r="3.6" fill="var(--coin-green)" />
            <circle cx="196" cy="97" r="3.6" fill="var(--coin-green)" />
            <circle cx="164" cy="97" r="3.6" fill="var(--coin-green)" />
            <circle cx="151" cy="74" r="3.6" fill="var(--coin-green)" />
            <text x="180" y="150" text-anchor="middle" font-size="12" font-weight="600" fill="var(--coin-green)">
              钨钢切刀触芯崩刃 · 干涉仪视窗显露无滑移面十重非周期准晶
            </text>
          </svg>

          <!-- Stage 2 SVG: Quantum Cleavage Twin Ultra-Hard Discs -->
          <svg v-else-if="activeMystery === 2" class="coin-map-svg" viewBox="0 0 360 164" aria-hidden="true">
            <ellipse cx="120" cy="74" rx="40" ry="47" fill="var(--bunny-ink)" />
            <text x="120" y="70" text-anchor="middle" font-size="13.5" font-weight="700" fill="var(--bunny-paper)">开拓阳核</text>
            <text x="120" y="89" text-anchor="middle" font-size="11.5" fill="var(--bunny-orange)">罗伊角色右腰匣</text>

            <line x1="164" y1="58" x2="196" y2="58" stroke="var(--bunny-orange)" stroke-width="2.2" class="coin-dash-anim" />
            <line x1="164" y1="90" x2="196" y2="90" stroke="var(--coin-green)" stroke-width="2.2" class="coin-dash-anim" />

            <ellipse cx="240" cy="74" rx="40" ry="47" fill="var(--bunny-ink)" />
            <text x="240" y="70" text-anchor="middle" font-size="13.5" font-weight="700" fill="var(--bunny-paper)">锚定阴核</text>
            <text x="240" y="89" text-anchor="middle" font-size="11.5" fill="var(--coin-green)">罗娅角色右腰匣</text>

            <text x="180" y="149" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bunny-orange)">
              重工撕开铜衣 · 双生生物电沿原子晶面平滑解耦两片超硬单晶！
            </text>
          </svg>

          <!-- Stage 3 SVG: Deep Quasicrystal Phase Awakening -->
          <svg v-else class="coin-map-svg" viewBox="0 0 360 164" aria-hidden="true">
            <circle cx="180" cy="74" r="52" fill="var(--bunny-paper)" stroke="var(--bunny-ink)" stroke-width="2.2" />
            <circle cx="180" cy="74" r="36" fill="none" stroke="var(--coin-green)" stroke-width="2.4" class="coin-dash-anim" />
            <circle cx="180" cy="74" r="20" fill="none" stroke="var(--bunny-orange)" stroke-width="2" stroke-dasharray="3 3" />
            <text x="180" y="78" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--coin-green)">深层晶胞相变</text>
            <text x="180" y="150" text-anchor="middle" font-size="12" font-weight="600" fill="var(--coin-green)">
              沐浴主炽环门重燃辐射 → 深层晶胞成片苏醒，超硬单晶外观永不改变！
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
          <h3 class="coin-viz-box__title">开篇射程三级跳：从币缘细缝初醒、跨卫切刀崩刃到舰桥剥皮解耦跨百光年破壁</h3>
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
