
# Plan: Data Types

## Phase 1: Rename `api/` → `supabase/`

Scope: `src/api/`, `src/api.js`, all files importing from them

1. Rename `src/api/` folder to `src/supabase/`
2. Rename `src/api.js` → `src/supabase.js`
3. Update all imports:
   - `src/state/sync.js` — `../api.js` → `../supabase.js`
   - `src/state/practice-stats.js` — `../api.js` → `../supabase.js`
   - `src/state/auth.js` — `../api.js` → `../supabase.js`
   - `src/state/filters.js` — `../api/filters.js` → `../supabase/filters.js`
   - `src/supabase.js` (was api.js) — `./api/supabase-*` → `./supabase/supabase-*`
4. Verify build passes

## Phase 2: Create `api/types.ts`

Scope: new file `src/api/types.ts`

1. Create `src/api/types.ts` with all exported enums and interfaces:
   - Enums: `PracticeType`, `SyncStatus`, `ListViewStyle`
   - Storage records: `GroupSession`, `WordAttempt`, `CharLog`
   - Derived: `WordStat`, `GroupSessionSummary`, `DailyActivity`
2. Run lint + format on new file
3. Verify build passes

## Phase 3: Use types in data layer

Scope: `src/data/idb-stats.js`, `src/data/idb-prefs-repo.js`

1. Rename `src/data/idb-stats.js` → `src/data/idb-stats-repo.ts`
2. Import types from `api/types.ts`, annotate all function signatures
3. Update all imports of `idb-stats.js` → `idb-stats-repo.ts` in:
   - `src/state/practice-stats.js`
   - `src/state/sync.js`
   - `src/state/auth.js`
   - `src/data/seed-test-stats.js`
   - `src/data/seed-elementary-stats.js`
4. Rename `src/data/idb-prefs-repo.js` → `src/data/idb-prefs-repo.ts`
5. Import types, annotate function signatures
6. Update all imports of `idb-prefs-repo.js` → `idb-prefs-repo.ts` in:
   - `src/state/auth.js`
   - `src/state/registry.js`
   - `src/supabase/filters.js` (was `api/filters.js`)
7. Run lint + format on changed files
8. Verify build passes
