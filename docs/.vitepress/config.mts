import { defineConfig } from 'vitepress'
import { createSearchRender } from './search-render.mjs'
import { loadCharacters, siteNav } from './characters.mjs'

const { roster, majorCast } = loadCharacters()

export default defineConfig({
  lang: 'zh-CN',
  title: 'OhGamers 星环设定集',
  description: 'OhGamers 星环纪元官方美术设定集：十一人全员主视觉、角色图鉴、世界总纲、主线漫画连载与通用制作规范。',
  cleanUrls: true,
  appearance: false,
  markdown: { headers: true },
  head: [
    ['meta', { name: 'theme-color', content: '#FAF7F1' }],
  ],
  themeConfig: {
    siteTitle: 'OhGamers · 星环设定集',
    nav: siteNav(roster, majorCast),
    sidebar: {},
    outline: { label: '本页目录', level: [2, 3] },
    docFooter: { prev: '上一页', next: '下一页' },
    sidebarMenuLabel: '章节导航',
    returnToTopLabel: '回到顶部',
    darkModeSwitchLabel: '外观',
    skipToContentLabel: '跳至正文',
    footer: {
      message: '角色、美术、漫画与相关 IP 资产的使用须另行获得授权。',
      copyright: 'OhGamers · Astral Ring Official Art & Design Archive',
    },
    search: {
      provider: 'local',
      options: {
        _render: createSearchRender(),
        locales: {
          root: {
            translations: {
              button: { buttonText: '检索设定集', buttonAriaLabel: '检索设定集' },
              modal: {
                displayDetails: '显示详情',
                resetButtonTitle: '清除搜索',
                backButtonTitle: '关闭搜索',
                noResultsText: '未找到相关设定或词条',
                footer: {
                  selectText: '跳转',
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
