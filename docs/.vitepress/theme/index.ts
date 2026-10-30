import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import ReleaseImage from './components/ReleaseImage.vue'
import AssetImage from './components/AssetImage.vue'
import OriginNote from './components/OriginNote.vue'
import LayerStrip from './components/LayerStrip.vue'
import CharacterHero from './components/CharacterHero.vue'
import LatestList from './components/LatestList.vue'
import ChapterBar from './components/ChapterBar.vue'
import ArchiveGrid from './components/ArchiveGrid.vue'
import ChangelogTable from './components/ChangelogTable.vue'
import DownloadList from './components/DownloadList.vue'
import BodyMeasurements from './components/BodyMeasurements.vue'
import GarmentMeasurements from './components/GarmentMeasurements.vue'
import BodyProportionCompare from './components/BodyProportionCompare.vue'
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
    app.component('ArchiveGrid', ArchiveGrid)
    app.component('ChangelogTable', ChangelogTable)
    app.component('DownloadList', DownloadList)
    app.component('ReleaseImage', ReleaseImage)
    app.component('BodyMeasurements', BodyMeasurements)
    app.component('GarmentMeasurements', GarmentMeasurements)
    app.component('BodyProportionCompare', BodyProportionCompare)
  },
} satisfies Theme
