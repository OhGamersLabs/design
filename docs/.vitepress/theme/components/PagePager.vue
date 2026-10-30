<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import { readingNeighbors } from '../bunny-site.mjs'

const { page } = useData()
const neighbors = computed(() => readingNeighbors(`/${page.value.relativePath.replace(/\.md$/, '').replace(/(^|\/)index$/, '$1')}`))
</script>

<template>
  <nav class="bunny-pager" aria-label="相邻页面">
    <a v-if="neighbors.prev" class="bunny-pager__prev" :href="withBase(neighbors.prev.path)"><small>上一页</small><b>{{ neighbors.prev.title }}</b></a>
    <a v-if="neighbors.next" class="bunny-pager__next" :href="withBase(neighbors.next.path)"><small>下一页</small><b>{{ neighbors.next.title }}</b></a>
  </nav>
</template>
