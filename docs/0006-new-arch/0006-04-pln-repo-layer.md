
# Plan: Repo Layer

## Phase 1: Create interface files

Scope: new files `src/api/stats-repo.ts`, `src/api/prefs-repo.ts`

1. Create `src/api/stats-repo.ts` — export `StatsRepo` interface importing types from `./types`
2. Add `MainFilters` interface to `src/api/types.ts` (alongside existing types)
3. Create `src/api/prefs-repo.ts` — export `PrefsRepo` interface importing `ListViewStyle`, `MainFilters` from `./types`
3. Run lint + format, verify build

## Phase 2: Reshape `idb-stats-repo.ts` to object export

Scope: `src/data/idb-stats-repo.ts`

1. Import `StatsRepo` from `../api/stats-repo`
2. Rename functions to match interface naming:
   - `getSessionById` → `getGroupSessionById`
   - `getPendingSessions` → `getPendingGroupSessions`
   - `markSessionSynced` → `markGroupSessionSynced`
   - `bulkInsertSessions` → `bulkInsertGroupSessions`
3. Collect all interface methods into a single `statsRepo` object typed as `StatsRepo`:
   ```ts
   export const statsRepo: StatsRepo = {
     saveGroupSession,
     getGroupSessionById,
     // ...
   }
   ```
4. `getWordStats`, `cleanupOldRecords`, legacy DB deletions stay as separate named exports outside the object. Tag with `// TODO 006-05: move to StatsService / MaintenanceService`
5. Run lint + format, verify build

## Phase 3: Update `idb-stats-repo` consumers

Scope: `src/state/practice-stats.js`, `src/state/sync.js`, `src/state/auth.js`, `src/data/seed-test-stats.js`, `src/data/seed-elementary-stats.js`

1. Replace `import * as idb from '../data/idb-stats-repo'` with `import { statsRepo } from '../data/idb-stats-repo'`
2. Update all call sites from `idb.xxx(...)` to `statsRepo.xxx(...)`
3. Update renamed method calls (`getSessionById` → `getGroupSessionById`, etc.)
4. Keep imports of standalone exports where needed (`getWordStats`, `cleanupOldRecords`, `switchDatabase` — note: `switchDatabase` is now on the `statsRepo` object, update `auth.js` accordingly)
5. Run lint + format, verify build

## Phase 4: Reshape `idb-prefs-repo.ts` to typed interface

Scope: `src/data/idb-prefs-repo.ts`, `src/supabase/filters.js`

1. Import `PrefsRepo` from `../api/prefs-repo` and `ListViewStyle` from `../api/types`
2. Replace generic `get/set` with dedicated typed methods. Internally each method uses the same IDB key-value store with string keys:
   - `getDatasetId` / `setDatasetId` — key `'datasetId'`
   - `getMainFilters(datasetId)` — reads all four filter keys via `Promise.all`, returns `MainFilters` with defaults baked in (no nulls)
   - `setMainSearch(datasetId)` / `setMainTags(...)` / `setMainGroups(...)` / `setMainListViewStyle(...)` — individual writes using keys `'main:search:{datasetId}'`, `'main:tags:{datasetId}'`, `'main:group:{datasetId}'`, `'main:compact:{datasetId}'`
3. Move `switchPrefsDatabase` into the `prefsRepo` object as `switchDatabase`
4. Type the export: `export const prefsRepo: PrefsRepo = { ... }`
5. Delete `src/supabase/filters.js` — its key-building logic is now inside `prefsRepo`
6. Run lint + format, verify build

## Phase 5: Update `idb-prefs-repo` consumers

Scope: `src/state/filters.js`, `src/state/registry.js`, `src/state/auth.js`

1. **`state/filters.js`**: replace `import { filtersApi }` with `import { prefsRepo }` from `../data/idb-prefs-repo`. Update calls:
   - `filtersApi.getMainFilters(datasetId)` → `prefsRepo.getMainFilters(datasetId)` (same shape, direct swap)
   - `filtersApi.setMainSearch(...)` → `prefsRepo.setMainSearch(...)`
   - Same pattern for tags, groups, listViewStyle
   - Rename store `mainCompact` → `mainListViewStyle`, update `App.svelte` import accordingly
   - Rename store `mainGroup` → `mainGroups`, update `App.svelte` import accordingly
2. **`state/registry.js`**: replace `prefs.get(PREF_DATASET)` / `prefs.set(PREF_DATASET, id)` with `prefsRepo.getDatasetId()` / `prefsRepo.setDatasetId(id)`. Remove `PREF_DATASET` constant
3. **`state/auth.js`**: replace `import { switchPrefsDatabase }` with `import { prefsRepo }`, update call `switchPrefsDatabase(userId)` → `prefsRepo.switchDatabase(userId)`
4. Run lint + format, verify build
