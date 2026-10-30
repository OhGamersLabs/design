export interface AssetFile {
  path: string
  width: number
  height: number
  bytes: number
}

export interface AssetRecord {
  id: string
  collection: 'bunny/3.1.0' | 'origins/1.0.0'
  status: string | null
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
  facts: Fact[]
  chips: { name: string; use: string; swatch: 'orange' | 'red' | 'white' | 'black' }[]
  chipNote: string
  version: string
  status: string
  updated: string
  chapters: { id: string; label: string }[]
}

export interface ChangeRecord {
  date: string
  order: number
  latest: { title: string; asset: string; caption: string } | null
  log: { change: string; reason: string; asset: string; caption: string }
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

export type DownloadItem = { asset: string; label: string } | { file: string; label: string }

export interface DownloadGroup {
  id: string
  group: string
  anchors: string[]
  items: DownloadItem[]
}

export interface DownloadsData {
  home: DownloadGroup[]
  page: DownloadGroup[]
}

export interface DownloadPackage {
  path: string
  bytes: number
}

export interface ArchiveData {
  groups: {
    id: string
    title: string
    statuses: string[]
    items: { asset: string; date: string; replacedBy: string }[]
  }[]
}

export interface AnchorMap {
  stubs: Record<string, { target: string; title: string }>
  anchors: Record<string, string>
}

export interface BunnySiteData {
  assets: Record<string, AssetRecord>
  home: HomeData
  changes: ChangeRecord[]
  layers: LayerRecord[]
  downloads: DownloadsData
  package: DownloadPackage
  archive: ArchiveData
  anchorMap: AnchorMap
  displayText: Record<string, Record<string, string>>
}
