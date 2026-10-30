<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import AnchorFallback from './components/AnchorFallback.vue'
</script>

<template>
  <DefaultTheme.Layout>
    <template #layout-bottom><AnchorFallback /></template>
  </DefaultTheme.Layout>
</template>
