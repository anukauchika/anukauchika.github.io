import { supabase } from './supabase-client.js'

export async function createGroupSession(record) {
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

export async function updateGroupSessionDone(id, doneAt) {
  const { error } = await supabase
    .from('group_session')
    .update({ done_at: doneAt })
    .eq('id', id)
  if (error) throw error
}

export async function insertWordAttempt(record) {
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

export async function insertCharLogs(chars) {
  const { error } = await supabase
    .from('char_log')
    .upsert(chars, {
      onConflict: 'word_attempt_id,char_index',
      ignoreDuplicates: true,
    })
  if (error) throw error
}

export async function fetchAllUserSessions() {
  const { data, error } = await supabase
    .from('group_session')
    .select('*')
    .order('started_at', { ascending: true })
  if (error) throw error
  return data
}

export async function fetchWordAttempts(sessionIds) {
  if (sessionIds.length === 0) return []
  const { data, error } = await supabase
    .from('word_attempt')
    .select('*')
    .in('group_session_id', sessionIds)
  if (error) throw error
  return data
}

export async function fetchCharLogs(wordAttemptIds) {
  if (wordAttemptIds.length === 0) return []
  const { data, error } = await supabase
    .from('char_log')
    .select('*')
    .in('word_attempt_id', wordAttemptIds)
  if (error) throw error
  return data
}
