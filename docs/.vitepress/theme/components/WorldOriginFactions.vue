<script setup lang="ts">
import { ref } from 'vue'
import { withBase } from 'vitepress'

const activeTab = ref(0)

const castLinks = [
  { id: 'kyuzo', label: '久藏：抗拒旗下军工格式化', href: '/characters/kyuzo/' },
  { id: 'wylin', label: '维琳：斩断旗下高轨遥控链', href: '/characters/wylin/' },
  { id: 'cruz', label: '克露丝：反抗旗下船坞封厂令', href: '/characters/cruz/' },
  { id: 'darrow', label: '达罗兄妹：正面击溃叛徒索伦', href: '/characters/darrow/' },
]
</script>

<template>
  <section class="coin-viz-box world-single-viz" aria-label="创世原点、十年灯下黑与三大宿敌交互图解">
    <header class="coin-viz-box__head">
      <div>
        <span class="coin-viz-box__eyebrow">INTERACTIVE DIAGRAM 01</span>
        <h3 class="coin-viz-box__title">创世原点与正邪三碎片：一场科考火并、十年灯下黑与两位宿敌统帅</h3>
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
          01 零号母门 · 一物裂三方
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 1"
          class="coin-viz-tab"
          :class="{ 'is-active': activeTab === 1 }"
          @click="activeTab = 1"
        >
          02 十年灯下黑（街机币伪装）
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 2"
          class="coin-viz-tab"
          :class="{ 'is-active': activeTab === 2 }"
          @click="activeTab = 2"
        >
          03 三块碎片 = 三种执币哲学
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 3"
          class="coin-viz-tab"
          :class="{ 'is-active': activeTab === 3 }"
          @click="activeTab = 3"
        >
          04 两大宿敌统帅档案
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
        <span>03 先驱主动熄灭外环星门熔断，将唯一「炽环母核」封于零号母门圣匣</span>
      </div>

      <svg class="world-split-svg" viewBox="0 0 680 148" aria-label="零号母门遗物一分为三因果图">
        <rect x="10" y="46" width="184" height="56" fill="var(--bunny-fabric)" stroke="var(--bunny-orange)" stroke-width="2.5" />
        <text x="102" y="70" text-anchor="middle" font-size="13" font-weight="700" fill="var(--bunny-ink)">十年前「零号母门」出土</text>
        <text x="102" y="90" text-anchor="middle" font-size="12" font-weight="600" fill="var(--bunny-orange)">科考队遭背叛 · 圣匣一裂为三</text>

        <line x1="194" y1="58" x2="298" y2="26" stroke="var(--bunny-red)" stroke-width="2.2" class="coin-dash-anim" />
        <line x1="194" y1="74" x2="298" y2="74" stroke="var(--coin-green)" stroke-width="2.6" class="coin-dash-anim" />
        <line x1="194" y1="90" x2="298" y2="122" stroke="var(--bunny-orange)" stroke-width="2.2" class="coin-dash-anim" />

        <rect x="300" y="6" width="370" height="38" fill="var(--bunny-paper)" stroke="var(--bunny-red)" stroke-width="1.8" />
        <text x="485" y="30" text-anchor="middle" font-size="12.5" font-weight="600" fill="var(--bunny-ink)">
          副领队索伦·韦恩夺「外层铸模」→ 掌白塔天秤财团量产伪币
        </text>

        <rect x="300" y="55" width="370" height="38" fill="var(--bunny-paper)" stroke="var(--coin-green)" stroke-width="2.4" />
        <text x="485" y="79" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--coin-green)">
          父母将「唯一炽环母核」裹入街机铜壳塞给幼子 → 达罗兄妹开局
        </text>

        <rect x="300" y="104" width="370" height="38" fill="var(--bunny-paper)" stroke="var(--bunny-orange)" stroke-width="1.8" />
        <text x="485" y="128" text-anchor="middle" font-size="12.5" font-weight="600" fill="var(--bunny-ink)">
          安保队长德雷克·莫罗夺「半枚导能护环」→ 建暗环私掠团吞噬特质
        </text>
      </svg>

      <p class="coin-map-stage__caption">
        <b>因果闭环：</b>同一场零号母门惨案，同步诞生了达罗兄妹手里的唯一炽环母核、索伦的六角伪币铸模、莫罗胸口的掠夺残环，以及跨越世代重返零号母门的终极悬念。
      </p>
    </div>

    <!-- TAB 1: Y1 ARCADE TOKEN DISGUISE (HOW THEY SURVIVED 10 YEARS) -->
    <div v-else-if="activeTab === 1" class="coin-viz-body coin-map-grid">
      <div class="coin-map-stage">
        <div class="coin-map-stage__top">
          <b>为何叛徒认识达罗一家，兄妹却能平安揣币十年？</b>
          <span>能谱探测仪读数 = 0.00</span>
        </div>

        <svg class="coin-map-svg" viewBox="0 0 380 162" aria-label="街机游戏币惰性镀层伪装剖面图">
          <circle cx="190" cy="74" r="54" fill="var(--bunny-fabric)" stroke="var(--bunny-ink-2)" stroke-width="5" stroke-dasharray="14 4" />
          <circle cx="190" cy="74" r="36" fill="var(--bunny-paper)" stroke="var(--bunny-orange)" stroke-width="3" />
          <text x="190" y="70" text-anchor="middle" font-size="13" font-weight="700" fill="var(--bunny-orange)">内胆：无字炽环母核</text>
          <text x="190" y="88" text-anchor="middle" font-size="12" font-weight="600" fill="var(--bunny-ink-2)">外皮：OG 街机黄铜壳</text>
          <text x="190" y="148" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--coin-green)">
            凡人黄铜壳隔绝一切辐射 · 首战裂壳后重塑为卡扣式屏蔽暗壳！
          </text>
        </svg>
      </div>

      <div class="coin-vault-col">
        <div class="coin-vault-card">
          <p class="coin-rule-title">神级灯下黑（顺带揭晓 OhGamers 名字双关由来）</p>
          <p class="coin-rule-desc">
            <b>01 偷梁换柱：</b>父母当着索伦的面把高能假诱饵扔进零号黑洞，提前给无字「炽环母核」裹上惰性黄铜皮，压成满街可见的廉价「OhGamers（OG）街机游戏代币」塞进孩子衣兜。<br />
            <b>02 亲自搜身放行：</b>十年前逃生舱归港，索伦亲自用最精密仪器扫遍年幼的罗伊，读数为零！他捏起这枚磨花的游戏铜板冷笑一眼，<b>亲手丢还给了小罗伊</b>。<br />
            <b>03 裂壳与法拉第护套：</b>兄妹天天抛币赌正反把铜皮磨薄，首战遇伪币共振裂缝泄能拉响索伦警报；随后克露丝将这层惰性 OG 铜皮重塑为可开合屏蔽壳——日常合壳潜伏，拔币滑壳即战！
          </p>
        </div>
      </div>
    </div>

    <!-- TAB 2: THREE SHARDS = THREE COIN PHILOSOPHIES -->
    <div v-else-if="activeTab === 2" class="coin-viz-body">
      <div class="coin-locks-grid">
        <article class="coin-lock-card">
          <div class="coin-step-card__meta">
            <b>达罗兄妹 · 唯一真母币</b>
            <span>同路人 · 共担</span>
          </div>
          <svg class="coin-lock-svg" viewBox="0 0 200 44" aria-hidden="true">
            <circle cx="100" cy="22" r="17" fill="none" stroke="var(--coin-green)" stroke-width="2.6" />
            <text x="100" y="26" text-anchor="middle" font-size="12" font-weight="700" fill="var(--coin-green)">共担</text>
          </svg>
          <h4>力量借给伙伴，反噬我来扛</h4>
          <p>对方自愿触影方才立契，全员保有真名与独立意志；反面超载灼烧全由执币人亲自承担。</p>
        </article>

        <article class="coin-lock-card">
          <div class="coin-step-card__meta">
            <b>索伦·韦恩 · 外层铸模</b>
            <span>独裁救世 · 统御</span>
          </div>
          <svg class="coin-lock-svg" viewBox="0 0 200 44" aria-hidden="true">
            <polygon points="100,4 118,14 118,30 100,40 82,30 82,14" fill="none" stroke="var(--bunny-ink)" stroke-width="2.6" />
            <text x="100" y="26" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bunny-ink)">统御</text>
          </svg>
          <h4>为抗灭世天灾，自由是奢侈品</h4>
          <p>批量钉入工业锁印伪币，抹去姓氏改刻编号；因超载痛苦全数转嫁给奴隶，可同时强控数十具改造兽而无带宽上限。</p>
        </article>

        <article class="coin-lock-card">
          <div class="coin-step-card__meta">
            <b>德雷克·莫罗 · 半枚残环</b>
            <span>亡命狂徒 · 剥夺</span>
          </div>
          <svg class="coin-lock-svg" viewBox="0 0 200 44" aria-hidden="true">
            <path d="M80,24 A20,20 0 1,1 120,24" fill="none" stroke="var(--bunny-red)" stroke-width="3.2" />
            <text x="100" y="32" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bunny-red)">剥夺</text>
          </svg>
          <h4>好特质？全剥下来装进我身体</h4>
          <p>半圈导能护环焊死胸口，虽无法召遣队友，却能强行抽干异族特质与长生炉心缝入自身，化作多族能力合一的怪物枭雄。</p>
        </article>
      </div>

      <div class="coin-trait-bar">
        <div class="coin-trait-bar__pills">
          <span class="coin-trait-bar__label">天秤财团一线串起全员宿怨（点击跳转）：</span>
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

    <!-- TAB 3: TWO ANTAGONIST BOSS PROFILES -->
    <div v-else class="coin-viz-body">
      <div class="world-rival-grid">
        <div class="coin-step-card">
          <div class="coin-step-card__meta">
            <b>内环本篇终极统帅</b>
            <span>白塔天秤财团最高执印官</span>
          </div>
          <h4>索伦·韦恩（Soren Vane）</h4>
          <p>
            十年前达罗父母最信任的科考副领队，身着纯白长礼服大衣、手持六角铸模手杖。他在零号母门目睹噬环天灾后彻底绝望，讥讽罗伊那枚赌正反的铜板救不了任何文明；内环终章被十人真币共链击碎百骑伪币大阵，眼睁睁看着归航号破封升空。
          </p>
        </div>

        <div class="coin-step-card coin-step-card--highlight">
          <div class="coin-step-card__meta">
            <b>跨世代外环世仇大恶贼</b>
            <span>暗环私掠团大船长</span>
          </div>
          <h4>德雷克·莫罗（Drake Marrow）</h4>
          <p>
            十年前零号科考船安保队长。胸口焊死半圈燃烧护环，角色左臂嫁接智械重炮、背部嵌合掠夺而来的天羽残翼。靠不断吞噬长生异族炉心延命，从初代罗伊一路纠缠至后续资料片的达罗子孙，每逢新星门重燃必现身赌命相搏！
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
