<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { getScrollOffset } from 'vitepress'
import { data } from '../../data/bunny-site.data.mjs'
import { activeChapterId, readingLine } from '../bunny-site.mjs'

const active = ref('')
let frame = 0

function readHash() {
  try { return decodeURIComponent(window.location.hash.slice(1)) }
  catch { return window.location.hash.slice(1) }
}

function update() {
  frame = 0
  const headings = data.home.chapters.map((chapter) => ({ id: chapter.id, top: document.getElementById(chapter.id)?.getBoundingClientRect().top ?? null }))
  active.value = activeChapterId(headings, {
    line: readingLine(window.innerHeight, getScrollOffset()),
    viewportHeight: window.innerHeight,
    atBottom: Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 1,
    hashId: readHash(),
  })
}

function schedule() {
  if (!frame) frame = window.requestAnimationFrame(update)
}

onMounted(() => {
  update()
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', schedule)
  window.addEventListener('hashchange', schedule)
})

onBeforeUnmount(() => {
  if (frame) window.cancelAnimationFrame(frame)
  window.removeEventListener('scroll', schedule)
  window.removeEventListener('resize', schedule)
  window.removeEventListener('hashchange', schedule)
})
</script>

<template>
  <nav class="bunny-chapters" aria-label="设定章节">
    <a v-for="chapter in data.home.chapters" :key="chapter.id" :href="`#${chapter.id}`" :aria-current="active === chapter.id ? 'location' : undefined">{{ chapter.label }}</a>
  </nav>
</template>
