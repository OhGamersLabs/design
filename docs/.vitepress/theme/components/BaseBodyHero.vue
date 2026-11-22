<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { data } from '../../data/base-bodies.data.mjs'
import BaseBodyImage from './BaseBodyImage.vue'

const tabs = data.overview.tabs
const active = ref<string | undefined>(tabs[0]?.key)
const instanceId = useId()
const activeTab = computed(() => tabs.find(tab => tab.key === active.value))

function panelClass(key: string) {
  if (key === 'scale') return 'bunny-hero__panel--card'
  return 'bunny-hero__panel--four'
}

function onTabKeydown(event: KeyboardEvent, index: number) {
  const count = tabs.length
  if (!count) return
  let next = index
  if (event.key === 'ArrowRight') next = (index + 1) % count
  else if (event.key === 'ArrowLeft') next = (index + count - 1) % count
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = count - 1
  else return
  const tab = tabs[next]
  if (!tab) return
  event.preventDefault()
  active.value = tab.key
  document.getElementById(`${instanceId}-tab-${tab.key}`)?.focus()
}
</script>

<template>
  <div data-base-body-hero class="bunny-hero base-body-hero">
    <div class="bunny-hero__viewer">
      <div class="bunny-hero__stage">
        <div
          v-for="tab in tabs"
          :id="`${instanceId}-panel-${tab.key}`"
          :key="tab.key"
          class="bunny-hero__panel"
          :class="panelClass(tab.key)"
          :data-hero-panel="tab.key"
          role="tabpanel"
          :aria-labelledby="`${instanceId}-tab-${tab.key}`"
          :hidden="active !== tab.key"
          tabindex="0"
        >
          <BaseBodyImage
            v-for="assetId in tab.assets"
            :id="assetId"
            :key="assetId"
            :group="tab.assets.length > 1 ? `base-body-hero-${tab.key}` : undefined"
          />
        </div>
      </div>
      <div class="bunny-hero__tabbar">
        <div class="bunny-hero__tabs" role="tablist" aria-label="通用素体总览图">
          <button
            v-for="(tab, index) in tabs"
            :id="`${instanceId}-tab-${tab.key}`"
            :key="tab.key"
            type="button"
            role="tab"
            :aria-controls="`${instanceId}-panel-${tab.key}`"
            :aria-selected="active === tab.key"
            :tabindex="active === tab.key ? 0 : -1"
            @click="active = tab.key"
            @keydown="onTabKeydown($event, index)"
          >{{ tab.label }}</button>
        </div>
        <p class="bunny-hero__view-caption" aria-live="polite">{{ activeTab?.caption }}</p>
      </div>
    </div>
    <aside class="bunny-idcard base-body-idcard" :aria-labelledby="`${instanceId}-name`">
      <p :id="`${instanceId}-name`" class="bunny-idcard__name base-body-idcard__name">{{ data.title }}</p>
      <p class="bunny-idcard__role">{{ data.subtitle }}</p>
      <dl class="bunny-facts">
        <div v-for="fact in data.overview.facts" :key="fact.term">
          <dt>{{ fact.term }}</dt>
          <dd>{{ fact.value }}<small v-if="fact.note">{{ fact.note }}</small></dd>
        </div>
      </dl>
      <dl class="bunny-status">
        <div><dt>状态</dt><dd>{{ data.status }}</dd></div>
        <div><dt>最近更新</dt><dd><time :datetime="data.updated">{{ data.updated }}</time></dd></div>
      </dl>
    </aside>
  </div>
</template>
