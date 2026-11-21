<script setup lang="ts">
import { withBase } from 'vitepress'
import { data } from '../../data/base-bodies.data.mjs'
</script>

<template>
  <div class="base-body-grid">
    <a
      v-for="tier in data.tiers"
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
        <p class="base-body-card__summary">{{ tier.summary }}</p>
        <p class="base-body-card__meta">A 姿三视 · T 姿四视 · 最近更新 <time :datetime="data.updated">{{ data.updated }}</time></p>
      </div>
    </a>
  </div>
</template>
