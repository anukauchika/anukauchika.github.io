export interface ChineseItem {
  id: number
  word: string
  pinyin: string
  english: string
  tags?: string[]
}

export interface ChineseGroup {
  group: number
  tags?: string[]
  items: ChineseItem[]
}

export interface ChineseDataset {
  kind: 'chinese'
  from: string
  to: string
  search: string[]
  groups: ChineseGroup[]
}

export interface ChineseDatasetStats {
  groups: number
  words: number
  chars: number
}
