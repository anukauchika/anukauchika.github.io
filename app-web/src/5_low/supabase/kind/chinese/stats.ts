import { supabase } from '@low/supabase/supabase-client.js'
import type { StorageDrill, StorageAttempt, StorageCharLog } from '@dat/kind/chinese/types'

type DrillRecord = Omit<StorageDrill, 'id' | 'synced' | 'done_at'> & { done_at?: string | null }
type AttemptRecord = Omit<StorageAttempt, 'id' | 'synced'>
type CharLogRecord = Omit<StorageCharLog, 'synced'>

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
  const { error } = await supabase
    .from('char_log')
    .upsert(chars, {
      onConflict: 'word_attempt_id,char_index',
      ignoreDuplicates: true,
    })
  if (error) throw error
}

const PAGE_SIZE = 1000

async function fetchAllPages<T>(query: () => ReturnType<ReturnType<typeof supabase.from>['select']>): Promise<T[]> {
  const all: T[] = []
  let offset = 0
  while (true) {
    const { data, error } = await query().range(offset, offset + PAGE_SIZE - 1)
    if (error) throw error
    all.push(...(data as T[]))
    if (data.length < PAGE_SIZE) break
    offset += PAGE_SIZE
  }
  return all
}

async function fetchAllUserSessions(): Promise<StorageDrill[]> {
  return fetchAllPages<StorageDrill>(() =>
    supabase.from('group_session').select('*').order('started_at', { ascending: true }),
  )
}

async function fetchWordAttempts(sessionIds: number[]): Promise<StorageAttempt[]> {
  if (sessionIds.length === 0) return []
  return fetchAllPages<StorageAttempt>(() =>
    supabase.from('word_attempt').select('*').in('group_session_id', sessionIds),
  )
}

async function fetchCharLogs(wordAttemptIds: number[]): Promise<StorageCharLog[]> {
  if (wordAttemptIds.length === 0) return []
  return fetchAllPages<StorageCharLog>(() =>
    supabase.from('char_log').select('*').in('word_attempt_id', wordAttemptIds),
  )
}

export interface LowStatsSupabase {
  createGroupSession(record: DrillRecord): Promise<{ id: number }>
  updateGroupSessionDone(id: number, doneAt: string): Promise<void>
  insertWordAttempt(record: AttemptRecord): Promise<{ id: number }>
  insertCharLogs(chars: CharLogRecord[]): Promise<void>
  fetchAllUserSessions(): Promise<StorageDrill[]>
  fetchWordAttempts(sessionIds: number[]): Promise<StorageAttempt[]>
  fetchCharLogs(wordAttemptIds: number[]): Promise<StorageCharLog[]>
}

export const lowStatsSupabase: LowStatsSupabase = {
  createGroupSession,
  updateGroupSessionDone,
  insertWordAttempt,
  insertCharLogs,
  fetchAllUserSessions,
  fetchWordAttempts,
  fetchCharLogs,
}
