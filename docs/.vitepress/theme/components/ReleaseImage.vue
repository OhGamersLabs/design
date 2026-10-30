<script lang="ts">
interface PreviewImage {
  imageUrl: string | undefined
  originalUrl: string | undefined
  alt: string
  caption: string | undefined
}

interface RegisteredImage {
  group: string | undefined
  button: HTMLButtonElement | undefined
  read: () => PreviewImage
}

// Register only mounted images: server renders never share a gallery or retain
// component instances across requests. Each opened dialog owns its snapshot.
const registeredImages = new Set<RegisteredImage>()
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { withBase } from 'vitepress'
import { focusAfterStep, stepIndex } from '../bunny-site.mjs'

const props = defineProps<{
  src: string
  alt: string
  original?: string
  caption?: string
  lightboxCaption?: string
  detail?: string
  width?: number
  height?: number
  thumb?: string
  thumbWidth?: number
  thumbHeight?: number
  group?: string
  assetId?: string
}>()

const dialog = ref<HTMLDialogElement>()
const triggerButton = ref<HTMLButtonElement>()
const viewport = ref<HTMLDivElement>()
const prevButton = ref<HTMLButtonElement>()
const nextButton = ref<HTMLButtonElement>()
const closeButton = ref<HTMLButtonElement>()
const isOpen = ref(false)
const isDetailView = ref(false)
const previewImages = ref<PreviewImage[]>([])
const previewIndex = ref(0)
let trigger: HTMLButtonElement | undefined

// Release URLs are local paths or HTTPS links. Never turn another scheme
// into a clickable download link, even if a future content import is wrong.
function resolveUrl(value: string): string | undefined {
  if (/^\/(?!\/)/.test(value) || /^https:\/\//i.test(value)) return withBase(value)
  return undefined
}

const imageUrl = computed(() => resolveUrl(props.src))
const thumbnailUrl = computed(() => resolveUrl(props.thumb ?? props.src))
const originalUrl = computed(() => resolveUrl(props.original || props.src))
const lightboxGroup = computed(() => (
  props.assetId === 'bunny-original-latest' || /\/origins\/bunny-original-latest\.(?:webp|png)$/.test(props.src)
    ? undefined
    : props.group || undefined
))
const activeImage = computed(() => previewImages.value[previewIndex.value] ?? readImage())

function readImage(): PreviewImage {
  return {
    imageUrl: imageUrl.value,
    originalUrl: originalUrl.value,
    alt: props.alt,
    caption: props.lightboxCaption ?? props.caption,
  }
}

const registration: RegisteredImage = {
  get group() { return lightboxGroup.value },
  get button() { return triggerButton.value },
  read: readImage,
}

function openDialog() {
  if (!dialog.value || !imageUrl.value || dialog.value.open) return
  // Capture the actual opening button, including browsers where a mouse click
  // does not focus it. Changing slides must never change this return target.
  trigger = triggerButton.value
  const group = lightboxGroup.value
  const images = group
    ? [...registeredImages]
      .filter((image) => image.group === group && image.button?.isConnected && image.read().imageUrl)
      .sort((first, second) => {
        if (!first.button || !second.button) return 0
        const position = first.button.compareDocumentPosition(second.button)
        if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1
        if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1
        return 0
      })
    : [registration]
  previewImages.value = images.length ? images.map((image) => image.read()) : [readImage()]
  previewIndex.value = Math.max(0, images.indexOf(registration))
  isDetailView.value = false
  isOpen.value = true
  dialog.value.showModal()
}

async function movePreview(delta: number) {
  const active = document.activeElement
  const focused = active === prevButton.value ? 'prev' : active === nextButton.value ? 'next' : 'other'
  previewIndex.value = stepIndex(previewIndex.value, delta, previewImages.value.length)
  await nextTick()
  const target = focusAfterStep(focused, {
    prevDisabled: previewIndex.value === 0,
    nextDisabled: previewIndex.value >= previewImages.value.length - 1,
  })
  if (target === 'prev') prevButton.value?.focus()
  else if (target === 'next') nextButton.value?.focus()
  else if (target === 'close') closeButton.value?.focus()
}

async function toggleDetailView() {
  isDetailView.value = !isDetailView.value
  if (!isDetailView.value) return
  await nextTick()
  if (isOpen.value && isDetailView.value) viewport.value?.focus({ preventScroll: true })
}

function onKeydown(event: KeyboardEvent) {
  if (!lightboxGroup.value || isDetailView.value || !isOpen.value) return
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault()
    movePreview(event.key === 'ArrowLeft' ? -1 : 1)
  }
}

function closeDialog() {
  dialog.value?.close()
}

function onClose() {
  isOpen.value = false
  if (trigger?.isConnected) trigger.focus()
  trigger = undefined
  previewImages.value = []
  previewIndex.value = 0
}

function onBackdropClick(event: MouseEvent) {
  if (event.target === dialog.value) closeDialog()
}

onMounted(() => registeredImages.add(registration))

onBeforeUnmount(() => {
  registeredImages.delete(registration)
  if (dialog.value?.open) dialog.value.close()
})
</script>

<template>
  <figure class="release-image" :data-asset-id="assetId">
    <button
      v-if="imageUrl"
      ref="triggerButton"
      class="release-image__trigger"
      type="button"
      :data-lightbox-group="lightboxGroup"
      aria-haspopup="dialog"
      :aria-label="`放大查看：${alt}`"
      @click="openDialog"
    >
      <img
        :src="thumbnailUrl"
        :alt="alt"
        :width="thumb === undefined ? width : thumbWidth"
        :height="thumb === undefined ? height : thumbHeight"
        loading="lazy"
        decoding="async"
      />
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
      :aria-label="`图片预览：${activeImage.alt}`"
      @click="onBackdropClick"
      @close="onClose"
      @cancel.prevent="closeDialog"
      @keydown="onKeydown"
    >
      <div class="release-image__panel">
        <div class="release-image__toolbar">
          <div class="release-image__heading">
            <p>{{ activeImage.alt }}</p>
            <p v-if="lightboxGroup && isOpen" data-lightbox-counter aria-live="polite">第 {{ previewIndex + 1 }} 张，共 {{ previewImages.length }} 张</p>
          </div>
          <div class="release-image__controls">
            <template v-if="lightboxGroup">
              <button
                type="button"
                ref="prevButton"
                class="release-image__close"
                data-lightbox-prev
                aria-label="上一张"
                :disabled="previewIndex === 0"
                @click="movePreview(-1)"
              >上一张</button>
              <button
                type="button"
                ref="nextButton"
                class="release-image__close"
                data-lightbox-next
                aria-label="下一张"
                :disabled="previewIndex >= previewImages.length - 1"
                @click="movePreview(1)"
              >下一张</button>
            </template>
            <button
              type="button"
              class="release-image__close"
              :aria-pressed="isDetailView"
              @click="toggleDetailView"
            >{{ isDetailView ? '适应屏幕' : '原始尺寸' }}</button>
            <button ref="closeButton" type="button" class="release-image__close" autofocus @click="closeDialog">
              关闭 <span aria-hidden="true">×</span>
            </button>
          </div>
        </div>
        <div
          ref="viewport"
          class="release-image__viewport"
          :class="{ 'release-image__viewport--detail': isDetailView }"
          role="region"
          aria-label="图片滚动区域"
          tabindex="0"
        >
          <img v-if="isOpen" :src="activeImage.originalUrl || activeImage.imageUrl" :alt="activeImage.alt" />
        </div>
        <div class="release-image__details">
          <p v-if="activeImage.caption">{{ activeImage.caption }}</p>
          <a v-if="activeImage.originalUrl" :href="activeImage.originalUrl" target="_blank" rel="noopener noreferrer">在新窗口查看原图 <span aria-hidden="true">↗</span></a>
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
.release-image__heading { min-width: 0; overflow-wrap: anywhere; }
.release-image__heading [data-lightbox-counter] { margin-top: 4px; color: var(--vp-c-text-2); font-size: 12px; font-weight: 400; }
.release-image__controls { display: flex; flex-shrink: 0; align-items: center; gap: 8px; }
.release-image__close { display: inline-flex; flex-shrink: 0; align-items: center; gap: 10px; min-height: 36px; padding: 4px 10px; border: 1px solid var(--vp-c-divider); border-radius: 6px; font-size: 13px; cursor: pointer; }
.release-image__close span { font-size: 24px; font-weight: 400; line-height: 1; }
.release-image__close:hover { background: var(--vp-c-bg-soft); }
.release-image__close:disabled { opacity: .4; cursor: default; }
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
  .release-image__hint { gap: 0; font-size: 0; }
  .release-image__hint span { font-size: 14px; }
  .release-image__dialog { width: calc(100vw - 16px); max-height: calc(100dvh - 16px); border-radius: 10px; }
  .release-image__panel { max-height: calc(100dvh - 18px); }
  .release-image__toolbar { flex-wrap: wrap; gap: 12px; padding: 12px; }
  .release-image__controls { flex-wrap: wrap; gap: 6px; }
  .release-image__viewport { padding: 8px; }
  .release-image__details { padding: 12px; }
}
</style>
