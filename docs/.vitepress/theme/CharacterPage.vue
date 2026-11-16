<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import { useCharacter } from './use-character'
import LayerCard from './components/LayerCard.vue'
import ReferenceCard from './components/ReferenceCard.vue'
import PagePager from './components/PagePager.vue'
import RedirectStub from './components/RedirectStub.vue'

const { frontmatter } = useData()
const data = useCharacter()
const mode = computed(() => {
  const value: unknown = frontmatter.value.pageType
  if (value === 'home' || value === 'layer' || value === 'reference' || value === 'stub') return value
  throw new Error(`Unknown character page layout: ${String(value)}`)
})
const layer = computed(() => {
  const value: unknown = frontmatter.value.layer
  if (typeof value !== 'number' || !Number.isInteger(value) || !data.value.layers?.items.some(item => item.layer === value)) throw new Error(`Invalid character layer: ${String(value)}`)
  return value
})
const category = computed(() => {
  const value: unknown = frontmatter.value.category
  if (typeof value !== 'string' || !value.trim()) throw new Error('Character reference page needs a category')
  return value
})
</script>

<template>
  <main class="bunny-page" :class="[`bunny-page--${mode}`, { 'bunny-page--inner': mode === 'layer' || mode === 'reference' }]">
    <RedirectStub v-if="mode === 'stub'" />
    <template v-else>
      <LayerCard v-if="mode === 'layer'" :layer="layer" />
      <ReferenceCard v-else-if="mode === 'reference'" :category="category" />
      <div class="bunny-page__body">
        <div class="vp-doc"><Content /></div>
        <PagePager v-if="mode === 'layer' || mode === 'reference'" />
      </div>
    </template>
  </main>
</template>
