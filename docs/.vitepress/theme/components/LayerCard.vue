<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { useCharacter } from '../use-character'

const data = useCharacter()
const props = defineProps<{ layer: number }>()
const current = computed(() => {
  const result = data.value.layers?.items.find(layer => layer.layer === props.layer)
  if (!result) throw new Error(`Unknown character layer: ${props.layer}`)
  return result
})
const layers = computed(() => {
  const result = data.value.layers
  if (!result) throw new Error(`Missing layers: ${data.value.id}`)
  return result
})
const chapter = computed(() => data.value.home.chapters.find(item => item.id === layers.value.chapter))
const first = computed(() => Math.min(...layers.value.items.map(item => item.layer)))
const last = computed(() => Math.max(...layers.value.items.map(item => item.layer)))
</script>

<template>
  <aside class="bunny-side-card bunny-layer-card" :aria-label="`${layers.noun}资料`">
    <div class="bunny-layer-card__heading">
      <p class="bunny-side-card__home"><a :href="withBase(`/characters/${data.id}/`)">{{ data.name }}</a> / <a :href="withBase(`/characters/${data.id}/#${layers.chapter}`)">{{ chapter?.label }}</a></p>
      <span class="bunny-layer-card__number">{{ current.layer }}</span>
      <p class="bunny-side-card__title">{{ current.name }}</p>
      <p class="bunny-layer-card__position">第 {{ current.layer }} 层，共 {{ first }} 到 {{ last }} 层</p>
      <nav class="bunny-layer-map" :aria-label="`第 ${first} 到 ${last} 层${layers.wear}`">
        <a v-for="item in layers.items" :key="item.layer" :href="withBase(item.path)" :aria-label="`第 ${item.layer} 层：${item.name}`" :aria-current="item.layer === current.layer ? 'page' : undefined" :class="{ 'bunny-layer-map__worn': item.layer < current.layer }">{{ item.layer }}</a>
      </nav>
    </div>
    <dl class="bunny-side-card__facts">
      <div v-for="fact in current.facts" :key="fact.term"><dt>{{ fact.term }}</dt><dd>{{ fact.value }}</dd></div>
    </dl>
    <p class="bunny-side-card__callout"><b>左右识别</b>{{ current.leftRight }}</p>
  </aside>
</template>
