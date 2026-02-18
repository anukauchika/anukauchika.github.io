// --- Enums ---

export enum PracticeType {
  ChineseStroke = 's',
  ChinesePinyin = 'p',
}

export enum SyncStatus {
  Pending = 0,
  Synced = 1,
}

// --- Storage records (IDB + Supabase shape) ---

export interface GroupSession {
  id: number
  user_id: string | null
  dataset_id: string
  practice_type: PracticeType
  group_id: number
  started_at: string
  done_at: string | null
  synced: SyncStatus
}

export interface WordAttempt {
  id: number
  group_session_id: number
  word_id: number
  started_at: string
  done_at: string
  synced: SyncStatus
}

export interface CharLog {
  word_attempt_id: number
  char_index: number
  started_at: string
  done_at: string
  error_count: number
  synced: SyncStatus
}
