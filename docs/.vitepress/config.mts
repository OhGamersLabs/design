import { defineConfig } from 'vitepress'
import { bunnySections } from './bunny-navigation.mjs'

export default defineConfig({
  lang: 'zh-CN',
  title: 'OhGamers 设计白皮书',
  description: 'OhGamers 角色设计白皮书、终稿与通用规范。',
  cleanUrls: true,
  appearance: false,
  markdown: { headers: true },
  head: [
    ['meta', { name: 'theme-color', content: '#fffdfa' }],
  ],
  themeConfig: {
    siteTitle: 'OhGamers / Design',
    nav: [
      { text: 'Bunny', link: '/characters/bunny/', activeMatch: '/characters/bunny/' },
      { text: '通用规范', link: '/standards/', activeMatch: '/standards/' },
    ],
    sidebar: {
      '/characters/': [
        {
          text: '角色档案',
          items: [
            {
              text: 'Bunny · 1.1.0',
              items: bunnySections.map((section) => ({
                text: `${section.number} · ${section.label}`,
                link: section.link,
                items: section.items.filter((item) => item.link !== section.link),
              })),
            },
          ],
        },
      ],
      '/standards/': [
        {
          text: '通用规范',
          items: [{ text: '规范索引', link: '/standards/' }],
        },
      ],
    },
    outline: { label: '本页目录', level: [2, 3] },
    docFooter: { prev: '上一章', next: '下一章' },
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
