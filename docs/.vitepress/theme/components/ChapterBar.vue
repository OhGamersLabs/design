<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { data } from '../../data/bunny-site.data.mjs'

const active = ref('')
let observer: IntersectionObserver | undefined

function updateHash() {
  try { active.value = decodeURIComponent(window.location.hash.slice(1)) }
  catch { active.value = window.location.hash.slice(1) }
}

onMounted(() => {
  updateHash()
  window.addEventListener('hashchange', updateHash)
  if (!('IntersectionObserver' in window)) return
  observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
    if (visible[0]) active.value = visible[0].target.id
  }, { rootMargin: '-15% 0px -65% 0px' })
  for (const chapter of data.home.chapters) {
    const section = document.getElementById(chapter.id)
    if (section) observer.observe(section)
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener('hashchange', updateHash)
})
</script>

<template>
  <nav class="bunny-chapters" aria-label="设定章节">
    <a v-for="chapter in data.home.chapters" :key="chapter.id" :href="`#${chapter.id}`" :aria-current="active === chapter.id ? 'location' : undefined">{{ chapter.label }}</a>
  </nav>
</template>
