<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { useCharacter } from '../use-character'
import { data as world } from '../../data/world.data.mjs'

const character = useCharacter()
const lore = computed(() => world.characters[character.value.id] ?? null)
const race = computed(() => (lore.value ? world.racesById[lore.value.raceId] ?? null : null))
</script>

<template>
  <div v-if="lore" class="character-lore">
    <div class="character-lore__story">
      <p class="character-lore__tagline">{{ lore.tagline }}</p>
      <p v-for="(paragraph, index) in lore.story" :key="index">{{ paragraph }}</p>
    </div>
    <aside class="character-lore__meta" aria-label="角色世界观档案">
      <dl class="bunny-home-facts">
        <div>
          <dt>英文全名</dt>
          <dd>{{ lore.enName }}</dd>
        </div>
        <div v-if="lore.twinNote">
          <dt>双生搭档</dt>
          <dd>{{ lore.twinNote }}</dd>
        </div>
        <div>
          <dt>所属种族</dt>
          <dd>
            <a :href="withBase(`/world/races#${lore.raceId}`)">{{ lore.raceLabel }}</a>
          </dd>
        </div>
        <div v-if="race">
          <dt>姓氏渊源</dt>
          <dd>{{ race.surnameRule }}</dd>
        </div>
        <div>
          <dt>标志武装</dt>
          <dd>{{ lore.signatureGear }}</dd>
        </div>
        <div>
          <dt>小队羁绊</dt>
          <dd>{{ lore.bonds }}</dd>
        </div>
      </dl>
      <p class="character-lore__link">
        <a :href="withBase('/world/')">查看完整世界观与十人名录 <span aria-hidden="true">↗</span></a>
      </p>
    </aside>
  </div>
</template>
