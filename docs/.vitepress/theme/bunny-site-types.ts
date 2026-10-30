export interface AssetFile {
  path: string
  width: number
  height: number
  bytes: number
}

export interface AssetRecord {
  id: string
  collection: 'bunny' | 'origins'
  name: string
  web: AssetFile
  original: AssetFile
  thumb: { path: string; width: number; height: number }
}

export interface Fact {
  term: string
  value: string
  note?: string
}

export interface HeroTab {
  key: 'scene' | 'three' | 'line'
  label: string
  caption: string
  assets: string[]
}

export interface HomeData {
  tabs: HeroTab[]
  highlights: { date: string; title: string; asset: string; caption: string }[]
  facts: Fact[]
  chips: { name: string; use: string; swatch: 'orange' | 'red' | 'white' | 'black' }[]
  chipNote: string
  status: string
  updated: string
  chapters: { id: string; label: string }[]
}

export interface LayerRecord {
  layer: number
  name: string
  path: string
  front: string
  side: string
  back: string
  summary: string
  facts: Fact[]
  leftRight: string
}

export interface AnchorMap {
  stubs: Record<string, { target: string; title: string }>
  anchors: Record<string, string>
}

export interface BunnySiteData {
  assets: Record<string, AssetRecord>
  home: HomeData
  layers: LayerRecord[]
  anchorMap: AnchorMap
  displayText: Record<string, Record<string, string>>
}
