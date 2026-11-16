<script setup lang="ts">
import { useCharacter } from '../use-character'
import AssetImage from './AssetImage.vue'

const data = useCharacter()
</script>

<template>
  <AssetImage :id="`${data.id}-original-latest`" class="bunny-origin" caption="画师原稿 · 设计依据" detail="现行造型以本站三视为准" use-thumb />
</template>
