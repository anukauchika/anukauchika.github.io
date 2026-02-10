
# Plan: Services Layer

Implements RFC: `0006-05-rfc-services-layer.md`. All paths relative to `app-fe/web/`.

## Phase 1: Interface files + types

Scope: `src/api/types.ts`, `src/api/stats-repo.ts`, new files in `src/api/`

1. Add to `src/api/types.ts`:
   ```ts
   export interface CharAttemptInput {
     charIndex: number
     startedAt: string
     doneAt: string
     errorCount: number
   }

   export interface WordAttemptResult {
     wordId: string
     groupId: string
     practiceType: PracticeType
     errorCount: number
   }
   ```
2. Add `nextTempId(): Promise<number>` to `StatsRepo` interface in `src/api/stats-repo.ts`
3. Create `src/api/stats-service.ts` — export `StatsService` interface (see RFC for full definition). Imports: `PracticeType`, `WordStat`, `GroupSessionSummary`, `DailyActivity` from `./types`
4. Create `src/api/group-session-service.ts` — export `GroupSessionService` interface. Imports: `PracticeType`, `GroupSession`, `CharAttemptInput`, `WordAttemptResult` from `./types`
5. Create `src/api/sync-service.ts` — export `SyncService` interface. No type imports needed (only primitives).
6. Create `src/api/maintenance-service.ts` — export `MaintenanceService` interface. No type imports needed.
7. Run lint + format, verify build

## Phase 2: `nextTempId` in StatsRepo implementation

Scope: `src/data/idb-stats-repo.ts`

1. Add module-level lazy-init counter:
   ```ts
   let nextId: number | null = null

   async function nextTempId(): Promise<number> {
     if (nextId === null) {
       const min = await getMinId()
       nextId = min - 1
     }
     return nextId--
   }
   ```
2. Add `nextTempId` to the `statsRepo` object
3. `getMinId` stays on the interface — removal is optional cleanup
4. Run lint + format, verify build

## Phase 3: StatsService

Scope: new `src/services/stats-service.ts`, modify `src/state/practice-stats.js`, modify `src/data/idb-stats-repo.ts`

1. Create `src/services/stats-service.ts`, typed as `StatsService`:
   - Import `statsRepo` from `../data/idb-stats-repo`, types from `../api/types`
   - `getWordStats(datasetId, practiceType)` — rewrite from `idb-stats-repo.ts` (lines 213–257) to use repo interface methods:
     - `statsRepo.getGroupSessions(datasetId, practiceType)` for sessions
     - `statsRepo.getWordAttempts(sessionId)` per session (replaces direct IDB `getAll()` + filter)
     - `statsRepo.getCharLogs(wordAttemptId)` per word attempt for error counts
     - Same aggregation logic: group by `(groupId, wordId)` → `WordStat`
   - `getGroupSessionSummaries(datasetId, practiceType)` — extract aggregation from `practice-stats.js` `loadDatasetGroupSessions` (lines 80–107):
     - `statsRepo.getGroupSessions(...)` → iterate sessions → build `Map<string, GroupSessionSummary>` with `{total, full, lastPracticedAt, lastFullSessionAt}` per `group_id`
   - `getDailyActivity(datasetId, practiceType)` — extract aggregation from `practice-stats.js` `loadDailyActivity` (lines 111–145):
     - `statsRepo.getGroupSessions(...)` + `statsRepo.getWordAttempts(sessionId)` per session
     - Build `Map<string, DailyActivity>` keyed by local date string
     - Move `toLocalDateKey` helper and `MAX_SESSION_MS` constant into this file
   - Export as `export const statsService: StatsService = { ... }`
2. Update `practice-stats.js` — add `import { statsService } from '../services/stats-service'`. Update load functions:
   - `loadGroupStats(datasetId, practiceType, groupId)` → `statsService.getWordStats(dsCode(datasetId), ptCode(practiceType))`, filter by groupId, set `groupStats` store
   - `loadDatasetStats(datasetId, practiceType)` → `statsService.getWordStats(...)`, build `"groupId::wordId"` key map, set `datasetStats` store
   - `loadDatasetGroupSessions(datasetId, practiceType)` → `statsService.getGroupSessionSummaries(dsCode(datasetId), ptCode(practiceType))`, set `datasetGroupSessions` store
   - `loadDailyActivity(datasetId, practiceType)` → `statsService.getDailyActivity(dsCode(datasetId), ptCode(practiceType))`, set `dailyActivity` store
   - `loadDatasetStatsAll(datasetId)` → call `statsService.getWordStats(dsCode(datasetId), code)` per practice type, merge into `datasetStats`, populate per-type stores (`datasetStatsStroke`, `datasetStatsPinyin`)
   - `loadDatasetGroupSessionsAll(datasetId)` → call `statsService.getGroupSessionSummaries(...)` per practice type, merge into `datasetGroupSessions`, populate per-type stores
   - `loadDailyActivityAll(datasetId)` → call `statsService.getDailyActivity(...)` per practice type, merge, set `dailyActivity` store
   - Remove `toLocalDateKey` helper and `MAX_SESSION_MS` constant (moved to StatsService)
3. Update import in `practice-stats.js`: change `import { statsRepo, getWordStats }` to `import { statsRepo }` (remove `getWordStats`). Note: `statsRepo` import stays — still used by session lifecycle functions until Phase 5.
4. Remove `getWordStats` export from `idb-stats-repo.ts` (lines 211–257, including the `// --- TODO 006-05` comment on line 211)
5. Run lint + format, verify build

## Phase 4: SyncService

Scope: new `src/services/sync-service.ts`, delete `src/state/sync.js`, modify `src/state/auth.js`, modify `src/state/practice-stats.js`

1. Create `src/services/sync-service.ts`, typed as `SyncService`:
   - Move all logic from `src/state/sync.js` (88 lines):
     - `syncing` flag and `activeSessionId` as module-level state
     - `setActiveSessionId`, `syncPending`, `restoreFromServer` — logic unchanged
   - Import `{ statsRepo }` from `../data/idb-stats-repo`, `{ api }` from `../supabase`
   - Export as `export const syncService: SyncService = { ... }`
2. Update `src/state/practice-stats.js`:
   - Replace `import { syncPending, setActiveSessionId } from './sync.js'` with `import { syncService } from '../services/sync-service'`
   - Update call sites: `syncPending()` → `syncService.syncPending()`, `setActiveSessionId(...)` → `syncService.setActiveSessionId(...)`
3. Update `src/state/auth.js`:
   - Replace `import { syncPending, restoreFromServer } from './sync.js'` with `import { syncService } from '../services/sync-service'`
   - Update `onUserChanged`: `await syncPending()` → `await syncService.syncPending()`, `await restoreFromServer()` → `await syncService.restoreFromServer()`
4. Delete `src/state/sync.js`
5. Run lint + format, verify build

## Phase 5: GroupSessionService

Scope: new `src/services/group-session-service.ts`, modify `src/state/practice-stats.js`

1. Create `src/services/group-session-service.ts`, typed as `GroupSessionService`:
   - Import `{ statsRepo }` from `../data/idb-stats-repo`, `{ api }` from `../supabase`, types from `../api/types`
   - `startGroupSession(userId, datasetId, practiceType, groupId)`:
     - `const now = new Date().toISOString()`
     - Try Supabase API `api.stats.createGroupSession({user_id: userId, dataset_id: datasetId, practice_type: practiceType, group_id: groupId, started_at: now})` → `id = result.id, synced = 1`
     - Catch → offline fallback: `id = await statsRepo.nextTempId()`, `synced = 0`
     - `statsRepo.saveGroupSession({id, user_id: userId, dataset_id: datasetId, practice_type: practiceType, group_id: groupId, started_at: now, done_at: null, synced})`
     - Return `id`
   - `endGroupSession(sessionId)`:
     - `const session = await statsRepo.getGroupSessionById(sessionId)` → if null return null
     - `const now = new Date().toISOString()`
     - `await statsRepo.saveGroupSession({ ...session, done_at: now, synced: 0 })`
     - Return `{ ...session, done_at: now, synced: 0 }` (the updated session)
   - `recordWordAttempt(sessionId, wordId, startedAt, doneAt, chars)`:
     - `const session = await statsRepo.getGroupSessionById(sessionId)` → if null, `console.error(...)` and return `{ wordId, groupId: '', practiceType: '' as PracticeType, errorCount: 0 }`
     - `const wordTempId = await statsRepo.nextTempId()`
     - `await statsRepo.saveWordAttempt({id: wordTempId, group_session_id: sessionId, word_id: wordId, started_at: startedAt, done_at: doneAt, synced: 0})`
     - If `chars.length > 0`: `await statsRepo.saveCharLogs(chars.map(c => ({word_attempt_id: wordTempId, char_index: c.charIndex, started_at: c.startedAt, done_at: c.doneAt, error_count: c.errorCount, synced: 0})))`
     - `const errorCount = chars.reduce((sum, c) => sum + (c.errorCount || 0), 0)`
     - Return `{ wordId, groupId: session.group_id, practiceType: session.practice_type, errorCount }`
   - Export as `export const groupSessionService: GroupSessionService = { ... }`
2. Update `practice-stats.js` — add `import { groupSessionService } from '../services/group-session-service'`. Rewrite session functions as thin wrappers:
   - `startGroupSession(datasetId, practiceType, groupId)`:
     - `syncService.setActiveSessionId(null)` — release previous active session (restart case)
     - `const userId = get(user)?.id ?? null`
     - `const id = await groupSessionService.startGroupSession(userId, dsCode(datasetId), ptCode(practiceType), groupId)`
     - `syncService.setActiveSessionId(id < 0 ? id : null)` — protect offline session
     - Return `id`
   - `endGroupSession(sessionId)`:
     - `syncService.setActiveSessionId(null)`
     - `const session = await groupSessionService.endGroupSession(sessionId)`
     - `if (!session) return`
     - `syncService.syncPending().catch(e => console.error('sync failed', e))`
     - Update `datasetGroupSessions` + per-type store using `session.practice_type` via `PT_SESSION_STORES` (existing store update logic stays unchanged)
   - `recordWordAttempt(sessionId, wordId, startedAt, doneAt, chars)`:
     - `const result = await groupSessionService.recordWordAttempt(sessionId, wordId, startedAt, doneAt, chars)`
     - `syncService.syncPending().catch(e => console.error('sync failed', e))`
     - Update `groupStats` store using `result.wordId`, `result.groupId`, `result.errorCount`
     - Update `datasetStats` store using key `"${result.groupId}::${result.wordId}"`
     - Update per-type store via `PT_STATS_STORES[result.practiceType]`
     - (existing store update logic stays, just uses result fields instead of local variables)
3. Clean up `practice-stats.js` imports:
   - Remove `nextTempId` variable and `tempIdReady` promise (lines 56–57)
   - Remove `import { statsRepo }` from idb-stats-repo (no longer used directly)
   - Remove `import { api } from '../supabase.js'` (Supabase calls moved to service)
   - Keep `import { user } from './auth.js'` (still used for `get(user)` in startGroupSession wrapper)
   - Keep `import { getDatasetCode } from './registry.js'` (still used for `dsCode`)
4. Run lint + format, verify build

## Phase 6: MaintenanceService

Scope: new `src/services/maintenance-service.ts`, modify `src/data/idb-stats-repo.ts`, modify `src/data/idb-prefs-repo.ts`, modify `src/main.js`, modify `src/practice.js`

1. Create `src/services/maintenance-service.ts`, typed as `MaintenanceService`:
   - Import `{ statsRepo }` from `../data/idb-stats-repo`, types from `../api/types`
   - `runStartupTasks()`:
     - `indexedDB.deleteDatabase('memris-stats')`
     - `indexedDB.deleteDatabase('memris-stats-v2')`
     - `indexedDB.deleteDatabase('memris-prefs')`
     - `runCleanup().catch(e => console.error('stats cleanup failed', e))` — fire-and-forget
   - `runCleanup()`:
     - Move logic from `idb-stats-repo.ts` `cleanupOldRecords` (lines 265–303)
     - Keep constants: `CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000`, `RETENTION_MS = 90 * 24 * 60 * 60 * 1000`
     - **Throttle storage**: use `localStorage` for throttle tracking (keep current approach). It's machine-local optimization state, not user data — pragmatic to keep in localStorage. The 006-02 principle applies to user-facing data, not internal timers.
     - Cleanup logic: find synced sessions older than cutoff → cascade delete word attempts + char logs. Current code accesses IDB stores directly for cascading deletes — the service needs the same direct access. **Approach**: add `deleteOldSyncedRecords(cutoffDate: string): Promise<void>` to `StatsRepo` interface that encapsulates the cascading delete (find old synced sessions → delete their word attempts → delete their char logs → delete sessions). This keeps IDB internals in the repo.
   - Export as `export const maintenanceService: MaintenanceService = { ... }`
2. Add `deleteOldSyncedRecords(cutoffDate: string): Promise<void>` to `StatsRepo` interface in `src/api/stats-repo.ts` and implement in `src/data/idb-stats-repo.ts` — move the cascading delete logic from `cleanupOldRecords` (lines 272–301) into this method.
3. Remove from `idb-stats-repo.ts`:
   - Lines 1–3: legacy DB deletions (`indexedDB.deleteDatabase(...)`)
   - Lines 259–306: `CLEANUP_KEY`, `CLEANUP_INTERVAL_MS`, `RETENTION_MS`, `cleanupOldRecords`, and the auto-run call at line 306
   - File becomes pure `StatsRepo` — only the `statsRepo` object export + `nextTempId` internal state
4. Remove from `idb-prefs-repo.ts`:
   - Line 1–2: legacy DB deletion (`indexedDB.deleteDatabase('memris-prefs')`) and its TODO comment
5. Update both entry points to call `runStartupTasks` before `initAuth`:
   - `src/main.js`: add `import { maintenanceService } from './services/maintenance-service'` and `maintenanceService.runStartupTasks()` before `await initAuth()`
   - `src/practice.js`: same pattern
6. Run lint + format, verify build
