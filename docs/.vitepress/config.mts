import { defineConfig } from 'vitepress'

export default defineConfig({
  lang: 'zh-CN',
  title: 'OhGamers 设计白皮书',
  description: 'OhGamers 角色设计白皮书、终稿与通用规范。',
  cleanUrls: true,
  appearance: false,
  head: [
    ['meta', { name: 'theme-color', content: '#faf9ff' }],
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
              text: 'Bunny · 1.0.0',
              items: [
                { text: '角色总览', link: '/characters/bunny/' },
                { text: '设计语言', link: '/characters/bunny/design-language' },
                { text: '头部与表情', link: '/characters/bunny/head-expressions' },
                { text: '上装与分层', link: '/characters/bunny/upper-layers' },
                { text: '双手与腕部', link: '/characters/bunny/hands' },
                { text: '腿部与护具', link: '/characters/bunny/legs' },
                { text: '鞋部结构', link: '/characters/bunny/shoes' },
                { text: '电锯与背负', link: '/characters/bunny/saw' },
                { text: '穿戴组合', link: '/characters/bunny/assembly' },
                { text: '下载与资产索引', link: '/characters/bunny/downloads' },
              ],
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
