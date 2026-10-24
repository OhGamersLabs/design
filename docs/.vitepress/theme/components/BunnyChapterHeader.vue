<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import { bunnySections, findBunnySection } from '../../bunny-navigation.mjs'

const { page, frontmatter } = useData()
const section = computed(() => findBunnySection(page.value.relativePath))
const localHeadings = computed(() => page.value.headers || [])
</script>

<template>
  <header class="bunny-chapter-header">
    <div class="bunny-chapter-header__meta">
      <a :href="withBase('/characters/bunny/')">角色档案 / BUNNY</a>
      <span class="bunny-release-version">3.1.0</span>
    </div>
    <nav class="bunny-reading-path" aria-label="Bunny 白皮书阅读顺序">
      <ol>
        <li v-for="item in bunnySections" :key="item.id" :class="{ 'is-current': item.id === section?.id }">
          <a :href="withBase(item.link)" :aria-current="item.id === section?.id ? 'step' : undefined">
            <span class="bunny-reading-path__number">{{ item.number }}</span>
            <span>{{ item.label }}</span>
          </a>
        </li>
      </ol>
    </nav>
    <div class="bunny-chapter-heading">
      <p class="bunny-chapter-heading__eyebrow">{{ section?.number }} / {{ section?.label }}</p>
      <h1>{{ frontmatter.editorialTitle || frontmatter.title }}</h1>
      <p v-if="frontmatter.lead" class="bunny-chapter-heading__lead">{{ frontmatter.lead }}</p>
    </div>
    <nav v-if="localHeadings.length > 1" class="bunny-page-contents" aria-label="本页结构">
      <span>本页结构</span>
      <a v-for="heading in localHeadings" :key="heading.slug" :href="`#${heading.slug}`">{{ heading.title }}</a>
    </nav>
  </header>
</template>
