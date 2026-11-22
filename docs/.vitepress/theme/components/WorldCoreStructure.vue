<script setup lang="ts">
import { computed, ref } from 'vue'

const activeTab = ref(0)

const states = [
  {
    tab: '01 外皮 · OG 黄铜屏蔽壳',
    badge: '索伦能谱仪读数：0.00（完全隐身）',
    tag: '凡人伪装外皮',
    title: '只有外层人类黄铜皮才印着「OG 街机游戏币」',
    summary:
      '十年前父母用原子级惰性屏蔽黄铜把先驱神核严密包覆，压印成满街可见的「OhGamers（OG）街机代币」。首战共振裂壳后，克露丝将其精工重塑为贴合母核的卡扣式法拉第暗壳——日常必须合壳隔绝辐射，防止索伦全星域雷达锁定。',
    bullets: [
      { k: '命名与外观归位', v: '唯有凡人造的黄铜外皮印有人类字母 OG；内胆名为「炽环母核」，绝无半个英文字母' },
      { k: '角色立绘零冲突', v: '达罗兄妹立绘中抛起、插在角色右腰黑橙磁吸匣里的，正是合壳潜伏态的金黄 OG 铜币' },
      { k: '小队名号由来', v: '兄妹叫顺嘴了十年的「游戏币」反成全队叛逆旗号，罗克更主动在胸甲喷涂纯白 OG 队徽' },
    ],
  },
  {
    tab: '02 内胆 · 无字无孔极简核',
    badge: '表层特征：零字母 · 零开孔 · 浑然无瑕',
    tag: '大巧不工 · 高维造物',
    title: '拇指弹开 OG 铜壳 → 显露浑然无瑕的先驱「炽环母核」',
    summary:
      '先驱高维造物不设任何外露刻度与发光孔位。弹开金黄铜壳后，内胆是一枚边缘光滑无缝、无字无孔的铂乌镜面圆盘，肉眼看不出任何机械开关或次数上限。',
    bullets: [
      { k: '材质代差反差', v: '外层是暖金黄铜街机壳；内胆是冷冽铂铱金属环包裹深邃乌金镜面，凡壳与神核一眼分明' },
      { k: '正面 · 环冠相', v: '乌金镜面中央仅浮现一道极简闭合微光圆环，开启零延迟视野与算力共链' },
      { k: '反面 · 蚀日相', v: '翻转浮现一道日食偏蚀残环微光，瞬时解开伙伴种族潜能限制器，神经负荷归执核人' },
    ],
  },
  {
    tab: '03 无限扩容 · 微观准晶胞',
    badge: '扩容上限：无外观枷锁（支持无限扩展）',
    tag: '仪器透视破译 · 不锁死表层',
    title: '容量与点将全藏在原子级「内部准晶点阵」，不在表面',
    summary:
      '肉眼看它只是一块死寂圆盘；直至克露丝用高倍相干干涉仪打入探测波，才在仪器屏幕上惊见母核内部悬浮着亿万高维准晶胞——因断环后零点能枯竭，初始仅有浅层九颗晶胞处于激发态。',
    bullets: [
      { k: '初始额度怎么测', v: '靠克露丝的高能干涉仪在屏幕读数上测出当前活跃晶胞数，而非数硬币边上的物理凹槽' },
      { k: '战时怎么精准点将', v: '靠执核人拇指弹击母核瞬间的生物电与谐振指法频率匹配目标波谱，无需抠按物理开关' },
      { k: '未来无限扩容', v: '每重燃一座断联主星门，原初炉心辐射便唤醒深层成片休眠晶胞，母核外观万古不变' },
    ],
  },
  {
    tab: '04 双核分执 · 半壳潜伏',
    badge: '双主角闭环：合盖同呈 OG 币面',
    tag: '原子暗缝 · 双腰匣呼应',
    title: '沿原子暗缝旋开阴阳双片 · 兄妹腰匣各配半副 OG 屏蔽壳',
    summary:
      '未旋开时接缝达原子级无痕贴合，十年间无人察觉；暗礁围剿危机中为适配归航号半深凹槽，兄妹合力将其旋开为「开拓阳核」与「锚定阴核」，克露丝同步把 OG 黄铜壳重塑为两只随身半核屏蔽护套。',
    bullets: [
      { k: '罗伊角色右腰匣', v: '内藏开拓阳核，外覆半副 OG 黄铜屏蔽前盖；平时隐蔽潜行，拔出滑壳即刻点将' },
      { k: '罗娅角色右腰匣', v: '内藏锚定阴核，外覆半副 OG 黄铜屏蔽背盖；跨光年开荒或燃门时兄妹双核合鸣' },
      { k: '三方裂片同源对比', v: '真核极简浑然，索伦执冷银六角圣匣外层铸模量产刺针伪币，莫罗将断裂导能残环焊死胸口' },
    ],
  },
]

const cur = computed(() => states[activeTab.value])
</script>

<template>
  <section class="coin-viz-box world-single-viz" aria-label="外层 OG 屏蔽铜壳与内层无字炽环母核结构交互图解">
    <header class="coin-viz-box__head">
      <div>
        <span class="coin-viz-box__eyebrow">INTERACTIVE DIAGRAM 02</span>
        <h3 class="coin-viz-box__title">外壳与内胆真容：凡人「OG 屏蔽铜壳」包裹无字无槽先驱「炽环母核」</h3>
      </div>
      <div class="coin-viz-tabs" role="tablist" aria-label="母核内外结构四态切换">
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

        <!-- Tab 0: Outer Brass OG Faraday Shell -->
        <svg v-if="activeTab === 0" class="coin-map-svg" viewBox="0 0 360 176" aria-hidden="true">
          <circle cx="180" cy="78" r="56" fill="var(--bunny-paper)" stroke="var(--bunny-orange)" stroke-width="3.6" />
          <circle cx="180" cy="78" r="45" fill="none" stroke="var(--bunny-ink-3)" stroke-width="1.5" />
          <circle cx="180" cy="78" r="33" fill="var(--bunny-fabric)" stroke="var(--bunny-orange)" stroke-width="2.2" />
          <text x="180" y="88" text-anchor="middle" font-size="28" font-weight="800" fill="var(--bunny-orange)">OG</text>
          <text x="180" y="156" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--coin-green)">
            人类街机黄铜屏蔽壳 · 合壳隔绝一切高维辐射
          </text>
        </svg>

        <!-- Tab 1: Inner Seamless Letterless Astral Ring Core -->
        <svg v-else-if="activeTab === 1" class="coin-map-svg" viewBox="0 0 360 176" aria-hidden="true">
          <g>
            <circle cx="106" cy="76" r="46" fill="var(--bunny-fabric)" stroke="var(--bunny-ink)" stroke-width="3" />
            <circle cx="106" cy="76" r="39" fill="var(--bunny-ink)" />
            <circle cx="106" cy="76" r="21" fill="none" stroke="var(--bunny-paper)" stroke-width="2.2" />
            <text x="106" y="142" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bunny-ink)">正面 · 极简闭合环</text>
          </g>
          <g>
            <circle cx="254" cy="76" r="46" fill="var(--bunny-fabric)" stroke="var(--bunny-ink)" stroke-width="3" />
            <circle cx="254" cy="76" r="39" fill="var(--bunny-ink)" />
            <circle cx="254" cy="76" r="21" fill="none" stroke="var(--bunny-orange)" stroke-width="2.4" />
            <circle cx="259" cy="73" r="19" fill="var(--bunny-ink)" />
            <text x="254" y="142" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bunny-orange)">反面 · 极简蚀日环</text>
          </g>
          <text x="180" y="166" text-anchor="middle" font-size="12" font-weight="600" fill="var(--bunny-ink-2)">
            光滑无缝铂乌圆盘 · 无字母、无开孔、无外露刻度
          </text>
        </svg>

        <!-- Tab 2: Sub-atomic Quasicrystal Lattice on Interferometer -->
        <svg v-else-if="activeTab === 2" class="coin-map-svg" viewBox="0 0 360 176" aria-hidden="true">
          <rect x="54" y="14" width="252" height="126" rx="8" fill="var(--bunny-fabric)" stroke="var(--bunny-ink)" stroke-width="2" />
          <line x1="54" y1="77" x2="306" y2="77" stroke="var(--bunny-rule-strong)" stroke-width="1" stroke-dasharray="3 3" />
          <line x1="180" y1="14" x2="180" y2="140" stroke="var(--bunny-rule-strong)" stroke-width="1" stroke-dasharray="3 3" />
          <circle cx="180" cy="77" r="46" fill="none" stroke="var(--bunny-ink-2)" stroke-width="1.8" />
          <circle cx="180" cy="77" r="34" fill="none" stroke="var(--bunny-ink-3)" stroke-width="1.2" stroke-dasharray="2 4" />
          <circle cx="180" cy="77" r="22" fill="none" stroke="var(--bunny-ink-3)" stroke-width="1.2" stroke-dasharray="2 3" />
          <circle cx="180" cy="77" r="10" fill="none" stroke="var(--bunny-ink-3)" stroke-width="1.2" stroke-dasharray="1.5 2.5" />
          <circle cx="156" cy="52" r="3.5" fill="var(--coin-green)" />
          <circle cx="208" cy="59" r="3.5" fill="var(--coin-green)" />
          <circle cx="195" cy="105" r="3.5" fill="var(--coin-green)" />
          <circle cx="149" cy="89" r="3.5" fill="var(--bunny-orange)" />
          <text x="180" y="162" text-anchor="middle" font-size="12" font-weight="700" fill="var(--coin-green)">
            唯高倍相干干涉仪可见：内部悬浮无上限休眠准晶胞
          </text>
        </svg>

        <!-- Tab 3: Twin Halves Each With Brass Shield Cap -->
        <svg v-else class="coin-map-svg" viewBox="0 0 360 176" aria-hidden="true">
          <g>
            <ellipse cx="108" cy="76" rx="32" ry="48" fill="var(--bunny-paper)" stroke="var(--bunny-orange)" stroke-width="2.6" />
            <ellipse cx="122" cy="76" rx="26" ry="42" fill="var(--bunny-ink)" stroke="var(--bunny-ink-2)" stroke-width="2" />
            <text x="93" y="81" text-anchor="middle" font-size="13" font-weight="800" fill="var(--bunny-orange)">OG</text>
            <text x="114" y="144" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bunny-ink)">阳核 + OG 屏蔽盖</text>
          </g>
          <line x1="156" y1="76" x2="204" y2="76" stroke="var(--coin-green)" stroke-width="2.2" class="coin-dash-anim" />
          <g>
            <ellipse cx="252" cy="76" rx="32" ry="48" fill="var(--bunny-paper)" stroke="var(--bunny-orange)" stroke-width="2.6" />
            <ellipse cx="238" cy="76" rx="26" ry="42" fill="var(--bunny-ink)" stroke="var(--bunny-ink-2)" stroke-width="2" />
            <text x="267" y="81" text-anchor="middle" font-size="13" font-weight="800" fill="var(--bunny-orange)">OG</text>
            <text x="246" y="144" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bunny-orange)">阴核 + OG 屏蔽盖</text>
          </g>
          <text x="180" y="166" text-anchor="middle" font-size="12" font-weight="600" fill="var(--bunny-ink-2)">
            兄妹角色右腰磁吸匣外露皆为 OG 屏蔽壳 · 拔出滑盖即战
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
