<script setup lang="ts">
import { computed, nextTick, onMounted, watch } from 'vue'
import { useData, useRoute, withBase } from 'vitepress'
import { data } from '../../data/bunny-site.data.mjs'
import { resolveAnchorTarget } from '../bunny-site.mjs'

const { page } = useData()
const route = useRoute()
const destination = computed(() => {
  const path = `/${page.value.relativePath.replace(/\.md$/, '').replace(/(^|\/)index$/, '$1')}`
  const entry = data.anchorMap.stubs[path]
  if (!entry) throw new Error(`Missing redirect stub mapping: ${path}`)
  return entry
})

async function redirect() {
  await nextTick()
  const target = resolveAnchorTarget(data.anchorMap, window.location.pathname, window.location.hash)
  if (target) window.location.replace(withBase(target))
}

onMounted(redirect)
watch(() => route.path, redirect, { flush: 'post' })
</script>

<template>
  <p data-redirect-stub>本页已迁移，前往：<a :href="withBase(destination.target)">{{ destination.title }}</a></p>
</template>
