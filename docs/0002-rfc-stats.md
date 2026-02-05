# RFC: Server Side Stats

Based on: `0002-req-stats.md`

## Scope

Character-level practice logging for `kind = 'chinese'`. Supabase with offline queue. Migrations via GitHub Actions.

## Overview

Stats only for logged-in users. Two tables: sessions and char logs. Offline-first with IndexedDB queue.

## Compact Codes

**Dataset IDs (2 char):** `aa`, `ab`, `ac`, ... assigned sequentially in registry.json

**Practice types (1 char):**
| Type | Code |
|------|------|
| stroke | s |

## Supabase Schema

**Table: `group_session`**

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK, generated always as identity |
| user_id | uuid | FK auth.users, NOT NULL |
| dataset_id | char(2) | NOT NULL |
| practice_type | char(1) | NOT NULL |
| group_id | smallint | NOT NULL |
| started_at | timestamptz | NOT NULL |
| done_at | timestamptz | NULL (set on completion) |

**Table: `word_attempt`**

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK, generated always as identity |
| group_session_id | bigint | FK group_session.id, NOT NULL |
| word_id | smallint | NOT NULL |
| started_at | timestamptz | NOT NULL |
| done_at | timestamptz | NOT NULL |

**Table: `char_log`**

| Column | Type | Notes |
|--------|------|-------|
| word_attempt_id | bigint | FK word_attempt.id, NOT NULL |
| char_index | smallint | NOT NULL |
| started_at | timestamptz | NOT NULL |
| done_at | timestamptz | NOT NULL |
| error_count | smallint | NOT NULL, default 0 |

Primary key: `(word_attempt_id, char_index)`

**RLS Policies:**

`group_session`:
- SELECT/INSERT/UPDATE: `auth.uid() = user_id`

`word_attempt`:
- SELECT/INSERT: `group_session_id IN (SELECT id FROM group_session WHERE user_id = auth.uid())`

`char_log`:
- SELECT/INSERT: `word_attempt_id IN (SELECT id FROM word_attempt WHERE group_session_id IN (SELECT id FROM group_session WHERE user_id = auth.uid()))`

**Indexes:**
- `group_session(user_id, dataset_id)` — dataset stats
- `group_session(user_id, dataset_id, group_id)` — group stats
- `word_attempt(group_session_id)` — words in session
- `char_log(word_attempt_id)` — chars in word

## Dedup

Group session: `UNIQUE (user_id, dataset_id, practice_type, group_id, started_at)`
Word attempt: `UNIQUE (group_session_id, word_id, started_at)` — allows retries
Char: composite PK `(word_attempt_id, char_index)`

## Migrations

**Structure:**
```
supabase/
  config.toml
  migrations/
    YYYYMMDD-001_create_group_session.sql
    YYYYMMDD-002_create_word_attempt.sql
    YYYYMMDD-003_create_char_log.sql
```

**GitHub Action** (on push to main):
```yaml
- uses: supabase/setup-cli@v1
- run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
- run: supabase db push
```

**Local dev:** `supabase migration new <name>`, `supabase db push`

## Layering

```
Practice.svelte → state/practice-stats.js → api.js → api/supabase-stats.js
                                                   ↘ data/idb-sync-queue.js
```

- **api/supabase-stats.js**: Supabase client calls
- **data/idb-sync-queue.js**: Offline queue for sessions and chars
- **state/practice-stats.js**: Orchestrates session lifecycle and sync

## API Functions

**`api.stats.*`:**
- `createGroupSession(record)` — insert group_session, return id
- `updateGroupSessionDone(id, doneAt)` — set done_at on completion
- `logWordAttempt(record, chars[])` — insert word_attempt + batch insert char_logs
- `syncPending()` — batch upload queued records
- `getGroupSessions(datasetId)` — fetch user's sessions for dataset
- `getWordAttempts(sessionId)` — fetch word attempts for session
- `getWordStats(datasetId)` — aggregate word success counts

## Offline-First Sync

**Group session start (online):**
1. Insert `group_session` to Supabase, get `id`
2. Store `id` in memory for word attempts

**Group session start (offline):**
1. Generate temp client ID (negative number)
2. Queue session in IndexedDB
3. On reconnect: insert session, get real `id`, update queued word attempts

**Word complete (online):**
1. Insert `word_attempt`, get `id`
2. Batch insert all `char_log` rows for that word
3. Single transaction if possible

**Word complete (offline):**
1. Queue word attempt + chars in IndexedDB with temp session ID
2. On reconnect: sync session first, then words with real session ID

**App start:**
1. If authenticated, `syncPending()` in background
2. Non-blocking — UI loads immediately

**IndexedDB stores (unified cache + queue):**
```js
group_sessions: { id, temp_id?, dataset_id, practice_type, group_id, started_at, done_at, synced }
word_attempts: { id, temp_id?, group_session_id, word_id, started_at, done_at, synced }
char_logs: { word_attempt_id, char_index, started_at, done_at, error_count, synced }
```

- `synced: false` = pending upload
- `synced: true` = backed up to Supabase, safe to read
- `temp_id` = client-generated ID before server response (replaced with real `id` on sync)

## Practice.svelte Changes

**Group session lifecycle:**
- On group start: `createGroupSession()` or queue if offline
- On group complete: `updateGroupSessionDone()`

**Word tracking:**
- Track `wordStartedAt` when first char of word begins
- Accumulate char data in memory: `{ charIndex, startedAt, doneAt, errorCount }`
- On word complete: `logWordAttempt()` with word data + all chars (batch insert)

**Char tracking:**
- Track `charStartedAt` when char quiz begins
- Track `errorCount` via HanziWriter `onMistake` callback
- On char `onComplete`: store in memory, don't insert yet
- Insert happens on word complete (batch)

## Display

- No stats UI when not logged in
- Show hints: "Log in to track progress"

**Stats computation:**
- Read from local IndexedDB (fast, offline-capable)
- Same computation logic as current implementation
- Supabase is durability layer, not primary read source

**New device / restore:**
1. On login, check if local cache is empty
2. Fetch all user data from Supabase
3. Populate IndexedDB cache
4. Stats display works immediately after

**Local cache structure (IndexedDB):**
```js
group_sessions: { id, dataset_id, practice_type, group_id, started_at, done_at, synced }
word_attempts: { id, group_session_id, word_id, started_at, done_at, synced }
char_logs: { word_attempt_id, char_index, started_at, done_at, error_count, synced }
```

**Periodic cleanup:**
- Delete synced records older than 90 days (configurable)
- Keeps IndexedDB size manageable
- Full history always in Supabase
