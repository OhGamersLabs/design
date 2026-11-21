<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import { data } from '../data/base-bodies.data.mjs'
import { readingNeighbors } from './character-site.mjs'

const { frontmatter, page } = useData()

const mode = computed(() => {
  const value: unknown = frontmatter.value.pageType
  if (value === 'overview' || value === 'tier') return value
  throw new Error(`Unknown base body page layout: ${String(value)}`)
})

const currentTier = computed(() => {
  if (mode.value !== 'tier') return null
  const id = frontmatter.value.tier
  if (typeof id !== 'string' || !Object.hasOwn(data.tiersById, id)) {
    throw new Error(`Invalid base body tier: ${String(id)}`)
  }
  return data.tiersById[id]
})

const neighbors = computed(() => {
  const currentPath = `/${page.value.relativePath.replace(/\.md$/, '').replace(/(^|\/)index$/, '$1')}`
  return readingNeighbors(data.readingOrder, currentPath)
})
</script>

<template>
  <main
    class="bunny-page base-body-page"
    :class="mode === 'tier' ? 'bunny-page--inner base-body-page--tier' : 'base-body-page--overview'"
  >
    <aside v-if="mode === 'tier' && currentTier" class="bunny-side-card base-body-tier-card" aria-label="素体档位资料">
      <div class="bunny-layer-card__heading base-body-tier-card__heading">
        <p class="bunny-side-card__home">
          <a :href="withBase('/base-bodies/')">通用素体</a> / <a :href="withBase('/base-bodies/#tiers')">三档素体</a>
        </p>
        <span class="base-body-tier-card__scale">{{ currentTier.scale }}</span>
        <p class="bunny-side-card__title">{{ currentTier.name }}</p>
        <p class="bunny-layer-card__position">{{ currentTier.role }}</p>
        <nav class="base-body-tier-map" aria-label="切换素体档位">
          <a
            v-for="tier in data.tiers"
            :key="tier.id"
            :href="withBase(tier.path)"
            :aria-current="tier.id === currentTier.id ? 'page' : undefined"
          >{{ tier.shortName }}</a>
        </nav>
      </div>
      <dl class="bunny-side-card__facts">
        <div v-for="fact in currentTier.facts" :key="fact.term">
          <dt>{{ fact.term }}</dt>
          <dd>{{ fact.value }}<small v-if="fact.note" class="base-body-tier-card__note">{{ fact.note }}</small></dd>
        </div>
      </dl>
      <p class="bunny-side-card__callout">
        <b>{{ currentTier.calloutTitle }}</b>{{ currentTier.callout }}
      </p>
    </aside>

    <div class="bunny-page__body">
      <div class="vp-doc"><Content /></div>
      <nav v-if="mode === 'tier'" class="bunny-pager" aria-label="相邻页面">
        <a v-if="neighbors.prev" class="bunny-pager__prev" :href="withBase(neighbors.prev.path)">
          <small>上一页</small><b>{{ neighbors.prev.title }}</b>
        </a>
        <a v-if="neighbors.next" class="bunny-pager__next" :href="withBase(neighbors.next.path)">
          <small>下一页</small><b>{{ neighbors.next.title }}</b>
        </a>
      </nav>
    </div>
  </main>
</template>
