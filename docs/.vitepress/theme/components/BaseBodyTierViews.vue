<script setup lang="ts">
import { computed } from 'vue'
import { data } from '../../data/base-bodies.data.mjs'
import BaseBodyImage from './BaseBodyImage.vue'

const props = defineProps<{ tier: string }>()
const current = computed(() => {
  const item = data.tiersById[props.tier]
  if (!item) throw new Error(`Unknown base body tier: ${props.tier}`)
  return item
})

const aposeViews: Array<{ key: 'front' | 'side' | 'back'; caption: string }> = [
  { key: 'front', caption: '正面' },
  { key: 'side', caption: '角色右侧面' },
  { key: 'back', caption: '背面' },
]

const tposeViews: Array<{ key: 'front' | 'right' | 'back' | 'left'; caption: string }> = [
  { key: 'front', caption: '正面' },
  { key: 'right', caption: '角色右侧面' },
  { key: 'back', caption: '背面' },
  { key: 'left', caption: '角色左侧面' },
]
</script>

<template>
  <section class="base-body-views" aria-labelledby="apose">
    <h2 id="apose">A 姿三视 <small>1024×1536 · 纯白底正交</small></h2>
    <p>正面、角色右侧面与背面三视图，点开任意一张后可用左右键逐张翻看或切换原始尺寸。</p>
    <div class="bunny-body-views">
      <BaseBodyImage
        v-for="view in aposeViews"
        :key="view.key"
        :id="current.apose[view.key]"
        :caption="view.caption"
        :group="`base-body-${current.id}-apose`"
      />
    </div>
  </section>

  <section class="bunny-tpose base-body-views" aria-labelledby="tpose">
    <h2 id="tpose">T 姿四视 <small>1024×1024 · 供 3D 建模参考</small></h2>
    <p>角色左侧面与角色右侧面均省去近侧手臂，完整露出肩帽、胸背与腰臀轮廓，与 A 姿三视保持同一体态比例。</p>
    <div class="bunny-tpose-views">
      <BaseBodyImage
        v-for="view in tposeViews"
        :key="view.key"
        :id="current.tpose[view.key]"
        :caption="view.caption"
        :group="`base-body-${current.id}-tpose`"
      />
    </div>
  </section>

  <section class="base-body-metrics" aria-labelledby="metrics">
    <h2 id="metrics">实测比例 <small>以单头高为单位，厘米身高未设定</small></h2>
    <dl class="base-body-metrics__grid">
      <div v-for="metric in current.metrics" :key="metric.label">
        <dt>{{ metric.label }}</dt>
        <dd>{{ metric.value }}</dd>
      </div>
    </dl>
  </section>
</template>
