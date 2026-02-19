# RFC: Stats & Drill Verticals

## Problem

Stats/drill code violates layer boundaries and doesn't follow the vertical pattern:

- **`@stt/kind/chinese/practice-stats.ts`** — state layer contains business logic: session lifecycle (`startGroupSession`, `endGroupSession`, `recordWordAttempt`), data loading, aggregation across drill types, code mapping. Imports from `@svc` (state → service violation). Uses old `writable`/`derived` stores
- **`@svc/kind/chinese/stats-service.ts`** — imports `statsRepo` directly from `@low` (svc → low violation)
- **`@svc/kind/chinese/group-session-service.ts`** — imports from both `@low/kind/chinese/idb-stats-repo` and `@low/supabase/kind/chinese/stats` (svc → low violation)
- **`@svc/sync-service.ts`** — imports from `@low/supabase` and `@low/kind/chinese/idb-stats-repo` (svc → low violation)
- **`@svc/maintenance-service.ts`** — imports from `@low/kind/chinese/idb-stats-repo` (svc → low violation)
- **Types scattered** — domain-facing types in `@svc/kind/chinese/types.ts`, storage types in `@dat/kind/chinese/types.ts`
- **Two concerns merged** — aggregated dataset progress (Stats) and live drill lifecycle (Drill) are tangled in one `practice-stats.ts`

## Scope

Two verticals sharing `@low` layer:

- **Stats** — aggregated progress data: `@dom` → `@dat` → `@stt` → `@svc`. Read-only over IDB.
- **Drill** — live drill session: `@dom` → `@dat` → `@stt` → `@svc`. Write path + online-first sync.

Route import updates. Fixes all svc → low violations. Migrates to `$state` runes.

## Domain Types

Domain types are **generic** (not kind-specific). Only Chinese-specific types go under `kind/chinese/`.

### `@dom/dataset.ts` — type aliases

Add to the existing file:

```ts
type WordId = number
type GroupId = number
type DatasetId = string
type WordKey = string    // mkWordKey(groupId, wordId)
```

`compositeKey()` renamed to `mkWordKey()` — name matches its return type. Existing interfaces (`Group`, `Word`, etc.) updated to use the aliases.

### `@dom/kind/chinese/dataset.ts` — add ChineseDrillType

```ts
enum ChineseDrillType { Stroke = 'stroke', Pinyin = 'pinyin' }
```

Drill type is a dataset-kind concept, not stats- or drill-specific. Both verticals import it from here.

Storage codes (`'s'`, `'p'`) are an implementation detail of `@low`/`@dat`.

### `@dom/stats.ts` — progress types

```ts
type DayKey = string     // "YYYY-MM-DD"

interface WordProgress {
  successCount: number
  errorCount: number
  lastDrilledAt: string | null
}

interface GroupProgress {
  total: number
  full: number
  lastDrilledAt: string | null
  lastFullDrillAt: string | null
}

interface DayProgress {
  count: number
  durationMs: number
  sessions: number
}
```

No map aliases — maps are a state/service concern. Dom defines value structs and ID aliases only.

### `@dom/drill.ts` — session & attempt types

```ts
type DrillId = number

interface WordAttempt {
  wordId: WordId
  startedAt: string
  doneAt: string
}
```

### `@dom/kind/chinese/drill.ts` — kind-specific attempt

```ts
interface CharAttempt {
  charIndex: number
  startedAt: string
  doneAt: string
  errorCount: number
}
```

## Low Layer (shared)

Both verticals share the same IDB and Supabase modules. No split at `@low`.

### `@low/kind/chinese/stats-idb.ts`

Rename from `idb-stats-repo.ts`. Follows `lowStatsIdb` naming. No interface changes — same IDB operations (read + write). Still uses storage codes and storage types internally.

```ts
export const lowStatsIdb: StatsIdbApi = { ... }
```

### `@low/supabase/kind/chinese/stats.ts`

Rename export to `lowStatsSupabase`. Same Supabase operations, wrapped in singleton.

```ts
export const lowStatsSupabase: StatsSupabaseApi = { ... }
```

## Stats Vertical

Aggregated progress data. Read-only over IDB.

### `@dat/kind/chinese/stats.ts`

```ts
import type { GroupId, WordKey } from '@dom/dataset'
import type { DayKey, WordProgress, GroupProgress, DayProgress } from '@dom/stats'

interface StatsRepo {
  getWordProgress(datasetCode: string, drillCode: string): Promise<Map<WordKey, WordProgress>>
  getGroupProgress(datasetCode: string, drillCode: string): Promise<Map<GroupId, GroupProgress>>
  getDayProgress(datasetCode: string, drillCode: string): Promise<Map<DayKey, DayProgress>>
}

export const datStats: StatsRepo = { ... }
```

Delegates to `lowStatsIdb` read methods. Aggregation from raw IDB rows to domain maps happens here. Accepts storage codes — no `@stt` imports.

### `@stt/kind/chinese/stats.svelte.ts`

Pure reactive state. `$state` runes.

```ts
import type { GroupId, WordKey } from '@dom/dataset'
import type { DayKey, WordProgress, GroupProgress, DayProgress } from '@dom/stats'

class StatsState {
  // dataset-wide word progress (merged + per drill type)
  wordProgress: Map<WordKey, WordProgress> = $state(new Map())
  wordProgressStroke: Map<WordKey, WordProgress> = $state(new Map())
  wordProgressPinyin: Map<WordKey, WordProgress> = $state(new Map())

  // dataset-wide group progress (merged + per drill type)
  groupProgress: Map<GroupId, GroupProgress> = $state(new Map())
  groupProgressStroke: Map<GroupId, GroupProgress> = $state(new Map())
  groupProgressPinyin: Map<GroupId, GroupProgress> = $state(new Map())

  // daily activity
  dayProgress: Map<DayKey, DayProgress> = $state(new Map())
}

export const sttStats = new StatsState()
```

No business logic. Routes read `sttStats.wordProgress` directly.

### `@svc/kind/chinese/stats.ts`

Load methods + cross-drill-type merging. Reads from `datStats`, writes to `sttStats`.

```ts
import type { DatasetId } from '@dom/dataset'

interface StatsService {
  loadWordProgressAll(datasetId: DatasetId): Promise<void>
  loadGroupProgressAll(datasetId: DatasetId): Promise<void>
  loadDayProgressAll(datasetId: DatasetId): Promise<void>
}

export const svcStats: StatsService = { ... }
```

**Code mapping**: `svcStats` owns `dsCode(datasetId)` and `dtCode(drillType)` — resolves domain values to storage codes using `sttDataset.meta`. Passes storage codes to `datStats`/`datDrill`.

**Load methods**: call `datStats` for each drill type (stroke, pinyin), merge into combined maps, write to `sttStats`.

## Drill Vertical

Live drill lifecycle. Write path with online-first sync.

### `@dat/kind/chinese/drill.ts`

```ts
import type { GroupId } from '@dom/dataset'
import type { WordProgress } from '@dom/stats'
import type { DrillId, WordAttempt } from '@dom/drill'
import type { CharAttempt } from '@dom/kind/chinese/drill'

interface DrillRepo {
  getGroupWordsProgress(datasetCode: string, drillCode: string, groupId: GroupId): Promise<Map<WordId, WordProgress>>
  startDrill(userId: string | null, datasetCode: string, drillCode: string, groupId: GroupId): Promise<DrillId>
  endDrill(drillId: DrillId): Promise<StorageDrill | null>
  recordAttempt(drillId: DrillId, attempt: WordAttempt, chars: CharAttempt[]): Promise<AttemptMeta>
}

interface DrillSyncRepo {
  getPendingDrills(): Promise<StorageDrill[]>
  getPendingAttempts(): Promise<StorageAttempt[]>
  getPendingCharLogs(): Promise<StorageCharLog[]>
  syncDrill(tempId: DrillId, realId: DrillId): Promise<void>
  syncAttempt(tempId: number, realId: number): Promise<void>
  pushDrillToRemote(drill: StorageDrill): Promise<{ id: DrillId }>
  pushDrillDoneToRemote(id: DrillId, doneAt: string): Promise<void>
  pushAttemptToRemote(attempt: StorageAttempt): Promise<{ id: number }>
  pushCharLogsToRemote(chars: StorageCharLog[]): Promise<void>
  restoreFromServer(): Promise<void>
  switchDatabase(userId: string | null): Promise<void>
  deleteOldSyncedRecords(cutoffDate: string): Promise<void>
}

export const datDrill: DrillRepo = { ... }
export const datDrillSync: DrillSyncRepo = { ... }
```

Both in `@dat/kind/chinese/drill.ts` — same file, two exports. Share `@low` imports.

`StorageDrill`, `StorageAttempt`, `StorageCharLog` — storage record types, internal to `@dat`/`@low`. Map to IDB stores (`group_sessions`, `word_attempts`, `char_logs`) and Supabase tables. `AttemptMeta` returns `{ groupId, drillCode, errorCount }` — context the service needs for optimistic state updates.

**Key responsibilities**:
- **`datDrill`**: drill lifecycle (online-first) + group word progress reads
- **`datDrillSync`**: pending record access, remote push, restore, DB switching, cleanup. No active drill exclusion needed — all pending records are safe to sync (session creation gets real ID, `done_at` update pushed later when drill ends)

### `@stt/kind/chinese/drill.svelte.ts`

Ephemeral state for the active drill.

```ts
import type { WordId } from '@dom/dataset'
import type { WordProgress } from '@dom/stats'
import type { DrillId } from '@dom/drill'

class DrillState {
  drillId: DrillId | null = $state(null)
  progress: Map<WordId, WordProgress> = $state(new Map())
}

export const sttDrill = new DrillState()
```

`drillId` — active session. `progress` — per-word progress within the group being drilled (for word ordering and success count display).

### `@svc/kind/chinese/drill.ts`

Session lifecycle. Calls `datDrill`, writes to `sttDrill` + `sttStats` (optimistic updates).

```ts
import type { GroupId, DatasetId } from '@dom/dataset'
import type { WordAttempt } from '@dom/drill'
import type { DrillId } from '@dom/drill'
import type { ChineseDrillType } from '@dom/kind/chinese/dataset'
import type { CharAttempt } from '@dom/kind/chinese/drill'

interface DrillService {
  loadProgress(datasetId: DatasetId, drillType: ChineseDrillType, groupId: GroupId): Promise<void>
  startDrill(datasetId: DatasetId, drillType: ChineseDrillType, groupId: GroupId): Promise<DrillId>
  endDrill(drillId: DrillId): Promise<void>
  recordAttempt(drillId: DrillId, attempt: WordAttempt, chars: CharAttempt[]): Promise<void>
}

export const svcDrill: DrillService = { ... }
```

**`loadProgress`**: calls `datDrill.getGroupWordsProgress()`, writes to `sttDrill.progress`. Called by drill routes before starting.

**`startDrill`**: resolves codes, calls `datDrill.startDrill()`, sets `sttDrill.drillId`. Returns `DrillId`.

**`endDrill`**: calls `datDrill.endDrill()`, clears `sttDrill.drillId`. Triggers `svcSync.syncPending()`.

**`recordAttempt`**: calls `datDrill.recordAttempt()`, optimistically updates `sttDrill.progress` (increment word success/error), optimistically updates `sttStats.wordProgress` + `sttStats.groupProgress`. Triggers `svcSync.syncPending()`.

## Support Services

### `@svc/sync.ts`

Rename from `sync-service.ts`. Imports `datDrillSync` from `@dat/kind/chinese/drill` instead of `@low`.

```ts
interface SyncService {
  syncPending(): Promise<void>
  restoreFromServer(): Promise<void>
}

export const svcSync: SyncService = { ... }
```

Sync phases use `datDrill` methods:
1. `datDrillSync.getPendingDrills()` → `datDrillSync.pushDrillToRemote()` → `datDrillSync.syncDrill()`
2. `datDrillSync.getPendingAttempts()` → `datDrillSync.pushAttemptToRemote()` → `datDrillSync.syncAttempt()`
3. `datDrillSync.getPendingCharLogs()` → `datDrillSync.pushCharLogsToRemote()`

### `@svc/maintenance.ts`

Rename from `maintenance-service.ts`. Imports `datDrillSync` from `@dat/kind/chinese/drill` instead of `@low`.

```ts
export const svcMaintenance: MaintenanceService = { ... }
```

Uses `datDrillSync.deleteOldSyncedRecords()`.

## Deleted

| File | Replaced by |
|------|-------------|
| `@stt/kind/chinese/practice-stats.ts` | `@stt/kind/chinese/stats.svelte.ts` + `@stt/kind/chinese/drill.svelte.ts` |
| `@svc/kind/chinese/stats-service.ts` | `@svc/kind/chinese/stats.ts` |
| `@svc/kind/chinese/group-session-service.ts` | `@svc/kind/chinese/drill.ts` + `@dat/kind/chinese/drill.ts` |
| `@svc/kind/chinese/types.ts` | `@dom/stats.ts` + `@dom/drill.ts` + `@dom/kind/chinese/drill.ts` |
| `@svc/sync-service.ts` | `@svc/sync.ts` |
| `@svc/maintenance-service.ts` | `@svc/maintenance.ts` |

## Stays (with modifications)

| File | Change |
|------|--------|
| `@dat/kind/chinese/types.ts` | Storage-only types (`StorageDrill`, `StorageAttempt`, `StorageCharLog`). Map to IDB/Supabase schema internally |
| `@low/kind/chinese/idb-stats-repo.ts` | Rename export to `lowStatsIdb` |
| `@low/supabase/kind/chinese/stats.ts` | Rename export to `lowStatsSupabase` |

## Side Effects

- **`@svc/auth.ts`** — `syncService` → `svcSync`, `datAuth.switchStatsDatabase()` → `datDrillSync.switchDatabase()`
- **`@dat/auth.ts`** — remove `switchStatsDatabase`, no longer needed
- **`@dom/kind/chinese/dataset.ts`** — add `ChineseDrillType` enum
- **Routes** (chinese/+page, practice/hanzi, practice/pinyin, groups, words, chars, browse-hero):
  - `$ps.datasetStats` → `sttStats.wordProgress`
  - `$ps.datasetStatsStroke` → `sttStats.wordProgressStroke`
  - `$ps.datasetGroupSessions` → `sttStats.groupProgress`
  - `$ps.dailyActivity` → `sttStats.dayProgress`
  - `$ps.groupStats` → `sttDrill.progress`
  - `loadDatasetStatsAll()` → `svcStats.loadWordProgressAll()`
  - `loadDatasetGroupSessionsAll()` → `svcStats.loadGroupProgressAll()`
  - `loadDailyActivityAll()` → `svcStats.loadDayProgressAll()`
  - `startGroupSession()` → `svcDrill.startDrill()`
  - `endGroupSession()` → `svcDrill.endDrill()`
  - `recordWordAttempt(sid, wid, start, done, chars)` → `svcDrill.recordAttempt(drillId, { wordId, startedAt, doneAt }, chars)`
  - Remove `import { get } from 'svelte/store'`, remove `$` store syntax
- **Components** (`@uic/kind/chinese/`) — props stay the same (they receive computed data, not stores)
- **`@std/kind/chinese/stats.ts`** — pure utility functions stay. Update type refs: `StatEntry` → `WordProgress`, `GroupSessionSummary` → `GroupProgress`

## Import Graph

```
@dom/stats                       <- (no deps)
@dom/drill                       <- @dom/dataset (WordId type)
@dom/kind/chinese/dataset        <- (no deps, adds ChineseDrillType)
@dom/kind/chinese/drill          <- (no deps)

@low/kind/chinese/stats-idb      <- @low/idb, @dat/kind/chinese/types
@low/supabase/.../stats          <- @low/supabase/supabase-client, @dat/kind/chinese/types

@dat/kind/chinese/stats          <- @dom/stats, @low/.../stats-idb
@dat/kind/chinese/drill          <- @dom/drill, @dom/.../drill, @low/.../stats-idb, @low/supabase/.../stats

@stt/kind/chinese/stats.svelte   <- @dom/stats (types only)
@stt/kind/chinese/drill.svelte   <- @dom/drill, @dom/stats (types only)

@svc/kind/chinese/stats          <- @dat/.../stats, @stt/.../stats.svelte, @stt/dataset.svelte
@svc/kind/chinese/drill          <- @dat/.../drill (datDrill), @stt/.../drill.svelte, @stt/.../stats.svelte, @stt/dataset.svelte, @svc/sync
@svc/sync                        <- @dat/.../drill (datDrillSync)
@svc/maintenance                 <- @dat/.../drill (datDrillSync)

routes (browse, drill)        <- @stt/.../stats.svelte (read), @stt/.../drill.svelte (read), @svc/.../stats (load), @svc/.../drill (actions)
```

All layers respect boundaries. State is pure. Service only imports from dom/dat/stt/svc.
