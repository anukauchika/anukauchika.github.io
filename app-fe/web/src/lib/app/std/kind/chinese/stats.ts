import type { ChineseGroup, ChineseDatasetStats } from '@app/api/data/kind/chinese/Dataset'

const isCJK = (c: string): boolean => c >= '\u4E00' && c <= '\u9FFF'

export function uniqueChars(groups: ChineseGroup[]): Set<string> {
  const chars = new Set<string>()
  for (const g of groups) {
    for (const item of g.items) {
      for (const c of item.word) {
        if (isCJK(c)) chars.add(c)
      }
    }
  }
  return chars
}

export function calcStats(groups: ChineseGroup[]): ChineseDatasetStats {
  return {
    groups: groups.length,
    words: groups.reduce((sum, g) => sum + g.items.length, 0),
    chars: uniqueChars(groups).size,
  }
}
