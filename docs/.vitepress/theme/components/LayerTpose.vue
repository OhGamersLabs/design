<script setup lang="ts">
import { computed } from 'vue'
import { useCharacter } from '../use-character'
import AssetImage from './AssetImage.vue'

const data = useCharacter()
const props = defineProps<{ layer: number }>()
const tpose = computed(() => {
  const result = data.value.layers?.items.find(layer => layer.layer === props.layer)
  if (!result) throw new Error(`Unknown character layer: ${props.layer}`)
  if (!result.tpose) throw new Error(`Character layer has no T-pose views: ${props.layer}`)
  return result.tpose
})
const views: Array<{ key: 'front' | 'right' | 'back' | 'left'; caption: string }> = [
  { key: 'front', caption: '正面' },
  { key: 'right', caption: '角色右侧面' },
  { key: 'back', caption: '背面' },
  { key: 'left', caption: '角色左侧面' },
]
</script>

<template>
  <section class="bunny-tpose" aria-labelledby="tpose">
    <h2 id="tpose">T 姿四视</h2>
    <p>供 3D 建模（Tripo）参考，与 A 姿三视展示同一设计。</p>
    <div class="bunny-tpose-views">
      <AssetImage v-for="view in views" :id="tpose[view.key]" :key="view.key" :group="`layer-${layer}-tpose`" :caption="view.caption" />
    </div>
  </section>
</template>
