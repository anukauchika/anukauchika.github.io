
# RFC: Repo Layer

## Goal

Define typed interfaces for `StatsRepo` and `PrefsRepo`. Formalize the data-access contract so consumers depend on interfaces, not implementation details. Clean boundary: repos = pure CRUD, all aggregation/orchestration goes to services (006-05).

## Current Problems

1. **`idb-stats-repo.ts`** — flat module of 20+ exported functions, mixes CRUD with aggregation (`getWordStats`) and maintenance (`cleanupOldRecords`)
2. **No interface** — consumers import concrete IDB functions directly
3. **Module-level side effects** — auto-runs `cleanupOldRecords()` and deletes legacy DBs on import
4. **`cleanupOldRecords` uses `localStorage`** — breaks the "all storage via IDB" principle from 006-02
5. **Inconsistent export shape** — `idb-stats-repo` uses flat exports, `idb-prefs-repo` already uses object export (`prefsRepo.get/set`)

## Approach

### Interface files in `api/`

Interfaces live alongside `types.ts` — the app's public data contract:

```
src/api/
  types.ts        # existing — data types
  stats-repo.ts   # NEW — StatsRepo interface
  prefs-repo.ts   # NEW — PrefsRepo interface
```

### StatsRepo interface

```ts
interface StatsRepo {
  // Session CRUD
  saveGroupSession(session: GroupSession): Promise<void>
  getGroupSessionById(id: number): Promise<GroupSession | null>
  getGroupSessions(datasetId: string, practiceType: PracticeType): Promise<GroupSession[]>

  // Word attempt CRUD
  saveWordAttempt(attempt: WordAttempt): Promise<void>
  getWordAttempts(groupSessionId: number): Promise<WordAttempt[]>

  // Char log CRUD
  saveCharLogs(chars: CharLog[]): Promise<void>
  getCharLogs(wordAttemptId: number): Promise<CharLog[]>

  // Sync reads
  getPendingGroupSessions(): Promise<GroupSession[]>
  getPendingWordAttempts(): Promise<WordAttempt[]>
  getPendingCharLogs(): Promise<CharLog[]>

  // Sync writes
  markGroupSessionSynced(tempId: number, realId: number): Promise<void>
  markWordAttemptSynced(tempId: number, realId: number): Promise<void>

  // Bulk restore
  bulkInsertGroupSessions(sessions: GroupSession[]): Promise<void>
  bulkInsertWordAttempts(attempts: WordAttempt[]): Promise<void>
  bulkInsertCharLogs(chars: CharLog[]): Promise<void>

  // Utils
  isEmpty(): Promise<boolean>
  getMinId(): Promise<number>  // lowest temp ID in sessions/words — used to init offline ID counter

  // Lifecycle
  switchDatabase(userId: string | null): Promise<void>
}
```

**Not in interface** (business logic, will move to services in 006-05):
- `getWordStats` — multi-store join + aggregation
- `cleanupOldRecords` — maintenance with throttle logic

These stay in `idb-stats-repo.ts` temporarily as standalone exports until 006-05 extracts them.

### PrefsRepo interface

No generic `get/set` with `any`. Dedicated typed methods per preference. Reads follow the real access pattern: filters are always loaded all-at-once, writes are always individual (store subscriptions).

```ts
interface MainFilters {
  search: string
  tags: string[]
  groups: string[]
  listViewStyle: ListViewStyle
}

interface PrefsRepo {
  // Dataset selection
  getDatasetId(): Promise<string | null>
  setDatasetId(value: string): Promise<void>

  // Per-dataset filter state — batch read, individual writes
  getMainFilters(datasetId: string): Promise<MainFilters>
  setMainSearch(datasetId: string, value: string): Promise<void>
  setMainTags(datasetId: string, value: string[]): Promise<void>
  setMainGroups(datasetId: string, value: string[]): Promise<void>
  setMainListViewStyle(datasetId: string, value: ListViewStyle): Promise<void>

  // Lifecycle
  switchDatabase(userId: string | null): Promise<void>
}
```

`getMainFilters` returns defaults baked in (no nulls for consumers to handle). `MainFilters` is added to `api/types.ts`.

This absorbs the key-building logic currently in `supabase/filters.js` — that file's `filtersApi` becomes redundant once PrefsRepo exposes these methods directly. `supabase/filters.js` is removed, its consumers switch to `prefsRepo`.

### Object export pattern

Convert `idb-stats-repo.ts` from flat exports to a single `statsRepo` object export — matches the existing `prefsRepo` pattern. Consumers update from `import * as idb` to `import { statsRepo }`.

Side-effect functions (`getWordStats`, `cleanupOldRecords`, legacy DB deletion) stay as separate named exports outside the object — they don't conform to the interface and will be relocated in 006-05.

### Side effects

Module-level side effects (legacy DB cleanup, auto-cleanup) remain for now — tagged with `// TODO 006-05: move to MaintenanceService`. Full extraction happens in 006-05.

## Not in Scope

- Extracting aggregation/maintenance logic to services (006-05)
- Code conversion (dsCode/ptCode mapping in practice-stats.js) — stays in state layer
- `supabase/filters.js` is removed (absorbed into PrefsRepo), but its state-layer consumer (`state/filters.js`) is not restructured
