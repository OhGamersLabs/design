<script setup lang="ts">
import { computed } from 'vue'
import { data } from '../../data/bunny-site.data.mjs'
import { assetById } from '../bunny-site.mjs'
import ReleaseImage from './ReleaseImage.vue'

const props = withDefaults(defineProps<{
  id: string
  caption?: string
  detail?: string
  group?: string
  useThumb?: boolean
}>(), { useThumb: false })

const asset = computed(() => {
  if (props.id === 'bunny-original' && props.group !== undefined) {
    throw new Error('bunny-original cannot join a lightbox group')
  }
  return assetById(data.assets, props.id)
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
