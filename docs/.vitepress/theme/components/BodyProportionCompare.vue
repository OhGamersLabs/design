<script setup lang="ts">
import { withBase } from 'vitepress'

type View = { label: string; centerX: number; crownY: number; floorY: number }
type Source = { label: string; src: string; width: number; views: View[] }
const props = defineProps<{ previous: Source; candidate: Source }>()
const frameRatio = 0.4
const imagePadding = 0.02
const frameStyle = {
  aspectRatio: String(frameRatio / (1 + 2 * imagePadding)),
  '--body-guide-inset': `${imagePadding / (1 + 2 * imagePadding) * 100}%`,
}

function imageStyle(source: Source, view: View) {
  const height = view.floorY - view.crownY
  // Both sources share one display height. A single scale per view preserves
  // image proportions; translation removes the source board's headings.
  return {
    width: `${source.width / height / frameRatio * 100}%`,
    left: `${50 - view.centerX / height / frameRatio * 100}%`,
    top: `${(imagePadding - view.crownY / height) / (1 + 2 * imagePadding) * 100}%`,
  }
}
</script>

<template>
  <div class="body-comparison" :aria-label="`${previous.label}与${candidate.label}的等高图面对照`">
    <p class="body-comparison__note">以图面冠顶与赤脚地面统一显示高度；等比缩放与平移，不改变原图身体宽窄。对齐点为图面近似位置，不是骨骼测量。</p>
    <div class="body-comparison__views">
      <section v-for="(view, index) in previous.views" :key="view.label" class="body-comparison__view" :aria-label="view.label">
        <h3>{{ view.label }}</h3>
        <div class="body-comparison__pair">
          <figure v-for="source in [props.previous, props.candidate]" :key="source.src">
            <figcaption>{{ source.label }}</figcaption>
            <div class="body-comparison__frame" :style="frameStyle">
              <img class="body-comparison__image" :src="withBase(source.src)" :alt="`${source.label} · ${source.views[index].label}图面等高裁切`" :style="imageStyle(source, source.views[index])" loading="lazy" decoding="async" />
            </div>
          </figure>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.body-comparison__note { color: var(--vp-c-text-2); font-size: 13px; line-height: 1.7; }
.body-comparison__views { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
.body-comparison__view h3 { margin: 16px 0 10px; font-size: 16px; text-align: center; }
.body-comparison__pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
.body-comparison figure { min-width: 0; margin: 0; }
.body-comparison figcaption { min-height: 36px; color: var(--vp-c-text-2); font-size: 12px; text-align: center; line-height: 1.5; }
.body-comparison__frame { position: relative; overflow: hidden; background: white; }
.body-comparison__frame::before, .body-comparison__frame::after { position: absolute; z-index: 1; right: 0; left: 0; border-top: 1px dashed var(--vp-c-divider); content: ""; pointer-events: none; }
.body-comparison__frame::before { top: var(--body-guide-inset); }
.body-comparison__frame::after { bottom: var(--body-guide-inset); }
.body-comparison__image { position: absolute; display: block; max-width: none; height: auto; margin: 0; }
@media (max-width: 639px) {
  .body-comparison__views { grid-template-columns: 1fr; gap: 12px; }
  .body-comparison__pair { width: min(100%, 360px); margin: 0 auto; gap: 12px; }
}
</style>
