<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { data } from '../../data/bunny-site.data.mjs'
import type { HeroTab } from '../bunny-site-types'
import AssetImage from './AssetImage.vue'

const active = ref<HeroTab['key']>('scene')
const instanceId = useId()
const activeTab = computed(() => data.home.tabs.find(tab => tab.key === active.value))

function onTabKeydown(event: KeyboardEvent, index: number) {
  const count = data.home.tabs.length
  if (!count) return
  let next = index
  if (event.key === 'ArrowRight') next = (index + 1) % count
  else if (event.key === 'ArrowLeft') next = (index + count - 1) % count
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = count - 1
  else return
  const tab = data.home.tabs[next]
  if (!tab) return
  event.preventDefault()
  active.value = tab.key
  document.getElementById(`${instanceId}-tab-${tab.key}`)?.focus()
}
</script>

<template>
  <div data-hero class="bunny-hero">
    <div class="bunny-hero__viewer">
      <div class="bunny-hero__stage">
        <div
          v-for="tab in data.home.tabs"
          :id="`${instanceId}-panel-${tab.key}`"
          :key="tab.key"
          class="bunny-hero__panel"
          :class="`bunny-hero__panel--${tab.key}`"
          :data-hero-panel="tab.key"
          role="tabpanel"
          :aria-labelledby="`${instanceId}-tab-${tab.key}`"
          :hidden="active !== tab.key"
          tabindex="0"
        >
          <AssetImage
            v-for="assetId in tab.assets"
            :id="assetId"
            :key="assetId"
            :group="tab.key === 'three' ? 'hero-three' : undefined"
          />
        </div>
      </div>
      <div class="bunny-hero__tabbar">
        <div class="bunny-hero__tabs" role="tablist" aria-label="角色图">
          <button
            v-for="(tab, index) in data.home.tabs"
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
    <aside class="bunny-idcard" :aria-labelledby="`${instanceId}-name`">
      <p :id="`${instanceId}-name`" class="bunny-idcard__name">Bunny</p>
      <p class="bunny-idcard__role">刺客 <span>职业定位</span></p>
      <dl class="bunny-facts">
        <div v-for="fact in data.home.facts" :key="fact.term">
          <dt>{{ fact.term }}</dt>
          <dd>{{ fact.value }}<small v-if="fact.note">{{ fact.note }}</small></dd>
        </div>
      </dl>
      <div class="bunny-chips">
        <ul aria-label="识别色">
          <li v-for="chip in data.home.chips" :key="chip.swatch">
            <span class="bunny-chips__swatch" :class="`bunny-chips__swatch--${chip.swatch}`" aria-hidden="true"></span>
            <b>{{ chip.name }}</b>{{ chip.use }}
          </li>
        </ul>
        <p>{{ data.home.chipNote }}</p>
      </div>
      <dl class="bunny-status">

        <div><dt>状态</dt><dd data-hero-status>{{ data.home.status }}</dd></div>
        <div><dt>最近更新</dt><dd><time :datetime="data.home.updated">{{ data.home.updated }}</time></dd></div>
      </dl>
    </aside>
  </div>
</template>
