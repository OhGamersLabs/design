<script setup lang="ts">
import { computed } from 'vue'
import { useCharacter } from '../use-character'
import { data as world } from '../../data/world.data.mjs'

const props = withDefaults(defineProps<{
  section?: 'all' | 'profile' | 'spectrum'
}>(), {
  section: 'all',
})

const character = useCharacter()
const lore = computed(() => world.characters[character.value.id] ?? null)
const personas = computed(() => lore.value?.personas ?? [])
const spectrumPersonas = computed(() => personas.value.filter((p) => p.actingSpectrum?.length))
</script>

<template>
  <div
    v-if="(props.section === 'all' || props.section === 'profile') && personas.length"
    class="character-persona-list"
    :class="{ 'character-persona-list--pair': personas.length > 1 }"
  >
    <article v-for="persona in personas" :key="persona.id" class="character-persona" :aria-label="`${persona.name}性格与日常习惯`">
      <header class="character-persona__head">
        <div class="character-persona__title-group">
          <span class="character-persona__eyebrow">{{ persona.roleTag }}</span>
          <h3 class="character-persona__name">{{ persona.name }}</h3>
          <span v-if="persona.mbti" class="character-persona__mbti">{{ persona.mbti }}</span>
        </div>
        <p class="character-persona__archetype">{{ persona.archetype }}</p>
      </header>

      <div class="character-persona__layers" role="list" aria-label="三层性格结构">
        <div v-for="item in persona.temperament" :key="item.label" class="character-persona__layer" role="listitem">
          <span class="character-persona__layer-label">{{ item.label }}</span>
          <p class="character-persona__layer-text">{{ item.text }}</p>
        </div>
      </div>

      <div v-if="persona.desiresAndAversions?.length" class="character-persona__desires" role="list" aria-label="喜好厌恶与欲望底色">
        <div v-for="item in persona.desiresAndAversions" :key="item.label" class="character-persona__desire" role="listitem">
          <span class="character-persona__layer-label">{{ item.label }}</span>
          <p class="character-persona__layer-text">{{ item.detail }}</p>
        </div>
      </div>

      <div class="character-persona__body">
        <div class="character-persona__habits">
          <h4 class="character-persona__subhead">日常起居与下意识习惯</h4>
          <ul class="character-persona__habit-list">
            <li v-for="habit in persona.dailyHabits" :key="habit.title">
              <strong>{{ habit.title }}：</strong>{{ habit.detail }}
            </li>
          </ul>
        </div>

        <aside class="character-persona__side" aria-label="语感与神态锚点">
          <div class="character-persona__block">
            <h4 class="character-persona__subhead">说话方式与口癖</h4>
            <p>{{ persona.speechStyle }}</p>
          </div>
          <div class="character-persona__block">
            <h4 class="character-persona__subhead">情绪与神态锚点</h4>
            <p>{{ persona.actingCues }}</p>
          </div>
        </aside>
      </div>

      <footer v-if="props.section === 'profile' && persona.actingSpectrum?.length" class="character-persona__jump">
        <span>已按此人格坐标拆解 {{ persona.actingSpectrum.reduce((sum, g) => sum + g.count, 0) }} 张独立面孔与护目镜起居切换态</span>
        <a href="#expressions">下翻查看七情六欲图板与逐格清单 <span aria-hidden="true">↓</span></a>
      </footer>

      <div v-if="props.section === 'all' && persona.actingSpectrum?.length" class="character-persona__spectrum" aria-label="七情六欲全光谱面孔定义">
        <div class="character-persona__spectrum-head">
          <h4 class="character-persona__subhead">七情六欲 · 全光谱面孔定义清单（共 {{ persona.actingSpectrum.reduce((sum, g) => sum + g.count, 0) }} 张独立面孔）</h4>
          <span class="character-persona__spectrum-note">按情绪与欲望原子态自然推导，不设固定网格上限</span>
        </div>
        <div class="character-persona__spectrum-grid">
          <section v-for="group in persona.actingSpectrum" :key="group.axis" class="character-persona__axis">
            <header class="character-persona__axis-head">
              <strong>{{ group.axis }}</strong>
              <span>{{ group.count }} 张</span>
            </header>
            <ul class="character-persona__face-list">
              <li v-for="face in group.faces" :key="face.name">
                <b>{{ face.name }}</b>
                <em>{{ face.gearState }}</em>
                <span>{{ face.cue }}</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </article>
  </div>

  <div
    v-else-if="props.section === 'spectrum' && spectrumPersonas.length"
    class="character-persona-list character-persona-list--spectrum"
    :class="{ 'character-persona-list--pair': spectrumPersonas.length > 1 }"
  >
    <section
      v-for="persona in spectrumPersonas"
      :key="`${persona.id}-spectrum`"
      class="character-persona character-persona--spectrum-only"
      :aria-label="`${persona.name}七情六欲逐板面孔对照清单`"
    >
      <div class="character-persona__spectrum">
        <div class="character-persona__spectrum-head">
          <div class="character-persona__title-group">
            <h4 class="character-persona__subhead">
              {{ persona.name }} · 七情六欲逐板面孔与装备状态对照清单（共 {{ persona.actingSpectrum.reduce((sum, g) => sum + g.count, 0) }} 张独立面孔）
            </h4>
            <span v-if="persona.mbti" class="character-persona__mbti">{{ persona.mbti }}</span>
          </div>
          <span class="character-persona__spectrum-note">就近对照上方表情图板，逐格核验护目镜状态与面部微肌肉运动</span>
        </div>
        <div class="character-persona__spectrum-grid">
          <section v-for="group in persona.actingSpectrum" :key="group.axis" class="character-persona__axis">
            <header class="character-persona__axis-head">
              <strong>{{ group.axis }}</strong>
              <span>{{ group.count }} 张</span>
            </header>
            <ul class="character-persona__face-list">
              <li v-for="face in group.faces" :key="face.name">
                <b>{{ face.name }}</b>
                <em>{{ face.gearState }}</em>
                <span>{{ face.cue }}</span>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </section>
  </div>
</template>
