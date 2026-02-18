import type { Group, Word } from '@app/api/data/dataset'
import { formatGroup } from '@std/format'

export interface ChineseWord extends Word {
  pinyin: string
  tr: string
}

export interface ChineseGroup extends Group {
  items: ChineseWord[]
}

export interface ChineseDataset {
  kind: 'chinese'
  from: string
  to: string
  groups: ChineseGroup[]
}

export interface ChineseDatasetStats {
  groups: number
  words: number
  chars: number
}

// --- Raw JSON shapes (before parsing) ---

interface RawChineseWord {
  id: number
  word: string
  pinyin: string
  english: string
  tags?: string[]
}

interface RawChineseGroup {
  group: number
  tags?: string[]
  items: RawChineseWord[]
}

export interface RawChineseDataset {
  kind: 'chinese'
  from: string
  to: string
  groups: RawChineseGroup[]
}

export function parseChineseDataset(raw: RawChineseDataset): ChineseDataset {
  return {
    kind: raw.kind,
    from: raw.from,
    to: raw.to,
    groups: raw.groups.map((g) => ({
      ...g,
      idx: g.group,
      id: g.group,
      displayId: formatGroup(g.group),
      items: g.items.map((item) => ({
        ...item,
        idx: item.id,
        id: item.id,
        displayId: String(item.id),
        tr: item.english,
      })),
    })),
  }
}
