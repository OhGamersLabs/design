<script setup lang="ts">
import { withBase } from 'vitepress'
import { data } from '../data/site.data.mjs'
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
  </div>
</template>
