import type { ChineseWord, ChineseGroup } from '@dom/kind/chinese/dataset'
import { formatGroup } from '@std/format'

// --- Raw JSON shapes ---

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

export interface ParsedChineseContent {
  kind: 'chinese'
  from: string
  to: string
  groups: ChineseGroup[]
}

export function parseChineseDataset(raw: RawChineseDataset): ParsedChineseContent {
  return {
    kind: raw.kind,
    from: raw.from,
    to: raw.to,
    groups: raw.groups.map((g): ChineseGroup => ({
      ...g,
      idx: g.group,
      id: g.group,
      displayId: formatGroup(g.group),
      items: g.items.map((item): ChineseWord => ({
        ...item,
        idx: item.id,
        id: item.id,
        displayId: String(item.id),
        tr: item.english,
      })),
    })),
  }
}
