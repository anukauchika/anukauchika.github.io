# RFC: Dataset Service Vertical

## Problem

Dataset loading, selection, and filtering are scattered across layers with boundary violations:

- `@stt/registry` imports `@svc/registry-service` (state -> service)
- `@stt/filters` imports `@low/idb-prefs-repo` (state -> low)
- `@stt/auth` imports `@low/idb-prefs-repo` (state -> low)
- `@stt/practice-stats` imports `@svc/registry-service` (state -> service)
- `@dat` mixes domain types with repo interfaces

## Scope

New `@dom` layer + full dataset vertical (`@low` -> `@dat` -> `@svc` -> `@stt`). Replaces `registry-service`, `@stt/registry`, `@stt/filters`. Does not touch stats/practice/sync — only dataset management.

## New Layer: `@dom` (0_dom)

Pure domain types and functions. Zero deps. Importable by all layers.

**`@dom/dataset.ts`** — unified domain types:

```ts
interface DatasetMeta {
  id: string
  code: string
  kind: string
  name: string
  appTitle: string
  path: string
  description: string
  tags: string[]
  search: string[]
}

interface Dataset extends DatasetMeta {
  groups: Group[]
}

interface Group {
  idx: number
  id: number
  displayId: string
  tags?: string[]
  items: Word[]
}

interface Word {
  idx: number
  id: number
  displayId: string
  word: string
  tags?: string[]
}

function compositeKey(groupId: number, wordId: number): string

enum GroupViewMode { Compact = 'compact', Full = 'full' }

interface DatasetPrefs {
  datasetId: string
  search: string
  tags: string[]
  groups: number[]
  viewMode: GroupViewMode
}

```

**`@dom/kind/chinese/dataset.ts`** — kind-specific extensions:

```ts
interface ChineseWord extends Word {
  pinyin: string
  tr: string
}

interface ChineseGroup extends Group {
  items: ChineseWord[]
}

interface ChineseDatasetMeta extends DatasetMeta {
  kind: 'chinese'
  from: string
  to: string
}

interface ChineseDataset extends ChineseDatasetMeta {
  groups: ChineseGroup[]
}
```

## Kind Handling

`@low/dataset-api` loads JSON and parses per kind internally. It returns `Dataset` — the generic type. The actual objects carry kind-specific fields (`pinyin`, `tr`), they're just not visible at the generic type level. Loading is lazy — only the selected dataset's content is loaded on demand.

- Generic consumers (filtering, group lists, search) work with `Dataset`/`Group`/`Word`
- Kind-specific consumers cast when needed: `word as ChineseWord`
- No `Record<string, unknown>`, no `getChineseContent()` cast helpers — direct structural typing

Parse functions live in `@low` (e.g. `@low/kind/chinese/parse-dataset.ts`) since parsing is raw data transformation — a `@low` concern. They import `@dom` types to produce typed output. `@dom` stays pure types + `compositeKey`.

## Dataset Vertical

### `@low/dataset-api.ts`

Raw data access. JSON glob + IDB prefs.

```ts
interface DatasetApi {
  // JSON loading — meta is cheap (registry.json), data is lazy (per dataset)
  loadRegistry(): Promise<DatasetMeta[]>
  loadData(meta: DatasetMeta): Promise<Dataset | null>

  // IDB prefs — dataset selection & filters
  getPrefs(datasetId: string): Promise<DatasetPrefs>
  setPrefId(id: string): Promise<void>
  setPrefSearch(datasetId: string, v: string): Promise<void>
  setPrefTags(datasetId: string, v: string[]): Promise<void>
  setPrefGroups(datasetId: string, v: number[]): Promise<void>
  setPrefViewMode(datasetId: string, v: GroupViewMode): Promise<void>
}
```

All methods return promises. `loadRegistry()` reads `registry.json` (cheap). `loadData()` loads a single dataset's JSON, parses per kind (parse functions live here in `@low`). Currently sync under the hood (`import.meta.glob` eager), but async interface allows switching to lazy import later without API change. IDB `uch-prefs` store for preferences.

### `@dat/dataset-repo.ts`

Repo interface. Thin abstraction over `@low/dataset-api`.

```ts
interface DatasetRepo {
  // meta — always available after init
  getAllMeta(): DatasetMeta[]
  getMetaById(id: string): DatasetMeta | null

  // data — lazy, per dataset
  loadData(id: string): Promise<Dataset | null>

  // prefs
  getPrefs(datasetId: string): Promise<DatasetPrefs>
  setPrefId(id: string): Promise<void>
  setPrefSearch(datasetId: string, v: string): Promise<void>
  setPrefTags(datasetId: string, v: string[]): Promise<void>
  setPrefGroups(datasetId: string, v: number[]): Promise<void>
  setPrefViewMode(datasetId: string, v: GroupViewMode): Promise<void>
}
```

Initialized via `await datasetApi.loadRegistry()`, builds lookup maps. Meta accessors are sync after init. `loadData()` is async. Prefs pass-through to `@low` for now — repo will own supabase sync logic later (out of scope for this RFC).

### `@svc/dataset-service.ts`

Orchestration. Calls repo, sets state.

```ts
interface DatasetService {
  init(): Promise<void>                     // load preferred dataset + its data + prefs
  selectDataset(id: string): Promise<void>  // load data + set state + persist
  reloadPrefs(): Promise<void>              // re-read prefs after user switch (called by auth)

  setSearch(v: string): void       // set state + recompute filteredGroups + persist
  setTags(v: string[]): void
  setGroups(v: number[]): void
  setViewMode(v: GroupViewMode): void
}
```

`selectDataset()` triggers lazy load of dataset content via repo. Filter persistence: debounce writes, skip writes during init load.

**Filtering**: `filterGroups()` is a local pure function inside the service (moves from `@std/dataset.ts`). Service imperatively sets `filteredGroups` store whenever `currentDataset`, `search`, `tags`, or `selectedGroups` change. This keeps `@stt` pure (no logic, no subscriptions) — the service owns all orchestration including recomputation.

### `@stt/dataset.ts`

Pure stores. No imports except `@dom` (for types) and `svelte/store`.

```ts
// meta — always available (set once by service on init)
const datasetsMeta: Writable<DatasetMeta[]>

// selection — set by service
const datasetId: Writable<string>
const currentDataset: Writable<Dataset | null>

// groups — set by service (derived from currentDataset)
const groups: Writable<Group[]>

// filtered groups — set by service (recomputed on dataset/filter changes)
const filteredGroups: Writable<Group[]>

// filter stores — set by service
const search: Writable<string>
const tags: Writable<string[]>
const selectedGroups: Writable<number[]>
const viewMode: Writable<GroupViewMode>
```

All stores are writable, all set imperatively by the service. `@stt` has no derivation logic, no subscriptions, no persistence. Pure reactive containers — routes read them, service writes them.

## Deleted

| File | Replaced by |
|------|-------------|
| `@svc/registry-service.ts` | `@svc/dataset-service.ts` |
| `@stt/registry.ts` | `@stt/dataset.ts` |
| `@stt/filters.ts` | `@stt/dataset.ts` + `@svc/dataset-service.ts` |
| `@dat/registry.ts` | `@dom/dataset.ts` (DatasetMeta) |
| `@dat/prefs-repo.ts` | `@dom/dataset.ts` (types) + `@dat/dataset-repo.ts` (interface) |
| `@dat/dataset-repo.ts` (old) | `@dat/dataset-repo.ts` (new, richer) |
| `@low/json-dataset-repo.ts` | `@low/dataset-api.ts` |

Dataset-related methods removed from `@low/idb-prefs-repo.ts`. `switchDatabase()` stays — owned by auth, not dataset vertical. Non-dataset prefs (if any remain) stay.

## Side Effects on Existing Files

- **`@stt/auth.ts`** — user switching is not this vertical's concern. Auth service owns `switchUser` (IDB database switch via `@low`). After switch, auth calls `datasetService.reloadPrefs()` to refresh dataset state. Dataset vertical only exposes `reloadPrefs()` — no `switchUser`.
- **`@stt/practice-stats.ts`** — `registryService.getDatasetCode()` -> reads from `@stt/dataset` meta stores directly
- **Routes** — `@stt/registry` -> `@stt/dataset`, `@stt/filters` -> `@stt/dataset`, filter setters -> `datasetService.setSearch()` etc.
- **`@std/dataset.ts`** — `filterGroups` moves to `@svc/dataset-service.ts` as local pure function, file deleted or left for other utils

## Import Graph

```
@dom        <- (no deps)
@stt/dataset <- @dom, svelte/store
@svc/dataset <- @stt/dataset, @dat/dataset-repo, @dom
@dat/dataset <- @low/dataset-api, @dom
@low/dataset <- @dom (for types), IDB, import.meta.glob
```

All layers respect boundaries. State is pure.
