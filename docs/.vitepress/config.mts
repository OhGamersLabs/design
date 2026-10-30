import { defineConfig } from 'vitepress'
import { createSearchRender } from './search-render.mjs'
import { parseAnchorMap, parseArchive, parseChanges, parseNames, readJson } from './data/bunny-data.mjs'

const dataRoot = new URL('./data/bunny/', import.meta.url)
const archive = parseArchive(readJson(new URL('archive.json', dataRoot), { groups: [] }))
const names = parseNames(readJson(new URL('asset-names.json', dataRoot), {}))
const changes = parseChanges(readJson(new URL('changes.json', dataRoot), []))
const anchorMap = parseAnchorMap(readJson(new URL('anchor-map.json', dataRoot), { stubs: {}, anchors: {} }))

export default defineConfig({
  lang: 'zh-CN',
  title: 'OhGamers 设计白皮书',
  description: 'OhGamers 角色设计白皮书、终稿与通用规范。',
  cleanUrls: true,
  appearance: false,
  markdown: { headers: true },
  head: [
    ['meta', { name: 'theme-color', content: '#ffffff' }],
  ],
  transformPageData(pageData) {
    if (pageData.frontmatter.bunny !== 'stub') return
    const path = `/${pageData.relativePath.replace(/\.md$/, '').replace(/index$/, '')}`
    const stub = anchorMap.stubs[path]
    if (!stub) throw new Error(`Missing redirect stub: ${path}`)
    pageData.frontmatter.head ??= []
    pageData.frontmatter.head.push(['meta', { 'http-equiv': 'refresh', content: `3; url=${stub.target}` }])
  },
  themeConfig: {
    siteTitle: 'OhGamers / Design',
    nav: [
      { text: 'Bunny', link: '/characters/bunny/', activeMatch: '^/characters/bunny/(?!downloads|archive)' },
      { text: '下载', link: '/characters/bunny/downloads' },
      { text: '历史档案', link: '/characters/bunny/archive' },
      { text: '通用规范', link: '/standards/', activeMatch: '/standards/' },
    ],
    sidebar: {
      '/standards/': [
        {
          text: '通用规范',
          items: [{ text: '规范索引', link: '/standards/' }],
        },
      ],
    },
    outline: { label: '本页目录', level: [2, 3] },
    docFooter: { prev: '上一页', next: '下一页' },
    sidebarMenuLabel: '章节导航',
    returnToTopLabel: '回到顶部',
    darkModeSwitchLabel: '外观',
    skipToContentLabel: '跳至正文',
    footer: {
      message: '角色、美术与相关 IP 的使用须另行获得授权。',
      copyright: 'OhGamers · Design Library',
    },
    search: {
      provider: 'local',
      options: {
        _render: createSearchRender({ archive, names, changes }),
        locales: {
          root: {
            translations: {
              button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
              modal: {
                displayDetails: '显示详情',
                resetButtonTitle: '清除搜索',
                backButtonTitle: '关闭搜索',
                noResultsText: '未找到相关内容',
                footer: {
                  selectText: '选择',
                  selectKeyAriaLabel: 'Enter 键',
                  navigateText: '切换',
                  navigateUpKeyAriaLabel: '向上键',
                  navigateDownKeyAriaLabel: '向下键',
                  closeText: '关闭',
                  closeKeyAriaLabel: 'Escape 键',
                },
              },
            },
          },
        },
      },
    },
  },
})
