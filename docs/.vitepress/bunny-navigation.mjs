export const bunnySections = [
  {
    "id": "identity",
    "label": "角色识别",
    "number": "01",
    "link": "/characters/bunny/",
    "description": "先识别整体，再锁定脸型、轮廓与不对称特征。",
    "items": [
      {
        "text": "轻亮轮廓与重型工具",
        "link": "/characters/bunny/"
      },
      {
        "text": "同一张脸的不同状态",
        "link": "/characters/bunny/face"
      }
    ]
  },
  {
    "id": "language",
    "label": "视觉逻辑",
    "number": "02",
    "link": "/characters/bunny/visual-language",
    "description": "用色彩分工和统一笔触解释同一个角色。",
    "items": [
      {
        "text": "色彩负责识别 笔触统一材质",
        "link": "/characters/bunny/visual-language"
      },
      {
        "text": "三套部件组成一个头部系统",
        "link": "/characters/bunny/headgear"
      }
    ]
  },
  {
    "id": "components",
    "label": "部件系统",
    "number": "03",
    "link": "/characters/bunny/body-base",
    "description": "让柔性衣物、固定带和硬质装备各有归属。",
    "items": [
      {
        "text": "先建立稳定的身体基准",
        "link": "/characters/bunny/body-base"
      },
      {
        "text": "贴身层建立清晰的上下边界",
        "link": "/characters/bunny/innerwear"
      },
      {
        "text": "蓬松外层包住紧实核心",
        "link": "/characters/bunny/jacket"
      },
      {
        "text": "袜装是柔性层，不是外骨骼",
        "link": "/characters/bunny/hosiery"
      },
      {
        "text": "带路连续，扣件有落点",
        "link": "/characters/bunny/harness"
      },
      {
        "text": "先能握持，再安排硬件",
        "link": "/characters/bunny/hands"
      },
      {
        "text": "双带把盒袋固定在外侧",
        "link": "/characters/bunny/thigh-gear"
      },
      {
        "text": "膝前硬片与膝后弹性带",
        "link": "/characters/bunny/knee-guard"
      },
      {
        "text": "同款镜像鞋，前侧后分工明确",
        "link": "/characters/bunny/shoes"
      },
      {
        "text": "工具外观与收纳关系成套设计",
        "link": "/characters/bunny/saw"
      }
    ]
  },
  {
    "id": "assembly",
    "label": "穿戴结构",
    "number": "04",
    "link": "/characters/bunny/assembly",
    "description": "由内而外组合，正背与遮挡保持连续。",
    "items": [
      {
        "text": "按覆盖关系由内向外组合",
        "link": "/characters/bunny/assembly"
      }
    ]
  },
  {
    "id": "application",
    "label": "应用规范",
    "number": "05",
    "link": "/characters/bunny/application",
    "description": "用于新视角与动作时，结构和画法都不漂移。",
    "items": [
      {
        "text": "扩展姿态 不扩写角色",
        "link": "/characters/bunny/application"
      },
      {
        "text": "终稿资产与下载",
        "link": "/characters/bunny/downloads"
      }
    ]
  }
]

const legacySections = {
  overview: 'identity',
  'design-language': 'language',
  'head-expressions': 'identity',
  'upper-layers': 'components',
  legs: 'components',
  systems: 'components',
  usage: 'application',
}

function normalizePath(path) {
  return String(path ?? '')
    .split(/[?#]/, 1)[0]
    .replace(/\\/g, '/')
    .replace(/^\/?docs\//, '/')
    .replace(/^\/?/, '/')
    .replace(/\.(?:md|html)$/, '')
    .replace(/\/index$/, '/')
    .replace(/\/$/, '')
}

export function findBunnySection(relativePath) {
  const path = normalizePath(relativePath)
  const match = bunnySections.find((section) =>
    [section.link, ...section.items.map((item) => item.link)]
      .some((link) => normalizePath(link) === path),
  )
  if (match) return match
  const slug = path.replace(/^\/characters\/bunny\//, '')
  if (slug === path) return undefined
  return bunnySections.find((section) => section.id === legacySections[slug])
}
