import type { DailyActivity, GroupSessionSummary, PracticeType, WordStat } from './types'

export interface StatsService {
  getWordStats(datasetId: string, practiceType: PracticeType): Promise<WordStat[]>
  getGroupSessionSummaries(datasetId: string, practiceType: PracticeType): Promise<Map<string, GroupSessionSummary>>
  getDailyActivity(datasetId: string, practiceType: PracticeType): Promise<Map<string, DailyActivity>>
}
