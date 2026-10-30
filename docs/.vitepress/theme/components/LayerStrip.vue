<script setup lang="ts">
import { withBase } from 'vitepress'
import { data } from '../../data/bunny-site.data.mjs'
import AssetImage from './AssetImage.vue'
</script>

<template>
  <div class="bunny-layer-strip">
    <ol data-layer-strip>
      <li v-for="layer in data.layers" :key="layer.layer" :data-layer="layer.layer">
        <AssetImage :id="layer.front" group="layers" use-thumb />
        <div class="bunny-layer-strip__name"><b>{{ layer.layer }}</b><span>{{ layer.name }}</span></div>
        <p>{{ layer.summary }}</p>
        <a :href="withBase(layer.path)">查看设定</a>
      </li>
    </ol>
    <p class="bunny-layer-strip__note">「角色左 / 角色右」指角色自身，「画面左 / 画面右」指图面方向。</p>
  </div>
</template>
