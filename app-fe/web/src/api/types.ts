// --- Enums ---

export enum PracticeType {
  ChineseStroke = 's',
  ChinesePinyin = 'p',
}

export enum SyncStatus {
  Pending = 0,
  Synced = 1,
}

export enum ListViewStyle {
  Compact = 'compact',
  Full = 'full',
}

// --- Storage records (IDB + Supabase shape) ---

export interface GroupSession {
  id: number
  user_id: string | null
  dataset_id: string
  practice_type: PracticeType
  group_id: string
  started_at: string
  done_at: string | null
  synced: SyncStatus
}

export interface WordAttempt {
  id: number
  group_session_id: number
  word_id: string
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

// --- Derived (computed by services) ---

export interface WordStat {
  datasetId: string
  practiceType: PracticeType
  groupId: string
  wordId: string
  successCount: number
  errorCount: number
  lastPracticedAt: string | null
}

export interface GroupSessionSummary {
  total: number
  full: number
  lastPracticedAt: string | null
  lastFullSessionAt: string | null
}

export interface DailyActivity {
  count: number
  durationMs: number
  sessions: number
}
