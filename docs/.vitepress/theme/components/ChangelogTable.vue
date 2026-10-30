<script setup lang="ts">
import { computed } from 'vue'
import { data } from '../../data/bunny-site.data.mjs'
import AssetImage from './AssetImage.vue'

const entries = computed(() => [...data.changes].sort((a, b) => b.date.localeCompare(a.date) || a.order - b.order))
</script>

<template>
  <table data-changelog class="bunny-changelog">
    <thead><tr><th scope="col">日期</th><th scope="col">改动</th><th scope="col">原因</th></tr></thead>
    <tbody>
      <tr v-for="entry in entries" :key="`${entry.date}-${entry.order}`">
        <td class="bunny-changelog__date"><time :datetime="entry.date">{{ entry.date }}</time></td>
        <td class="bunny-changelog__change"><AssetImage :id="entry.log.asset" :caption="entry.log.caption" group="log" use-thumb /><p>{{ entry.log.change }}</p></td>
        <td class="bunny-changelog__reason">{{ entry.log.reason }}</td>
      </tr>
    </tbody>
  </table>
</template>
