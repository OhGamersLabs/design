<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useData, withBase } from 'vitepress'
import { data as story } from '../data/story.data.mjs'
import { data as site } from '../data/site.data.mjs'
import { data as world } from '../data/world.data.mjs'
import { readingNeighbors } from './character-site.mjs'
import StoryImage from './components/StoryImage.vue'

const { frontmatter, page } = useData()

const mode = computed(() => {
  const value: unknown = frontmatter.value.pageType
  if (value === 'overview' || value === 'episode') return value
  throw new Error(`Unknown story page layout: ${String(value)}`)
})

const episode = computed(() => {
  const id = typeof frontmatter.value.episodeId === 'string' ? frontmatter.value.episodeId : 'ep01'
  const found = story.episodesById[id]
  if (!found) throw new Error(`Unknown story episode: ${id}`)
  return found
})

const neighbors = computed(() => {
  const currentPath = `/${page.value.relativePath.replace(/\.md$/, '').replace(/(^|\/)index$/, '$1')}`
  return readingNeighbors(story.readingOrder, currentPath)
})

const allCharactersById = computed(() => ({
  ...Object.fromEntries(site.roster.map((entry) => [entry.id, entry])),
  ...Object.fromEntries(site.majorCast.map((entry) => [entry.id, entry])),
}))

const npcsById = computed(() =>
  Object.fromEntries((world.storyCast?.standardCards ?? []).map((card) => [card.id, card])),
)

type ReaderMode = 'spread' | 'scroll'
const readerMode = ref<ReaderMode>('spread')
const currentSpreadIndex = ref(0)

/** Group pages into L->R spreads: cover P01 solo or paired cleanly so wide spreads stand alone. */
const spreads = computed(() => {
  const list: Array<{ index: number; actId: string; label: string; items: typeof episode.value.pages }> = []
  const pages = episode.value.pages
  let i = 0
  while (i < pages.length) {
    const first = pages[i]
    if (first.spread) {
      list.push({ index: list.length, actId: first.actId, label: first.pageLabel, items: [first] })
      i += 1
    } else if (i + 1 < pages.length && !pages[i + 1].spread) {
      const second = pages[i + 1]
      list.push({
        index: list.length,
        actId: first.actId,
        label: `${first.pageLabel} · ${second.pageLabel}`,
        items: [first, second],
      })
      i += 2
    } else {
      list.push({ index: list.length, actId: first.actId, label: first.pageLabel, items: [first] })
      i += 1
    }
  }
  return list
})

const activeSpread = computed(() => spreads.value[currentSpreadIndex.value] ?? spreads.value[0])
const activeActId = computed(() => activeSpread.value?.actId ?? episode.value.acts[0]?.id ?? '')

function stepSpread(delta: number) {
  const next = Math.max(0, Math.min(spreads.value.length - 1, currentSpreadIndex.value + delta))
  currentSpreadIndex.value = next
}

function jumpToAct(actId: string) {
  if (readerMode.value === 'scroll') {
    document.getElementById(`story-act-${actId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    return
  }
  const idx = spreads.value.findIndex((sp) => sp.items.some((item) => item.actId === actId))
  if (idx >= 0) currentSpreadIndex.value = idx
}

function onKeydown(event: KeyboardEvent) {
  if (mode.value !== 'episode' || readerMode.value !== 'spread') return
  if (document.querySelector('dialog[open]')) return
  const target = event.target as HTMLElement | null
  if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
  if (event.key === 'ArrowRight') {
    event.preventDefault()
    stepSpread(1)
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    stepSpread(-1)
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <main class="bunny-page story-page" :class="`story-page--${mode}`">
    <div class="bunny-page__body">
      <template v-if="mode === 'overview'">
        <section class="world-hero story-overview-hero" aria-label="主线漫画连载提要">
          <div class="world-hero__main">
            <p class="roster-section__label">OhGamers · Serialization Archive</p>
            <h1 class="world-hero__title">{{ story.title }}</h1>
            <p class="world-hero__subtitle">{{ story.subtitle }}</p>
            <p class="world-hero__intro">{{ story.intro }}</p>
            <div class="world-hero__actions">
              <a class="roster-section__more" :href="withBase('/story/ep01')">进入第 01 话《0.00 的游戏币》阅读器 <span aria-hidden="true">↗</span></a>
              <a class="world-hero__secondary" :href="withBase('/world/')">查阅世界观总纲</a>
            </div>
          </div>
          <aside class="bunny-idcard world-hero__card" aria-label="连载档案信息">
            <dl class="bunny-facts">
              <div><dt>已归档话数</dt><dd>第 01 话（34 页全篇）</dd></div>
              <div><dt>阅读动线</dt><dd>从左往右横排推进</dd></div>
              <div><dt>跨页规格</dt><dd>28 单页 + 3 组双页大跨页</dd></div>
            </dl>
            <dl class="bunny-status">
              <div><dt>状态</dt><dd>{{ story.status }}</dd></div>
              <div><dt>最近更新</dt><dd><time :datetime="story.updated">{{ story.updated }}</time></dd></div>
            </dl>
          </aside>
        </section>

        <section v-for="ep in story.episodes" :key="ep.id" class="story-episode-card">
          <div class="story-episode-card__header">
            <div>
              <span class="story-episode-card__num">{{ ep.number }}</span>
              <h2 class="story-episode-card__title">
                <a :href="withBase(ep.path)">{{ ep.title }}</a>
                <small>{{ ep.enTitle }}</small>
              </h2>
            </div>
            <a class="roster-section__more" :href="withBase(ep.path)">展开全话 34 页阅读器 <span aria-hidden="true">↗</span></a>
          </div>
          <p class="story-episode-card__summary">{{ ep.summary }}</p>
          <div class="story-preview-strip">
            <a
              v-for="thumb in ep.previewThumbs"
              :key="thumb.asset"
              class="story-preview-card"
              :href="withBase(ep.path)"
              :data-asset-id="thumb.asset"
            >
              <img :src="withBase(thumb.path)" :width="thumb.width" :height="thumb.height" alt="" loading="lazy" decoding="async">
            </a>
          </div>
          <div class="story-act-pills">
            <span v-for="act in ep.acts" :key="act.id" class="story-act-pill">
              <b>{{ act.code }}</b> {{ act.title }} <small>{{ act.range }}</small>
            </span>
          </div>
        </section>
      </template>

      <template v-else>
        <header class="story-reader-head">
          <div>
            <p class="story-reader-crumb">
              <a :href="withBase('/')">设定集首页</a> / <a :href="withBase('/story/')">主线连载</a> / <span>{{ episode.number }}</span>
            </p>
            <h1 class="story-reader-title">{{ episode.title }} <small>{{ episode.enTitle }}</small></h1>
            <p class="story-reader-meta">{{ episode.pageCountLabel }} · {{ episode.readingDirection }} · 支持键盘左右键翻页与点击放大原图</p>
          </div>
          <div class="story-mode-toggle" role="group" aria-label="阅读模式切换">
            <button
              type="button"
              :class="{ 'is-active': readerMode === 'spread' }"
              @click="readerMode = 'spread'"
            >画册跨页模式</button>
            <button
              type="button"
              :class="{ 'is-active': readerMode === 'scroll' }"
              @click="readerMode = 'scroll'"
            >竖屏条漫模式</button>
          </div>
        </header>

        <nav class="story-act-bar" aria-label="分幕快速跳转">
          <button
            v-for="act in episode.acts"
            :key="act.id"
            type="button"
            class="story-act-btn"
            :class="{ 'is-active': activeActId === act.id }"
            @click="jumpToAct(act.id)"
          >
            <small>{{ act.code }} · {{ act.range }}</small>
            <b>{{ act.title }}</b>
          </button>
        </nav>

        <!-- Spread Mode Stage -->
        <section class="story-spread-stage" :hidden="readerMode !== 'spread'" aria-label="画册跨页阅读台">
          <div class="story-spread-toolbar">
            <button type="button" class="story-step-btn" :disabled="currentSpreadIndex === 0" @click="stepSpread(-1)">
              ← 上一跨页
            </button>
            <div class="story-spread-indicator">
              <b>{{ activeSpread?.label }}</b>
              <span>跨页 {{ currentSpreadIndex + 1 }} / {{ spreads.length }}</span>
            </div>
            <button type="button" class="story-step-btn" :disabled="currentSpreadIndex >= spreads.length - 1" @click="stepSpread(1)">
              下一跨页 →
            </button>
          </div>

          <div
            v-for="sp in spreads"
            :key="sp.index"
            class="story-book-frame"
            :class="sp.items.length === 1 && sp.items[0].spread ? 'story-book-frame--wide' : (sp.items.length === 2 ? 'story-book-frame--pair' : 'story-book-frame--single')"
            :hidden="sp.index !== currentSpreadIndex"
          >
            <div v-for="item in sp.items" :key="item.asset" class="story-book-sheet">
              <StoryImage :id="item.asset" group="ep01-spread" />
            </div>
          </div>

          <div class="story-spread-toolbar story-spread-toolbar--bottom">
            <button type="button" class="story-step-btn" :disabled="currentSpreadIndex === 0" @click="stepSpread(-1)">
              ← 上一跨页
            </button>
            <div class="story-page-dots" role="tablist" aria-label="跨页进度">
              <button
                v-for="sp in spreads"
                :key="sp.index"
                type="button"
                class="story-page-dot"
                :class="{ 'is-active': sp.index === currentSpreadIndex, 'is-wide': sp.items[0]?.spread }"
                :title="sp.label"
                @click="currentSpreadIndex = sp.index"
              >{{ sp.label }}</button>
            </div>
            <button type="button" class="story-step-btn" :disabled="currentSpreadIndex >= spreads.length - 1" @click="stepSpread(1)">
              下一跨页 →
            </button>
          </div>
        </section>

        <!-- Vertical Webtoon / Scroll Mode Stage -->
        <section class="story-scroll-stage" :hidden="readerMode !== 'scroll'" aria-label="竖屏条漫连续阅读">
          <div
            v-for="item in episode.pages"
            :id="episode.pages.findIndex((p) => p.actId === item.actId) === episode.pages.indexOf(item) ? `story-act-${item.actId}` : undefined"
            :key="item.asset"
            class="story-scroll-sheet"
            :class="{ 'story-scroll-sheet--wide': item.spread }"
          >
            <div class="story-scroll-sheet__bar">
              <b>{{ item.pageLabel }}</b>
              <span>{{ item.title }}</span>
            </div>
            <StoryImage :id="item.asset" group="ep01-scroll" />
          </div>
        </section>

        <!-- Linked Episode Cast & Lore Footer -->
        <section class="roster-section story-cast-footer" aria-labelledby="ep-cast-heading">
          <div class="roster-section__header">
            <div>
              <p class="roster-section__label">本话登场档案联动</p>
              <h2 id="ep-cast-heading" class="roster-section__title">《0.00 的游戏币》核心角色与剧情图鉴</h2>
              <p class="roster-section__intro">点入对应角色卡查阅完整 4K 衣层拆解、童年设定与世界观阵营考据。</p>
            </div>
            <a class="roster-section__more" :href="withBase('/world/cast')">查看完整剧情角色图鉴 <span aria-hidden="true">↗</span></a>
          </div>
          <div class="npc-roster-grid">
            <a
              v-for="cid in episode.featuredCharacters"
              :key="cid"
              class="npc-roster-card npc-roster-card--major"
              :href="withBase(allCharactersById[cid].home)"
              :data-npc-id="cid"
              :data-asset-id="allCharactersById[cid].portrait.asset"
            >
              <div class="npc-roster-card__picture">
                <img
                  :src="withBase(allCharactersById[cid].portrait.path)"
                  :width="allCharactersById[cid].portrait.width"
                  :height="allCharactersById[cid].portrait.height"
                  alt=""
                  loading="lazy"
                  decoding="async"
                >
                <span class="npc-roster-card__badge npc-roster-card__badge--major">重点角色 · 全衣层拆解</span>
              </div>
              <div class="npc-roster-card__copy">
                <div class="npc-roster-card__head">
                  <h3 class="npc-roster-card__name">{{ allCharactersById[cid].name }}</h3>
                  <span class="npc-roster-card__en">{{ world.characters[cid]?.enName }}</span>
                </div>
                <p class="npc-roster-card__faction">{{ allCharactersById[cid].role }}</p>
                <p class="npc-roster-card__summary">{{ world.characters[cid]?.tagline }}</p>
              </div>
            </a>
            <a
              v-for="nid in episode.featuredNpcs"
              :key="nid"
              class="npc-roster-card"
              :href="withBase(`/world/cast#${nid}`)"
              :data-npc-id="nid"
              :data-asset-id="npcsById[nid]?.portrait?.asset"
            >
              <div v-if="npcsById[nid]?.portrait" class="npc-roster-card__picture">
                <img
                  :src="withBase(npcsById[nid].portrait.path)"
                  :width="npcsById[nid].portrait.width"
                  :height="npcsById[nid].portrait.height"
                  alt=""
                  loading="lazy"
                  decoding="async"
                >
                <span class="npc-roster-card__badge">第 01 话登场</span>
              </div>
              <div class="npc-roster-card__copy">
                <div class="npc-roster-card__head">
                  <h3 class="npc-roster-card__name">{{ npcsById[nid]?.name }}</h3>
                  <span class="npc-roster-card__en">{{ npcsById[nid]?.enName }}</span>
                </div>
                <p class="npc-roster-card__faction">{{ npcsById[nid]?.faction }}</p>
                <p class="npc-roster-card__summary">{{ npcsById[nid]?.tagline }}</p>
              </div>
            </a>
          </div>
        </section>

        <nav class="bunny-pager" aria-label="相邻页面">
          <a v-if="neighbors.prev" class="bunny-pager__prev" :href="withBase(neighbors.prev.path)">
            <small>上一页</small><b>{{ neighbors.prev.title }}</b>
          </a>
          <a v-if="neighbors.next" class="bunny-pager__next" :href="withBase(neighbors.next.path)">
            <small>下一页</small><b>{{ neighbors.next.title }}</b>
          </a>
        </nav>
      </template>
    </div>
  </main>
</template>
