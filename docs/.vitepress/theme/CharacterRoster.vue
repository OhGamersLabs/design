<script setup lang="ts">
import { withBase } from 'vitepress'
import { data } from '../data/site.data.mjs'
import { data as baseBodies } from '../data/base-bodies.data.mjs'
import { data as world } from '../data/world.data.mjs'
</script>

<template>
  <div class="roster-shell">
    <div class="roster-heading">
      <p class="roster-label">OhGamers</p>
      <h1 class="roster-title">角色设计资料库</h1>
      <p class="roster-intro">OhGamers 十位成员的正式档案：命名、种族、背景故事、衣层拆解、表情与武装参考。</p>
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

    <section v-if="world?.storyCast?.standardCards?.length" class="roster-section" aria-labelledby="story-cast-heading">
      <div class="roster-section__header">
        <div>
          <p class="roster-section__label">主线剧情提炼 · 重点全拆解与普通单卡双轨制</p>
          <h2 id="story-cast-heading" class="roster-section__title">{{ world.storyCast.title }}</h2>
          <p class="roster-section__intro">{{ world.storyCast.intro }}</p>
        </div>
        <a class="roster-section__more" :href="withBase('/world/cast')">查看完整敌方与剧情角色图鉴 <span aria-hidden="true">↗</span></a>
      </div>
      <div class="npc-roster-grid">
        <a
          v-for="boss in data.majorCast"
          :key="boss.id"
          class="npc-roster-card npc-roster-card--major"
          :href="withBase(boss.home)"
          :data-npc-id="boss.id"
          :data-asset-id="boss.portrait.asset"
        >
          <div class="npc-roster-card__picture">
            <img
              :src="withBase(boss.portrait.path)"
              :width="boss.portrait.width"
              :height="boss.portrait.height"
              alt=""
              loading="lazy"
              decoding="async"
            >
            <span class="npc-roster-card__badge npc-roster-card__badge--major">重点角色 · 全衣层拆解</span>
          </div>
          <div class="npc-roster-card__copy">
            <div class="npc-roster-card__head">
              <h3 class="npc-roster-card__name">{{ boss.name }}</h3>
              <span class="npc-roster-card__en">{{ world.characters[boss.id]?.enName ?? boss.id }}</span>
            </div>
            <p class="npc-roster-card__faction">{{ boss.role }} · {{ world.characters[boss.id]?.raceLabel }}</p>
            <p class="npc-roster-card__summary">{{ world.characters[boss.id]?.tagline }}</p>
            <p class="roster-updated">L0–L3 全拆解 · 最近更新 <time :datetime="boss.updated">{{ boss.updated }}</time></p>
          </div>
        </a>
        <a
          v-for="npc in world.storyCast.standardCards"
          :key="npc.id"
          class="npc-roster-card"
          :href="withBase(`/world/cast#${npc.id}`)"
          :data-npc-id="npc.id"
          :data-asset-id="npc.portrait?.asset"
        >
          <div v-if="npc.portrait" class="npc-roster-card__picture">
            <img
              :src="withBase(npc.portrait.path)"
              :width="npc.portrait.width"
              :height="npc.portrait.height"
              alt=""
              loading="lazy"
              decoding="async"
            >
            <span class="npc-roster-card__badge">{{ npc.tier }}</span>
          </div>
          <div class="npc-roster-card__copy">
            <div class="npc-roster-card__head">
              <h3 class="npc-roster-card__name">{{ npc.name }}</h3>
              <span class="npc-roster-card__en">{{ npc.enName }}</span>
            </div>
            <p class="npc-roster-card__faction">{{ npc.faction }} · {{ npc.raceLabel }}</p>
            <p class="npc-roster-card__summary">{{ npc.tagline }}</p>
            <p class="roster-updated">{{ npc.debut }} · 最近更新 <time :datetime="npc.updated">{{ npc.updated }}</time></p>
          </div>
        </a>
      </div>
    </section>

    <section v-if="world?.races?.length" class="roster-section" aria-labelledby="world-heading">
      <div class="roster-section__header">
        <div>
          <p class="roster-section__label">星环纪元 · 抛币结契总纲</p>
          <h2 id="world-heading" class="roster-section__title">世界观、抛币法则与五大种族</h2>
          <p class="roster-section__intro">{{ world.intro }}</p>
        </div>
        <a class="roster-section__more" :href="withBase('/world/#coin-pact')">体验抛币结契交互图解 <span aria-hidden="true">↗</span></a>
      </div>
      <div class="world-roster-grid">
        <a
          v-for="race in world.races"
          :key="race.id"
          class="world-roster-card"
          :href="withBase(`/world/races#${race.id}`)"
        >
          <div class="world-roster-card__head">
            <h3 class="world-roster-card__name">{{ race.name }}</h3>
            <span class="world-roster-card__en">{{ race.enName }}</span>
          </div>
          <p class="world-roster-card__tagline">{{ race.tagline }}</p>
          <p class="world-roster-card__members">{{ race.members.map((id: string) => world.characters[id]?.name).filter(Boolean).join(' · ') }}</p>
        </a>
      </div>
    </section>

    <section v-if="baseBodies?.tiers?.length" class="roster-section" aria-labelledby="base-bodies-heading">
      <div class="roster-section__header">
        <div>
          <p class="roster-section__label">公共基础资产</p>
          <h2 id="base-bodies-heading" class="roster-section__title">通用素体设计</h2>
          <p class="roster-section__intro">{{ baseBodies.intro }}</p>
        </div>
        <a class="roster-section__more" :href="withBase('/standards/')">查看素体总览与通用规范 <span aria-hidden="true">↗</span></a>
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
