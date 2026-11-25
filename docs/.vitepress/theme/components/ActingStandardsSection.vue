<script setup lang="ts">
import { withBase } from 'vitepress'
import WorldImage from './WorldImage.vue'

interface ActingRuleCard {
  code: string
  title: string
  body: string
}

interface CastAnchor {
  name: string
  mbti: string
  plates: string
  href: string
}

interface DomainSlot {
  slotLabel: string
  who: string
  mbti: string
  gear: string
  mechanism: string
}

interface CrossDomain {
  code: string
  title: string
  subtitle: string
  asset: string
  caption: string
  detail: string
  slots: DomainSlot[]
}

const ruleCards: ActingRuleCard[] = [
  {
    code: '01 · COGNITIVE STACK',
    title: 'MBTI 认知功能栈定姿态与视线',
    body: '主导与辅助功能直接锚定常态脊柱重心、头颈倾角与视线落点：内倾思维配外倾感觉（ISTP · Ti-Se）呈冷感省力观察与瞬时猎手定焦；外倾感觉主导（ESTP · Se-Ti）呈高低肩歪脖斜靠与滚币斜睨摸底；外倾思维主导（ESTJ · Te-Si）呈脊背笔直抱臂与垂眸高速心算。',
  },
  {
    code: '02 · ENNEAGRAM DEFENSE',
    title: '九型防御侧翼定情绪破防路径',
    body: '拒绝千篇一律的捂脸害羞或张嘴嚎哭，按心理防御机制拆解失控弧光：7w8 独行野猫遇直球善意不抬手挡脸，耳尖晕红斜瞟死抿翘唇；8w7 护短长兄悲极必猛拧过头用手背狠抹泛红外眼角死撑硬汉体面；1w2 铁面管家在人前昂颌咬唇逼回眼泪，唯独在兄长面前破功才揪紧衣襟孩童化落泪。',
  },
  {
    code: '03 · SENSORY DOMINANCE',
    title: '眼耳鼻舌身意主导感官反换皮填空',
    body: '同一欲望命题严禁仅替换手中道具而复用相同五官肌肉组合：同样面对饮食享受，街头嗜甜者用舌齿单侧鼓腮护食咀嚼，市井嗜辣者喝干红汤满头热汗吐半截舌尖扇风嘶哈，重体面管家则双手捧白瓷杯闭目深嗅佛手柑茶雾且上唇角沾一星白奶油浑然不觉。',
  },
  {
    code: '04 · RIGID PROP & ANATOMY',
    title: '刚体护目镜与五指解剖总作监铁律',
    body: '战术护目镜外框与镜片属刚性工业构件，必须按居家卸镜露额、日常挂颈、高推发冠让眉、实战四成透光护眼（或整框水平拉低越框直射）真实切换，严禁随眉弓弯曲成软胶或添加漫符贴纸；凡近景出现手部，严格校验五指关节解剖及角色左手与角色右手专属手套制式。',
  },
]

const benchmarkedCast: CastAnchor[] = [
  {
    name: '邦妮·弗林',
    mbti: 'ISTP (Ti-Se-Ni-Fe) · 7w8 独行野猫怪盗',
    plates: '8 板 30 张独立面孔',
    href: '/characters/bonnie/#expressions',
  },
  {
    name: '罗伊·达罗',
    mbti: 'ESTP (Se-Ti-Fe-Ni) · 8w7 护短破局赌徒',
    plates: '8 板 30 张独立面孔',
    href: '/characters/darrow/#expressions',
  },
  {
    name: '罗娅·达罗',
    mbti: 'ESTJ (Te-Si-Ne-Fi) · 1w2 铁面秩序管家',
    plates: '9 板 28 张独立面孔',
    href: '/characters/darrow/#expressions',
  },
]

const crossDomains: CrossDomain[] = [
  {
    code: 'COLLISION DOMAIN 01 · APPETITE & OLFACTORY DESIRE',
    title: '口腹与味嗅觉欲：单侧鼓腮护食 × 痛辣吐舌扇风 × 闭目嗅茶沾奶油',
    subtitle: '从左往右分别调动味觉咀嚼、痛觉散热与嗅觉品茗三条感官通道，剥离道具后五官肌肉零重叠。',
    asset: 'acting-cross-d01-appetite-latest',
    caption: '口腹与味嗅觉欲横向实证（从左往右：邦妮 · 罗伊 · 罗娅）',
    detail: '味觉鼓腮咀嚼 · 痛觉吐舌扇风 · 嗅觉闭目品茗',
    slots: [
      {
        slotLabel: '画面左格',
        who: '邦妮·弗林',
        mbti: 'ISTP · 7w8',
        gear: '卸镜居家态',
        mechanism: '角色左手捏焦糖奶油酥塔咬下第一口，双眉柔和舒扬，睁亮弯眸配单侧腮帮微鼓幸福咀嚼。',
      },
      {
        slotLabel: '居中格',
        who: '罗伊·达罗',
        mbti: 'ESTP · 8w7',
        gear: '卸镜露额态',
        mechanism: '喝干滚烫红油辣汤放下空碗，额颈沁满热汗，吐出半截红舌尖并以角色右手扇风嘶哈过瘾。',
      },
      {
        slotLabel: '画面右格',
        who: '罗娅·达罗',
        mbti: 'ESTJ · 1w2',
        gear: '卸镜露额态',
        mechanism: '双手端捧骨瓷热红茶闭目深嗅佛手柑白雾，上唇角沾着一星甜塔白奶油而浑然不觉。',
      },
    ],
  },
  {
    code: 'COLLISION DOMAIN 02 · SENSORY INDULGENCE',
    title: '感官松弛享乐：甜酒托腮微醺 × 高空迎风敞领 × 夜寒软毯猫蜷',
    subtitle: '从左往右分别以重心交付掌心、仰颈迎风舒展与裹毯向内收拢呈现截然相反的躯干松弛机制。',
    asset: 'acting-cross-d02-indulgence-latest',
    caption: '感官松弛享乐横向实证（从左往右：邦妮 · 罗伊 · 罗娅）',
    detail: '掌心托腮微醺 · 仰颈迎风深吸 · 裹毯拢颌取暖',
    slots: [
      {
        slotLabel: '画面左格',
        who: '邦妮·弗林',
        mbti: 'ISTP · 7w8',
        gear: '卸镜露额态',
        mechanism: '浅量贪杯蜜酿甜果酒上脸，角色左手轻托绯红脸颊，双眉松垂、半阖水润冰蓝眼迷离吐热气。',
      },
      {
        slotLabel: '居中格',
        who: '罗伊·达罗',
        mbti: 'ESTP · 8w7',
        gear: '卸镜露额态',
        mechanism: '敞开高领拉链衫仰颈迎向百米高空狂风，墨黑碎发向后飞扬，闭目舒眉深吸自由空气。',
      },
      {
        slotLabel: '画面右格',
        who: '罗娅·达罗',
        mbti: 'ESTJ · 1w2',
        gear: '卸镜露额态',
        mechanism: '夜航畏寒独处时裹紧米白粗针麻花软毯，双手拢住下颌向内猫蜷，半垂暖琥珀眸松懈防备。',
      },
    ],
  },
  {
    code: 'COLLISION DOMAIN 03 · SLEEPINESS & FATIGUE',
    title: '困倦与睡眠反应：断电圆口哈欠 × 揉眼推肉起床气 × 掐鼻根硬抗困意',
    subtitle: '从左往右对比顺应睡意断电、赖床烦躁起床气与自律强压生理困意三种能量耗尽状态。',
    asset: 'acting-cross-d03-fatigue-latest',
    caption: '困倦与睡眠反应横向实证（从左往右：邦妮 · 罗伊 · 罗娅）',
    detail: '睡乱银发哈欠 · 炸呆毛揉脸赖床 · 淡黑眼圈掐鼻抗困',
    slots: [
      {
        slotLabel: '画面左格',
        who: '邦妮·弗林',
        mbti: 'ISTP · 7w8',
        gear: '卸镜晨起乱发',
        mechanism: '银白短发睡翘蓬乱、橙色夹克滑落角色右肩，沉重眼皮半阖泛起生理泪花，微张圆口打小哈欠。',
      },
      {
        slotLabel: '居中格',
        who: '罗伊·达罗',
        mbti: 'ESTP · 8w7',
        gear: '卸镜露额态',
        mechanism: '头顶炸起两撮呆毛，角色左手揉挤眼窝推起单侧脸肉，半睁单只琥珀眼扁嘴发作起床气。',
      },
      {
        slotLabel: '画面右格',
        who: '罗娅·达罗',
        mbti: 'ESTJ · 1w2',
        gear: '卸镜露额态',
        mechanism: '凌晨五点眼下浮现淡青倦影，角色左手执笔未停，角色右手死掐鼻根晴明穴紧闭双眼硬撑清醒。',
      },
    ],
  },
  {
    code: 'COLLISION DOMAIN 04 · LETHAL RAGE & BOTTOM LINE',
    title: '触及逆鳞杀心：灭高光零度死寂 × 抹唇血疯犬反笑 × 拉低刚性橙镜处决',
    subtitle: '从左往右区分暗巷刺客收尽情绪、街头赌徒嗜血反笑与战术指挥官越过刚性镜框下达处决口令。',
    asset: 'acting-cross-d04-lethal-latest',
    caption: '触及逆鳞杀心横向实证（从左往右：邦妮 · 罗伊 · 罗娅）',
    detail: '平眉灭高光死寂 · 歪颈抹血露犬齿 · 刚性橙镜拉低越框直射',
    slots: [
      {
        slotLabel: '画面左格',
        who: '邦妮·弗林',
        mbti: 'ISTP · 7w8',
        gear: '卸镜露额态',
        mechanism: '同伴遇害触及逆鳞，完全不皱眉不呲牙，双眉水平冷寂，熄灭眼神高光的冰蓝双眸死寂锁定。',
      },
      {
        slotLabel: '居中格',
        who: '罗伊·达罗',
        mbti: 'ESTP · 8w7',
        gear: '卸镜露额态',
        mechanism: '歪头拧颈以角色右手拇指抹开下唇血痕，压低刀眉下暗火琥珀瞳配森白尖犬齿露出无温狠笑。',
      },
      {
        slotLabel: '画面右格',
        who: '罗娅·达罗',
        mbti: 'ESTJ · 1w2',
        gear: '刚性橙镜平移拉低',
        mechanism: '疾风中角色左手捏持刚性镜框将橙红护目镜水平拉低架于鼻梁，双眸越过平直上缘直射寒光并微启薄唇下令。',
      },
    ],
  },
  {
    code: 'COLLISION DOMAIN 05 · GRIEF DEFENSE & HOLDING BACK TEARS',
    title: '极度悲伤忍泪：正视抿唇封口 × 猛拧头手背狠抹 × 昂颌逼泪攥袖撑体面',
    subtitle: '从左往右以正视封锁、拧头遮掩与仰颈借重力逼回眼泪三种头颈朝向，立住迥异的自尊防线。',
    asset: 'acting-cross-d05-grief-latest',
    caption: '极度悲伤忍泪横向实证（从左往右：邦妮 · 罗伊 · 罗娅）',
    detail: '正视红睑紧抿唇 · 猛拧头手背擦眼尾 · 昂颌逼泪死攥衣袖',
    slots: [
      {
        slotLabel: '画面左格',
        who: '邦妮·弗林',
        mbti: 'ISTP · 7w8',
        gear: '卸镜露额态',
        mechanism: '眉心微蹙，正面平视强撑睁大蓄满薄水光的泛红冰蓝眼绝不眨眼，双唇紧抿成线封死脆弱。',
      },
      {
        slotLabel: '居中格',
        who: '罗伊·达罗',
        mbti: 'ESTP · 8w7',
        gear: '卸镜露额态',
        mechanism: '死要面子的长兄猛拧过头别向侧方，角色左手手背重擦发红外眼角，紧咬后槽牙硬装风沙迷眼。',
      },
      {
        slotLabel: '画面右格',
        who: '罗娅·达罗',
        mbti: 'ESTJ · 1w2',
        gear: '卸镜露额态',
        mechanism: '微侧上身昂起下颌借重力把泪水逼回通红眼眶，紧咬牙关、角色左手死攥对侧衣袖硬撑体面。',
      },
    ],
  },
  {
    code: 'COLLISION DOMAIN 06 · FLUSTERED & PRAISE DEFENSE',
    title: '被夸心软破防：斜瞟压翘唇 × 仰头拍额抓狂 × 递创可贴涨红脸凶巴巴顶嘴',
    subtitle: '从左往右拒绝雷同的双手捂脸害羞，分别以眼神闪躲憋笑、仰头扶额失态与反向拔高音量顶嘴兑现反差。',
    asset: 'acting-cross-d06-fluster-latest',
    caption: '被夸心软破防横向实证（从左往右：邦妮 · 罗伊 · 罗娅）',
    detail: '挂颈斜瞟压翘唇 · 仰头拍额耳红咬唇 · 递创可贴红脸张口回嘴',
    slots: [
      {
        slotLabel: '画面左格',
        who: '邦妮·弗林',
        mbti: 'ISTP · 7w8',
        gear: '护目镜挂颈态',
        mechanism: '不抬手挡脸，耳尖与双颊晕红、视线往斜下方乱瞟，死死抿紧双唇仍压不住微微上翘的嘴角。',
      },
      {
        slotLabel: '居中格',
        who: '罗伊·达罗',
        mbti: 'ESTP · 8w7',
        gear: '卸镜露额态',
        mechanism: '被直球道谢打穿厚脸皮，仰头翻眼望天并以角色右手拍捂前额，双耳通红紧咬单侧下唇狼狈失态。',
      },
      {
        slotLabel: '画面右格',
        who: '罗娅·达罗',
        mbti: 'ESTJ · 1w2',
        gear: '卸镜露额态',
        mechanism: '角色右手往前递出防水创可贴，满脸通红竖眉瞪大水润琥珀眼，张口拔高音量凶巴巴顶嘴掩饰心软。',
      },
    ],
  },
]
</script>

<template>
  <div class="acting-standards">
    <div class="base-body-rules-grid">
      <article v-for="card in ruleCards" :key="card.code" class="base-body-rule-card acting-rule-card">
        <span class="world-pillar-card__code">{{ card.code }}</span>
        <h3>{{ card.title }}</h3>
        <p>{{ card.body }}</p>
      </article>
    </div>

    <div class="acting-cast-bar" role="region" aria-label="首批实装神态谱系角色">
      <div class="acting-cast-bar__intro">
        <b>首批实装神态谱系 · 三主角六大碰撞域同框实证</b>
        <span>点击角色可直达对应专页审阅完整八至九板原尺寸特写与逐格清单：</span>
      </div>
      <div class="acting-cast-bar__pills">
        <a v-for="item in benchmarkedCast" :key="item.name" class="acting-cast-pill" :href="withBase(item.href)">
          <strong>{{ item.name }}</strong>
          <span class="character-persona__mbti">{{ item.mbti }}</span>
          <small>{{ item.plates }} ↗</small>
        </a>
      </div>
    </div>

    <div class="acting-cross-list" aria-label="六大高危碰撞域三主角同框对照">
      <article v-for="domain in crossDomains" :key="domain.asset" class="acting-cross-card">
        <header class="acting-cross-card__head">
          <span class="world-pillar-card__code">{{ domain.code }}</span>
          <h3>{{ domain.title }}</h3>
          <p>{{ domain.subtitle }}</p>
        </header>

        <WorldImage
          :id="domain.asset"
          :caption="domain.caption"
          :detail="domain.detail"
          group="acting-cross-benchmarks"
        />

        <div class="acting-cross-slots" role="list" :aria-label="`${domain.title}逐格拆解`">
          <div v-for="slot in domain.slots" :key="slot.who" class="acting-cross-slot" role="listitem">
            <div class="acting-cross-slot__meta">
              <b>{{ slot.slotLabel }} · {{ slot.who }}</b>
              <span class="character-persona__mbti">{{ slot.mbti }}</span>
              <em>{{ slot.gear }}</em>
            </div>
            <p>{{ slot.mechanism }}</p>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
