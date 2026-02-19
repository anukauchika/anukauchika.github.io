# Plan: Stats & Drill Verticals

RFC: `docs/0010-rfc-stats-drill-verticals.md`

Strategy: build new verticals alongside old code → switch consumers → delete old code. App works at every phase.

---

## Phase 1: Domain Types

New files + rename. No breaking changes — old code continues to work.

**Scope**: `@dom/dataset.ts`, `@dom/kind/chinese/dataset.ts`, `@dom/stats.ts`, `@dom/drill.ts`, `@dom/kind/chinese/drill.ts`, `@std/kind/chinese/stats.ts`, all `compositeKey` callers

**Steps**:

1. `@dom/dataset.ts` — add type aliases `WordId`, `GroupId`, `DatasetId`, `WordKey`. Rename `compositeKey()` → `mkWordKey()`. Update return type annotation to `WordKey`.

2. Update all `compositeKey` callers:
   - `@std/kind/chinese/stats.ts` — 7 call sites
   - `@dom/kind/chinese/dataset.ts` — re-export if needed
   - Routes: `words/+page.svelte` uses `compositeKey` directly

3. `@dom/kind/chinese/dataset.ts` — add `ChineseDrillType` enum (`Stroke = 'stroke'`, `Pinyin = 'pinyin'`). Existing types stay.

4. Create `@dom/stats.ts`:
   ```ts
   export type DayKey = string
   export interface WordProgress { successCount, errorCount, lastDrilledAt }
   export interface GroupProgress { total, full, lastDrilledAt, lastFullDrillAt }
   export interface DayProgress { count, durationMs, sessions }
   ```

5. Create `@dom/drill.ts`:
   ```ts
   export type DrillId = number
   export interface WordAttempt { wordId: WordId, startedAt, doneAt }
   ```

6. Create `@dom/kind/chinese/drill.ts`:
   ```ts
   export interface CharAttempt { charIndex, startedAt, doneAt, errorCount }
   ```

**Verify**: `npm run build` passes. All old code still works with renamed `mkWordKey`.

---

## Phase 2: Stats Vertical

New files only. Nothing imports them yet — no risk.

**Scope**: `@dat/kind/chinese/stats.ts`, `@stt/kind/chinese/stats.svelte.ts`, `@svc/kind/chinese/stats.ts`

**Steps**:

1. Create `@dat/kind/chinese/stats.ts` — `datStats: StatsRepo`
   - Imports `statsRepo` from `@low/kind/chinese/idb-stats-repo` (old name, will rename in Phase 5)
   - `getWordProgress(datasetCode, drillCode)` → reads sessions + word attempts + char logs from IDB, aggregates into `Map<WordKey, WordProgress>`. Logic moves from `stats-service.ts:getWordStats()`.
   - `getGroupProgress(datasetCode, drillCode)` → aggregates sessions into `Map<GroupId, GroupProgress>`. Logic moves from `stats-service.ts:getGroupSessionSummaries()`.
   - `getDayProgress(datasetCode, drillCode)` → aggregates into `Map<DayKey, DayProgress>`. Logic moves from `stats-service.ts:getDailyActivity()`.
   - Key: field names change — `lastPracticedAt` → `lastDrilledAt`, `lastFullSessionAt` → `lastFullDrillAt`. Use `mkWordKey()` instead of inline template strings.

2. Create `@stt/kind/chinese/stats.svelte.ts` — `sttStats: StatsState`
   - `$state` class with 7 maps (word progress x3, group progress x3, day progress x1)
   - Types only from `@dom/stats` and `@dom/dataset`

3. Create `@svc/kind/chinese/stats.ts` — `svcStats: StatsService`
   - `dsCode(datasetId)` and `dtCode(drillType)` — code mapping using `sttDataset.meta`. Logic moves from `practice-stats.ts` (lines 12-21).
   - `loadWordProgressAll(datasetId)` — calls `datStats.getWordProgress()` for each drill type, merges, writes `sttStats.wordProgress/Stroke/Pinyin`. Logic moves from `practice-stats.ts:loadDatasetStatsAll()`.
   - `loadGroupProgressAll(datasetId)` — same pattern. Logic from `loadDatasetGroupSessionsAll()`.
   - `loadDayProgressAll(datasetId)` — same pattern. Logic from `loadDailyActivityAll()`.
   - Note: `dsCode`/`dtCode` are shared with svcDrill — define as module-level functions, export if needed or duplicate (they're 3-liners).

**Verify**: `npm run build` passes. New files compile. Old code untouched.

---

## Phase 3: Drill Vertical + Support Services

New files only. Nothing imports them yet.

**Scope**: `@dat/kind/chinese/drill.ts`, `@stt/kind/chinese/drill.svelte.ts`, `@svc/kind/chinese/drill.ts`, `@svc/sync.ts`, `@svc/maintenance.ts`

**Steps**:

1. Create `@dat/kind/chinese/drill.ts` — `datDrill: DrillRepo` + `datDrillSync: DrillSyncRepo`
   - Imports from `@low/kind/chinese/idb-stats-repo` and `@low/supabase/kind/chinese/stats` (old names)
   - Import old storage types with aliases: `import type { GroupSession as StorageDrill, ... } from '@dat/kind/chinese/types'`
   - **datDrill**:
     - `getGroupWordsProgress(datasetCode, drillCode, groupId)` — reads IDB, filters by group, returns `Map<WordId, WordProgress>`. Logic from `practice-stats.ts:loadGroupStats()` + `stats-service.ts:getWordStats()`.
     - `startDrill(userId, datasetCode, drillCode, groupId)` — online-first: try supabase, fallback temp ID. Logic from `group-session-service.ts:startGroupSession()`.
     - `endDrill(drillId)` — update `done_at`. Logic from `group-session-service.ts:endGroupSession()`.
     - `recordAttempt(drillId, attempt, chars)` — save to IDB, return `AttemptMeta`. Logic from `group-session-service.ts:recordWordAttempt()`.
   - **datDrillSync**:
     - Sync methods: wrap `statsRepo` + `supabaseStats` calls. Logic from `sync-service.ts`.
     - `switchDatabase(userId)` — delegates to `statsRepo.switchDatabase()`. Moves from `datAuth`.
     - `deleteOldSyncedRecords(cutoff)` — delegates to `statsRepo`. Moves from `maintenance-service.ts`.
     - `restoreFromServer()` — logic from `sync-service.ts:restoreFromServer()`.

2. Create `@stt/kind/chinese/drill.svelte.ts` — `sttDrill: DrillState`
   - `drillId: DrillId | null` and `progress: Map<WordId, WordProgress>`

3. Create `@svc/kind/chinese/drill.ts` — `svcDrill: DrillService`
   - `loadProgress(datasetId, drillType, groupId)` — calls `datDrill.getGroupWordsProgress()`, writes `sttDrill.progress`.
   - `startDrill(datasetId, drillType, groupId)` — resolves codes, calls `datDrill.startDrill()`, sets `sttDrill.drillId`.
   - `endDrill(drillId)` — calls `datDrill.endDrill()`, clears state, triggers `svcSync.syncPending()`. Optimistically updates `sttStats.groupProgress`.
   - `recordAttempt(drillId, attempt, chars)` — calls `datDrill.recordAttempt()`, optimistically updates `sttDrill.progress` + `sttStats.wordProgress` + `sttStats.groupProgress`. Triggers `svcSync.syncPending()`.
   - Key: optimistic update logic moves from `practice-stats.ts:recordWordAttempt()` and `endGroupSession()`.

4. Create `@svc/sync.ts` — `svcSync: SyncService`
   - `syncPending()` — 3-phase sync using `datDrillSync` methods. Logic from `sync-service.ts`. Drop `activeSessionId` guard.
   - `restoreFromServer()` — delegates to `datDrillSync.restoreFromServer()`.

5. Create `@svc/maintenance.ts` — `svcMaintenance: MaintenanceService`
   - `runStartupTasks()` — legacy DB cleanup + `runCleanup()`. Logic from `maintenance-service.ts`.
   - `runCleanup()` — calls `datDrillSync.deleteOldSyncedRecords()`.

**Verify**: `npm run build` passes. New files compile.

---

## Phase 4: Switch Consumers

The big switch. Replace all imports from old modules to new ones. After this phase, old files are unused.

**Scope**: 7 routes, 2 @uic builders, 1 @std utility, `@svc/auth.ts`, `@dat/auth.ts`, `@std/kind/chinese/pick-next-practice.ts`

**Steps**:

1. **`@std/kind/chinese/stats.ts`** — update type imports:
   - `StatsMap` → `Map<WordKey, WordProgress>` (from `@dom/dataset` + `@dom/stats`)
   - `SessionsMap` → `Map<GroupId, GroupProgress>`
   - `StatEntry` → `WordProgress`
   - `DailyActivityMap` → `Map<DayKey, DayProgress>`
   - `compositeKey` → `mkWordKey`
   - `lastPracticedAt` → `lastDrilledAt` in function bodies
   - `lastFullSessionAt` → `lastFullDrillAt`
   - Update `PracticedItem.stat: StatEntry` → `PracticedItem.stat: WordProgress`

2. **`@std/kind/chinese/pick-next-practice.ts`** — update type imports:
   - `SessionsMap` → `Map<GroupId, GroupProgress>` from `@dom`
   - Field access: `lastPracticedAt` → `lastDrilledAt`

3. **`@uic/kind/chinese/group-item.ts`** + **`compact-group-list.ts`** — update type imports:
   - `StatsMap` → `Map<WordKey, WordProgress>`
   - `SessionsMap` → `Map<GroupId, GroupProgress>`
   - Field access: `lastPracticedAt` → `lastDrilledAt`

4. **`@svc/auth.ts`**:
   - `import { syncService } from '@svc/sync-service'` → `import { svcSync } from '@svc/sync'`
   - `syncService.syncPending()` → `svcSync.syncPending()`
   - `syncService.restoreFromServer()` → `svcSync.restoreFromServer()`
   - `datAuth.switchStatsDatabase(userId)` → `import { datDrillSync } from '@dat/kind/chinese/drill'` + `datDrillSync.switchDatabase(userId)`

5. **`@dat/auth.ts`** — remove `switchStatsDatabase` method and `statsRepo` import.

6. **`routes/chinese/+page.svelte`**:
   - Remove: `import { ps, loadDatasetStatsAll, loadDatasetGroupSessionsAll, loadDailyActivityAll } from '@stt/kind/chinese/practice-stats.js'`
   - Add: `import { sttStats } from '@stt/kind/chinese/stats.svelte.js'` + `import { svcStats } from '@svc/kind/chinese/stats'`
   - `reloadStats()`: call `svcStats.loadWordProgressAll()`, `svcStats.loadGroupProgressAll()`, `svcStats.loadDayProgressAll()`
   - `$ps.datasetGroupSessions` → `sttStats.groupProgress` (no `$` prefix)
   - Same for all `$ps.*` → `sttStats.*`
   - Remove `$` store syntax — direct property access

7. **`routes/chinese/browse-hero.svelte`**:
   - `$ps.*` → `sttStats.*`
   - Remove `ps` import, add `sttStats`

8. **`routes/chinese/groups/+page.svelte`**:
   - `$ps.*` → `sttStats.*`

9. **`routes/chinese/words/+page.svelte`**:
   - `$ps.datasetStats` → `sttStats.wordProgress`
   - `$ps.datasetStatsStroke` → `sttStats.wordProgressStroke`
   - `compositeKey` → `mkWordKey`

10. **`routes/chinese/chars/+page.svelte`**:
    - `$ps.datasetStatsStroke` → `sttStats.wordProgressStroke`
    - `$ps.datasetStatsPinyin` → `sttStats.wordProgressPinyin`

11. **`routes/chinese/practice/hanzi/+page.svelte`**:
    - Remove all practice-stats imports
    - Add: `sttStats`, `sttDrill`, `svcStats`, `svcDrill`
    - `loadDatasetGroupSessions()` → `svcStats.loadGroupProgressAll()`
    - `loadGroupStats()` + `get(groupStats)` → `await svcDrill.loadProgress(datasetId, ChineseDrillType.Stroke, groupId)` then read `sttDrill.progress`
    - `$ps.datasetGroupSessions` → `sttStats.groupProgress`
    - `$ps.groupStats` → `sttDrill.progress`
    - `startGroupSession(datasetId, 'stroke', groupId)` → `svcDrill.startDrill(datasetId, ChineseDrillType.Stroke, groupId)`
    - `endGroupSession(sid)` → `svcDrill.endDrill(drillId)`
    - `recordWordAttempt(sid, wid, start, done, chars)` → `svcDrill.recordAttempt(drillId, { wordId: wid, startedAt: start, doneAt: done }, chars)`
    - Remove `import { get } from 'svelte/store'`

12. **`routes/chinese/practice/pinyin/+page.svelte`** — same as hanzi but with `ChineseDrillType.Pinyin`.

13. **`routes/+layout.svelte`**:
    - `maintenanceService` → `svcMaintenance` (if imported here)

**Verify**: `npm run build` passes. Test app manually — browse, practice hanzi, practice pinyin, view stats pages.

---

## Phase 5: Cleanup

Rename @low exports, delete old files.

**Scope**: `@low/kind/chinese/idb-stats-repo.ts`, `@low/supabase/kind/chinese/stats.ts`, `@dat/kind/chinese/types.ts`, old files

**Steps**:

1. `@low/kind/chinese/idb-stats-repo.ts`:
   - Rename `statsRepo` → `lowStatsIdb`
   - Optionally rename file to `stats-idb.ts`

2. `@low/supabase/kind/chinese/stats.ts`:
   - Wrap individual function exports in `lowStatsSupabase` singleton object

3. Update new `@dat` files to use renamed exports:
   - `@dat/kind/chinese/stats.ts`: `statsRepo` → `lowStatsIdb`
   - `@dat/kind/chinese/drill.ts`: `statsRepo` → `lowStatsIdb`, `supabaseStats.*` → `lowStatsSupabase.*`

4. `@dat/kind/chinese/types.ts`:
   - Rename: `GroupSession` → `StorageDrill`, `WordAttempt` → `StorageAttempt`, `CharLog` → `StorageCharLog`
   - Remove `PracticeType` enum (replaced by `ChineseDrillType` in `@dom`)
   - Update `@dat/kind/chinese/drill.ts` to remove import aliases

5. Delete old files:
   - `@stt/kind/chinese/practice-stats.ts`
   - `@svc/kind/chinese/stats-service.ts`
   - `@svc/kind/chinese/group-session-service.ts`
   - `@svc/kind/chinese/types.ts`
   - `@svc/sync-service.ts`
   - `@svc/maintenance-service.ts`
   - `@dat/kind/chinese/stats-repo.ts` (old interface, merged into new stats.ts)

6. Verify no remaining imports to deleted files: `grep -r` for old module names.

**Verify**: `npm run build` passes. Clean import graph — no `@low` imports above `@dat`.
