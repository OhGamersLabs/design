<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import LayerCard from './components/LayerCard.vue'
import ReferenceCard from './components/ReferenceCard.vue'
import PagePager from './components/PagePager.vue'
import RedirectStub from './components/RedirectStub.vue'

const { frontmatter } = useData()
const mode = computed(() => {
  const value: unknown = frontmatter.value.bunny
  if (value === 'home' || value === 'layer' || value === 'reference' || value === 'stub') return value
  throw new Error(`Unknown Bunny page layout: ${String(value)}`)
})
const layer = computed(() => {
  const value: unknown = frontmatter.value.layer
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 8) throw new Error(`Invalid Bunny layer: ${String(value)}`)
  return value
})
const category = computed(() => {
  const value: unknown = frontmatter.value.category
  if (typeof value !== 'string' || !value.trim()) throw new Error('Bunny reference page needs a category')
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
