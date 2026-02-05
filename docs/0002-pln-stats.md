# Plan: Server Side Stats

Based on: `0002-rfc-stats.md`

**Prerequisites:** Read RFC for full schema details, RLS policies, indexes, and unique constraints.

---

## Phase 1: Supabase migrations infrastructure

**Scope:** `supabase/`, `.github/workflows/`

**Steps:**
1. Create `supabase/config.toml` with basic config
2. Create migration files (schema from RFC):
   - `YYYYMMDD-001_create_group_session.sql`
   - `YYYYMMDD-002_create_word_attempt.sql`
   - `YYYYMMDD-003_create_char_log.sql`
3. Create `.github/workflows/supabase-migrate.yml` — triggers on push to main, paths `supabase/migrations/**`, uses `supabase/setup-cli@v1`, runs `supabase link` + `supabase db push`

**Manual (user):**
- Generate Supabase access token (dashboard → account → access tokens)
- Add GitHub secrets: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`
- Run `supabase link` and `supabase db push` locally to test

---

## Phase 2: Dataset ID codes

**Scope:** `app-fe/data/registry.json`, `app-fe/web/src/state/registry.js`

**Steps:**
1. Add `code` field (2-char) to each dataset: `aa`, `ab`, `ac`, ...
2. Add `getDatasetCode(datasetId)` helper in `registry.js`
3. Define practice type constant: `'s'` = stroke

---

## Phase 3: New IndexedDB schema

**Scope:** `app-fe/web/src/data/idb-stats.js` (new file)

**Steps:**
1. New database: `memris-stats-v2`
2. Stores:
   - `group_sessions` (keyPath: `id`, indexes: `[dataset_id, practice_type]`, `synced`)
   - `word_attempts` (keyPath: `id`, indexes: `group_session_id`, `synced`)
   - `char_logs` (keyPath: `[word_attempt_id, char_index]`, indexes: `synced`)
3. Functions:
   - Write: `saveGroupSession`, `saveWordAttempt`, `saveCharLogs`
   - Read: `getGroupSessions`, `getWordAttempts`, `getCharLogs`, `getWordStats`
   - Sync: `getPendingSessions`, `getPendingWordAttempts`, `getPendingCharLogs`
   - Mark synced: `markSessionSynced(tempId, realId)` — also updates `group_session_id` in word_attempts
   - Mark synced: `markWordAttemptSynced(tempId, realId)` — also updates `word_attempt_id` in char_logs
   - Restore: `bulkInsertSessions`, `bulkInsertWordAttempts`, `bulkInsertCharLogs`, `isEmpty`

**Key points:**
- Temp IDs: negative numbers (client-generated)
- Real IDs: positive bigints (from Supabase)

---

## Phase 4: Supabase stats API

**Scope:** `app-fe/web/src/api/`

**Steps:**
1. Extract shared client: `supabase-client.js` (used by auth and stats)
2. Create `supabase-stats.js`:
   - `createGroupSession(record)` → returns `{ id }`
   - `updateGroupSessionDone(id, doneAt)`
   - `insertWordAttempt(record)` → returns `{ id }`
   - `insertCharLogs(chars[])` — batch insert
   - `fetchAllUserSessions()`, `fetchWordAttempts(sessionIds)`, `fetchCharLogs(wordAttemptIds)`
3. Update `api.js`: expose `api.stats.*`

**Key point:** Use `ON CONFLICT DO NOTHING` for dedup

---

## Phase 5: Sync orchestration

**Scope:** `app-fe/web/src/state/sync.js` (new file)

**Steps:**
1. `syncPending()`:
   - Sync sessions first → get real IDs → propagate to word_attempts
   - Sync word_attempts → get real IDs → propagate to char_logs
   - Sync char_logs
   - Guard against concurrent syncs with flag
2. `restoreFromServer()`: fetch all user data from Supabase, bulk insert to IndexedDB with `synced: true`
3. Call `syncPending()` from `auth.js` on app init (non-blocking)

**Key point:** Sync order matters — sessions → words → chars (dependency chain)

---

## Phase 6: State layer refactor

**Scope:** `app-fe/web/src/state/practice-stats.js`

**Steps:**
1. Replace `idb-stats-repo` import with new `idb-stats`
2. Keep existing store shapes for UI compatibility
3. Update load functions to use new IDB schema
4. Add session lifecycle functions:
   - `startGroupSession(datasetId, practiceType, groupId)` → saves to IDB, triggers sync, returns temp ID
   - `endGroupSession(sessionId)` → updates `done_at`, triggers sync
   - `recordWordAttempt(sessionId, wordId, startedAt, doneAt, chars[])` → saves word + chars, updates stores, triggers sync
5. Temp ID counter: starts at -1, decrements

---

## Phase 7: Practice.svelte changes

**Scope:** `app-fe/web/src/kind/chinese/Practice.svelte`

**Steps:**
1. Add tracking state: `groupSessionId`, `wordStartedAt`, `charStartedAt`, `charErrorCount`, `charData[]`
2. On group start: call `startGroupSession()` if authenticated
3. On char init: record `charStartedAt`, reset `charErrorCount`
4. Add `onMistake` callback to HanziWriter: increment `charErrorCount`
5. On char complete: push to `charData[]` (first char sets `wordStartedAt`)
6. On word complete: call `recordWordAttempt()` with accumulated `charData`, clear array
7. On session end: call `endGroupSession()`

**Key point:** All stat calls guarded by `$isAuthenticated`

---

## Phase 8: Auth-gated stats display

**Scope:** `Practice.svelte`, `App.svelte`, group list components

**Steps:**
1. Conditionally render stat elements (success count badges, etc.) only when authenticated
2. Hide session counts, last practiced timestamps, activity viz when not authenticated
3. Add subtle login hint: "Log in to track progress"

---

## Phase 9: New device restore

**Scope:** `app-fe/web/src/state/auth.js`, `sync.js`

**Steps:**
1. In `initAuth()`: check `idb.isEmpty()`
2. If empty + authenticated: call `restoreFromServer()` (could show loading state)
3. If not empty: call `syncPending()` as usual

---

## Phase 10: Cleanup

**Scope:** `app-fe/web/src/data/`

**Steps:**
1. Delete `idb-stats-repo.js` and `stats-repo.js`
2. Add old DB cleanup in `idb-stats.js`: `indexedDB.deleteDatabase('memris-stats')`
3. Add `cleanupOldRecords()`: delete synced records > 90 days
4. Call cleanup once per day (check via localStorage timestamp)

---

## Summary

| Phase | Scope | Key deliverable |
|-------|-------|-----------------|
| 1 | Infrastructure | Supabase migrations + GH Action |
| 2 | Data | Dataset 2-char codes |
| 3 | IndexedDB | New schema with sync flag |
| 4 | API | supabase-stats.js |
| 5 | Sync | Offline queue orchestration |
| 6 | State | practice-stats.js refactor |
| 7 | UI | Practice.svelte char tracking |
| 8 | Auth | Gate stats display behind login |
| 9 | Restore | New device data restore |
| 10 | Cleanup | Remove old code, periodic purge |

---

## Dependencies

Phases 1-2 can run in parallel. Phases 3-10 are sequential.
