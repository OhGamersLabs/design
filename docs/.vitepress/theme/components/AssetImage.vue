<script setup lang="ts">
import { computed } from 'vue'
import { useCharacter } from '../use-character'
import { assetById } from '../character-site.mjs'
import ReleaseImage from './ReleaseImage.vue'

const props = withDefaults(defineProps<{
  id: string
  character?: string
  caption?: string
  detail?: string
  group?: string
  useThumb?: boolean
}>(), { useThumb: false })

const data = useCharacter(() => props.character)
const asset = computed(() => {
  const result = assetById(data.value.assets, props.id)
  if (result.collection === 'origins' && props.group !== undefined) {
    throw new Error(`${props.id} cannot join a lightbox group`)
  }
  return result
})
</script>

<template>
  <ReleaseImage
    :src="asset.web.path"
    :original="asset.original.path"
    :width="asset.web.width"
    :height="asset.web.height"
    :thumb="useThumb ? asset.thumb.path : undefined"
    :thumb-width="useThumb ? asset.thumb.width : undefined"
    :thumb-height="useThumb ? asset.thumb.height : undefined"
    :alt="asset.name"
    :caption="caption ?? asset.name"
    :lightbox-caption="asset.name"
    :detail="detail"
    :group="group"
    :asset-id="id"
  />
</template>
