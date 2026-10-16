<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
import { computed } from 'vue'
import BunnyChapterHeader from './components/BunnyChapterHeader.vue'

const { page } = useData()
const isBunny = computed(() => page.value.relativePath.startsWith('characters/bunny/'))
</script>

<template>
  <DefaultTheme.Layout>
    <template #doc-before><BunnyChapterHeader v-if="isBunny" /></template>
  </DefaultTheme.Layout>
</template>
