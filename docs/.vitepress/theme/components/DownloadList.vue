<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import { data } from '../../data/bunny-site.data.mjs'
import { assetById } from '../bunny-site.mjs'
import AssetImage from './AssetImage.vue'

const props = defineProps<{ set: 'home' | 'page'; group?: string }>()
const groups = computed(() => {
  const available = data.downloads[props.set]
  if (!props.group) return available
  const selected = available.find(group => group.id === props.group)
  if (!selected) throw new Error(`Unknown ${props.set} download group: ${props.group}`)
  return [selected]
})

function sizeLabel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <div class="bunny-downloads" :class="`bunny-downloads--${set}`">
    <div class="bunny-downloads__groups">
      <div v-for="entry in groups" :id="set === 'home' ? entry.id : undefined" :key="entry.id" :data-download-group="entry.id" class="bunny-download-group">
        <span v-for="anchor in entry.anchors" :id="anchor" :key="anchor"></span>
        <h3 v-if="set === 'home'">{{ entry.group }}</h3>
        <ul>
          <li v-for="item in entry.items" :key="'asset' in item ? item.asset : item.file" :data-download-asset="'asset' in item ? item.asset : undefined" :data-download-file="'file' in item ? item.file : undefined">
            <template v-if="'asset' in item">
              <AssetImage :id="item.asset" :caption="item.label" group="downloads" use-thumb />
              <div class="bunny-download-group__meta">
                <span>{{ sizeLabel(assetById(data.assets, item.asset).original.bytes) }}</span>
                <a :href="withBase(assetById(data.assets, item.asset).original.path)" target="_blank" rel="noopener noreferrer">原图 ↗</a>
              </div>
            </template>
            <a v-else class="bunny-download-group__file" :href="withBase(item.file)">{{ item.label }} ↗</a>
          </li>
        </ul>
      </div>
    </div>
    <template v-if="set === 'home'">
      <p class="bunny-downloads__package"><a :href="withBase(data.package.path)">资料包 ZIP ↗</a></p>
      <dl class="bunny-downloads__status">
        <div><dt>状态</dt><dd>{{ data.home.status }}</dd></div>
        <div><dt>最近更新</dt><dd><time :datetime="data.home.updated">{{ data.home.updated }}</time></dd></div>
      </dl>
    </template>
  </div>
</template>
