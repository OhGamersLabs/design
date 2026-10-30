<script setup lang="ts">
import { computed } from 'vue'
import { data } from '../../data/bunny-site.data.mjs'
import AssetImage from './AssetImage.vue'

const props = defineProps<{ group: string }>()
const current = computed(() => {
  const result = data.archive.groups.find(group => group.id === props.group)
  if (!result) throw new Error(`Unknown archive group: ${props.group}`)
  return result
})
</script>

<template>
  <ul class="bunny-archive-grid" :data-archive-grid="group">
    <li v-for="item in current.items" :key="item.asset" :data-archive-item="item.asset">
      <span class="archive-stamp">历史</span>
      <AssetImage :id="item.asset" :group="`archive-${group}`" use-thumb />
      <p class="bunny-archive-grid__note"><time v-if="item.date !== '—'" :datetime="item.date">{{ item.date }}</time><span v-else>—</span> · 已改为{{ item.replacedBy }}</p>
    </li>
  </ul>
</template>
