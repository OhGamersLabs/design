<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import { data as world } from '../data/world.data.mjs'
import { data as site } from '../data/site.data.mjs'
import { readingNeighbors } from './character-site.mjs'

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
              <a class="roster-section__more" :href="withBase('/world/races')">浏览五大种族与姓氏谱系 <span aria-hidden="true">↗</span></a>
              <a class="world-hero__secondary" :href="withBase('/')">返回十人角色资料库</a>
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
            <h2 id="stage">世界舞台</h2>
            <p>炽环跃迁门、白塔星港与一枚 OG 金币串起的主线舞台。</p>
          </div>
          <div class="world-stage-grid">
            <article class="base-body-rule-card">
              <h3>炽环门与白塔星港</h3>
              <p>巨型环状跃迁门「炽环门」将散落星海的浮空云塔、高轨道精瓷穹顶、荒原锻炉与游牧星舟相连。航网枢纽「白塔星港」在晴空下立起纯白高塔与轨道船坞，成为五大种族通商、修舰与集结的自由舞台。</p>
            </article>
            <article class="base-body-rule-card">
              <h3>裂隙潮汐与 OG 契约</h3>
              <p>星环轨道的周期性扰动「裂隙潮汐」会带来能源暴走、失控机群与边境断航。赏金猎人兄妹罗伊·达罗与罗娅·达罗重启白塔船坞的自由委托执照，凭压纹 OG 金币结契，将十位跨种族同伴聚拢成并肩远征的星环小队。</p>
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
            <p>每种生命形态都有清晰的生理特征、栖地生态与专属姓氏构词规则。</p>
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
            <h2 id="squad">十人小队名录</h2>
            <p>正式中英文全名、种族归属、职业定位与角色背景一句话速览。</p>
          </div>
          <div class="base-body-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>中文全名</th>
                  <th>英文名</th>
                  <th>种族谱系</th>
                  <th>职业定位</th>
                  <th>人物速写</th>
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
                  <td>{{ world.characters[entry.id]?.tagline ?? '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="vp-doc">
          <h1 class="world-detail-title">五大种族与姓氏谱系</h1>
          <p class="world-detail-lead">炽环星域由五大生命谱系共同构筑。各族在生理构造、栖居生态与能源驾驭上各具边界，其姓氏体系亦直接映照族群文化与来处。</p>

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
