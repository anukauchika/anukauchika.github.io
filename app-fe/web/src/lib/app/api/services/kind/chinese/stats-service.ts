import type { PracticeType } from '@app/api/data/kind/chinese/types'
import type { DailyActivity, GroupSessionSummary, WordStat } from './types'

export interface StatsService {
  getWordStats(datasetId: string, practiceType: PracticeType): Promise<WordStat[]>
  getGroupSessionSummaries(datasetId: string, practiceType: PracticeType): Promise<Map<string, GroupSessionSummary>>
  getDailyActivity(datasetId: string, practiceType: PracticeType): Promise<Map<string, DailyActivity>>
}
