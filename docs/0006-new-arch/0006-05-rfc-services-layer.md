
# RFC: Services Layer

## Goal

Extract business logic out of the data layer (`idb-stats-repo.ts`) and the state layer (`practice-stats.js`, `sync.js`) into dedicated service modules. Services are pure logic — no Svelte stores, no direct IDB access (use repo interfaces). State layer becomes thin: load data via services, set stores.

## Current Problems

1. **`idb-stats-repo.ts`** — mixes CRUD with aggregation (`getWordStats`) and maintenance (`cleanupOldRecords`), both tagged with `// TODO 006-05`
2. **`practice-stats.js`** — 460 lines mixing: Svelte stores, aggregation logic (group session summaries, daily activity), session lifecycle (start/end/record), store update logic, code conversion
3. **`sync.js`** — good separation already, but lives in `state/` despite being pure orchestration logic with no Svelte stores
4. **`cleanupOldRecords` uses `localStorage`** for throttle tracking — should use IDB per 006-02 principle
5. **Legacy DB deletions** (`indexedDB.deleteDatabase(...)`) run as module-level side effects in the repo file

## Approach

### New folder: `src/services/`

```
src/services/
  stats-service.ts            # Aggregation: repo data → derived stats
  group-session-service.ts    # Session lifecycle: create, end, record
  sync-service.ts             # IDB ↔ Supabase coordination
  maintenance-service.ts      # Cleanup + legacy DB migration
```

All services are exported as plain objects (same pattern as `statsRepo` / `prefsRepo`). No classes.

### Interfaces in `api/`

Same pattern as repos — interfaces live in `api/`, implementations in `services/`:

```
src/api/
  types.ts              # existing
  stats-repo.ts         # existing
  prefs-repo.ts         # existing
  stats-service.ts      # NEW — StatsService interface
  group-session-service.ts  # NEW — GroupSessionService interface
  sync-service.ts       # NEW — SyncService interface
  maintenance-service.ts    # NEW — MaintenanceService interface
```

Consumers import the interfaces from `api/`, implementations are wired at the app level. This keeps the same contract-first pattern established in 006-04.

### New types in `api/types.ts`

```ts
// Input type for char data when recording word attempts
interface CharAttemptInput {
  charIndex: number
  startedAt: string
  doneAt: string
  errorCount: number
}

// Return type from recordWordAttempt — enough for optimistic store updates
interface WordAttemptResult {
  wordId: string
  groupId: string
  practiceType: PracticeType
  errorCount: number
}
```

### StatsRepo addition

Temp ID generation belongs to the data layer. Add `nextTempId()` to the existing `StatsRepo` interface (`api/stats-repo.ts`):

```ts
interface StatsRepo {
  // ... existing methods ...

  // Returns next negative temp ID for offline records.
  // Lazily initializes counter from getMinId() on first call.
  nextTempId(): Promise<number>
}
```

`getMinId()` becomes an internal implementation detail — only used to seed the counter. Can be removed from the interface (or kept, harmless).

The `nextTempId` / `tempIdReady` logic currently in `practice-stats.js` moves into `idb-stats-repo.ts`.

### StatsService interface

`api/stats-service.ts` — pure read-only aggregation. Consumes `StatsRepo`, returns computed data structures.

```ts
interface StatsService {
  // Multi-store join: sessions → words → chars → aggregate per (groupId, wordId)
  // Moved from idb-stats-repo.ts getWordStats
  getWordStats(datasetId: string, practiceType: PracticeType): Promise<WordStat[]>

  // Sessions → per-group {total, full, lastPracticedAt, lastFullSessionAt}
  // Extracted from practice-stats.js loadDatasetGroupSessions aggregation
  getGroupSessionSummaries(datasetId: string, practiceType: PracticeType): Promise<Map<string, GroupSessionSummary>>

  // Sessions + word attempts → per-date {count, durationMs, sessions}
  // Extracted from practice-stats.js loadDailyActivity aggregation
  getDailyActivity(datasetId: string, practiceType: PracticeType): Promise<Map<string, DailyActivity>>
}
```

### GroupSessionService interface

`api/group-session-service.ts` — session lifecycle. Consumes `StatsRepo` + Supabase API.

Services accept compact codes directly — code conversion (`dsCode`/`ptCode`) stays in state layer. Temp IDs are obtained from `statsRepo.nextTempId()`.

```ts
interface GroupSessionService {
  // Online-first (Supabase → real ID) with offline fallback (statsRepo.nextTempId())
  // Saves to IDB via repo. Returns session ID.
  // Does NOT update stores or manage sync — caller handles that.
  startGroupSession(
    userId: string | null,
    datasetId: string,
    practiceType: PracticeType,
    groupId: string,
  ): Promise<number>

  // Marks session done_at in IDB.
  // Returns updated session so caller can update stores.
  // Does NOT trigger sync.
  endGroupSession(sessionId: number): Promise<GroupSession | null>

  // Saves word attempt (ID from statsRepo.nextTempId()) + char logs to IDB.
  // Returns summary for optimistic store updates.
  // Does NOT trigger sync.
  recordWordAttempt(
    sessionId: number,
    wordId: string,
    startedAt: string,
    doneAt: string,
    chars: CharAttemptInput[],
  ): Promise<WordAttemptResult>
}
```

Note: `userId` is an explicit parameter — the current code reads it from a Svelte store (`get(user)`), but services must not depend on stores.

### SyncService interface

`api/sync-service.ts` — replaces `state/sync.js`. IDB ↔ Supabase coordination. Consumes `StatsRepo` + Supabase API. Logic unchanged — relocated.

```ts
interface SyncService {
  // Protect active offline session from ID remapping during sync
  setActiveSessionId(id: number | null): void

  // 3-phase sync: sessions → words → chars
  // Handles temp ID → real ID remapping
  // Guards against concurrent runs (internal syncing flag)
  syncPending(): Promise<void>

  // Bulk download all user data from Supabase → IDB
  restoreFromServer(): Promise<void>
}
```

The `syncing` guard and `activeSessionId` are module-level state inside the implementation — not exposed on the interface.

### MaintenanceService interface

`api/maintenance-service.ts` — cleanup and migration. Consumes `StatsRepo` + `PrefsRepo`.

```ts
interface MaintenanceService {
  // Called once at app init.
  // Deletes legacy databases (memris-stats, memris-stats-v2, memris-prefs).
  // Triggers throttled cleanup (fire-and-forget).
  runStartupTasks(): void

  // Deletes synced sessions older than 90 days (cascades: words → chars).
  // Throttled: max once per 24h. Tracking moved from localStorage to IDB.
  runCleanup(): Promise<void>
}
```

### State layer changes after extraction

**`practice-stats.js`** shrinks:
- Keeps: all Svelte stores, `dsCode`/`ptCode` conversion, store update logic
- Load functions simplify to: call StatsService → set store (no inline aggregation)
- Session functions become thin wrappers: call GroupSessionService → trigger `syncService.syncPending()` → update stores with returned data
- `nextTempId` / `tempIdReady` removed (owned by `StatsRepo`)

**`state/sync.js`** — deleted. Replaced by `services/sync-service.ts`.

**`state/auth.js`** — imports from `services/sync-service` instead of `state/sync`.

### App init sequence

Currently spread across module-level side effects. After extraction, explicit init in app startup:

1. `maintenanceService.runStartupTasks()` — legacy cleanup + throttled record cleanup
2. `initAuth()` — auth state + DB switch + sync (unchanged)

No explicit init step for temp IDs — `statsRepo.nextTempId()` lazily initializes on first call.

### Cleanup of idb-stats-repo.ts

After all extractions:
- `getWordStats` removed (→ StatsService)
- `cleanupOldRecords` removed (→ MaintenanceService)
- Legacy DB deletions removed (→ MaintenanceService)
- All module-level side effects removed
- File becomes pure `StatsRepo` implementation — only the `statsRepo` object export

## Not in Scope

- Restructuring `practice-stats.js` stores (8 stores remain) — that's component decomposition (next step)
- Code conversion refactoring (`dsCode`/`ptCode`) — stays in state layer
- Converting state files from `.js` to `.ts` — incremental, not blocking
