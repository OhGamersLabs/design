<script setup lang="ts">
import { withBase } from 'vitepress'
import { data } from '../data/site.data.mjs'
import { data as baseBodies } from '../data/base-bodies.data.mjs'
</script>

<template>
  <div class="roster-shell">
    <div class="roster-heading">
      <p class="roster-label">OhGamers</p>
      <h1 class="roster-title">角色设计资料库</h1>
      <p class="roster-intro">每位角色的身份、衣层、表情、武器与场景参考。</p>
    </div>
    <div class="character-grid">
      <a v-for="character in data.roster" :key="character.id" class="character-card" :href="withBase(character.home)" :data-character-id="character.id" :data-asset-id="character.portrait.asset">
        <div class="roster-picture"><img :src="withBase(character.portrait.path)" :width="character.portrait.width" :height="character.portrait.height" alt="" loading="lazy" decoding="async"></div>
        <div class="character-card__copy">
          <h2 class="character-card__name">{{ character.name }}</h2>
          <p class="character-card__role">{{ character.role }}</p>
          <p class="roster-updated">最近更新 <time :datetime="character.updated">{{ character.updated }}</time></p>
        </div>
      </a>
    </div>

    <section v-if="baseBodies?.tiers?.length" class="roster-section" aria-labelledby="base-bodies-heading">
      <div class="roster-section__header">
        <div>
          <p class="roster-section__label">公共基础资产</p>
          <h2 id="base-bodies-heading" class="roster-section__title">通用素体设计</h2>
          <p class="roster-section__intro">{{ baseBodies.intro }}</p>
        </div>
        <a class="roster-section__more" :href="withBase('/base-bodies/')">查看素体总览与比例规范 <span aria-hidden="true">↗</span></a>
      </div>
      <div class="base-body-grid base-body-grid--home">
        <a
          v-for="tier in baseBodies.tiers"
          :key="tier.id"
          class="base-body-card"
          :href="withBase(tier.path)"
          :data-base-body-id="tier.id"
          :data-asset-id="tier.portrait.asset"
        >
          <div class="roster-picture">
            <img
              :src="withBase(tier.portrait.path)"
              :width="tier.portrait.width"
              :height="tier.portrait.height"
              alt=""
              loading="lazy"
              decoding="async"
            >
            <span class="base-body-card__badge">{{ tier.scale }}</span>
          </div>
          <div class="base-body-card__copy">
            <div class="base-body-card__head">
              <h3 class="base-body-card__name">{{ tier.name }}</h3>
              <span class="base-body-card__ratio">{{ tier.headRatio }}</span>
            </div>
            <p class="base-body-card__role">{{ tier.role }}</p>
            <p class="roster-updated">A 姿三视 · T 姿四视 · 最近更新 <time :datetime="baseBodies.updated">{{ baseBodies.updated }}</time></p>
          </div>
        </a>
      </div>
    </section>
  </div>
</template>
