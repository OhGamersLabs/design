<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import { data as world } from '../data/world.data.mjs'
import { data as site } from '../data/site.data.mjs'
import { readingNeighbors } from './character-site.mjs'
import WorldOriginFactions from './components/WorldOriginFactions.vue'
import WorldCoreStructure from './components/WorldCoreStructure.vue'
import WorldRelicMeasurements from './components/WorldRelicMeasurements.vue'
import WorldMysteryOnboarding from './components/WorldMysteryOnboarding.vue'
import WorldCoinInteractive from './components/WorldCoinInteractive.vue'
import WorldArkGenerations from './components/WorldArkGenerations.vue'
import CharacterPersona from './components/CharacterPersona.vue'
import WorldImage from './components/WorldImage.vue'
import ReleaseImage from './components/ReleaseImage.vue'

const { frontmatter, page } = useData()

const mode = computed(() => {
  const value: unknown = frontmatter.value.pageType
  if (value === 'overview' || value === 'races' || value === 'cast') return value
  throw new Error(`Unknown world page layout: ${String(value)}`)
})

const neighbors = computed(() => {
  const currentPath = `/${page.value.relativePath.replace(/\.md$/, '').replace(/(^|\/)index$/, '$1')}`
  return readingNeighbors(world.readingOrder, currentPath)
})

const rosterById = computed(() => Object.fromEntries([...site.roster, ...(site.majorCast ?? [])].map((entry) => [entry.id, entry])))

function characterMbtiBadges(characterId: string): string[] {
  const personas = world.characters[characterId]?.personas ?? []
  const withMbti = personas.filter((p: { mbti?: string }) => Boolean(p.mbti))
  if (!withMbti.length) return []
  if (personas.length > 1) {
    return withMbti.map((p: { id: string; name: string; mbti: string }) => {
      const prefix = p.id === 'roy' ? '罗伊' : p.id === 'roya' ? '罗娅' : p.name
      return `${prefix} · ${p.mbti}`
    })
  }
  return withMbti.map((p: { mbti: string }) => p.mbti)
}

function plateCountZh(count: number): string {
  return ({ 2: '两', 3: '三', 4: '四', 6: '六', 8: '八', 9: '九' } as Record<number, string>)[count] ?? String(count)
}

function faceCountZh(count: number): string {
  return ({ 6: '六', 9: '九', 12: '十二', 18: '十八', 28: '二十八', 30: '三十' } as Record<number, string>)[count] ?? String(count)
}

function castGearLabel(npcId: string): string {
  if (npcId === 'lorn-vele') return '天羽生物柔羽耳与装束状态'
  if (npcId === 'child-roy' || npcId === 'child-roya') return '船坞日常与暴雨夜状态'
  return '刚性镜具与工坊起居切换态'
}

function castSpectrumNote(npcId: string, plateCount: number): string {
  const count = plateCountZh(plateCount)
  if (npcId === 'lorn-vele') return `就近对照上方${count}张分板特写，逐格核验双侧白至冰青生物柔羽耳动势、锁芯明灭与面部微肌肉运动`
  if (npcId === 'child-roy' || npcId === 'child-roya') return `就近对照上方${count}张分板特写，逐格核验八岁幼态骨相、随身信物与面部微肌肉运动`
  return `就近对照上方${count}张分板特写，逐格核验刚性镜具状态与面部微肌肉运动`
}
</script>

<template>
  <main
    class="bunny-page world-page"
    :class="mode === 'overview' ? 'world-page--overview' : `bunny-page--inner world-page--${mode}`"
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

    <aside v-else-if="mode === 'cast' && world.storyCast" class="bunny-side-card world-side-card" aria-label="剧情角色导航">
      <div class="bunny-reference-card__heading">
        <p class="bunny-side-card__home">
          <a :href="withBase('/world/')">世界观总览</a> / <span>剧情角色图鉴</span>
        </p>
        <p class="bunny-side-card__title">剧情与敌方图鉴</p>
        <p class="bunny-layer-card__position">重点全拆解档 · 普通单张角色卡档</p>
      </div>
      <nav class="bunny-reference-card__contents" aria-label="剧情角色目录">
        <a href="#tier-rules">资产分级标准</a>
        <a href="#major-cast">重点角色 · 索伦·韦恩</a>
        <a v-for="npc in world.storyCast.standardCards" :key="npc.id" :href="`#${npc.id}`">
          角色卡 · {{ npc.name }}
        </a>
      </nav>
      <p class="bunny-side-card__callout">
        <b>双轨制资产规范</b>核心反派首领纳入重点角色档，严格配齐标准通用素体与多层着装拆解；财团兵种与单元剧见证者归入普通角色档，交付独立全身角色卡。
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
              <a class="roster-section__more" :href="`#coin-pact`">查看外壳与无字母核蓝图（含七组交互图解） <span aria-hidden="true">↓</span></a>
              <a class="world-hero__secondary" :href="withBase('/world/races')">浏览五大种族与姓氏谱系</a>
              <a class="world-hero__secondary" :href="withBase('/world/cast')">浏览剧情角色与敌方图鉴</a>
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
            <h2 id="coin-pact">外壳内胆与单核铁律</h2>
            <p>{{ world.coinPact.lead }}</p>
          </div>

          <WorldCoreStructure />

          <WorldRelicMeasurements />

          <div class="world-relic-list" aria-label="核心信物与正邪三碎片设定板">
            <article class="world-relic-card">
              <div class="world-relic-card__head">
                <span class="world-pillar-card__code">RELIC PROP SHEET 01 · TWO-GENERATION SHELL EVOLUTION</span>
                <h3>两代外皮演进：初代三周年阻波黄铜币、切刀崩刃剥皮与克露丝重制「二代零点全透波金瓷壳」</h3>
              </div>
              <WorldImage
                id="og-arcade-shell-board-latest"
                caption="两代外皮演进 · 初代阻波黄铜币、克露丝二代零点全透波金瓷壳与波导腰匣设定板"
                detail="初代波导黄铜阻波伪装 · 二代掺金硅碳复合金瓷环形透晶窗零损耗透波"
                group="world-relic-props"
              />
              <div class="world-relic-badges">
                <div class="world-relic-badge">
                  <b>画面左上方 · 初代阻波三周年铜币与边缝</b>
                  <span>十年前雷恩以波导废黄铜无缝紧包母核冲压为三周年店庆纪念币（防误投街机口且锁死零点波），肉搏硬磕仅裂一条币边细缝。</span>
                </div>
                <div class="world-relic-badge">
                  <b>画面右上方 · 钨钢切刀崩刃与剥除初代铜皮</b>
                  <span>第 02 话克露丝切刀探缝触芯当场崩断，遂剥下完成潜伏使命的初代软黄铜外衣（由罗伊珍藏纪念父母），显露无损暗晶母核。</span>
                </div>
                <div class="world-relic-badge">
                  <b>画面左下方 · 克露丝二代「零点全透波金瓷壳」</b>
                  <span>采用不阻挡零点波的暖金钛瓷合成材料配四向旋锁卡口，正面围绕 OG 嵌环形透波暗晶窗，战后分制日冕阳壳与月蚀阴壳背面。</span>
                </div>
                <div class="world-relic-badge">
                  <b>画面右下方 · 波导屏蔽腰匣与全功率拔币激振</b>
                  <span>平时插回加装波导内衬的角色右腰黑橙磁吸匣即锁死 0.00（对齐立绘外观）；拔出二代透波币即由环形透晶窗全功率激振。</span>
                </div>
              </div>
            </article>

            <article class="world-relic-card">
              <div class="world-relic-card__head">
                <span class="world-pillar-card__code">RELIC PROP SHEET 02 · SEPARABLE YANG &amp; YIN MOTHER CORE</span>
                <h3>可分体「炽环母核」专项六视设定：外平内扣咬合半剖、开拓阳片（凸阶星榫）、锚定阴片（凹阶星卯）与准晶透视</h3>
              </div>
              <WorldImage
                id="astral-mother-core-board-latest"
                caption="可分体先驱炽环母核 · 六视图合体星榫半剖、开拓阳片、锚定阴片与准晶透视设定板"
                detail="合体上下纯平严密包芯 · 分体阳片十重凸阶星榫与阴片十重凹阶星卯精密互补"
                group="world-relic-props"
              />
              <div class="world-relic-badges">
                <div class="world-relic-badge">
                  <b>画面左上方 · 合体纯平圆饼与星榫半剖</b>
                  <span>合体态上下外表面绝对纯平平行；切面展示上层阳片凸阶星榫与下层阴片凹阶星卯零间隙咬合锁死。</span>
                </div>
                <div class="world-relic-badge">
                  <b>画面上中 · 开拓阳片（兄）内外双面</b>
                  <span>外表面为纯平环冠面（哑光外环与十重游标微刻）；内耦合面隆起十重微星芒正圆凸阶星榫台与暖白金日冕轨。</span>
                </div>
                <div class="world-relic-badge">
                  <b>画面右上方 · 锚定阴片（妹）内外双面</b>
                  <span>外表面为纯平同平面偏心月蚀双圆面；内耦合面内沉互补的十重微星芒正圆凹阶星卯槽与冰青银月蚀轨。</span>
                </div>
                <div class="world-relic-badge">
                  <b>画面左下方 · 环冠相与蚀日相激振发光</b>
                  <span>拇指生物电激振瞬间，环冠相亮起闭合冷白金星环与天顶星芒共链；蚀日相燃起炽珀赤金贝利珠日冕残弧解限。</span>
                </div>
                <div class="world-relic-badge">
                  <b>画面下中 · 双生生物电「子母星榫轴向分离」</b>
                  <span>物理刀锯不可撬开；唯达罗双生生物电谐振解锁零点场，阳片十重凸阶星榫台方从阴片凹阶星卯槽中平滑退出。</span>
                </div>
                <div class="world-relic-badge">
                  <b>画面右下方 · 十重彭罗斯准晶与九激发晶胞</b>
                  <span>干涉仪透视揭示极高硬度根源：无滑移面十重非周期菱形准晶键合网，浅层点亮九颗激发晶胞、深层嵌套休眠晶海。</span>
                </div>
              </div>
            </article>

            <article class="world-relic-card">
              <div class="world-relic-card__head">
                <span class="world-pillar-card__code">RELIC PROP SHEET 03 · THREE ZERO-GATE RELIC SHARDS</span>
                <h3>零号母门一物裂三方：两代外皮与阴阳分体真核、天秤六角空腔外模伪币及暗环剥夺残环</h3>
              </div>
              <WorldImage
                id="zero-gate-three-relics-latest"
                caption="零号母门正邪三碎片 · 三方核心信物对比设定板"
                detail="两代外皮与阴阳星榫真核 · 六角蜂巢统御外模伪币 · 断裂半圈剥夺护环"
                group="world-relic-props"
              />
              <div class="world-relic-badges">
                <div class="world-relic-badge">
                  <b>画面左列 · 达罗兄妹「共担真核与两代外皮」</b>
                  <span>初代三周年铜皮、克露丝二代透波金瓷 OG 壳、分离态凸星榫阳片与凹星卯阴片及波导快抽腰匣，力量归伙伴而负荷归己身。</span>
                </div>
                <div class="world-relic-badge">
                  <b>中列 · 索伦·韦恩「统御外模与伪币」</b>
                  <span>冷银拼黑曜空腔六角圣匣外模，批量冲压表面光洁纯白六角瓷盖、底层暗藏哑黑六角铁座与四根暗红神经刺针的稳压章。</span>
                </div>
                <div class="world-relic-badge">
                  <b>画面右列 · 德雷克·莫罗「剥夺残环」</b>
                  <span>两端焦黑撕裂的半圈远古金钛导能护环，加装粗糙黑钢胸骨外科抓扣与紫铜抽吸线圈，强行榨取异族炉心嫁接自身。</span>
                </div>
              </div>
            </article>
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
            <p>正式中英文全名、种族归属、职业定位、人格坐标与共鸣特质速览。</p>
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
                  <td>
                    <a :href="withBase(entry.home)">{{ entry.name }}</a>
                    <small v-if="world.characters[entry.id]?.twinNote" class="world-table-note">{{ world.characters[entry.id].twinNote }}</small>
                    <div v-if="characterMbtiBadges(entry.id).length" class="world-table-mbti-list">
                      <span v-for="badge in characterMbtiBadges(entry.id)" :key="badge" class="character-persona__mbti world-table-mbti">{{ badge }}</span>
                    </div>
                  </td>
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

      <template v-else-if="mode === 'races'">
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

      <template v-else-if="mode === 'cast' && world.storyCast">
        <div class="vp-doc">
          <h1 class="world-detail-title">{{ world.storyCast.title }}</h1>
          <p class="world-detail-lead">{{ world.storyCast.intro }}</p>

          <section id="tier-rules" class="world-cast-tiers">
            <div class="world-race-grid">
              <article v-for="rule in world.storyCast.tierRules" :key="rule.code" class="base-body-rule-card world-pillar-card">
                <span class="world-pillar-card__code">{{ rule.code }}</span>
                <h3>{{ rule.title }}</h3>
                <p>{{ rule.body }}</p>
              </article>
            </div>
          </section>

          <section id="major-cast" class="world-race-detail world-major-cast-box">
            <h2>重点角色名录 <small>MAJOR ANTAGONIST · FULL LAYER BREAKDOWN TIER</small></h2>
            <p class="world-race-detail__tagline">配齐通用素体基准与多层服装、暗藏探测机构及核心信物拆解的主线首领档案</p>
            <article v-for="boss in world.storyCast.majorCharacters" :key="boss.id" :id="boss.id" class="world-major-cast-item">
              <div class="world-cast-card__grid">
                <a
                  v-if="rosterById[boss.id]"
                  class="npc-roster-card npc-roster-card--major"
                  :href="withBase(boss.home)"
                  :data-npc-id="boss.id"
                  :data-asset-id="rosterById[boss.id].portrait.asset"
                >
                  <div class="npc-roster-card__picture">
                    <img
                      :src="withBase(rosterById[boss.id].portrait.path)"
                      :width="rosterById[boss.id].portrait.width"
                      :height="rosterById[boss.id].portrait.height"
                      alt=""
                      loading="lazy"
                      decoding="async"
                    >
                    <span class="npc-roster-card__badge npc-roster-card__badge--major">{{ boss.tier }}</span>
                  </div>
                </a>
                <div>
                  <div class="world-major-cast-item__head">
                    <div>
                      <h3><a :href="withBase(boss.home)">{{ boss.name }}</a> <span>{{ boss.enName }}</span></h3>
                      <p class="world-major-cast-item__meta">{{ boss.faction }} · {{ boss.raceLabel }} · {{ boss.debut }}</p>
                    </div>
                    <a class="roster-section__more" :href="withBase(boss.home)">进入全衣层拆解专页（L0–L3） <span aria-hidden="true">↗</span></a>
                  </div>
                  <dl class="world-race-detail__dl">
                    <div>
                      <dt>人物定位</dt>
                      <dd>{{ boss.tagline }}</dd>
                    </div>
                    <div>
                      <dt>素体基准</dt>
                      <dd><a :href="withBase('/standards/male-standard')">{{ boss.bodyScale }}</a></dd>
                    </div>
                    <div>
                      <dt>衣层结构</dt>
                      <dd>{{ boss.layerSpec }}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </article>
          </section>

          <div class="bunny-section-heading">
            <h2 id="standard-cast">剧情与往昔时期角色卡档案</h2>
            <p>完整收录《第 01 话：0.00 的游戏币》中的零号考察队先辈父母、十年前副领队时期索伦、八岁遗孤时期达罗兄妹，以及天秤财团清剿兵种、受控卫兵与获救见证者的 4K 角色设定卡。</p>
          </div>

          <section
            v-for="npc in world.storyCast.standardCards"
            :key="npc.id"
            :id="npc.id"
            class="world-race-detail world-cast-card"
          >
            <div class="world-cast-card__grid">
              <div class="world-cast-card__media">
                <ReleaseImage
                  v-if="npc.image"
                  :src="npc.image.web.path"
                  :original="npc.image.original.path"
                  :width="npc.image.web.width"
                  :height="npc.image.web.height"
                  :alt="npc.image.name"
                  :caption="`${npc.name} · 角色设定卡`"
                  :lightbox-caption="npc.image.name"
                  :detail="npc.debut"
                  group="ep01-standard-cast"
                  :asset-id="npc.asset"
                />
                <ReleaseImage
                  v-if="npc.expressionsImage"
                  :src="npc.expressionsImage.web.path"
                  :original="npc.expressionsImage.original.path"
                  :width="npc.expressionsImage.web.width"
                  :height="npc.expressionsImage.web.height"
                  :alt="npc.expressionsImage.name"
                  :caption="`${npc.name} · 3×4 性格与日常习惯演技表`"
                  :lightbox-caption="npc.expressionsImage.name"
                  detail="12 格多角度衣领与随身物件微演技基准"
                  group="ep01-standard-cast"
                  :asset-id="npc.expressionsAsset"
                />
              </div>
              <div class="world-cast-card__body">
                <div class="world-cast-card__head">
                  <div>
                    <h2>{{ npc.name }} <small>{{ npc.enName }}</small></h2>
                    <p class="world-race-detail__tagline">{{ npc.tagline }}</p>
                  </div>
                  <span class="world-cast-tier-pill">{{ npc.tier }}</span>
                </div>
                <dl class="world-race-detail__dl">
                  <div>
                    <dt>所属阵营</dt>
                    <dd>{{ npc.faction }}</dd>
                  </div>
                  <div>
                    <dt>谱系编制</dt>
                    <dd>{{ npc.raceLabel }}</dd>
                  </div>
                  <div>
                    <dt>登场话数</dt>
                    <dd>{{ npc.debut }}（最近更新 <time :datetime="npc.updated">{{ npc.updated }}</time>）</dd>
                  </div>
                  <div>
                    <dt>外观识别</dt>
                    <dd>{{ npc.signature }}</dd>
                  </div>
                  <div>
                    <dt>剧情职能</dt>
                    <dd>{{ npc.story }}</dd>
                  </div>
                </dl>
                <p v-if="npc.profileLink" class="character-lore__link">
                  <a :href="withBase(npc.profileLink)">{{ npc.profileLinkLabel ?? '查看关联角色专页' }} <span aria-hidden="true">↗</span></a>
                </p>
              </div>
            </div>

            <CharacterPersona
              v-if="npc.persona"
              class="world-cast-persona"
              :section="npc.expressionPlates?.length ? 'profile' : 'all'"
              :personas="[npc.persona]"
              :spectrum-href="`#${npc.id}-expressions`"
              :gear-label="castGearLabel(npc.id)"
            />

            <div
              v-if="npc.expressionPlates?.length"
              :id="`${npc.id}-expressions`"
              class="world-cast-expressions"
              :aria-label="`${npc.name}${plateCountZh(npc.expressionPlates.length)}板${faceCountZh(npc.persona?.actingSpectrum?.reduce((sum, g) => sum + g.count, 0) ?? 18)}面孔神态谱系`"
            >
              <div class="world-cast-expressions__head">
                <div>
                  <span class="world-pillar-card__code">ACTING SPECTRUM · {{ npc.expressionPlates.length }} PLATES</span>
                  <h3>{{ npc.name }} · 七情六欲分板神态设定（{{ npc.expressionPlates.length }} 板 {{ npc.persona?.actingSpectrum?.reduce((sum, g) => sum + g.count, 0) ?? 18 }} 张独立面孔）</h3>
                </div>
                <p>按人格认知功能栈、九型防御路径与时期骨相逐板展开，点开任意图板可用左右键翻看原图细节。</p>
              </div>

              <div class="world-cast-expressions__grid">
                <ReleaseImage
                  v-for="plate in npc.expressionPlates"
                  :key="plate.id"
                  :src="plate.image.web.path"
                  :original="plate.image.original.path"
                  :width="plate.image.web.width"
                  :height="plate.image.web.height"
                  :alt="plate.image.name"
                  :caption="plate.caption"
                  :lightbox-caption="plate.image.name"
                  :detail="plate.detail"
                  :group="`${npc.id}-expressions-spectrum`"
                  :asset-id="plate.id"
                />
              </div>

              <CharacterPersona
                v-if="npc.persona?.actingSpectrum?.length"
                section="spectrum"
                :personas="[npc.persona]"
                :spectrum-note="castSpectrumNote(npc.id, npc.expressionPlates.length)"
              />
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
.world-cast-card__media {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.world-cast-persona {
  margin-top: 22px;
}
.world-cast-expressions {
  margin-top: 26px;
  padding-top: 22px;
  border-top: 1px solid var(--vp-c-divider);
}
.world-cast-expressions__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px 24px;
  margin-bottom: 18px;
}
.world-cast-expressions__head h3 {
  margin: 4px 0 0 !important;
  font-size: 19px !important;
  font-weight: 700 !important;
  line-height: 1.35 !important;
}
.world-cast-expressions__head p {
  margin: 0 !important;
  color: var(--vp-c-text-2);
  font-size: 13.5px;
  line-height: 1.6 !important;
}
.world-cast-expressions__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  align-items: start;
}
.world-cast-expressions__grid :deep(.release-image) {
  margin: 0 !important;
}
@media (max-width: 760px) {
  .world-cast-expressions__grid {
    grid-template-columns: minmax(0, 1fr);
  }
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
