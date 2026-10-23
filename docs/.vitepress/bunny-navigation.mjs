export const bunnySections = [
  {
    "id": "identity",
    "label": "角色与画风",
    "number": "01",
    "link": "/characters/bunny/",
    "description": "角色与画风",
    "items": [
      {
        "text": "Bunny · 角色设计",
        "link": "/characters/bunny/"
      },
      {
        "text": "面部与身份",
        "link": "/characters/bunny/face"
      },
      {
        "text": "当前身份表情与变化",
        "link": "/characters/bunny/expressions"
      },
      {
        "text": "配色与 2D 手绘语言",
        "link": "/characters/bunny/visual-language"
      }
    ]
  },
  {
    "id": "baseline",
    "label": "人物基准",
    "number": "02",
    "link": "/characters/bunny/body-base",
    "description": "人物基准",
    "items": [
      {
        "text": "v2 · 身体三视基准",
        "link": "/characters/bunny/body-base"
      },
      {
        "text": "人物统一尺寸",
        "link": "/characters/bunny/dimensions"
      },
      {
        "text": "衣层与部件阅读顺序",
        "link": "/characters/bunny/assembly"
      }
    ]
  },
  {
    "id": "layers",
    "label": "由内到外",
    "number": "03",
    "link": "/characters/bunny/innerwear",
    "description": "由内到外",
    "items": [
      {
        "text": "贴身衣层",
        "link": "/characters/bunny/innerwear"
      },
      {
        "text": "袜装",
        "link": "/characters/bunny/hosiery"
      },
      {
        "text": "鞋靴",
        "link": "/characters/bunny/shoes"
      },
      {
        "text": "手部装备",
        "link": "/characters/bunny/hands"
      },
      {
        "text": "腿部盒袋与任务终端",
        "link": "/characters/bunny/thigh-gear"
      },
      {
        "text": "橙色外套",
        "link": "/characters/bunny/jacket"
      },
      {
        "text": "承载带与固定点",
        "link": "/characters/bunny/harness"
      },
      {
        "text": "头部装备",
        "link": "/characters/bunny/headgear"
      }
    ]
  },
  {
    "id": "complete",
    "label": "累计与武器",
    "number": "04",
    "link": "/characters/bunny/assembled",
    "description": "累计与武器",
    "items": [
      {
        "text": "当前累计穿戴",
        "link": "/characters/bunny/assembled"
      },
      {
        "text": "武器与收纳",
        "link": "/characters/bunny/saw"
      }
    ]
  },
  {
    "id": "application",
    "label": "应用与下载",
    "number": "05",
    "link": "/characters/bunny/application",
    "description": "应用与下载",
    "items": [
      {
        "text": "应用规范",
        "link": "/characters/bunny/application"
      },
      {
        "text": "设计图与参考下载",
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
