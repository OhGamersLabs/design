<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { withBase } from 'vitepress'
import { data } from '../data/site.data.mjs'
import { data as baseBodies } from '../data/base-bodies.data.mjs'
import { data as world } from '../data/world.data.mjs'
import { data as story } from '../data/story.data.mjs'
import WorldImage from './components/WorldImage.vue'

type KvVariant = 'artbook' | 'starport'
const activeKv = ref<KvVariant>('artbook')
const hoveredKey = ref<string | null>(null)
const pinnedKey = ref<string | null>(null)
const activeRaceFilter = ref<string>('all')

let leaveTimer: ReturnType<typeof setTimeout> | null = null

interface HotspotPin {
  key: string
  badge: string
  characterId: string
  displayName: string
  enName: string
  kicker: string
  summary: string
  artbook: { x: number; y: number }
  starport: { x: number; y: number }
  spotAssetId: string
  boxPct: { left: number; top: number; width: number; height: number }
  hitPolys: string[]
}

const ensemblePins: HotspotPin[] = [
  {
    "key": "wylin",
    "badge": "10",
    "characterId": "wylin",
    "displayName": "维琳·西莱克斯",
    "enName": "Wylin Silex",
    "kicker": "NO. 10 · 高轨精瓷雷电奥术师",
    "summary": "硅碳混合族 · 雷电法师。双腕三联电青导能环徒手唤雷，深度解析母核内部沉睡的准晶相变法则。",
    "artbook": {
      "x": 12.2,
      "y": 13.5
    },
    "starport": {
      "x": 11.5,
      "y": 21.5
    },
    "spotAssetId": "ensemble-spot-wylin-latest",
    "boxPct": {
      "left": 10.8594,
      "top": 11.3426,
      "width": 10.8854,
      "height": 23.6574
    },
    "hitPolys": [
      "826,245 764,245 747,265 709,267 683,297 678,333 638,287 586,280 543,301 534,339 474,322 462,331 463,348 417,377 417,451 435,471 417,490 447,527 417,566 419,674 454,752 485,747 495,713 512,755 568,755 580,699 582,751 615,755 635,742 646,707 664,711 698,691 700,672 674,652 692,637 683,609 696,610 695,629 715,643 754,606 751,556 713,470 768,429 767,406 794,404 807,374 831,363"
    ]
  },
  {
    "key": "gunnar",
    "badge": "04",
    "characterId": "gunnar",
    "displayName": "冈纳·霍尔姆",
    "enName": "Gunnar Holm",
    "kicker": "NO. 04 · 北境要塞重装老兵",
    "summary": "碳基人族 · 重装步兵。双核首次合鸣跨三百光年折跃驰援的破壁重火力支点。",
    "artbook": {
      "x": 85.8,
      "y": 22.8
    },
    "starport": {
      "x": 90.2,
      "y": 22.5
    },
    "spotAssetId": "ensemble-spot-gunnar-latest",
    "boxPct": {
      "left": 79.4531,
      "top": 21.6667,
      "width": 8.5938,
      "height": 22.5926
    },
    "hitPolys": [
      "3215,470 3124,468 3092,513 3107,535 3095,560 3051,589 3051,608 3062,614 3051,617 3051,676 3087,722 3086,797 3061,808 3057,844 3076,874 3054,930 3074,954 3151,950 3156,920 3137,910 3141,849 3173,851 3165,876 3190,905 3236,921 3281,910 3296,875 3263,832 3267,791 3281,783 3310,804 3323,831 3380,824 3380,786 3299,697 3312,671 3309,630 3273,571 3278,548 3262,527 3224,515 3225,481"
    ]
  },
  {
    "key": "ange",
    "badge": "07",
    "characterId": "ange",
    "displayName": "安洁·阿维拉",
    "enName": "Ange Avela",
    "kicker": "NO. 07 · 苍穹云塔圣咏治疗师",
    "summary": "天羽族 · 治疗师。生具三色柔羽耳与蝴蝶骨原生光翼，执苍穹羽环法杖维系全队生机。",
    "artbook": {
      "x": 71.5,
      "y": 14.5
    },
    "starport": {
      "x": 74.2,
      "y": 30.5
    },
    "spotAssetId": "ensemble-spot-ange-latest",
    "boxPct": {
      "left": 57.8906,
      "top": 11.6667,
      "width": 14.9219,
      "height": 26.6204
    },
    "hitPolys": [
      "2223,263 2223,293 2259,346 2247,369 2263,386 2223,388 2232,434 2223,453 2223,580 2240,593 2245,642 2267,655 2266,690 2308,740 2347,742 2361,729 2348,700 2388,662 2392,686 2410,699 2368,748 2356,803 2361,826 2400,826 2429,777 2455,783 2534,697 2592,660 2558,756 2563,818 2589,825 2648,639 2677,617 2699,656 2719,663 2730,651 2731,615 2757,604 2754,562 2769,548 2761,496 2795,452 2795,354 2753,367 2781,330 2767,311 2772,288 2757,279 2707,295 2678,263 2631,252 2629,280 2606,290 2609,309 2591,320 2591,338 2560,321 2546,349 2496,364 2472,337 2455,339 2446,354 2424,317 2380,289 2352,291 2299,252 2262,252 2265,275"
    ]
  },
  {
    "key": "rook",
    "badge": "09",
    "characterId": "rook",
    "displayName": "罗克·卡迈恩",
    "enName": "Rook Carmine",
    "kicker": "NO. 09 · 双核爆甲重装机甲",
    "summary": "智械族 · 重火力机甲。逾三点五米高的移动火力壁垒，胸甲正中主动喷涂纯白 OG 队徽。",
    "artbook": {
      "x": 48.5,
      "y": 8.2
    },
    "starport": {
      "x": 42.5,
      "y": 24.5
    },
    "spotAssetId": "ensemble-spot-rook-latest",
    "boxPct": {
      "left": 25.625,
      "top": 5.3704,
      "width": 34.375,
      "height": 41.713
    },
    "hitPolys": [
      "2239,160 2168,131 2159,116 2031,116 1986,135 1961,161 1930,159 1898,189 1828,195 1812,185 1795,198 1794,173 1776,152 1722,126 1666,129 1595,152 1566,173 1569,214 1513,263 1493,261 1455,302 1452,330 1434,338 1421,385 1372,425 1301,411 1275,436 1248,428 1241,460 1189,529 1210,464 1196,445 1136,511 1144,476 1126,458 1048,498 1016,502 1007,529 984,540 984,630 1013,665 1074,685 1115,677 1159,603 1143,646 1154,665 1178,659 1222,670 1283,649 1333,674 1367,656 1417,657 1419,673 1373,686 1365,718 1349,721 1313,769 1311,830 1229,935 1235,988 1267,1009 1479,1016 1571,988 1608,934 1598,909 1612,875 1638,861 1636,824 1676,807 1671,752 1696,730 1703,701 1738,673 1730,713 1717,725 1731,752 1825,804 1959,826 1951,863 1978,890 2027,891 2039,919 2076,932 2122,917 2155,937 2253,920 2303,893 2303,842 2283,802 2238,771 2253,683 2239,621 2220,596 2208,523 2271,499 2292,467 2284,430 2227,322 2243,285"
    ]
  },
  {
    "key": "bonnie",
    "badge": "02",
    "characterId": "bonnie",
    "displayName": "邦妮·弗林",
    "enName": "Bonnie Flynn",
    "kicker": "NO. 02 · 首席共链斥候",
    "summary": "碳基人族 · 刺客。第七索道劫车战中首位触碰金光虚影立契的先锋同伴，佩渡月工业不对称双匕首。",
    "artbook": {
      "x": 28.2,
      "y": 11.8
    },
    "starport": {
      "x": 58.0,
      "y": 26.5
    },
    "spotAssetId": "ensemble-spot-bonnie-latest",
    "boxPct": {
      "left": 27.0052,
      "top": 10.2315,
      "width": 7.8906,
      "height": 21.6667
    },
    "hitPolys": [
      "1268,223 1182,222 1140,252 1131,313 1118,330 1125,346 1098,377 1072,442 1037,470 1041,502 1098,484 1037,594 1037,656 1101,688 1176,681 1257,490 1283,516 1339,516 1339,461 1307,451 1312,420 1299,380 1309,369 1302,342 1315,280"
    ]
  },
  {
    "key": "kyuzo",
    "badge": "08",
    "characterId": "kyuzo",
    "displayName": "荒铁·久藏",
    "enName": "Kyuzo Aragane",
    "kicker": "NO. 08 · 东方锻系长生机魂剑客",
    "summary": "智械族 · 武士。拒绝财团格式化编号的浪人机魂，佩热能正宗野太刀跨越世代守望信诺。",
    "artbook": {
      "x": 46.8,
      "y": 38.2
    },
    "starport": {
      "x": 21.5,
      "y": 43.0
    },
    "spotAssetId": "ensemble-spot-kyuzo-latest",
    "boxPct": {
      "left": 36.6146,
      "top": 36.5278,
      "width": 11.4062,
      "height": 31.713
    },
    "hitPolys": [
      "1594,1331 1564,1344 1542,1336 1527,1351 1530,1398 1553,1404 1563,1420 1606,1408 1605,1343",
      "1734,1313 1703,1330 1706,1364 1687,1391 1669,1473 1710,1471 1705,1456 1751,1339",
      "1781,798 1762,793 1735,819 1700,789 1611,789 1571,826 1527,840 1498,866 1484,958 1522,991 1406,1043 1417,1100 1437,1109 1406,1152 1406,1228 1440,1241 1419,1266 1433,1297 1469,1297 1486,1270 1513,1264 1521,1236 1545,1224 1555,1231 1535,1294 1556,1315 1596,1311 1641,1287 1731,1295 1830,1279 1840,1249 1804,1226 1818,1182 1798,1145 1813,1107 1809,1050 1843,1031 1843,927 1794,886 1806,843"
    ]
  },
  {
    "key": "cruz",
    "badge": "03",
    "characterId": "cruz",
    "displayName": "克露丝·埃雷拉",
    "enName": "Cruz Herrera",
    "kicker": "NO. 03 · 归航号总轮机师",
    "summary": "碳基人族 · 工程师。重塑卡扣式 OG 黄铜法拉第屏蔽暗壳，并以相干干涉仪测出母核浅层九颗激发态准晶胞。",
    "artbook": {
      "x": 73.2,
      "y": 51.0
    },
    "starport": {
      "x": 69.0,
      "y": 59.0
    },
    "spotAssetId": "ensemble-spot-cruz-latest",
    "boxPct": {
      "left": 67.1615,
      "top": 49.537,
      "width": 10.3906,
      "height": 33.4259
    },
    "hitPolys": [
      "2641,1070 2615,1111 2614,1137 2628,1162 2652,1164 2645,1184 2671,1210 2640,1223 2579,1297 2579,1353 2599,1363 2615,1397 2639,1395 2675,1417 2678,1454 2668,1511 2644,1533 2651,1552 2612,1583 2613,1636 2579,1654 2579,1685 2590,1695 2579,1773 2597,1791 2676,1786 2685,1748 2673,1655 2709,1624 2705,1604 2723,1578 2718,1603 2736,1623 2706,1641 2724,1669 2704,1727 2772,1772 2884,1786 2923,1749 2904,1687 2927,1624 2919,1603 2934,1587 2926,1571 2933,1529 2948,1516 2943,1480 2977,1448 2977,1384 2880,1313 2878,1286 2858,1278 2845,1244 2828,1242 2833,1148 2802,1123 2796,1098 2775,1095 2753,1070"
    ]
  },
  {
    "key": "dorji",
    "badge": "05",
    "characterId": "dorji",
    "displayName": "多吉·库诺",
    "enName": "Dorji Kuno",
    "kicker": "NO. 05 · 纳构双形态先锋重坦",
    "summary": "纳米星兽族 · 先锋重坦。可在两头身巡航柴犬与全功率重装格斗体态间瞬时重构。",
    "artbook": {
      "x": 86.8,
      "y": 50.0
    },
    "starport": {
      "x": 83.5,
      "y": 56.5
    },
    "spotAssetId": "ensemble-spot-dorji-latest",
    "boxPct": {
      "left": 77.474,
      "top": 48.9352,
      "width": 13.8542,
      "height": 38.1019
    },
    "hitPolys": [
      "3163,1057 3136,1072 3124,1095 3095,1103 3091,1153 3101,1180 3059,1215 3060,1239 3044,1247 3041,1266 3002,1280 2985,1302 2991,1322 2975,1325 2975,1478 3014,1512 3048,1514 3051,1555 3036,1575 3063,1603 3056,1628 3022,1638 2992,1674 2985,1713 3012,1743 3056,1755 3166,1707 3183,1678 3172,1615 3188,1576 3199,1619 3228,1647 3222,1680 3249,1702 3251,1778 3278,1854 3303,1879 3389,1879 3411,1857 3417,1820 3376,1726 3388,1705 3372,1690 3374,1661 3476,1620 3506,1579 3506,1491 3457,1441 3471,1416 3461,1397 3463,1348 3410,1312 3367,1240 3327,1211 3296,1164 3248,1132 3258,1118 3249,1074 3231,1057"
    ]
  },
  {
    "key": "miu",
    "badge": "06",
    "characterId": "miu",
    "displayName": "弥羽·奥塞尔",
    "enName": "Miu Ocel",
    "kicker": "NO. 06 · 太空舱近战格斗士",
    "summary": "纳米星兽族 · 格斗士。携球形太空舱电台高速突入敌阵的敏捷双形态近战专家。",
    "artbook": {
      "x": 14.2,
      "y": 51.8
    },
    "starport": {
      "x": 11.8,
      "y": 64.5
    },
    "spotAssetId": "ensemble-spot-miu-latest",
    "boxPct": {
      "left": 11.4062,
      "top": 50.1852,
      "width": 13.9323,
      "height": 37.0833
    },
    "hitPolys": [
      "643,1084 626,1099 627,1120 579,1144 548,1184 485,1225 477,1266 491,1317 458,1324 438,1353 438,1487 510,1576 503,1598 524,1632 509,1686 520,1758 554,1785 597,1789 592,1834 610,1870 649,1884 716,1884 753,1862 789,1795 783,1762 768,1748 821,1760 881,1737 889,1700 852,1654 917,1633 972,1592 972,1523 957,1483 972,1465 972,1393 945,1375 954,1360 947,1332 972,1303 972,1253 947,1207 916,1198 917,1150 882,1110 864,1108 832,1140 813,1144 789,1103 760,1084"
    ]
  },
  {
    "key": "roya",
    "badge": "01B",
    "characterId": "darrow",
    "displayName": "罗娅·达罗",
    "enName": "Roya Darrow",
    "kicker": "NO. 01B · 星环小队执核双主角",
    "summary": "碳基人族 · 赏金猎人。领口佩母亲留下的 09 号船坞六角铝牌，暗礁危机后执掌锚定阴核。",
    "artbook": {
      "x": 58.5,
      "y": 55.5
    },
    "starport": {
      "x": 49.2,
      "y": 55.0
    },
    "spotAssetId": "ensemble-spot-roya-latest",
    "boxPct": {
      "left": 50.0521,
      "top": 54.3056,
      "width": 12.1875,
      "height": 42.6389
    },
    "hitPolys": [
      "2237,1173 2113,1173 2106,1196 2065,1223 2069,1279 2040,1314 2017,1323 2015,1358 1976,1374 1948,1406 1940,1452 1959,1472 1962,1497 1982,1512 1965,1555 1971,1571 1948,1589 1947,1608 1967,1630 1971,1664 1998,1673 2011,1699 1994,1756 2005,1803 1982,1898 1922,2017 1922,2082 1934,2093 2017,2093 2037,2064 2072,2061 2107,2036 2133,1989 2113,1871 2148,1778 2171,1748 2202,1750 2227,1726 2270,1720 2288,1697 2287,1640 2308,1621 2351,1621 2389,1595 2387,1488 2365,1474 2342,1417 2362,1360 2340,1351 2342,1322 2307,1295 2318,1282 2307,1242"
    ]
  },
  {
    "key": "roy",
    "badge": "01A",
    "characterId": "darrow",
    "displayName": "罗伊·达罗",
    "enName": "Roy Darrow",
    "kicker": "NO. 01A · 星环小队执核双主角",
    "summary": "碳基人族 · 赏金猎人。十年前零号母门遗孤，角色右腰磁吸匣佩裹有 OG 街机黄铜屏蔽壳的开拓阳核。",
    "artbook": {
      "x": 31.2,
      "y": 57.5
    },
    "starport": {
      "x": 36.8,
      "y": 60.0
    },
    "spotAssetId": "ensemble-spot-roy-latest",
    "boxPct": {
      "left": 25.5729,
      "top": 56.713,
      "width": 17.526,
      "height": 43.287
    },
    "hitPolys": [
      "1177,1225 1183,1247 1138,1258 1103,1319 1072,1335 1020,1428 1029,1473 1008,1492 994,1573 1008,1596 1002,1620 982,1638 982,1837 1017,1856 1011,1915 1031,1927 1063,1915 1071,1946 1039,2042 1047,2087 1071,2106 1130,2114 1170,2109 1199,2089 1230,1977 1210,1920 1220,1899 1196,1861 1211,1839 1259,1841 1282,1827 1318,1846 1327,1876 1360,1895 1361,1921 1388,1968 1421,2003 1448,2013 1427,2084 1446,2124 1506,2159 1652,2157 1654,2084 1608,2039 1576,1967 1554,1949 1561,1890 1535,1873 1544,1847 1518,1797 1577,1760 1578,1714 1548,1680 1504,1670 1475,1639 1498,1621 1493,1601 1516,1558 1513,1537 1557,1528 1588,1489 1588,1441 1571,1428 1554,1435 1534,1346 1509,1327 1475,1327 1436,1353 1435,1375 1420,1386 1428,1434 1445,1446 1419,1477 1402,1460 1392,1413 1376,1401 1368,1276 1339,1275 1333,1251 1312,1250 1285,1225"
    ]
  }
]

const pinDisplayOrder = computed(() => {
  const orderRank: Record<string, number> = {
    roy: 1, roya: 2, bonnie: 3, cruz: 4, gunnar: 5,
    dorji: 6, miu: 7, ange: 8, kyuzo: 9, rook: 10, wylin: 11,
  }
  return [...ensemblePins].sort((a, b) => (orderRank[a.key] ?? 99) - (orderRank[b.key] ?? 99))
})

const activeSpotKey = computed(() => hoveredKey.value ?? pinnedKey.value)
const rosterById = computed(() => Object.fromEntries(data.roster.map((item) => [item.id, item])))
const activePin = computed(() => activeSpotKey.value ? (ensemblePins.find((p) => p.key === activeSpotKey.value) ?? null) : null)
const activePinCharacter = computed(() => activePin.value ? rosterById.value[activePin.value.characterId] : null)
const dossierDockRight = computed(() => {
  if (!activePin.value) return false
  const pos = activeKv.value === 'artbook' ? activePin.value.artbook : activePin.value.starport
  return pos.x < 50
})
const ep01 = computed(() => story.episodesById.ep01 ?? story.episodes[0])

function clearLeaveTimer() {
  if (leaveTimer !== null) {
    clearTimeout(leaveTimer)
    leaveTimer = null
  }
}

function enterCharacter(key: string) {
  clearLeaveTimer()
  hoveredKey.value = key
}

function scheduleLeaveCharacter() {
  clearLeaveTimer()
  leaveTimer = setTimeout(() => {
    hoveredKey.value = null
  }, 110)
}

function leaveStageImmediate() {
  clearLeaveTimer()
  hoveredKey.value = null
}

function togglePinCharacter(key: string) {
  clearLeaveTimer()
  pinnedKey.value = pinnedKey.value === key ? null : key
  hoveredKey.value = key
}

onBeforeUnmount(() => clearLeaveTimer())

function pinStyle(pin: HotspotPin) {
  const pos = activeKv.value === 'artbook' ? pin.artbook : pin.starport
  return { left: `${pos.x}%`, top: `${pos.y}%` }
}

function spotLayerStyle(pin: HotspotPin) {
  const b = pin.boxPct
  return {
    left: `${b.left}%`,
    top: `${b.top}%`,
    width: `${b.width}%`,
    height: `${b.height}%`,
  }
}

function matchesRaceFilter(characterId: string) {
  if (activeRaceFilter.value === 'all') return true
  return world.characters[characterId]?.raceId === activeRaceFilter.value
}

function padIndex(index: number) {
  return String(index + 1).padStart(2, '0')
}
</script>

<template>
  <div class="roster-shell artbook-home">
    <!-- Above-the-Fold Plate 00: 11-Cast Interactive Hero -->
    <section v-if="world?.assets?.['ensemble-artbook-latest']" class="ensemble-hero" aria-label="十一人集结主视觉画卷">
      <div class="ensemble-hero__meta">
        <p class="ensemble-hero__plate">
          <span>PLATE NO. 00</span> — 白塔星港露台 · 十一人集结主视觉（悬停画中任意人物即可点亮赛璐璐涂色并预览档案）
        </p>
        <div class="ensemble-hero__switcher" role="tablist" aria-label="主视觉画风切换">
          <button
            type="button"
            role="tab"
            :aria-selected="activeKv === 'artbook'"
            :class="{ 'is-active': activeKv === 'artbook' }"
            @click="activeKv = 'artbook'"
          >画集彩铅原画（悬停点亮涂色）</button>
          <button
            type="button"
            role="tab"
            :aria-selected="activeKv === 'starport'"
            :class="{ 'is-active': activeKv === 'starport' }"
            @click="activeKv = 'starport'"
          >炽环门赛璐璐全景</button>
        </div>
      </div>

      <div class="ensemble-hero__frame">
        <div class="ensemble-hero__stage" @mouseleave="leaveStageImmediate">
          <div class="ensemble-canvas-wrap">
            <div class="ensemble-hero__canvas" :hidden="activeKv !== 'artbook'">
              <WorldImage id="ensemble-artbook-latest" />
            </div>
            <div v-if="world.assets['ensemble-starport-latest']" class="ensemble-hero__canvas" :hidden="activeKv !== 'starport'">
              <WorldImage id="ensemble-starport-latest" />
            </div>

            <!-- 11 Individual Per-Character Cel-Shaded Hover Layers (Artbook Mode) -->
            <template v-for="pin in ensemblePins" :key="`spot-${pin.key}`">
              <figure
                v-if="world.assets[pin.spotAssetId]"
                class="release-image ensemble-spot-layer"
                :class="{ 'is-active': activeKv === 'artbook' && activeSpotKey === pin.key }"
                :hidden="activeKv !== 'artbook'"
                :data-asset-id="pin.spotAssetId"
                :style="spotLayerStyle(pin)"
                aria-hidden="true"
              >
                <img
                  :src="withBase(world.assets[pin.spotAssetId].web.path)"
                  :width="world.assets[pin.spotAssetId].web.width"
                  :height="world.assets[pin.spotAssetId].web.height"
                  alt=""
                  decoding="async"
                >
              </figure>
            </template>

            <!-- Exact 4K Character Silhouette SVG Hitmap (Ordered Back-to-Front) -->
            <svg
              v-show="activeKv === 'artbook'"
              class="ensemble-hitmap"
              viewBox="0 0 3840 2160"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <g
                v-for="pin in ensemblePins"
                :key="`hit-${pin.key}`"
                class="ensemble-hitmap__group"
                :data-spot-key="pin.key"
                @mouseenter="enterCharacter(pin.key)"
                @mouseleave="scheduleLeaveCharacter"
                @click.stop="togglePinCharacter(pin.key)"
              >
                <polygon
                  v-for="(pts, pIdx) in pin.hitPolys"
                  :key="pIdx"
                  :points="pts"
                />
              </g>
            </svg>

            <!-- 11 Interactive Character Badges -->
            <button
              v-for="pin in pinDisplayOrder"
              :key="pin.key"
              type="button"
              class="ensemble-pin"
              :class="{
                'is-active': activeSpotKey === pin.key,
                'is-dimmed': activeSpotKey !== null && activeSpotKey !== pin.key,
              }"
              :style="pinStyle(pin)"
              :aria-label="`预览 ${pin.displayName} 赛璐璐涂色与档案`"
              @mouseenter="enterCharacter(pin.key)"
              @mouseleave="scheduleLeaveCharacter"
              @focus="enterCharacter(pin.key)"
              @blur="scheduleLeaveCharacter"
              @click.stop="togglePinCharacter(pin.key)"
            >{{ pin.badge }}</button>
          </div>

          <!-- Floating Editorial Dossier Card (Auto-Docks Opposite Hovered Character) -->
          <aside
            v-if="activePin && activePinCharacter"
            class="ensemble-dossier"
            :class="[`ensemble-dossier--${activeKv}`, { 'ensemble-dossier--right': dossierDockRight }]"
            :style="activePinCharacter.accent ? { '--pin-accent': activePinCharacter.accent } : undefined"
            aria-live="polite"
            @mouseenter="clearLeaveTimer"
            @mouseleave="scheduleLeaveCharacter"
          >
            <p class="ensemble-dossier__kicker">{{ activePin.kicker }}</p>
            <h2 class="ensemble-dossier__name">
              {{ activePin.displayName }}
              <small>{{ activePin.enName }}</small>
            </h2>
            <p class="ensemble-dossier__summary">{{ activePin.summary }}</p>
            <div class="ensemble-dossier__foot">
              <span>{{ world.characters[activePin.characterId]?.raceLabel }} · {{ activePinCharacter.role }}</span>
              <a :href="withBase(activePinCharacter.home)">翻阅角色档案 →</a>
            </div>
          </aside>
        </div>
      </div>

      <div class="ensemble-editorial-lockup">
        <div>
          <p class="roster-label">ARCHIVE VOLUME I · 星环纪元官方美术设定集</p>
          <h1 class="roster-title">一枚读数 0.00 的游戏铜板，<br>与十一位跨族同伴的星环远征。</h1>
        </div>
        <div class="ensemble-editorial-lockup__side">
          <p class="roster-intro">
            收录 OhGamers 企划全部定稿视觉与叙事资产：十一位星环小队成员（十席正式编制）、天秤财团宿敌核心、五大生命谱系姓氏考据、4K 服装层序拆解及主线漫画《0.00 的游戏币》。
          </p>
          <div class="ensemble-editorial-actions">
            <a class="artbook-btn artbook-btn--ink" href="#roster-archive">浏览角色群像图鉴 →</a>
            <a class="artbook-btn artbook-btn--outline" :href="withBase('/story/ep01')">阅读第 01 话漫画（34页）</a>
            <a class="artbook-btn artbook-btn--outline" :href="withBase('/world/')">世界观与抛币图解</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Section I: Squad Roster Archive -->
    <section id="roster-archive" class="roster-section artbook-roster-section" aria-labelledby="squad-heading">
      <div class="roster-section__header">
        <div>
          <p class="roster-section__label">CHAPTER I · 星环小队正式编制（10 席档案 · 11 位成员）</p>
          <h2 id="squad-heading" class="roster-section__title">角色群像与衣层拆解图鉴</h2>
          <p class="roster-section__intro">每位成员均配置独立角色主题色、身世小传、A 姿三视、T 姿四视与武装拆解设定。</p>
        </div>
        <div v-if="world?.races?.length" class="artbook-filter-bar" role="group" aria-label="按种族筛选小队角色">
          <button
            type="button"
            class="artbook-filter-pill"
            :class="{ 'is-active': activeRaceFilter === 'all' }"
            @click="activeRaceFilter = 'all'"
          >全部小队（11人）</button>
          <button
            v-for="race in world.races"
            :key="race.id"
            type="button"
            class="artbook-filter-pill"
            :class="{ 'is-active': activeRaceFilter === race.id }"
            @click="activeRaceFilter = race.id"
          >{{ race.name }}</button>
        </div>
      </div>

      <div class="character-grid">
        <a
          v-for="(character, index) in data.roster"
          :key="character.id"
          class="character-card"
          :href="withBase(character.home)"
          :data-character-id="character.id"
          :data-asset-id="character.portrait.asset"
          :style="character.accent ? { '--card-accent': character.accent } : undefined"
          :hidden="!matchesRaceFilter(character.id)"
        >
          <div class="roster-picture">
            <span class="character-card__index" aria-hidden="true">NO. {{ padIndex(index) }}</span>
            <span v-if="world.characters[character.id]?.raceLabel" class="character-card__race" aria-hidden="true">
              {{ world.characters[character.id].raceLabel }}
            </span>
            <img :src="withBase(character.portrait.path)" :width="character.portrait.width" :height="character.portrait.height" alt="" loading="lazy" decoding="async">
          </div>
          <div class="character-card__copy">
            <div class="character-card__accent-line" aria-hidden="true"></div>
            <h2 class="character-card__name">{{ character.name }}</h2>
            <p class="character-card__role">{{ character.role }}</p>
            <p class="roster-updated">最近更新 <time :datetime="character.updated">{{ character.updated }}</time></p>
          </div>
        </a>
      </div>
    </section>

    <!-- Section II: Story & Antagonist Cast -->
    <section v-if="world?.storyCast?.standardCards?.length" class="roster-section" aria-labelledby="story-cast-heading">
      <div class="roster-section__header">
        <div>
          <p class="roster-section__label">CHAPTER II · 主线剧情提炼 · 重点全拆解与普通单卡双轨制</p>
          <h2 id="story-cast-heading" class="roster-section__title">{{ world.storyCast.title }}</h2>
          <p class="roster-section__intro">{{ world.storyCast.intro }}</p>
        </div>
        <a class="roster-section__more" :href="withBase('/world/cast')">查看完整敌方与剧情角色图鉴 <span aria-hidden="true">↗</span></a>
      </div>
      <div class="npc-roster-grid">
        <a
          v-for="boss in data.majorCast"
          :key="boss.id"
          class="npc-roster-card npc-roster-card--major"
          :href="withBase(boss.home)"
          :data-npc-id="boss.id"
          :data-asset-id="boss.portrait.asset"
          :style="boss.accent ? { '--card-accent': boss.accent } : undefined"
        >
          <div class="npc-roster-card__picture">
            <img
              :src="withBase(boss.portrait.path)"
              :width="boss.portrait.width"
              :height="boss.portrait.height"
              alt=""
              loading="lazy"
              decoding="async"
            >
            <span class="npc-roster-card__badge npc-roster-card__badge--major">宿敌核心 · 全衣层拆解</span>
          </div>
          <div class="npc-roster-card__copy">
            <div class="npc-roster-card__head">
              <h3 class="npc-roster-card__name">{{ boss.name }}</h3>
              <span class="npc-roster-card__en">{{ world.characters[boss.id]?.enName ?? boss.id }}</span>
            </div>
            <p class="npc-roster-card__faction">{{ boss.role }} · {{ world.characters[boss.id]?.raceLabel }}</p>
            <p class="npc-roster-card__summary">{{ world.characters[boss.id]?.tagline }}</p>
            <p class="roster-updated">全套 4K 拆解 · 最近更新 <time :datetime="boss.updated">{{ boss.updated }}</time></p>
          </div>
        </a>
        <a
          v-for="npc in world.storyCast.standardCards"
          :key="npc.id"
          class="npc-roster-card"
          :href="withBase(`/world/cast#${npc.id}`)"
          :data-npc-id="npc.id"
          :data-asset-id="npc.portrait?.asset"
        >
          <div v-if="npc.portrait" class="npc-roster-card__picture">
            <img
              :src="withBase(npc.portrait.path)"
              :width="npc.portrait.width"
              :height="npc.portrait.height"
              alt=""
              loading="lazy"
              decoding="async"
            >
            <span class="npc-roster-card__badge">{{ npc.tier }}</span>
          </div>
          <div class="npc-roster-card__copy">
            <div class="npc-roster-card__head">
              <h3 class="npc-roster-card__name">{{ npc.name }}</h3>
              <span class="npc-roster-card__en">{{ npc.enName }}</span>
            </div>
            <p class="npc-roster-card__faction">{{ npc.faction }} · {{ npc.raceLabel }}</p>
            <p class="npc-roster-card__summary">{{ npc.tagline }}</p>
            <p class="roster-updated">{{ npc.debut }} · 最近更新 <time :datetime="npc.updated">{{ npc.updated }}</time></p>
          </div>
        </a>
      </div>
    </section>

    <!-- Section III & IV: Dual Artbook Spread (World Bible + EP01 Manga) -->
    <section class="artbook-dual-spread" aria-label="世界总纲与主线漫画专题跨页">
      <div class="artbook-spread-card">
        <div>
          <p class="roster-section__label">CHAPTER III · 星环纪元世界总纲与五大谱系</p>
          <h2 class="artbook-spread-card__title">OG 黄铜屏蔽暗壳 × 无字炽环母核</h2>
          <p class="artbook-spread-card__desc">
            唯有外层人类街机黄铜皮印有 OG 字样以隔绝能谱探测（读数恒为 0.00）；滑壳瞬间显露零字母、零灯槽的光滑乌金母核，相干干涉仪下可见内部浅层九颗激发态准晶胞。
          </p>
        </div>

        <div class="artbook-core-engraving" aria-hidden="true">
          <svg viewBox="0 0 540 176">
            <g transform="translate(88, 84)">
              <circle r="54" fill="#E6B85C" stroke="#1B1917" stroke-width="2" />
              <circle r="44" fill="none" stroke="#8C621E" stroke-width="1.2" stroke-dasharray="6 4" />
              <circle r="29" fill="#F2CB78" stroke="#1B1917" stroke-width="1.5" />
              <text x="0" y="7" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="20" fill="#5A3D0C">OG</text>
              <text x="0" y="74" text-anchor="middle" font-size="11.5" fill="#57524A">外层 · 惰性黄铜屏蔽壳</text>
            </g>
            <g transform="translate(186, 84)">
              <line x1="-18" y1="0" x2="22" y2="0" stroke="#9E7840" stroke-width="1.5" />
              <polygon points="22,-4 30,0 22,4" fill="#9E7840" />
              <text x="4" y="-9" text-anchor="middle" font-size="10.5" fill="#9E7840">滑扣弹开</text>
            </g>
            <g transform="translate(284, 84)">
              <circle r="54" fill="#23262D" stroke="#B8C0CC" stroke-width="4.5" />
              <circle r="50" fill="none" stroke="#1B1917" stroke-width="1.4" />
              <circle r="33" fill="none" stroke="#E5B976" stroke-width="1.8" />
              <text x="0" y="74" text-anchor="middle" font-size="11.5" fill="#57524A">内胆 · 无字无槽乌金母核</text>
            </g>
            <g transform="translate(444, 84)">
              <circle r="52" fill="#FAF7F1" stroke="#9E7840" stroke-width="1.2" stroke-dasharray="3 3" />
              <polygon points="0,-38 33,-19 33,19 0,38 -33,19 -33,-19" fill="none" stroke="#C8B99E" stroke-width="1" />
              <circle cx="0" cy="0" r="4.8" fill="#C43B28" />
              <circle cx="0" cy="-29" r="4" fill="#9E7840" /><circle cx="25" cy="-14" r="4" fill="#9E7840" />
              <circle cx="25" cy="14" r="4" fill="#9E7840" /><circle cx="0" cy="29" r="4" fill="#9E7840" />
              <circle cx="-25" cy="14" r="4" fill="#9E7840" /><circle cx="-25" cy="-14" r="4" fill="#9E7840" />
              <circle cx="-12" cy="-7" r="3.6" fill="#9E7840" /><circle cx="12" cy="7" r="3.6" fill="#9E7840" />
              <text x="0" y="74" text-anchor="middle" font-size="11.5" fill="#57524A">干涉透视 · 浅层九颗激发晶胞</text>
            </g>
          </svg>
        </div>

        <div>
          <div v-if="world?.races?.length" class="artbook-race-seals">
            <a
              v-for="race in world.races"
              :key="race.id"
              class="artbook-race-seal"
              :href="withBase(`/world/races#${race.id}`)"
            >
              <b>{{ race.name }}</b>
              <small>{{ race.enName }}</small>
            </a>
          </div>
          <div class="artbook-spread-card__foot">
            <span>含可交互抛币结契推演与归航号跨世代史诗</span>
            <a :href="withBase('/world/#coin-pact')">进入世界观总纲 →</a>
          </div>
        </div>
      </div>

      <div v-if="ep01" class="artbook-spread-card">
        <div>
          <p class="roster-section__label">CHAPTER IV · 周刊卷头规格正篇漫画连载</p>
          <h2 class="artbook-spread-card__title">{{ ep01.title }} · 全 34 页归档</h2>
          <p class="artbook-spread-card__desc">{{ ep01.summary }}</p>
        </div>

        <div class="artbook-manga-openbook">
          <a
            v-for="thumb in ep01.previewThumbs.slice(0, 2)"
            :key="thumb.asset"
            class="story-preview-card artbook-manga-leaf"
            :href="withBase(ep01.path)"
            :data-asset-id="thumb.asset"
          >
            <img :src="withBase(thumb.path)" :width="thumb.width" :height="thumb.height" alt="" loading="lazy" decoding="async">
          </a>
        </div>

        <div class="artbook-spread-card__foot">
          <span>支持「画册跨页 / 竖屏条漫」双模式与 4K 放大检视</span>
          <a :href="withBase(ep01.path)">展开沉浸式阅读器 →</a>
        </div>
      </div>
    </section>

    <!-- Section V: Universal Base Bodies & Production Standards -->
    <section v-if="baseBodies?.tiers?.length" class="roster-section" aria-labelledby="base-bodies-heading">
      <div class="roster-section__header">
        <div>
          <p class="roster-section__label">CHAPTER V · 公共基础资产与制版基准</p>
          <h2 id="base-bodies-heading" class="roster-section__title">四档通用素体设计规范</h2>
          <p class="roster-section__intro">{{ baseBodies.intro }}</p>
        </div>
        <a class="roster-section__more" :href="withBase('/standards/')">查看素体总览与通用规范 <span aria-hidden="true">↗</span></a>
      </div>
      <div class="base-body-grid base-body-grid--home">
        <a
          v-for="tier in baseBodies.tiers"
          :key="tier.id"
          class="base-body-card"
          :href="withBase(tier.path)"
          :data-base-body-id="tier.id"
          :data-asset-id="tier.portrait.asset"
        >
          <div class="roster-picture">
            <img
              :src="withBase(tier.portrait.path)"
              :width="tier.portrait.width"
              :height="tier.portrait.height"
              alt=""
              loading="lazy"
              decoding="async"
            >
            <span class="base-body-card__badge">{{ tier.scale }}</span>
          </div>
          <div class="base-body-card__copy">
            <div class="base-body-card__head">
              <h3 class="base-body-card__name">{{ tier.name }}</h3>
              <span class="base-body-card__ratio">{{ tier.headRatio }}</span>
            </div>
            <p class="base-body-card__role">{{ tier.role }}</p>
            <p class="roster-updated">A 姿三视 · T 姿四视 · 最近更新 <time :datetime="baseBodies.updated">{{ baseBodies.updated }}</time></p>
          </div>
        </a>
      </div>
    </section>
  </div>
</template>
