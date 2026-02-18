import type { PracticeType } from '@dat/kind/chinese/types'
import type { DailyActivity, GroupSessionSummary, WordStat } from '@svc/api/kind/chinese/types'

export interface StatsService {
  getWordStats(datasetId: string, practiceType: PracticeType): Promise<WordStat[]>
  getGroupSessionSummaries(datasetId: string, practiceType: PracticeType): Promise<Map<number, GroupSessionSummary>>
  getDailyActivity(datasetId: string, practiceType: PracticeType): Promise<Map<string, DailyActivity>>
}
