
# RFC: Data Types

## Goal

Define shared TypeScript types for all data structures. No changes to existing files — types are consumed by future refactoring.

## Folder rename: `api/` → `supabase/`

Current `api/` folder is all Supabase-specific code. Rename to `supabase/` to free up `api/` as the app's public data contract. Types go to `api/types.ts`.

## File: `api/types.ts`

```ts
// --- Enums ---

enum PracticeType {
  ChineseStroke = 's',
  ChinesePinyin = 'p',
}

enum SyncStatus {
  Pending = 0,
  Synced = 1,
}

enum ListViewStyle {
  Compact = 'compact',
  Full = 'full',
}

// --- Storage records (IDB + Supabase shape) ---

interface GroupSession {
  id: number
  user_id: string | null
  dataset_id: string
  practice_type: PracticeType
  group_id: string
  started_at: string           // ISO timestamp
  done_at: string | null       // null = incomplete/skipped
  synced: SyncStatus
}

interface WordAttempt {
  id: number
  group_session_id: number
  word_id: string
  started_at: string
  done_at: string
  synced: SyncStatus
}

interface CharLog {
  word_attempt_id: number
  char_index: number
  started_at: string
  done_at: string
  error_count: number
  synced: SyncStatus
}

// --- Derived (computed by services) ---

interface WordStat {
  datasetId: string
  practiceType: PracticeType
  groupId: string
  wordId: string
  successCount: number
  errorCount: number
  lastPracticedAt: string | null
}

interface GroupSessionSummary {
  total: number                // total sessions for this group
  full: number                 // completed sessions (done_at set)
  lastPracticedAt: string | null
  lastFullSessionAt: string | null
}

interface DailyActivity {
  count: number                // unique words practiced
  durationMs: number           // total practice time
  sessions: number             // number of sessions
}
```
