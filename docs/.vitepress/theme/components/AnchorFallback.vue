<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute, withBase } from 'vitepress'
import { data } from '../../data/bunny-site.data.mjs'
import { resolveAnchorTarget, shouldRedirectForHash } from '../bunny-site.mjs'

const route = useRoute()

async function redirectMissingAnchor() {
  await nextTick()
  const hash = window.location.hash
  let id = hash.slice(1)
  try { id = decodeURIComponent(id) } catch { /* Keep malformed fragments literal. */ }
  if (!shouldRedirectForHash(hash, document.getElementById(id) !== null)) return
  const target = resolveAnchorTarget(data.anchorMap, window.location.pathname, hash)
  if (target) window.location.replace(withBase(target))
}

onMounted(() => {
  redirectMissingAnchor()
  window.addEventListener('hashchange', redirectMissingAnchor)
})
watch(() => route.path, redirectMissingAnchor, { flush: 'post' })
onBeforeUnmount(() => window.removeEventListener('hashchange', redirectMissingAnchor))
</script>

<template><span hidden></span></template>
