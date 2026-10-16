<script setup lang="ts">
defineProps<{ reverse?: boolean }>()
</script>

<template>
  <div class="editorial-pair" :class="{ 'editorial-pair--reverse': reverse }">
    <div class="editorial-pair__visual"><slot name="visual" /></div>
    <div class="editorial-pair__text"><slot name="text" /></div>
  </div>
</template>
