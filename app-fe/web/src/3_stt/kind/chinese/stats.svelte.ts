import type { GroupId, WordKey } from '@dom/dataset'
import type { DayKey, WordProgress, GroupProgress, DayProgress } from '@dom/stats'

class StatsState {
  wordProgress: Map<WordKey, WordProgress> = $state(new Map())
  wordProgressStroke: Map<WordKey, WordProgress> = $state(new Map())
  wordProgressPinyin: Map<WordKey, WordProgress> = $state(new Map())

  groupProgress: Map<GroupId, GroupProgress> = $state(new Map())
  groupProgressStroke: Map<GroupId, GroupProgress> = $state(new Map())
  groupProgressPinyin: Map<GroupId, GroupProgress> = $state(new Map())

  dayProgress: Map<DayKey, DayProgress> = $state(new Map())
}

export const sttStats = new StatsState()
