# Plan: Dataset Service Vertical

RFC: `docs/0008-rfc-dataset-service.md`

Base: `app-fe/web/src/`

---

## Phase 1 — @dom layer + alias

Create pure domain types. Add backward-compat re-exports in old @dat files so existing imports keep working.

### Scope

| Action | File |
|--------|------|
| create | `0_dom/dataset.ts` |
| create | `0_dom/kind/chinese/dataset.ts` |
| edit   | `svelte.config.js` (in `app-fe/web/`) |
| edit   | `4_dat/dataset.ts` |
| edit   | `4_dat/registry.ts` |
| edit   | `4_dat/kind/chinese/dataset.ts` |

### Details

**`0_dom/dataset.ts`** — types from RFC:
- `DatasetMeta` (id, code, kind, name, appTitle, path, description, tags: string[], search: string[])
- `Dataset extends DatasetMeta` (groups: Group[])
- `Group` (idx, id, displayId, tags?, items: Word[])
- `Word` (idx, id, displayId, word, tags?)
- `compositeKey(groupId, wordId): string` — returns `` `${groupId}::${wordId}` ``
- `GroupViewMode` enum (Compact = 'compact', Full = 'full')
- `DatasetPrefs` (datasetId, search, tags, groups, viewMode)

**`0_dom/kind/chinese/dataset.ts`** — kind-specific types:
- `ChineseWord extends Word` (pinyin, tr)
- `ChineseGroup extends Group` (items: ChineseWord[])
- `ChineseDatasetMeta extends DatasetMeta` (kind: 'chinese', from, to)
- `ChineseDataset extends ChineseDatasetMeta` (groups: ChineseGroup[])
- `ChineseDatasetStats` (groups, words, chars) — keep this, used by stats code
- `asChineseDataset(ds: Dataset | null): ChineseDataset | null` — kind guard + cast, replaces old `getChineseContent()`

**`svelte.config.js`** — add alias:
```js
'@dom': 'src/0_dom',
```

**`4_dat/dataset.ts`** — replace body with re-exports from `@dom/dataset`:
```ts
export { type Dataset, type Group, type Word, compositeKey } from '@dom/dataset'
```
This keeps `import { compositeKey } from '@dat/dataset'` working in: `@uic/kind/chinese/group-item.ts`, `@std/kind/chinese/stats.ts`, `routes/chinese/words/+page.svelte`, `@std/kind/chinese/pick-next-practice.ts`, `@std/dataset.ts`.

**`4_dat/registry.ts`** — replace body with re-export:
```ts
export type { DatasetMeta } from '@dom/dataset'
```
This keeps `import type { DatasetMeta } from '@dat/registry'` working in: `@svc/registry-service.ts`, `@stt/registry.ts`.

**`4_dat/kind/chinese/dataset.ts`** — update type imports to come from `@dom`, keep parse function and raw types for now (moved in phase 2). Types `ChineseWord`, `ChineseGroup`, `ChineseDataset`, `ChineseDatasetStats` imported from `@dom/kind/chinese/dataset` and re-exported. `formatGroup` import stays (used by parse).

### Verify

`npm run check` — all existing imports resolve through re-exports.

---

## Phase 2 — @low parse extraction + dataset-api

Extract parse function to @low. Create unified dataset-api that combines JSON loading + IDB prefs.

### Scope

| Action | File |
|--------|------|
| create | `5_low/kind/chinese/parse-dataset.ts` |
| create | `5_low/dataset-api.ts` |
| edit   | `4_dat/kind/chinese/dataset.ts` |
| edit   | `5_low/json-dataset-repo.ts` |

### Details

**`5_low/kind/chinese/parse-dataset.ts`** — move from `4_dat/kind/chinese/dataset.ts`:
- Move `RawChineseWord`, `RawChineseGroup`, `RawChineseDataset` interfaces
- Move `parseChineseDataset()` function
- Import `formatGroup` from `@std/format`
- Import types from `@dom/kind/chinese/dataset`

**`5_low/dataset-api.ts`** — new unified API. Interface from RFC. Implementation:
- **JSON loading**: copy glob pattern from `json-dataset-repo.ts` — `import.meta.glob('@data/**/*.json', { eager: true, import: 'default' })`. Normalize paths. `loadRegistry()` — import `registry.json` from `@data/registry.json`, return as `Promise<DatasetMeta[]>`. `loadData(meta)` — look up by `meta.path`, call kind-specific parse (chinese → `parseChineseDataset`, else return raw), return as `Promise<Dataset | null>`.
- **IDB prefs**: copy get/set helpers from `idb-prefs-repo.ts`. Create own `createDatabase('uch-prefs', ...)`. Key scheme same as current: `datasetId`, `main:search:{id}`, `main:tags:{id}`, `main:group:{id}`, `main:compact:{id}`. Return `DatasetPrefs` from `getPrefs()`. `GroupViewMode` mapping: stored `true` or `'compact'` → `GroupViewMode.Compact`, else `GroupViewMode.Full`.
- Key point: this IDB instance is the SAME database name `uch-prefs` as current `idb-prefs-repo.ts`. They share the same underlying IDB. The `switchDatabase(userId)` call (owned by auth) switches BOTH because same db name. For now, both `idb-prefs-repo` and `dataset-api` create separate `DbHandle` instances to the same db — this works because IDB connections are shared per-name. On user switch, auth calls `prefsRepo.switchDatabase()` which switches `idb-prefs-repo`'s handle, AND later `datasetService.reloadPrefs()` will re-read from the now-switched db. BUT — `dataset-api`'s own `DbHandle` also needs switching. Solution: `dataset-api` exports `switchDatabase(userId)` too, called from auth alongside existing `prefsRepo.switchDatabase()`. Will be cleaned up when `idb-prefs-repo` dataset methods are removed in phase 6.

**`4_dat/kind/chinese/dataset.ts`** — remove parse function and raw types (moved to @low). Keep only type re-exports from `@dom/kind/chinese/dataset`.

**`5_low/json-dataset-repo.ts`** — update `parseChineseDataset` import to `@low/kind/chinese/parse-dataset`. Remove `DatasetRepo` type import from `@dat/dataset-repo` (just type the export inline or remove annotation). This file is temporary — deleted in phase 6.

### Verify

`npm run check` — dataset-api compiles, existing app still works through old paths.

---

## Phase 3 — New state + repo + service

Create the three remaining vertical layers. Old files still exist in parallel — no route changes yet.

### Scope

| Action | File |
|--------|------|
| create | `3_stt/dataset.ts` |
| edit   | `4_dat/dataset-repo.ts` |
| create | `2_svc/dataset-service.ts` |

### Details

**`3_stt/dataset.ts`** — pure stores, per RFC:
```ts
import { writable, type Writable } from 'svelte/store'
import type { DatasetMeta, Dataset, Group, GroupViewMode } from '@dom/dataset'
```
All stores initialized with empty/default values:
- `datasetsMeta: Writable<DatasetMeta[]>` — `writable([])`
- `datasetId: Writable<string>` — `writable('')`
- `currentDataset: Writable<Dataset | null>` — `writable(null)`
- `groups: Writable<Group[]>` — `writable([])`
- `filteredGroups: Writable<Group[]>` — `writable([])`
- `search: Writable<string>` — `writable('')`
- `tags: Writable<string[]>` — `writable([])`
- `selectedGroups: Writable<number[]>` — `writable([])`
- `viewMode: Writable<GroupViewMode>` — `writable(GroupViewMode.Full)`

Zero logic. Just exports.

**`4_dat/dataset-repo.ts`** — overwrite old 3-line file. New interface + implementation per RFC:
```ts
import type { DatasetMeta, Dataset, DatasetPrefs, GroupViewMode } from '@dom/dataset'
import { datasetApi } from '@low/dataset-api'
```
- Constructor: `create()` async factory — calls `await datasetApi.loadRegistry()`, builds `Map<id, DatasetMeta>`.
- `getAllMeta()` — returns cached array
- `getMetaById(id)` — map lookup
- `loadData(id)` — find meta by id, call `datasetApi.loadData(meta)`, return result
- Prefs: delegate to `datasetApi.getPrefs/setPref*`
- Export `datasetRepo` as a promise: `export const datasetRepo = create()`

**`2_svc/dataset-service.ts`** — orchestration per RFC:
```ts
import { datasetRepo } from '@dat/dataset-repo'
import * as state from '@stt/dataset'
import type { DatasetPrefs, GroupViewMode } from '@dom/dataset'
```

**`init()`**:
1. `const repo = await datasetRepo`
2. `state.datasetsMeta.set(repo.getAllMeta())`
3. Load prefs: `const prefs = await repo.getPrefs(defaultId)`. Default id = `prefs.datasetId` if valid, else first meta id.
4. Load dataset data: `const ds = await repo.loadData(prefs.datasetId)`
5. Set all stores: `datasetId`, `currentDataset`, `groups` (from ds), `search`, `tags`, `selectedGroups`, `viewMode`
6. Call `recomputeFiltered()` — runs filterGroups and sets `filteredGroups`
7. Set `initialized = true`

**`selectDataset(id)`**:
1. `const repo = await datasetRepo`
2. `const ds = await repo.loadData(id)`
3. Set `datasetId`, `currentDataset`, `groups`
4. Reset filters to defaults (empty search, no tags, no group selection, keep viewMode)
5. Load prefs for new dataset, apply them
6. `recomputeFiltered()`
7. Persist: `repo.setPrefId(id)`

**`reloadPrefs()`** — called by auth after user switch:
1. Re-read prefs from repo for current dataset id
2. Set filter stores
3. `recomputeFiltered()`

**`setSearch(v)`** / **`setTags(v)`** / **`setGroups(v)`** / **`setViewMode(v)`**:
1. Set corresponding store
2. `recomputeFiltered()` (not needed for viewMode, but consistent)
3. Persist to repo (debounced — use a simple `setTimeout` debounce, ~300ms)

**`recomputeFiltered()`** — local helper:
1. Read current values via `get()` from stores: groups, search, tags, selectedGroups
2. Call `filterGroups()` (local pure function, moved from `@std/dataset.ts`)
3. Also clean up invalid selectedGroups (same logic as current `groups.subscribe` in filters.ts)
4. Set `filteredGroups` store

**`filterGroups()`** — copy from `6_std/dataset.ts`. Change type: groups parameter is `Group[]` (from `@dom/dataset`), items accessed via `item.word` for search. Key difference: current implementation uses `collectStrings()` to search ALL string fields — this handles kind-specific fields (`pinyin`, `english`) without knowing them. Keep this behavior. Also use `dataset.search` field to filter which fields are searched (read from `currentDataset`).

Actually, keep current `collectStrings` behavior — it searches all string fields on items, which naturally includes kind-specific fields. The `search` field on `DatasetMeta` can be used later for more precise searching. For now, match current behavior exactly.

### Verify

`npm run check` — new files compile. Old app still works. New vertical is unused.

---

## Phase 4 — Wire +layout, auth, practice-stats

Connect initialization and fix boundary violations in non-route files.

### Scope

| Action | File |
|--------|------|
| edit   | `routes/+layout.svelte` |
| edit   | `3_stt/auth.ts` |
| edit   | `3_stt/kind/chinese/practice-stats.ts` |

### Details

**`routes/+layout.svelte`** — add dataset service init:
```svelte
import { datasetService } from '@svc/dataset-service'
```
Change init sequence:
```ts
initAuth().then(() => datasetService.init()).then(() => { ready = true })
```
Auth must init first (sets up IDB user context), then dataset service loads prefs from the correct user db.

**`3_stt/auth.ts`** — fix boundary violations:
- Remove: `import { prefsRepo } from '@low/idb-prefs-repo'` (state→low violation)
- Remove: `import { reloadDatasetPref } from '@stt/registry.js'`
- Add: `import { datasetService } from '@svc/dataset-service'`
- WAIT: auth is @stt, can't import @svc. This is a boundary violation too.

**Resolution**: `onUserChanged` needs to call `datasetService.reloadPrefs()` but @stt can't import @svc. Two options:
  1. Auth exposes a callback hook that +layout wires up
  2. Move `onUserChanged` orchestration to a service

Option 1 is simpler. `auth.ts` exports `onUserChanged` as a settable callback:
```ts
export let onUserChanged: ((userId: string | null) => Promise<void>) | null = null
```
Then `+layout.svelte` wires it:
```ts
import { onUserChanged } from '@stt/auth'
import { datasetService } from '@svc/dataset-service'
onUserChanged = async (userId) => {
  await statsRepo.switchDatabase(userId)
  // prefsRepo.switchDatabase handled by dataset-api internally
  await datasetService.reloadPrefs()
  if (userId) { await syncService.syncPending(); await syncService.restoreFromServer() }
  dbVersion.update(n => n + 1)
}
```

Actually this pulls too much into +layout. Better approach: create `@svc/auth-service.ts` or keep the orchestration in `auth.ts` but inject the dataset reload callback.

**Simplest**: `auth.ts` keeps the `onUserChanged` function but accepts a `reloadDataset` callback set from outside:
```ts
let _reloadDataset: (() => Promise<void>) | null = null
export function setReloadDataset(fn: () => Promise<void>) { _reloadDataset = fn }
```

Called from `+layout.svelte`:
```ts
import { setReloadDataset } from '@stt/auth'
setReloadDataset(() => datasetService.reloadPrefs())
```

Inside `auth.ts` `onUserChanged`:
- Keep `statsRepo.switchDatabase(userId)` (this is stats concern, not dataset)
- Remove `prefsRepo.switchDatabase(userId)` — dataset-api handles its own db switching
- Call `await _reloadDataset?.()` instead of `reloadDatasetPref()`
- Remove `prefsRepo` import

Also need: `dataset-api.ts` must switch its IDB handle when user changes. Add `switchDatabase` to dataset-api and call it from auth. BUT auth can't import @low either (that's the same violation we're fixing).

**Final approach**: `@low/dataset-api.ts` exports `switchDatabase()`. This is called via `datasetService.reloadPrefs()` which internally does `datasetApi.switchDatabase(userId)` before re-reading prefs. The service needs the userId — pass it through: `datasetService.reloadPrefs(userId)` or the service reads it from auth state. Since @svc CAN import @stt:

```ts
// in dataset-service.ts reloadPrefs():
const userId = get(user) // from @stt/auth — @svc can import @stt
await datasetApi.switchDatabase(userId?.id ?? null)
// then re-read prefs
```

Wait, `datasetApi` is @low. Service can't import @low directly. It goes through repo. So add `switchDatabase(userId)` to `DatasetRepo` interface, which delegates to `datasetApi.switchDatabase()`.

Updated `auth.ts`:
- Remove `import { prefsRepo } from '@low/idb-prefs-repo'`
- Remove `import { reloadDatasetPref } from '@stt/registry.js'`
- Remove `await prefsRepo.switchDatabase(userId)` from `onUserChanged`
- Remove `await reloadDatasetPref()`
- Keep `await statsRepo.switchDatabase(userId)` (stats concern)
- Add callback: `let _onDatasetReload: (() => Promise<void>) | null = null`
- `export function setDatasetReloadHook(fn: () => Promise<void>) { _onDatasetReload = fn }`
- In `onUserChanged`: `await _onDatasetReload?.()`

Updated `+layout.svelte`:
```ts
import { setDatasetReloadHook } from '@stt/auth'
import { datasetService } from '@svc/dataset-service'
setDatasetReloadHook(() => datasetService.reloadPrefs())
```

Updated `dataset-service.ts` `reloadPrefs()`:
```ts
async reloadPrefs() {
  const repo = await datasetRepo
  // switch IDB to current user
  const userId = get(user)?.id ?? null  // import { user } from '@stt/auth'
  await repo.switchDatabase(userId)
  // re-read prefs for current dataset
  const id = get(state.datasetId)
  const prefs = await repo.getPrefs(id)
  // set filter stores
  state.search.set(prefs.search)
  // ... etc
  recomputeFiltered()
}
```

Updated `DatasetRepo` interface — add:
```ts
switchDatabase(userId: string | null): Promise<void>
```
Delegates to `datasetApi.switchDatabase()`.

**`3_stt/kind/chinese/practice-stats.ts`** — fix state→service violation:
- Remove: `import { registryService } from '@svc/registry-service'`
- Add: `import { datasetsMeta } from '@stt/dataset'` (state→state is allowed)
- Replace `dsCode()` function:
  ```ts
  function dsCode(id: string): string {
    const meta = get(datasetsMeta).find(m => m.id === id)
    return meta?.code ?? id
  }
  ```

### Verify

`npm run check` — auth, practice-stats compile with new imports. Old routes still work (they still import from @stt/registry and @stt/filters which still exist).

---

## Phase 5 — Wire all routes

Switch every route from old imports (`@stt/registry`, `@stt/filters`) to new (`@stt/dataset`, `@svc/dataset-service`).

### Scope

| Action | File |
|--------|------|
| edit | `routes/chinese/+page.svelte` |
| edit | `routes/chinese/browse-hero.svelte` |
| edit | `routes/chinese/groups/+page.svelte` |
| edit | `routes/chinese/chars/+page.svelte` |
| edit | `routes/chinese/words/+page.svelte` |
| edit | `routes/chinese/practice/hanzi/+page.svelte` |
| edit | `routes/chinese/practice/pinyin/+page.svelte` |
| edit | `routes/chinese/workbook/+page.svelte` |
| edit | `routes/english/+page.svelte` |
| edit | `routes/english/workbook/+page.svelte` |

### Import mapping (all routes)

| Old | New |
|-----|-----|
| `import { datasets, datasetId, currentDataset, setDatasetById } from '@stt/registry.js'` | `import { datasetsMeta, datasetId, currentDataset } from '@stt/dataset.js'` |
| `import { getChineseContent } from '@stt/registry.js'` | `import { asChineseDataset } from '@dom/kind/chinese/dataset'` |
| `import { mainSearch, mainTags, mainGroups, mainListViewStyle, groups, filteredGroups } from '@stt/filters.js'` | `import { search, tags, selectedGroups, viewMode, groups, filteredGroups } from '@stt/dataset.js'` |
| `import { compositeKey } from '@dat/dataset'` | `import { compositeKey } from '@dom/dataset'` |
| `import type { ListViewStyle } from '@dat/prefs-repo'` | `import { GroupViewMode } from '@dom/dataset'` |

### Mutation mapping (all routes)

| Old pattern | New pattern |
|------------|-------------|
| `$datasetId = id` (toolbar dataset change) | `datasetService.selectDataset(id)` |
| `setDatasetById(id)` | `datasetService.selectDataset(id)` |
| `setDatasetByKind('english')` | `const m = $datasetsMeta.find(m => m.kind === 'english'); if (m) datasetService.selectDataset(m.id)` |
| `$mainSearch = v` | `datasetService.setSearch(v)` |
| `$mainTags = [...]` | `datasetService.setTags([...])` |
| `$mainGroups = [...]` | `datasetService.setGroups([...])` |
| `$mainListViewStyle = ...` | `datasetService.setViewMode(...)` |

### Rename mapping (reads — all routes)

| Old | New |
|-----|-----|
| `$mainSearch` | `$search` |
| `$mainTags` | `$tags` |
| `$mainGroups` | `$selectedGroups` |
| `$mainListViewStyle` | `$viewMode` |
| `datasets` (the array) | `$datasetsMeta` |
| `getChineseContent($currentDataset)` | `asChineseDataset($currentDataset)` |
| `$currentDataset?.data?.groups` | `$currentDataset?.groups` (data is now inline) |
| `'full'` / `'compact'` string literals for viewStyle | `GroupViewMode.Full` / `GroupViewMode.Compact` |

### Per-file notes

**`routes/chinese/+page.svelte`**:
- Remove `@stt/registry.js` import, add `@stt/dataset.js`
- Remove `@stt/filters.js` import, add `@stt/dataset.js` (merge with above)
- Add `import { datasetService } from '@svc/dataset-service'`
- Read stores: `$datasetId`, `$currentDataset`, `$filteredGroups`, `$search`, `$viewMode`
- No filter mutations in this file — only reads

**`routes/chinese/browse-hero.svelte`**:
- Same import swap as above
- Filter mutations: `onSearchChange`, `onTagAdd/Remove/Clear`, `onGroupAdd/Remove/Clear`, `onToggleView` — all change to `datasetService.setX()` calls
- `onDatasetChange={(id) => datasetService.selectDataset(id)}`
- `{datasets}` → `{$datasetsMeta}` for Toolbar prop
- `listViewStyle={$mainListViewStyle}` → `listViewStyle={$viewMode}`

**`routes/chinese/groups/+page.svelte`**:
- `@stt/registry.js` → `@stt/dataset.js`
- `@stt/filters.js` → `@stt/dataset.js`

**`routes/chinese/chars/+page.svelte`**:
- `@stt/filters.js` → `@stt/dataset.js`

**`routes/chinese/words/+page.svelte`**:
- `@stt/filters.js` → `@stt/dataset.js`
- `@dat/dataset` → `@dom/dataset` for compositeKey

**`routes/chinese/practice/hanzi/+page.svelte`** and **`pinyin/+page.svelte`**:
- `@stt/registry.js` → `@stt/dataset.js`
- `setDatasetById(requested)` → `datasetService.selectDataset(requested)`
- `getChineseContent($currentDataset)?.groups` → `asChineseDataset($currentDataset)?.groups`
- Add `import { datasetService } from '@svc/dataset-service'`

**`routes/chinese/workbook/+page.svelte`**:
- `@stt/registry.js` → `@stt/dataset.js`
- `setDatasetById` → `datasetService.selectDataset`
- `getChineseContent($currentDataset)` → `asChineseDataset($currentDataset)`

**`routes/english/+page.svelte`**:
- `@stt/registry.js` → `@stt/dataset.js`
- `@stt/filters.js` → `@stt/dataset.js`
- `setDatasetByKind('english')` → find + `datasetService.selectDataset(id)`
- All filter mutations → `datasetService.setX()`
- `{datasets}` → `{$datasetsMeta}`

**`routes/english/workbook/+page.svelte`**:
- `@stt/registry.js` → `@stt/dataset.js`
- `setDatasetById` → `datasetService.selectDataset`
- `$currentDataset?.data?.groups` → `$currentDataset?.groups`

### Verify

`npm run check` + `npm run dev` — full app works through new vertical. Old files (@stt/registry, @stt/filters, @svc/registry-service) are now unused.

---

## Phase 6 — Delete old files + cleanup

Remove all replaced files and update remaining @dat/dataset imports to @dom/dataset.

### Scope

| Action | File |
|--------|------|
| delete | `2_svc/registry-service.ts` |
| delete | `3_stt/registry.ts` |
| delete | `3_stt/filters.ts` |
| delete | `4_dat/registry.ts` |
| delete | `4_dat/prefs-repo.ts` |
| delete | `5_low/json-dataset-repo.ts` |
| delete | `6_std/dataset.ts` |
| edit   | `4_dat/dataset.ts` — delete file (re-exports no longer needed) |
| edit   | `4_dat/kind/chinese/dataset.ts` — delete file (types moved to @dom, parse moved to @low) |
| edit   | `5_low/idb-prefs-repo.ts` — remove dataset methods, keep only `switchDatabase` + non-dataset prefs |
| edit   | `1_uic/kind/chinese/group-item.ts` — `@dat/dataset` → `@dom/dataset`, `@dat/kind/chinese/dataset` → `@dom/kind/chinese/dataset` |
| edit   | `6_std/kind/chinese/stats.ts` — `@dat/dataset` → `@dom/dataset` |
| edit   | `6_std/kind/chinese/pick-next-practice.ts` — `@dat/dataset` → `@dom/dataset` |

### Details

**`5_low/idb-prefs-repo.ts`** — strip to minimal:
- Remove: `getDatasetId`, `setDatasetId`, `getMainFilters`, `setMainSearch`, `setMainTags`, `setMainGroups`, `setMainListViewStyle`
- Remove: `ListViewStyle` import from `@dat/prefs-repo` (file deleted)
- Keep: `switchDatabase()`, IDB helpers (`get`, `set`), db handle creation
- Keep: any non-dataset prefs methods if they exist
- Update `PrefsRepo` type or inline — since `@dat/prefs-repo.ts` is deleted, either define a minimal interface locally or just export raw functions

**Import updates** — mechanical, change `@dat/dataset` → `@dom/dataset` in:
- `1_uic/kind/chinese/group-item.ts` — `compositeKey`, `ChineseGroup` type
- `6_std/kind/chinese/stats.ts` — `compositeKey`
- `6_std/kind/chinese/pick-next-practice.ts` — `Group` type

### Verify

`npm run check` — no remaining imports of deleted files. `npm run dev` — app works. `grep -r '@dat/dataset' src/` and `grep -r '@dat/registry' src/` and `grep -r '@stt/registry' src/` and `grep -r '@stt/filters' src/` — all return empty.
