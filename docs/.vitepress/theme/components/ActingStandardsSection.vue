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
    body: '主导与辅助功能直接锚定常态脊柱重心、头颈倾角与视线落点：内倾思维配外倾感觉（ISTP · Ti-Se）呈冷感省力观察与瞬时猎手定焦；外倾感觉主导（ESTP · Se-Ti）呈高低肩歪脖斜靠与滚币斜睨摸底；外倾思维主导（ESTJ · Te-Si）呈脊背笔直抱臂与垂眸高速心算；内倾直觉配外倾情感（INFJ · Ni-Fe）呈静水包容浅笑与越过银框镜上缘的洞悉凝视；外倾直觉配内倾思维（ENTP · Ne-Ti）呈抱臂微歪头的工匠底气与打响指高挑单眉的奇谋精光。',
  },
  {
    code: '02 · ENNEAGRAM DEFENSE',
    title: '九型防御侧翼定跨代情绪破防路径',
    body: '拒绝千篇一律的捂脸害羞或张嘴嚎哭，按心理防御与代际身份拆解失控弧光：7w8 野猫刺客遇善意斜瞟死抿翘唇，同为 7w8 的造船巨匠严父诀别幼子时眼眶通红却挤出鱼尾纹爽朗豪笑；8w7 护短长兄悲极必猛拧头用手背狠抹泛红外眼角；1w2 铁面管家昂颌咬唇逼回眼泪；2w1 悲悯慈母隔防爆窗落泪却舒展柔眉露出澄澈安抚微笑。',
  },
  {
    code: '03 · SENSORY DOMINANCE',
    title: '眼耳鼻舌身意主导感官反换皮填空',
    body: '同一欲望命题严禁仅替换手中道具而复用相同五官肌肉组合：街头嗜甜者用舌齿单侧鼓腮护食咀嚼，市井嗜辣者喝干红汤吐半截舌尖扇风嘶哈，重体面管家双手捧白瓷杯闭目深嗅茶雾，熟龄学者母亲角色左手托碟角色右手执银叉从容慢品柠檬果塔，豪迈船匠父亲角色左手抓蓝图卷角色右手大口咬下厚切黑麦熏肉三明治。',
  },
  {
    code: '04 · RIGID PROP & ANATOMY',
    title: '刚体镜具与五指解剖总作监铁律',
    body: '战术护目镜、黄铜防弧焊镜与细银框圆眼镜均属绝对对称的刚性工业构件，必须按居家卸镜、挂颈、高推发冠、水平护眼或架于鼻梁中段越框平视真实切换，严禁随眉弓弯曲成软胶或添加漫符贴纸；凡近景出现手部，严格校验五指关节解剖及角色左手与角色右手专属制式。',
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
  {
    name: '艾琳·达罗',
    mbti: 'INFJ (Ni-Fe-Ti-Se) · 2w1 悲悯洞察学者',
    plates: '6 板 18 张独立面孔',
    href: '/world/cast#eileen-darrow-expressions',
  },
  {
    name: '伦恩·达罗',
    mbti: 'ENTP (Ne-Ti-Fe-Si) · 7w8 奇谋造船巨匠',
    plates: '6 板 18 张独立面孔',
    href: '/world/cast#renn-darrow-expressions',
  },
]

const crossDomains: CrossDomain[] = [
  {
    code: 'COLLISION DOMAIN 01 · APPETITE & OLFACTORY DESIRE',
    title: '口腹与味嗅觉欲：鼓腮护食 × 痛辣扇风 × 闭目嗅茶 × 银叉慢品果塔 × 抓蓝图大口咬三明治',
    subtitle: '从左往右横跨街头青少年与先辈父母两代五人，分别调动护食咀嚼、痛辣散热、嗅茶留香、银叉慢品与工匠豪嚼五条正交路径，剥离道具后五官肌肉零重叠。',
    asset: 'acting-cross-d01-appetite-latest',
    caption: '口腹与味嗅觉欲横向实证（从左往右：邦妮 · 罗伊 · 罗娅 · 艾琳 · 伦恩）',
    detail: '鼓腮嚼酥塔 · 吐舌扇辣风 · 闭目嗅热茶 · 托碟执叉品果塔 · 抓蓝图咬三明治',
    slots: [
      {
        slotLabel: '画面左格',
        who: '邦妮·弗林',
        mbti: 'ISTP · 7w8',
        gear: '卸镜居家态',
        mechanism: '角色左手捏焦糖奶油酥塔咬下第一口，双眉柔和舒扬，睁亮弯眸配单侧腮帮微鼓幸福咀嚼。',
      },
      {
        slotLabel: '第 2 格',
        who: '罗伊·达罗',
        mbti: 'ESTP · 8w7',
        gear: '卸镜露额态',
        mechanism: '喝干滚烫红油辣汤放下空碗，额颈沁满热汗，吐出半截红舌尖并以角色右手扇风嘶哈过瘾。',
      },
      {
        slotLabel: '居中格',
        who: '罗娅·达罗',
        mbti: 'ESTJ · 1w2',
        gear: '卸镜露额态',
        mechanism: '双手端捧骨瓷热红茶闭目深嗅佛手柑白雾，上唇角沾着一星甜塔白奶油而浑然不觉。',
      },
      {
        slotLabel: '第 4 格',
        who: '艾琳·达罗',
        mbti: 'INFJ · 2w1',
        gear: '藏青毛衣 · 无镜',
        mechanism: '角色左手托白瓷小碟、角色右手执细银叉送至唇畔，温润亮眸轻启双唇优雅慢品柠檬果塔，确立女儿嗜甜的熟龄学者源头。',
      },
      {
        slotLabel: '画面右格',
        who: '伦恩·达罗',
        mbti: 'ENTP · 7w8',
        gear: '船坞马甲 · 无镜',
        mechanism: '角色左手抓星舰蓝图卷夹于胸侧、角色右手举厚切黑麦熏肉三明治豪迈张大口咬下，尽显船坞总师不拘小节的工匠食欲。',
      },
    ],
  },
  {
    code: 'COLLISION DOMAIN 02 · SENSORY INDULGENCE',
    title: '感官松弛享乐：托腮微醺 × 迎风敞领 × 裹毯猫蜷 × 凭木栏望晚星 × 双臂枕后脑吹坞风',
    subtitle: '从左往右对比掌心托腮微醺、仰颈迎狂风、裹毯向内收拢、凭栏仰望夜星与双臂枕脑歇工五种截然不同的躯干松弛机制。',
    asset: 'acting-cross-d02-indulgence-latest',
    caption: '感官松弛享乐横向实证（从左往右：邦妮 · 罗伊 · 罗娅 · 艾琳 · 伦恩）',
    detail: '托腮微醺 · 仰颈迎狂风 · 裹毯拢颌 · 凭栏仰望晚星 · 枕臂半眯吹风',
    slots: [
      {
        slotLabel: '画面左格',
        who: '邦妮·弗林',
        mbti: 'ISTP · 7w8',
        gear: '卸镜露额态',
        mechanism: '浅量贪杯蜜酿甜果酒上脸，角色左手轻托绯红脸颊，双眉松垂、半阖水润冰蓝眼迷离吐热气。',
      },
      {
        slotLabel: '第 2 格',
        who: '罗伊·达罗',
        mbti: 'ESTP · 8w7',
        gear: '卸镜露额态',
        mechanism: '敞开高领拉链衫仰颈迎向百米高空狂风，墨黑碎发向后飞扬，闭目舒眉深吸自由空气。',
      },
      {
        slotLabel: '居中格',
        who: '罗娅·达罗',
        mbti: 'ESTJ · 1w2',
        gear: '卸镜露额态',
        mechanism: '夜航畏寒独处时裹紧米白粗针麻花软毯，双手拢住下颌向内猫蜷，半垂暖琥珀眸松懈防备。',
      },
      {
        slotLabel: '第 4 格',
        who: '艾琳·达罗',
        mbti: 'INFJ · 2w1',
        gear: '藏青毛衣 · 无镜',
        mechanism: '侧身双小臂低搭庭院雪松木栏，微仰首睁亮温润琥珀眸仰望夜空晚星，微启双唇舒气浅笑，呈静水深流的学者夜思。',
      },
      {
        slotLabel: '画面右格',
        who: '伦恩·达罗',
        mbti: 'ENTP · 7w8',
        gear: '船坞马甲 · 无镜',
        mechanism: '歇工双臂交叉枕住后脑勺，晚风拂动角色左额遗传灰褐挑染，半眯慵懒琥珀笑眸配成熟鱼尾纹惬意舒气。',
      },
    ],
  },
  {
    code: 'COLLISION DOMAIN 03 · SLEEPINESS & FATIGUE',
    title: '困倦与抗困反应：断电小哈欠 × 揉脸起床气 × 掐鼻根抗困 × 木椅持镜浅憩 × 冰水泼满脸振作',
    subtitle: '从左往右呈现顺应睡意断电、赖床烦躁起床气、高压自律死掐鼻根、书斋摘镜静憩与掬冰水泼脸驱困五种能量恢复策略。',
    asset: 'acting-cross-d03-fatigue-latest',
    caption: '困倦与抗困反应横向实证（从左往右：邦妮 · 罗伊 · 罗娅 · 艾琳 · 伦恩）',
    detail: '乱发小哈欠 · 揉脸起床气 · 掐鼻根抗困 · 靠木椅持圆镜浅憩 · 冰水泼满脸振作',
    slots: [
      {
        slotLabel: '画面左格',
        who: '邦妮·弗林',
        mbti: 'ISTP · 7w8',
        gear: '卸镜晨起乱发',
        mechanism: '银白短发睡翘蓬乱、橙色夹克滑落角色右肩，沉重眼皮半阖泛起生理泪花，微张圆口打小哈欠。',
      },
      {
        slotLabel: '第 2 格',
        who: '罗伊·达罗',
        mbti: 'ESTP · 8w7',
        gear: '卸镜露额态',
        mechanism: '头顶炸起两撮呆毛，角色左手揉挤眼窝推起单侧脸肉，半睁单只琥珀眼扁嘴发作起床气。',
      },
      {
        slotLabel: '居中格',
        who: '罗娅·达罗',
        mbti: 'ESTJ · 1w2',
        gear: '卸镜露额态',
        mechanism: '凌晨五点眼下浮现淡青倦影，角色左手执笔未停，角色右手死掐鼻根晴明穴紧闭双眼硬撑清醒。',
      },
      {
        slotLabel: '第 4 格',
        who: '艾琳·达罗',
        mbti: 'INFJ · 2w1',
        gear: '摘镜双手持握',
        mechanism: '深夜微仰颈靠向深胡桃木高背椅，双手在胸前轻持摘下的刚性细银框圆镜，半阖温润琥珀倦眸平静浅憩。',
      },
      {
        slotLabel: '画面右格',
        who: '伦恩·达罗',
        mbti: 'ENTP · 7w8',
        gear: '船坞马甲 · 无镜',
        mechanism: '通宵赶制图纸后双手掬冰水猛泼满脸，晶亮水珠顺整洁短须滴落，双掌外分、琥珀双眸瞪亮长呼一口气酣畅振作。',
      },
    ],
  },
  {
    code: 'COLLISION DOMAIN 04 · LETHAL RAGE & BOTTOM LINE',
    title: '触及逆鳞与生死底线：灭高光死寂 × 抹血疯犬笑 × 拉低橙镜处决 × 死锁红拉杆冰湖决断 × 半背身人墙怒喝',
    subtitle: '从左往右区分刺客零度死寂、双子长兄疯犬反笑、双子幼妹越框处决，以及先辈母亲无怒容牺牲决断与先辈父亲铁塔护后怒吼的家族演进。',
    asset: 'acting-cross-d04-lethal-latest',
    caption: '触及逆鳞与生死底线横向实证（从左往右：邦妮 · 罗伊 · 罗娅 · 艾琳 · 伦恩）',
    detail: '灭高光死寂 · 抹唇血疯笑 · 拉低橙镜处决 · 双拳锁拉杆决断 · 半背身护后怒喝',
    slots: [
      {
        slotLabel: '画面左格',
        who: '邦妮·弗林',
        mbti: 'ISTP · 7w8',
        gear: '卸镜露额态',
        mechanism: '同伴遇害触及逆鳞，完全不皱眉不呲牙，双眉水平冷寂，熄灭眼神高光的冰蓝双眸死寂锁定。',
      },
      {
        slotLabel: '第 2 格',
        who: '罗伊·达罗',
        mbti: 'ESTP · 8w7',
        gear: '卸镜露额态',
        mechanism: '歪头拧颈以角色右手拇指抹开下唇血痕，压低刀眉下暗火琥珀瞳配森白尖犬齿露出无温狠笑。',
      },
      {
        slotLabel: '居中格',
        who: '罗娅·达罗',
        mbti: 'ESTJ · 1w2',
        gear: '刚性橙镜平移拉低',
        mechanism: '疾风中角色左手捏持刚性镜框将橙红护目镜水平拉低架于鼻梁，双眸越过平直上缘直射寒光并微启薄唇下令。',
      },
      {
        slotLabel: '第 4 格',
        who: '艾琳·达罗',
        mbti: 'INFJ · 2w1',
        gear: '研究所制服 · 无镜',
        mechanism: '迎寒风侧转头颈，双拳紧握红色手动气闸拉杆向下死锁，平展微提的学者眉宇间毫无狰狞怒容，唯余冰湖般的牺牲决断。',
      },
      {
        slotLabel: '画面右格',
        who: '伦恩·达罗',
        mbti: 'ENTP · 7w8',
        gear: '探险夹克 · 无镜',
        mechanism: '半背身如铜墙铁壁横挡妻儿身前，角色左臂张开五指护后阻敌，猛然越肩回首怒目低吼震慑来敌，立住严父护犊气魄。',
      },
    ],
  },
  {
    code: 'COLLISION DOMAIN 05 · GRIEF DEFENSE & FAREWELL',
    title: '极度悲伤与诀别忍泪：正视抿唇封口 × 拧头手背狠抹 × 昂颌逼泪撑体面 × 隔窗贴掌含泪微笑 × 红眶递币爽朗豪笑',
    subtitle: '从左往右串联少年辈封锁脆弱的三种自尊防线，与先辈父母在气闸诀别一刻「眼角含泪却用微笑安抚儿女」的跨代悲剧美学闭环。',
    asset: 'acting-cross-d05-grief-latest',
    caption: '极度悲伤与诀别忍泪横向实证（从左往右：邦妮 · 罗伊 · 罗娅 · 艾琳 · 伦恩）',
    detail: '正视蓄泪抿唇 · 拧头手背擦眼 · 昂颌攥袖逼泪 · 贴防爆窗含泪微笑 · 红眶递黄铜币豪笑',
    slots: [
      {
        slotLabel: '画面左格',
        who: '邦妮·弗林',
        mbti: 'ISTP · 7w8',
        gear: '卸镜露额态',
        mechanism: '眉心微蹙，正面平视强撑睁大蓄满薄水光的泛红冰蓝眼绝不眨眼，双唇紧抿成线封死脆弱。',
      },
      {
        slotLabel: '第 2 格',
        who: '罗伊·达罗',
        mbti: 'ESTP · 8w7',
        gear: '卸镜露额态',
        mechanism: '死要面子的长兄猛拧过头别向侧方，角色左手手背重擦发红外眼角，紧咬后槽牙硬装风沙迷眼。',
      },
      {
        slotLabel: '居中格',
        who: '罗娅·达罗',
        mbti: 'ESTJ · 1w2',
        gear: '卸镜露额态',
        mechanism: '微侧上身昂起下颌借重力把泪水逼回通红眼眶，紧咬牙关、角色左手死攥对侧衣袖硬撑体面。',
      },
      {
        slotLabel: '第 4 格',
        who: '艾琳·达罗',
        mbti: 'INFJ · 2w1',
        gear: '研究所制服 · 无镜',
        mechanism: '角色右手五指张开平贴透明防爆玻璃，泛红眼眶滑落清泪，双眉却柔和舒展浮起澄澈安抚的慈母微笑。',
      },
      {
        slotLabel: '画面右格',
        who: '伦恩·达罗',
        mbti: 'ENTP · 7w8',
        gear: '探险夹克 · 无镜',
        mechanism: '俯身额带擦伤细汗以角色右手递出无字黄铜圆币，眼眶通红泛泪光却挤出深刻鱼尾纹露出爽朗露齿托付大笑。',
      },
    ],
  },
  {
    code: 'COLLISION DOMAIN 06 · FLUSTERED & COUPLE WARMTH',
    title: '被夸心软与夫妻窘迫：斜瞟压翘唇 × 仰头拍额抓狂 × 递创可贴红脸凶顶 × 抱笔记挑眉含嗔点夫 × 缩肩蹭须摆手干笑',
    subtitle: '从左往右拒绝雷同捂脸害羞，完整对照少年辈嘴硬破防与先辈夫妇一嗔一赔笑的家庭日常默契，一眼看见双子微动作的父母根源。',
    asset: 'acting-cross-d06-fluster-latest',
    caption: '被夸心软与夫妻窘迫横向实证（从左往右：邦妮 · 罗伊 · 罗娅 · 艾琳 · 伦恩）',
    detail: '斜瞟压翘唇 · 仰头拍额咬唇 · 递创可贴凶顶 · 抱笔记挑眉点夫 · 缩肩蹭须摆手干笑',
    slots: [
      {
        slotLabel: '画面左格',
        who: '邦妮·弗林',
        mbti: 'ISTP · 7w8',
        gear: '护目镜挂颈态',
        mechanism: '不抬手挡脸，耳尖与双颊晕红、视线往斜下方乱瞟，死死抿紧双唇仍压不住微微上翘的嘴角。',
      },
      {
        slotLabel: '第 2 格',
        who: '罗伊·达罗',
        mbti: 'ESTP · 8w7',
        gear: '卸镜露额态',
        mechanism: '被直球道谢打穿厚脸皮，仰头翻眼望天并以角色右手拍捂前额，双耳通红紧咬单侧下唇狼狈失态。',
      },
      {
        slotLabel: '居中格',
        who: '罗娅·达罗',
        mbti: 'ESTJ · 1w2',
        gear: '卸镜露额态',
        mechanism: '角色右手往前递出防水创可贴，满脸通红竖眉瞪大水润琥珀眼，张口拔高音量凶巴巴顶嘴掩饰心软。',
      },
      {
        slotLabel: '第 4 格',
        who: '艾琳·达罗',
        mbti: 'INFJ · 2w1',
        gear: '藏青毛衣 · 无镜',
        mechanism: '侧身以角色左手抱深藏青硬壳笔记于胸前，角色右手食指轻抬点向丈夫，单侧柔眉微挑配耳垂暖红与微启双唇含嗔轻笑。',
      },
      {
        slotLabel: '画面右格',
        who: '伦恩·达罗',
        mbti: 'ENTP · 7w8',
        gear: '船坞马甲 · 无镜',
        mechanism: '被妻子查出私房钱缩起宽肩侧倾头，角色右手蹭短须脸颊、角色左手在胸前张掌摆手赔不是，八字眉配单眼微眯哈哈干笑。',
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

    <div class="acting-cast-bar" role="region" aria-label="实装神态谱系五角色导航">
      <div class="acting-cast-bar__intro">
        <b>实装神态谱系 · 两代五角色六大碰撞域同框去同质化实证</b>
        <span>点击任意角色直达对应专页或先辈图鉴，审阅完整分板原尺寸特写与逐格微表情清单：</span>
      </div>
      <div class="acting-cast-bar__pills">
        <a v-for="item in benchmarkedCast" :key="item.name" class="acting-cast-pill" :href="withBase(item.href)">
          <strong>{{ item.name }}</strong>
          <span class="character-persona__mbti">{{ item.mbti }}</span>
          <small>{{ item.plates }} ↗</small>
        </a>
      </div>
    </div>

    <div class="acting-cross-list" aria-label="六大高危碰撞域五角色同框对照">
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
