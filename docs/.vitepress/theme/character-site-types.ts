export interface AssetFile {
  path: string
  width: number
  height: number
  bytes: number
}

export interface AssetRecord {
  id: string
  collection: string
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
  key: 'scene' | 'three' | 'tpose' | 'line' | 'card'
  label: string
  caption: string
  assets: string[]
}

type Swatch = 'orange' | 'red' | 'white' | 'black'
export type ColorChip = { name: string; use: string } & (
  { swatch: Swatch; color?: never } | { color: string; swatch?: never }
)

export interface HomeData {
  tabs: HeroTab[]
  highlights: { date: string; title: string; asset: string; caption: string }[]
  facts: Fact[]
  chips: ColorChip[]
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
  tpose?: { front: string; right: string; back: string; left: string }
  summary: string
  facts: Fact[]
  leftRight: string
}

export interface LayerSet {
  chapter: string
  noun: string
  wear: string
  items: LayerRecord[]
}

export interface AnchorMap {
  stubs: Record<string, { target: string; title: string }>
  anchors: Record<string, string>
}

export interface ReadingEntry {
  path: string
  title: string
}

export interface CharacterDefinition {
  id: string
  name: string
  role: string
  order: number
  portrait: string
  listed: boolean
  pages: ReadingEntry[]
}

export interface CharacterData {
  id: string
  name: string
  role: string
  order: number
  portrait: string
  listed: boolean
  readingOrder: ReadingEntry[]
  assets: Record<string, AssetRecord>
  home: HomeData
  layers: LayerSet | null
  anchorMap: AnchorMap
  displayText: Record<string, Record<string, string>>
}

export interface RosterEntry {
  id: string
  name: string
  role: string
  home: string
  updated: string
  portrait: { asset: string; path: string; width: number; height: number }
}

export interface SiteData {
  characters: Record<string, CharacterData>
  roster: RosterEntry[]
  anchorMap: AnchorMap
}
