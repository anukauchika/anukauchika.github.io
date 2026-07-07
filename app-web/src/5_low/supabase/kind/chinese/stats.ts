import { supabase } from '@low/supabase/supabase-client.js'
import type { StorageDrill, StorageAttempt, StorageCharLog } from '@dat/kind/chinese/types'

type DrillRecord = Omit<StorageDrill, 'id' | 'synced' | 'done_at'> & { done_at?: string | null }
type AttemptRecord = Omit<StorageAttempt, 'id' | 'synced'>
type CharLogRecord = Omit<StorageCharLog, 'synced'>

const CHAR_LOG_UPSERT_BATCH_SIZE = 500

interface RestoreChineseStatsPayload {
  sessions: StorageDrill[]
  words: StorageAttempt[]
  chars: StorageCharLog[]
}

export interface ChineseGroupReviewRecord {
  group_id: number
  practice_type: string
  full_count: number
  clean_count: number
  first_full_at: string | null
  last_full_at: string | null
  last_clean_at: string | null
  last_session_hint_count: number | null
  reason: string
  due_at: string | null
  interval_days: number | null
}

export interface ChineseHomeSummaryRecord {
  today_sessions: number
  today_duration_ms: number
  due_count: number
  drilled_words: number
  next_group_id: number | null
  next_practice_type: string | null
  next_reason: string | null
}

async function createGroupSession(record: DrillRecord): Promise<{ id: number }> {
  const { data, error } = await supabase
    .from('group_session')
    .upsert(record, {
      onConflict: 'user_id,dataset_id,practice_type,group_id,started_at',
      ignoreDuplicates: true,
    })
    .select('id')
  if (error) throw error
  if (data.length > 0) return data[0]

  // Duplicate — fetch existing row by unique key
  const { data: existing, error: err2 } = await supabase
    .from('group_session')
    .select('id')
    .eq('user_id', record.user_id)
    .eq('dataset_id', record.dataset_id)
    .eq('practice_type', record.practice_type)
    .eq('group_id', record.group_id)
    .eq('started_at', record.started_at)
    .single()
  if (err2) throw err2
  return existing
}

async function updateGroupSessionDone(id: number, doneAt: string): Promise<void> {
  const { error } = await supabase
    .from('group_session')
    .update({ done_at: doneAt })
    .eq('id', id)
  if (error) throw error
}

async function insertWordAttempt(record: AttemptRecord): Promise<{ id: number }> {
  const { data, error } = await supabase
    .from('word_attempt')
    .upsert(record, {
      onConflict: 'group_session_id,word_id,started_at',
      ignoreDuplicates: true,
    })
    .select('id')
  if (error) throw error
  if (data.length > 0) return data[0]

  // Duplicate — fetch existing row by unique key
  const { data: existing, error: err2 } = await supabase
    .from('word_attempt')
    .select('id')
    .eq('group_session_id', record.group_session_id)
    .eq('word_id', record.word_id)
    .eq('started_at', record.started_at)
    .single()
  if (err2) throw err2
  return existing
}

async function insertCharLogs(chars: CharLogRecord[]): Promise<void> {
  for (let offset = 0; offset < chars.length; offset += CHAR_LOG_UPSERT_BATCH_SIZE) {
    const batch = chars.slice(offset, offset + CHAR_LOG_UPSERT_BATCH_SIZE)
    const { error } = await supabase
      .from('char_log')
      .upsert(batch, {
        onConflict: 'word_attempt_id,char_index',
        ignoreDuplicates: true,
      })
    if (error) throw error
  }
}

async function restoreChineseStats(): Promise<RestoreChineseStatsPayload> {
  const { data, error } = await supabase.rpc('restore_chinese_stats')
  if (error) throw error

  return {
    sessions: data?.sessions ?? [],
    words: data?.words ?? [],
    chars: data?.chars ?? [],
  }
}

async function getChineseGroupReviewState(datasetCode: string, groupIds: number[], timeZone: string): Promise<ChineseGroupReviewRecord[]> {
  const { data, error } = await supabase.rpc('chinese_group_review_state', {
    p_dataset_id: datasetCode,
    p_group_ids: groupIds,
    p_timezone: timeZone,
  })
  if (error) throw error
  return data ?? []
}

async function getChineseHomeSummary(datasetCode: string, groupIds: number[], timeZone: string): Promise<ChineseHomeSummaryRecord | null> {
  const { data, error } = await supabase.rpc('chinese_home_summary', {
    p_dataset_id: datasetCode,
    p_group_ids: groupIds,
    p_timezone: timeZone,
  })
  if (error) throw error
  return data?.[0] ?? null
}

export interface LowStatsSupabase {
  createGroupSession(record: DrillRecord): Promise<{ id: number }>
  updateGroupSessionDone(id: number, doneAt: string): Promise<void>
  insertWordAttempt(record: AttemptRecord): Promise<{ id: number }>
  insertCharLogs(chars: CharLogRecord[]): Promise<void>
  restoreChineseStats(): Promise<RestoreChineseStatsPayload>
  getChineseGroupReviewState(datasetCode: string, groupIds: number[], timeZone: string): Promise<ChineseGroupReviewRecord[]>
  getChineseHomeSummary(datasetCode: string, groupIds: number[], timeZone: string): Promise<ChineseHomeSummaryRecord | null>
}

export const lowStatsSupabase: LowStatsSupabase = {
  createGroupSession,
  updateGroupSessionDone,
  insertWordAttempt,
  insertCharLogs,
  restoreChineseStats,
  getChineseGroupReviewState,
  getChineseHomeSummary,
}
