import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import ReleaseImage from './components/ReleaseImage.vue'
import AssetImage from './components/AssetImage.vue'
import OriginNote from './components/OriginNote.vue'
import LayerStrip from './components/LayerStrip.vue'
import CharacterHero from './components/CharacterHero.vue'
import LatestList from './components/LatestList.vue'
import ChapterBar from './components/ChapterBar.vue'
import BodyMeasurements from './components/BodyMeasurements.vue'
import GarmentMeasurements from './components/GarmentMeasurements.vue'
import SiteLayout from './SiteLayout.vue'
import BunnyPage from './BunnyPage.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout: SiteLayout,
  enhanceApp({ app }) {
    if (import.meta.env.SSR) app.config.throwUnhandledErrorInProduction = true
    app.component('BunnyPage', BunnyPage)
    app.component('AssetImage', AssetImage)
    app.component('OriginNote', OriginNote)
    app.component('LayerStrip', LayerStrip)
    app.component('CharacterHero', CharacterHero)
    app.component('LatestList', LatestList)
    app.component('ChapterBar', ChapterBar)
    app.component('ReleaseImage', ReleaseImage)
    app.component('BodyMeasurements', BodyMeasurements)
    app.component('GarmentMeasurements', GarmentMeasurements)
  },
} satisfies Theme
