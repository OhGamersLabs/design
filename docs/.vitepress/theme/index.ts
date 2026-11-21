import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import ReleaseImage from './components/ReleaseImage.vue'
import AssetImage from './components/AssetImage.vue'
import OriginNote from './components/OriginNote.vue'
import LayerStrip from './components/LayerStrip.vue'
import LayerTpose from './components/LayerTpose.vue'
import CharacterHero from './components/CharacterHero.vue'
import LatestList from './components/LatestList.vue'
import ChapterBar from './components/ChapterBar.vue'
import BodyMeasurements from './components/BodyMeasurements.vue'
import GarmentMeasurements from './components/GarmentMeasurements.vue'
import SiteLayout from './SiteLayout.vue'
import CharacterPage from './CharacterPage.vue'
import CharacterRoster from './CharacterRoster.vue'
import BaseBodyPage from './BaseBodyPage.vue'
import BaseBodyHero from './components/BaseBodyHero.vue'
import BaseBodyImage from './components/BaseBodyImage.vue'
import BaseBodyTierGrid from './components/BaseBodyTierGrid.vue'
import BaseBodyTierViews from './components/BaseBodyTierViews.vue'
import './style.css'

export default {
  extends: DefaultTheme,
  Layout: SiteLayout,
  enhanceApp({ app }) {
    if (import.meta.env.SSR) app.config.throwUnhandledErrorInProduction = true
    app.component('CharacterPage', CharacterPage)
    app.component('CharacterRoster', CharacterRoster)
    app.component('BaseBodyPage', BaseBodyPage)
    app.component('BaseBodyHero', BaseBodyHero)
    app.component('BaseBodyImage', BaseBodyImage)
    app.component('BaseBodyTierGrid', BaseBodyTierGrid)
    app.component('BaseBodyTierViews', BaseBodyTierViews)
    app.component('AssetImage', AssetImage)
    app.component('OriginNote', OriginNote)
    app.component('LayerStrip', LayerStrip)
    app.component('LayerTpose', LayerTpose)
    app.component('CharacterHero', CharacterHero)
    app.component('LatestList', LatestList)
    app.component('ChapterBar', ChapterBar)
    app.component('ReleaseImage', ReleaseImage)
    app.component('BodyMeasurements', BodyMeasurements)
    app.component('GarmentMeasurements', GarmentMeasurements)
  },
} satisfies Theme
