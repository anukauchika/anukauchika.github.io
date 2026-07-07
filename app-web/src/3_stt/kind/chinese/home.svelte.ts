import type { ChineseNextDrill } from '@dom/kind/chinese/stats'

class HomeState {
  loaded: boolean = $state(false)
  todaySessions: number = $state(0)
  todayDurationMs: number = $state(0)
  dueCount: number = $state(0)
  drilledWords: number = $state(0)
  next: ChineseNextDrill | null = $state(null)
}

export const sttHome = new HomeState()
