<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { withBase } from 'vitepress'

const props = defineProps<{
  src: string
  alt: string
  original?: string
  caption?: string
  detail?: string
  width?: number
  height?: number
}>()

const dialog = ref<HTMLDialogElement>()
const isOpen = ref(false)
const isDetailView = ref(false)
let trigger: HTMLElement | null = null

// Release URLs are local paths or HTTPS links. Never turn another scheme
// into a clickable download link, even if a future content import is wrong.
function resolveUrl(value: string): string | undefined {
  if (/^\/(?!\/)/.test(value) || /^https:\/\//i.test(value)) return withBase(value)
  return undefined
}

const imageUrl = computed(() => resolveUrl(props.src))
const originalUrl = computed(() => resolveUrl(props.original || props.src))

function openDialog() {
  if (!dialog.value || !imageUrl.value) return
  trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
  isDetailView.value = false
  isOpen.value = true
  dialog.value.showModal()
}

function closeDialog() {
  dialog.value?.close()
}

function onClose() {
  isOpen.value = false
  trigger?.focus()
  trigger = null
}

function onBackdropClick(event: MouseEvent) {
  if (event.target === dialog.value) closeDialog()
}

onBeforeUnmount(() => {
  if (dialog.value?.open) dialog.value.close()
})
</script>

<template>
  <figure class="release-image">
    <button
      v-if="imageUrl"
      class="release-image__trigger"
      type="button"
      aria-haspopup="dialog"
      :aria-label="`放大查看：${alt}`"
      @click="openDialog"
    >
      <img :src="imageUrl" :alt="alt" :width="width" :height="height" loading="lazy" decoding="async" />
      <span class="release-image__hint" aria-hidden="true">点击放大 <span>↗</span></span>
    </button>
    <p v-else class="release-image__unavailable">图片暂不可用</p>
    <figcaption v-if="caption || originalUrl" class="release-image__caption">
      <span class="release-image__caption-copy">
        <span class="figure-number" aria-hidden="true"></span>
        <strong v-if="caption">{{ caption }}</strong>
        <span v-if="detail" class="release-image__caption-detail">{{ detail }}</span>
      </span>
      <a v-if="originalUrl" :href="originalUrl" target="_blank" rel="noopener noreferrer">查看原图 <span aria-hidden="true">↗</span></a>
    </figcaption>

    <dialog
      ref="dialog"
      class="release-image__dialog"
      :aria-label="`图片预览：${alt}`"
      @click="onBackdropClick"
      @close="onClose"
      @cancel.prevent="closeDialog"
    >
      <div class="release-image__panel">
        <div class="release-image__toolbar">
          <p>{{ alt }}</p>
          <div class="release-image__controls">
            <button
              type="button"
              class="release-image__close"
              :aria-pressed="isDetailView"
              @click="isDetailView = !isDetailView"
            >{{ isDetailView ? '适应屏幕' : '原始尺寸' }}</button>
            <button type="button" class="release-image__close" autofocus @click="closeDialog">
              关闭 <span aria-hidden="true">×</span>
            </button>
          </div>
        </div>
        <div
          class="release-image__viewport"
          :class="{ 'release-image__viewport--detail': isDetailView }"
          role="region"
          aria-label="图片滚动区域"
          tabindex="0"
        >
          <img v-if="isOpen" :src="originalUrl || imageUrl" :alt="alt" />
        </div>
        <div class="release-image__details">
          <p v-if="caption">{{ caption }}</p>
          <a v-if="originalUrl" :href="originalUrl" target="_blank" rel="noopener noreferrer">在新窗口查看原图 <span aria-hidden="true">↗</span></a>
        </div>
      </div>
    </dialog>
  </figure>
</template>

<style scoped>
.release-image { margin: 32px 0; }
.release-image__trigger { position: relative; display: block; width: 100%; padding: 12px; overflow: hidden; cursor: zoom-in; border: 1px solid var(--vp-c-divider); border-radius: 12px; background: var(--vp-c-bg-soft); }
.release-image__trigger img { display: block; width: 100%; height: auto; max-height: 760px; margin: 0 auto; object-fit: contain; border-radius: 6px; }
.release-image__hint { position: absolute; right: 24px; bottom: 24px; display: inline-flex; align-items: center; gap: 8px; padding: 5px 10px; border: 1px solid var(--vp-c-divider); border-radius: 6px; background: var(--vp-c-bg); color: var(--vp-c-text-2); font-size: 12px; font-weight: 500; }
.release-image__hint span { font-size: 16px; }
.release-image__caption { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px 20px; margin-top: 10px; color: var(--vp-c-text-2); font-size: 13px; line-height: 1.7; }
.release-image__caption a { white-space: nowrap; }
.release-image__unavailable { padding: 32px; border: 1px solid var(--vp-c-divider); border-radius: 12px; text-align: center; color: var(--vp-c-text-2); }
.release-image__dialog { width: min(1440px, calc(100vw - 48px)); max-width: none; max-height: calc(100dvh - 48px); margin: auto; padding: 0; overflow: hidden; border: 1px solid var(--vp-c-divider); border-radius: 14px; background: var(--vp-c-bg); color: var(--vp-c-text-1); box-shadow: 0 24px 80px #10102640; }
.release-image__dialog::backdrop { background: #111229b8; backdrop-filter: blur(4px); }
.release-image__panel { display: flex; flex-direction: column; max-height: calc(100dvh - 50px); }
.release-image__toolbar { display: flex; flex-shrink: 0; align-items: center; justify-content: space-between; gap: 20px; padding: 16px 20px; border-bottom: 1px solid var(--vp-c-divider); }
.release-image__toolbar p { margin: 0; font-size: 14px; font-weight: 600; line-height: 1.5; }
.release-image__controls { display: flex; flex-shrink: 0; align-items: center; gap: 8px; }
.release-image__close { display: inline-flex; flex-shrink: 0; align-items: center; gap: 10px; min-height: 36px; padding: 4px 10px; border: 1px solid var(--vp-c-divider); border-radius: 6px; font-size: 13px; cursor: pointer; }
.release-image__close span { font-size: 24px; font-weight: 400; line-height: 1; }
.release-image__close:hover { background: var(--vp-c-bg-soft); }
.release-image__viewport { min-height: 0; padding: 16px; overflow: auto; background: var(--vp-c-bg-soft); }
.release-image__viewport img { display: block; width: auto; max-width: 100%; height: auto; max-height: calc(100dvh - 220px); margin: auto; object-fit: contain; }
.release-image__viewport--detail img { max-width: none; max-height: none; }
.release-image__details { display: flex; flex-shrink: 0; flex-wrap: wrap; justify-content: space-between; gap: 8px 20px; padding: 12px 20px; font-size: 13px; line-height: 1.7; }
.release-image__details p { margin: 0; color: var(--vp-c-text-2); }
.release-image__details a { white-space: nowrap; }
.release-image__trigger:focus-visible, .release-image__close:focus-visible { outline: 3px solid var(--vp-c-brand-1); outline-offset: 3px; }
.release-image__viewport:focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: -3px; }
@media (max-width: 640px) {
  .release-image__trigger { padding: 8px; }
  .release-image__hint { right: 16px; bottom: 16px; }
  .release-image__dialog { width: calc(100vw - 16px); max-height: calc(100dvh - 16px); border-radius: 10px; }
  .release-image__panel { max-height: calc(100dvh - 18px); }
  .release-image__toolbar { padding: 12px; }
  .release-image__viewport { padding: 8px; }
  .release-image__details { padding: 12px; }
}
</style>
