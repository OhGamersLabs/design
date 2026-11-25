<script setup lang="ts">
import { ref } from 'vue'
import { withBase } from 'vitepress'

const activeTab = ref(0)

const castLinks = [
  { id: 'kyuzo', label: '久藏：抗拒旗下军工格式化', href: '/characters/kyuzo/' },
  { id: 'wylin', label: '维琳：斩断旗下高轨遥控链', href: '/characters/wylin/' },
  { id: 'cruz', label: '克露丝：反抗旗下船坞封厂令', href: '/characters/cruz/' },
  { id: 'darrow', label: '达罗兄妹：正面跨越守夜铁幕', href: '/characters/darrow/' },
]
</script>

<template>
  <section class="coin-viz-box world-single-viz" aria-label="创世原点、十年灯下黑与三大宿敌交互图解">
    <header class="coin-viz-box__head">
      <div>
        <span class="coin-viz-box__eyebrow">INTERACTIVE DIAGRAM 01</span>
        <h3 class="coin-viz-box__title">创世原点与正邪三碎片：一场零号母门浩劫、三周年纪念币灯下黑与两位宿敌统帅</h3>
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
          02 十年灯下黑（三周年纪念币）
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="activeTab === 2"
          class="coin-viz-tab"
          :class="{ 'is-active': activeTab === 2 }"
          @click="activeTab = 2"
        >
          03 三块碎片 = 三种几何晶格
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
        <span>03 先驱主动熄灭外环星门熔断，将唯一超硬单晶「炽环母核」封于零号母门圣匣</span>
      </div>

      <svg class="world-split-svg" viewBox="0 0 680 148" aria-label="零号母门遗物一分为三因果图">
        <rect x="10" y="46" width="184" height="56" fill="var(--bunny-fabric)" stroke="var(--bunny-orange)" stroke-width="2.5" />
        <text x="102" y="70" text-anchor="middle" font-size="13" font-weight="700" fill="var(--bunny-ink)">十年前「零号母门」浩劫</text>
        <text x="102" y="90" text-anchor="middle" font-size="12" font-weight="600" fill="var(--bunny-orange)">越权超载坍缩 · 圣匣一裂为三</text>

        <line x1="194" y1="58" x2="298" y2="26" stroke="var(--bunny-red)" stroke-width="2.2" class="coin-dash-anim" />
        <line x1="194" y1="74" x2="298" y2="74" stroke="var(--coin-green)" stroke-width="2.6" class="coin-dash-anim" />
        <line x1="194" y1="90" x2="298" y2="122" stroke="var(--bunny-orange)" stroke-width="2.2" class="coin-dash-anim" />

        <rect x="300" y="6" width="370" height="38" fill="var(--bunny-paper)" stroke="var(--bunny-red)" stroke-width="1.8" />
        <text x="485" y="30" text-anchor="middle" font-size="12.5" font-weight="600" fill="var(--bunny-ink)">
          副领队索伦·韦恩抢出「空腔六角外模」→ 铸天秤稳压章制衡五长老
        </text>

        <rect x="300" y="55" width="370" height="38" fill="var(--bunny-paper)" stroke="var(--coin-green)" stroke-width="2.4" />
        <text x="485" y="79" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--coin-green)">
          父母以波导废铜捶打冲压成「三周年 OG 纪念币」→ 达罗兄妹开局
        </text>

        <rect x="300" y="104" width="370" height="38" fill="var(--bunny-paper)" stroke="var(--bunny-orange)" stroke-width="1.8" />
        <text x="485" y="128" text-anchor="middle" font-size="12.5" font-weight="600" fill="var(--bunny-ink)">
          安保队长德雷克·莫罗夺「半枚导能护环」→ 建暗环私掠团吞噬特质
        </text>
      </svg>

      <p class="coin-map-stage__caption">
        <b>因果闭环：</b>同一场零号母门浩劫，同步造就了达罗兄妹手里的唯一炽环母核、索伦的空腔六角外模与稳压伪币、莫罗胸口的掠夺残环，以及跨越世代重返零号母门的终极悬念。
      </p>
    </div>

    <!-- TAB 1: Y1 3RD ANNIVERSARY MEDAL DISGUISE -->
    <div v-else-if="activeTab === 1" class="coin-viz-body coin-map-grid">
      <div class="coin-map-stage">
        <div class="coin-map-stage__top">
          <b>为何高敏安检门不报警、小罗伊也没拿去街机店投币花掉？</b>
          <span>零点能谱仪读数 = 0.00</span>
        </div>

        <svg class="coin-map-svg" viewBox="0 0 380 162" aria-label="三周年店庆纪念币无缝捶打冲压包覆剖面图">
          <circle cx="190" cy="72" r="52" fill="var(--bunny-paper)" stroke="var(--bunny-orange)" stroke-width="4.5" />
          <circle cx="190" cy="72" r="44" fill="var(--bunny-ink)" />
          <circle cx="190" cy="72" r="20" fill="none" stroke="var(--bunny-paper)" stroke-width="1.8" />
          <text x="190" y="116" text-anchor="middle" font-size="11" font-weight="700" fill="var(--bunny-orange)">紧贴内芯：09 波导铜无缝冲压皮</text>
          <text x="190" y="148" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--coin-green)">
            超硬母核作内砧无缝锻合 · 背面三周年纪念纹防误投币！
          </text>
        </svg>
      </div>

      <div class="coin-vault-col">
        <div class="coin-vault-card">
          <p class="coin-rule-title">三周年店庆纪念币三重灯下黑（揭晓 OhGamers 队名由来）</p>
          <p class="coin-rule-desc">
            <b>01 防投币花掉与废铜来历：</b>小罗伊抓娃娃赢回的是街机厅限量的「OhGamers 三周年店庆非流通纪念币」（背面刻三颗星与数字 3，塞不进普通投币口，孩子绝不会花掉；而店老板恰恰在印这批三周年纪念币时买下了零九号船坞熔不化的星门波导废铜）。<br />
            <b>02 借超硬母核作砧无缝冲压：</b>真母核硬度极高、百吨重压不形变，父亲雷恩直接以延展波导铜裹核捶打收口至完全无缝，上冲床复压出原样纪念币（0.00 穿过 0.03 安检门）；雨夜索伦无声跪拥遗孤留下白手帕，全程未碰孩子衣袋。<br />
            <b>03 币缘一条细缝与波导腰匣：</b>十年后重磕钢梁仅在币缘侧壁撕裂一条细缝；前中期无需剥皮，拔出抛币即由细缝透波，插回克露丝改造的波导内衬黑橙腰匣即封死细缝归零！
          </p>
        </div>
      </div>
    </div>

    <!-- TAB 2: THREE SHARDS = THREE GEOMETRIC LATTICE PHILOSOPHIES -->
    <div v-else-if="activeTab === 2" class="coin-viz-body">
      <div class="coin-locks-grid">
        <article class="coin-lock-card">
          <div class="coin-step-card__meta">
            <b>达罗兄妹 · 一体超硬真母核</b>
            <span>外圆准晶 · 共担</span>
          </div>
          <svg class="coin-lock-svg" viewBox="0 0 200 44" aria-hidden="true">
            <circle cx="100" cy="22" r="17" fill="none" stroke="var(--coin-green)" stroke-width="2.6" />
            <circle cx="100" cy="22" r="9" fill="none" stroke="var(--bunny-orange)" stroke-width="1.4" stroke-dasharray="3 2" />
            <text x="100" y="26" text-anchor="middle" font-size="11" font-weight="700" fill="var(--coin-green)">共担</text>
          </svg>
          <h4>力量借给伙伴，反噬我来扛</h4>
          <p>通体一体超硬暗晶、内藏无滑移面十重非周期准晶；伙伴自愿触环立契保有独立意志，反面蚀日超载灼烧全由执核人共担。</p>
        </article>

        <article class="coin-lock-card">
          <div class="coin-step-card__meta">
            <b>索伦·韦恩 · 空腔六角外模</b>
            <span>六角蜂巢 · 统御</span>
          </div>
          <svg class="coin-lock-svg" viewBox="0 0 200 44" aria-hidden="true">
            <polygon points="100,4 118,14 118,30 100,40 82,30 82,14" fill="none" stroke="var(--bunny-ink)" stroke-width="2.6" />
            <text x="100" y="26" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bunny-ink)">统御</text>
          </svg>
          <h4>白瓷体面之下，尽是黑铁锁针</h4>
          <p>以六重周期密铺外模冲压「天秤稳压章」：表层覆光洁纯白六角瓷盖，底层将黑铁四刺针钉入异族胸骨，痛苦全转嫁受控者。</p>
        </article>

        <article class="coin-lock-card">
          <div class="coin-step-card__meta">
            <b>德雷克·莫罗 · 断裂半环</b>
            <span>残缺圆弧 · 剥夺</span>
          </div>
          <svg class="coin-lock-svg" viewBox="0 0 200 44" aria-hidden="true">
            <path d="M80,24 A20,20 0 1,1 120,24" fill="none" stroke="var(--bunny-red)" stroke-width="3.2" />
            <text x="100" y="32" text-anchor="middle" font-size="12" font-weight="700" fill="var(--bunny-red)">剥夺</text>
          </svg>
          <h4>好特质？全剥下来焊进我胸膛</h4>
          <p>一百八十度焦黑断裂导能护环加装外科钢爪与紫铜抽吸线圈焊死胸口，强行抽干异族特质与长生炉心嫁接自身。</p>
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
            <b>内环本篇执政统帅</b>
            <span>白塔天秤财团最高执印官</span>
          </div>
          <h4>索伦·韦恩（Soren Vane）</h4>
          <p>
            十年前达罗父母麾下温厚可靠的世交副领队。挚友殉难后，深信真母核已毁的他在百零八层温室裸手修剪白玫瑰，凭唯一空腔先驱六角外模铸造残缺稳压章与五长老相互制衡；内环终章被十人真核共链击破伪币大阵，目送归航号破封升空。
          </p>
        </div>

        <div class="coin-step-card coin-step-card--highlight">
          <div class="coin-step-card__meta">
            <b>跨世代外环世仇大恶贼</b>
            <span>暗环私掠团大船长</span>
          </div>
          <h4>德雷克·莫罗（Drake Marrow）</h4>
          <p>
            十年前零号科考船雇佣安保队长。胸口焊死半圈燃烧导能残环，角色左臂嫁接智械重炮、背部嵌合掠夺而来的天羽残翼。靠不断吞噬长生异族炉心延命，从初代罗伊一路纠缠至后续资料片的达罗子孙，每逢新星门重燃必现身赌命相搏！
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
