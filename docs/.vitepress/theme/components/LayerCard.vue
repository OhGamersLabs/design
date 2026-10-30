<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { data } from '../../data/bunny-site.data.mjs'

const props = defineProps<{ layer: number }>()
const current = computed(() => {
  const result = data.layers.find(layer => layer.layer === props.layer)
  if (!result) throw new Error(`Unknown Bunny layer: ${props.layer}`)
  return result
})
</script>

<template>
  <aside class="bunny-side-card bunny-layer-card" aria-label="衣层资料">
    <div class="bunny-layer-card__heading">
      <a class="bunny-side-card__home" :href="withBase('/characters/bunny/#layers')">Bunny / 衣层</a>
      <span class="bunny-layer-card__number">{{ current.layer }}</span>
      <p class="bunny-side-card__title">{{ current.name }}</p>
      <p class="bunny-layer-card__position">第 {{ current.layer }} 层，共 0 到 8 层</p>
      <nav class="bunny-layer-map" aria-label="九层穿着">
        <a v-for="item in data.layers" :key="item.layer" :href="withBase(item.path)" :aria-label="`第 ${item.layer} 层：${item.name}`" :aria-current="item.layer === current.layer ? 'page' : undefined" :class="{ 'bunny-layer-map__worn': item.layer < current.layer }">{{ item.layer }}</a>
      </nav>
    </div>
    <dl class="bunny-side-card__facts">
      <div v-for="fact in current.facts" :key="fact.term"><dt>{{ fact.term }}</dt><dd>{{ fact.value }}</dd></div>
    </dl>
    <p class="bunny-side-card__callout"><b>左右识别</b>{{ current.leftRight }}</p>
  </aside>
</template>
