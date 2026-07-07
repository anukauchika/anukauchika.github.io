// Summary the app main page renders — one fetch, nothing more.

export interface ChineseNextDrill {
  groupId: number
  type: 'stroke' | 'pinyin'
}

export interface ChineseHomeSummary {
  todaySessions: number
  todayDurationMs: number
  dueCount: number
  drilledWords: number
  next: ChineseNextDrill | null
}
