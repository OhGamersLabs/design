<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'

defineProps<{ category: string }>()
const { page } = useData()
const headings = computed(() => page.value.headers.filter(header => header.level === 2))
</script>

<template>
  <aside class="bunny-side-card bunny-reference-card" aria-label="本页目录">
    <div class="bunny-reference-card__heading">
      <p class="bunny-side-card__home"><a :href="withBase('/characters/bunny/')">Bunny</a></p>
      <p class="bunny-reference-card__category">{{ category }}</p>
      <p class="bunny-side-card__title">{{ page.title }}</p>
    </div>
    <nav v-if="headings.length" class="bunny-reference-card__contents" aria-label="本页章节">
      <a v-for="heading in headings" :key="heading.slug" :href="`#${heading.slug}`">{{ heading.title }}</a>
    </nav>
  </aside>
</template>
