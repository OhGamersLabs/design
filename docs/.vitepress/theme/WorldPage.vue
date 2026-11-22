<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import { data as world } from '../data/world.data.mjs'
import { data as site } from '../data/site.data.mjs'
import { readingNeighbors } from './character-site.mjs'
import WorldOriginFactions from './components/WorldOriginFactions.vue'
import WorldMysteryOnboarding from './components/WorldMysteryOnboarding.vue'
import WorldCoinInteractive from './components/WorldCoinInteractive.vue'
import WorldArkGenerations from './components/WorldArkGenerations.vue'
import WorldImage from './components/WorldImage.vue'

const { frontmatter, page } = useData()

const mode = computed(() => {
  const value: unknown = frontmatter.value.pageType
  if (value === 'overview' || value === 'races') return value
  throw new Error(`Unknown world page layout: ${String(value)}`)
})

const neighbors = computed(() => {
  const currentPath = `/${page.value.relativePath.replace(/\.md$/, '').replace(/(^|\/)index$/, '$1')}`
  return readingNeighbors(world.readingOrder, currentPath)
})

const rosterById = computed(() => Object.fromEntries(site.roster.map((entry) => [entry.id, entry])))
</script>

<template>
  <main
    class="bunny-page world-page"
    :class="mode === 'races' ? 'bunny-page--inner world-page--races' : 'world-page--overview'"
  >
    <aside v-if="mode === 'races'" class="bunny-side-card world-side-card" aria-label="种族谱系导航">
      <div class="bunny-reference-card__heading">
        <p class="bunny-side-card__home">
          <a :href="withBase('/world/')">世界观总览</a> / <span>五大种族</span>
        </p>
        <p class="bunny-side-card__title">五大种族谱系</p>
        <p class="bunny-layer-card__position">生理特征 · 文明栖地 · 姓氏规则</p>
      </div>
      <nav class="bunny-reference-card__contents" aria-label="种族目录">
        <a v-for="race in world.races" :key="race.id" :href="`#${race.id}`">
          {{ race.name }} · {{ race.enName }}
        </a>
      </nav>
      <p class="bunny-side-card__callout">
        <b>姓氏与种族</b>五族姓氏各自遵循独立的构词文化：人族沿袭家族行会，天羽族取自苍穹古音，硅碳族承继精瓷工坊，智械族立于锻炉炉心，星兽族守望物种图腾。
      </p>
    </aside>

    <div class="bunny-page__body">
      <template v-if="mode === 'overview'">
        <section class="world-hero" aria-label="世界观提要">
          <div class="world-hero__main">
            <p class="roster-section__label">OhGamers · World Bible</p>
            <h1 class="world-hero__title">{{ world.title }}</h1>
            <p class="world-hero__subtitle">{{ world.subtitle }}</p>
            <p class="world-hero__intro">{{ world.intro }}</p>
            <div class="world-hero__actions">
              <a class="roster-section__more" :href="`#relic-sheets`">浏览核心信物设定板与交互图解 <span aria-hidden="true">↓</span></a>
              <a class="world-hero__secondary" :href="withBase('/world/races')">浏览五大种族与姓氏谱系</a>
            </div>
          </div>
          <aside class="bunny-idcard world-hero__card" aria-label="世界档案概览">
            <dl class="bunny-facts">
              <div v-for="fact in world.facts" :key="fact.term">
                <dt>{{ fact.term }}</dt>
                <dd>{{ fact.value }}<small v-if="fact.note">{{ fact.note }}</small></dd>
              </div>
            </dl>
            <dl class="bunny-status">
              <div><dt>状态</dt><dd>{{ world.status }}</dd></div>
              <div><dt>最近更新</dt><dd><time :datetime="world.updated">{{ world.updated }}</time></dd></div>
            </dl>
          </aside>
        </section>

        <nav class="bunny-chapters world-chapters" aria-label="本页章节">
          <a v-for="chapter in world.overviewChapters" :key="chapter.id" :href="`#${chapter.id}`">{{ chapter.label }}</a>
        </nav>

        <div class="vp-doc">
          <div class="bunny-section-heading">
            <h2 id="relic-sheets">核心信物设定图鉴</h2>
            <p>{{ world.relicSheets.lead }}</p>
          </div>

          <div class="world-relic-list">
            <article v-for="sheet in world.relicSheets.items" :key="sheet.asset" class="world-relic-card">
              <div class="world-relic-card__head">
                <span class="world-pillar-card__code">{{ sheet.code }}</span>
                <h3>{{ sheet.title }}</h3>
              </div>
              <WorldImage
                :id="sheet.asset"
                :caption="sheet.caption"
                group="world-relic-sheets"
              />
              <div class="world-relic-badges">
                <div v-for="badge in sheet.badges" :key="badge.pos" class="world-relic-badge">
                  <b>{{ badge.pos }}</b>
                  <span>{{ badge.desc }}</span>
                </div>
              </div>
            </article>
          </div>

          <div class="bunny-section-heading">
            <h2 id="stage">创世原点与三大宿敌</h2>
            <p>{{ world.originAndFactions.lead }}</p>
          </div>

          <WorldOriginFactions />

          <div class="world-three-grid">
            <article v-for="faction in world.originAndFactions.factions" :key="faction.code" class="base-body-rule-card world-pillar-card">
              <span class="world-pillar-card__code">{{ faction.code }}</span>
              <h3>{{ faction.title }}</h3>
              <p>{{ faction.body }}</p>
            </article>
          </div>

          <div class="bunny-section-heading">
            <h2 id="coin-pact">单币解谜与抛币铁律</h2>
            <p>{{ world.coinPact.lead }}</p>
          </div>

          <WorldMysteryOnboarding />
          <WorldCoinInteractive />

          <div class="world-axiom-grid">
            <article v-for="axiom in world.coinPact.axioms" :key="axiom.code" class="base-body-rule-card world-pillar-card world-axiom-card">
              <span class="world-pillar-card__code">{{ axiom.code }}</span>
              <h3>{{ axiom.title }}</h3>
              <p>{{ axiom.body }}</p>
            </article>
          </div>

          <div class="bunny-section-heading">
            <h2 id="echoes-ark">归航号与跨代回响</h2>
            <p>{{ world.echoesAndArk.lead }}</p>
          </div>

          <WorldArkGenerations />

          <div class="world-three-grid">
            <article v-for="card in world.echoesAndArk.cards" :key="card.code" class="base-body-rule-card world-pillar-card">
              <span class="world-pillar-card__code">{{ card.code }}</span>
              <h3>{{ card.title }}</h3>
              <p>{{ card.body }}</p>
            </article>
          </div>

          <div class="bunny-section-heading">
            <h2 id="pillars">科技与能量法则</h2>
            <p>贯穿全队十套设定与武装的底层世界观逻辑。</p>
          </div>
          <div class="base-body-rules-grid">
            <article v-for="pillar in world.pillars" :key="pillar.code" class="base-body-rule-card world-pillar-card">
              <span class="world-pillar-card__code">{{ pillar.code }}</span>
              <h3>{{ pillar.title }}</h3>
              <p>{{ pillar.body }}</p>
            </article>
          </div>

          <div class="bunny-section-heading">
            <h2 id="races">五大种族总览</h2>
            <p>每种生命形态都有清晰的生理特征、寿命尺度、栖地生态与专属姓氏构词规则。</p>
          </div>
          <div class="world-race-grid">
            <article v-for="race in world.races" :key="race.id" class="world-race-card">
              <div class="world-race-card__head">
                <h3><a :href="withBase(`/world/races#${race.id}`)">{{ race.name }}</a></h3>
                <span class="world-race-card__en">{{ race.enName }}</span>
              </div>
              <p class="world-race-card__tagline">{{ race.tagline }}</p>
              <p class="world-race-card__rule"><b>姓氏谱系：</b>{{ race.surnameRule }}</p>
              <div class="world-race-card__members">
                <a
                  v-for="memberId in race.members"
                  :key="memberId"
                  class="world-member-pill"
                  :href="withBase(`/characters/${memberId}/`)"
                >{{ world.characters[memberId]?.name }}</a>
              </div>
            </article>
          </div>

          <div class="bunny-section-heading">
            <h2 id="squad">初代十人名录</h2>
            <p>正式中英文全名、种族归属、职业定位与共鸣特质速览。</p>
          </div>
          <div class="base-body-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>中文全名</th>
                  <th>英文名</th>
                  <th>种族谱系</th>
                  <th>职业定位</th>
                  <th>共鸣特质与人物速写</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in site.roster" :key="entry.id">
                  <td><a :href="withBase(entry.home)">{{ entry.name }}</a><small v-if="world.characters[entry.id]?.twinNote" class="world-table-note">{{ world.characters[entry.id].twinNote }}</small></td>
                  <td>{{ world.characters[entry.id]?.enName ?? '—' }}</td>
                  <td>
                    <a v-if="world.characters[entry.id]?.raceId" :href="withBase(`/world/races#${world.characters[entry.id].raceId}`)">{{ world.characters[entry.id].raceLabel }}</a>
                    <span v-else>—</span>
                  </td>
                  <td>{{ entry.role }}</td>
                  <td>
                    <b v-if="world.characters[entry.id]?.pactTrait" class="world-table-trait">{{ world.characters[entry.id].pactTrait }}</b>
                    <span>{{ world.characters[entry.id]?.tagline ?? '—' }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="vp-doc">
          <h1 class="world-detail-title">五大种族与姓氏谱系</h1>
          <p class="world-detail-lead">炽环星域由五大生命谱系共同构筑。各族在生理构造、寿命跨度、栖居生态与能源驾驭上各具边界，其姓氏体系亦直接映照族群文化与来处。</p>

          <section v-for="race in world.races" :key="race.id" class="world-race-detail">
            <h2 :id="race.id">{{ race.name }} <small>{{ race.enName }}</small></h2>
            <p class="world-race-detail__tagline">{{ race.tagline }}</p>
            <dl class="world-race-detail__dl">
              <div>
                <dt>生命形态</dt>
                <dd>{{ race.physiology }}</dd>
              </div>
              <div>
                <dt>文明栖地</dt>
                <dd>{{ race.homeland }}</dd>
              </div>
              <div>
                <dt>姓氏规则</dt>
                <dd>{{ race.surnameRule }}</dd>
              </div>
            </dl>
            <div class="world-race-detail__members">
              <p class="world-race-detail__members-label">小队代表成员</p>
              <div class="world-member-cards">
                <a
                  v-for="memberId in race.members"
                  :key="memberId"
                  class="world-member-card"
                  :href="withBase(`/characters/${memberId}/`)"
                >
                  <div class="world-member-card__head">
                    <b>{{ world.characters[memberId]?.name }}</b>
                    <span>{{ world.characters[memberId]?.enName }}</span>
                  </div>
                  <p class="world-member-card__role">{{ rosterById[memberId]?.role ?? world.characters[memberId]?.role }}</p>
                  <p class="world-member-card__copy">{{ world.characters[memberId]?.tagline }}</p>
                </a>
              </div>
            </div>
          </section>
        </div>

        <nav class="bunny-pager" aria-label="相邻页面">
          <a v-if="neighbors.prev" class="bunny-pager__prev" :href="withBase(neighbors.prev.path)">
            <small>上一页</small><b>{{ neighbors.prev.title }}</b>
          </a>
          <a v-if="neighbors.next" class="bunny-pager__next" :href="withBase(neighbors.next.path)">
            <small>下一页</small><b>{{ neighbors.next.title }}</b>
          </a>
        </nav>
      </template>
    </div>
  </main>
</template>

<style scoped>
.world-relic-list {
  display: grid;
  gap: 24px;
  margin: 20px 0 36px;
}
.world-relic-card {
  padding: 22px 24px 24px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 14px;
  background: var(--vp-c-bg);
}
.world-relic-card__head h3 {
  margin: 6px 0 0;
  font-size: 19px;
  font-weight: 700;
  line-height: 1.4;
}
.world-relic-card :deep(.release-image) {
  margin: 16px 0 18px;
}
.world-relic-badges {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px 12px;
}
.world-relic-badge {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
}
.world-relic-badge b {
  color: var(--vp-c-text-1);
  font-size: 13px;
  font-weight: 700;
  line-height: 1.45;
}
.world-relic-badge span {
  color: var(--vp-c-text-2);
  font-size: 12.5px;
  line-height: 1.55;
}
@media (max-width: 640px) {
  .world-relic-card {
    padding: 16px;
  }
}
</style>
