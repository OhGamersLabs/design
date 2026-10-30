<script setup lang="ts">
import { computed, useId } from 'vue'
import { data } from '../../data/bunny-site.data.mjs'
import AssetImage from './AssetImage.vue'

const latest = computed(() => data.home.highlights)
const headingId = useId()
</script>

<template>
  <section class="bunny-latest" :aria-labelledby="headingId">
    <h2 :id="headingId">最新</h2>
    <ol data-latest>
      <li v-for="(entry, index) in latest" :key="entry.asset" :data-asset-id="entry.asset" :class="{ 'bunny-latest__newest': index === 0 }">
        <AssetImage :id="entry.asset" :caption="entry.caption" group="latest" use-thumb />
        <time :datetime="entry.date">{{ entry.date }}</time>
        <p data-latest-title>{{ entry.title }}</p>
      </li>
    </ol>
  </section>
</template>
