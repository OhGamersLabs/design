import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import ReleaseImage from './components/ReleaseImage.vue'
import EditorialPair from './components/EditorialPair.vue'
import EditorialLayout from './EditorialLayout.vue'
import './style.css'
import './bunny-editorial.css'

export default {
  extends: DefaultTheme,
  Layout: EditorialLayout,
  enhanceApp({ app }) {
    app.component('ReleaseImage', ReleaseImage)
    app.component('EditorialPair', EditorialPair)
  },
} satisfies Theme
