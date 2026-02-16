# Plan 0007: Stats Computation Layer

See full architecture: [0007-arch-stats-layer.md](./0007-arch-stats-layer.md)

4 phases, each = 1 commit.

---

## Phase 1: Types + pure functions

### Step 1a: Add output types to `api/data/kind/chinese/Dataset.ts`

New types alongside existing `ChineseItem`, `ChineseGroup`, `ChineseDatasetStats`:

```ts
export interface ChineseCharData {
  char: string
  wordCount: number
  stroke: { successCount: number; errorCount: number }
  pinyin: { successCount: number; errorCount: number }
  lastPracticedAt: string | null
  practiced: boolean
}

export interface ChinesePracticedItem {
  item: ChineseItem
  group: ChineseGroup
  stat: StatEntry           // from api/types.ts
}
```

Chart types are not chinese-specific, add to `api/types.ts`:

```ts
export interface ChartBar {
  date: string
  count: number
  label: string
  monthLabel: string | null
}

export interface ChartData {
  bars: ChartBar[]
  maxCount: number
  cumulativeData: number[]
  maxCumulative: number
  yMax: number
  ticks: number[]
}
```

### Step 1b: Extend `lib/app/std/kind/chinese/stats.ts`

File already has `uniqueChars()` and `calcStats()` using `ChineseGroup`.
Add practice stats functions using existing types from api/.

**Functions** — all use existing types (`ChineseGroup` from Dataset.ts, `StatsMap`/`SessionsMap`/`DailyActivityMap` from types.ts):

| Function | Signature | Replaces |
|---|---|---|
| `practicedCount` | `(groups: ChineseGroup[], stats: StatsMap) → number` | App L242-259 |
| `progress` | `(groups: ChineseGroup[], stats: StatsMap) → number` | App L330-355 |
| `mastery` | `(groups: ChineseGroup[], stats: StatsMap) → number` | App L333-366 |
| `groupProgress` | `(group: ChineseGroup, stats: StatsMap) → number` | App L372-377 |
| `groupMastery` | `(group: ChineseGroup, sessions: SessionsMap) → number` | App L378-381 |
| `charsData` | `(groups: ChineseGroup[], stroke: StatsMap, pinyin: StatsMap) → ChineseCharData[]` | App L189-240 |
| `practicedItems` | `(groups: ChineseGroup[], stats: StatsMap) → ChinesePracticedItem[]` | App L262-273 |
| `practicedGroupsSorted` | `(groups: ChineseGroup[], sessions: SessionsMap) → ChineseGroup[]` | App L430-438 |
| `chartData` | `(items: ChinesePracticedItem[], daily: DailyActivityMap) → ChartData \| null` | App L274-328 |

Note: existing `uniqueChars()` and `calcStats()` stay as-is.

Key points:
- `chartData` needs `toLocalDateKey` — copy the 4-line helper as a private function (no import needed)
- All functions import only from `api/` — types only
- No Svelte, no stores, no side effects

---

## Phase 2: Split `practice-stats.ts` → `stats-raw.ts` + `stats-session.ts`

**Scope:** `app-fe/web/src/lib/app/state/`
- Rename `practice-stats.ts` → `stats-raw.ts`
- Create `stats-session.ts`

**`stats-raw.ts`** keeps:
- All store declarations (L21-44)
- PT_CODES, dsCode, ptCode helpers (L9-19)
- All load functions: loadGroupStats, loadDatasetStatsAll, loadDatasetGroupSessionsAll, loadDailyActivityAll (L46-148)

**`stats-session.ts`** gets:
- startGroupSession (L152-158)
- endGroupSession (L160-186)
- recordWordAttempt (L188-230)
- Imports stores from `stats-raw.ts` to update them

**Update imports in consumers:**
- `App.svelte`: imports stores + loaders from `stats-raw.ts` (no session functions used)
- `Practice.svelte`: imports both `stats-raw.ts` (stores + loaders) and `stats-session.ts` (session lifecycle)

---

## Phase 3: Rewire App.svelte — use pure functions

**Scope:** `app-fe/web/src/pages/App.svelte`

Replace ~190 lines of inline stats logic with one-liner `$derived` calls into `std/kind/chinese/stats.ts`.

Before:
```svelte
const practicedCount = $derived.by(() => {
  let count = 0
  filteredGroups.forEach((g) => {
    g.items.forEach((item) => {
      if ($datasetStats.has(`${g.group}::${item.id}`)) count++
    })
  })
  return count
})
// ... 20+ similar blocks
```

After:
```svelte
import * as cs from '@app/std/kind/chinese/stats.js'

// Dataset-level
const practicedCount = $derived(cs.practicedCount(filteredGroups, $datasetStats))
const strokePracticedCount = $derived(cs.practicedCount(filteredGroups, $datasetStatsStroke))
const pinyinPracticedCount = $derived(cs.practicedCount(filteredGroups, $datasetStatsPinyin))
const strokeProgress = $derived(cs.progress(filteredGroups, $datasetStatsStroke))
const strokeMastery = $derived(cs.mastery(filteredGroups, $datasetStatsStroke))
const pinyinProgress = $derived(cs.progress(filteredGroups, $datasetStatsPinyin))
const pinyinMastery = $derived(cs.mastery(filteredGroups, $datasetStatsPinyin))
const uniqueChars = $derived(cs.uniqueCharsCount(filteredGroups))

// Lists
const practicedCharsData = $derived(cs.charsData(filteredGroups, $datasetStatsStroke, $datasetStatsPinyin))
const practicedCharsCount = $derived(practicedCharsData.filter(c => c.practiced).length)
const practicedItems = $derived(cs.practicedItems(filteredGroups, $datasetStats))
const practicedGroupsSorted = $derived(cs.practicedGroupsSorted(filteredGroups, $datasetGroupSessions))
const chartData = $derived(cs.chartData(practicedItems, dayCounts))
```

**What stays in App.svelte** (not stats — UI wiring):
- `filteredGroups` — filter/search logic
- `nextPractice` + `practiceHref` — navigation
- `compactRowProps` / `fullGroupProps` — prop builders (use `cs.groupProgress`/`cs.groupMastery` inside)
- `reloadStats` + `$effect` — data loading triggers
- All UI state vars, modal logic, auth dropdown
- `dayCounts` store-to-state sync

**Lines removed:** ~190. **Lines added:** ~15 one-liner $derived calls.

---

## Phase 4: Remove `datasetProgress`/`datasetMastery` dead code, verify

**Scope:** `App.svelte`

- `datasetProgress` and `datasetMastery` (merged stats across all practice types) — check if still used in template. Currently they're computed (L330-343) but Hero only receives per-type progress/mastery. If unused, drop them.
- Remove `countPracticed` helper (replaced by `cs.practicedCount`)
- Remove `calcProgress`/`calcMastery` helpers (replaced by `cs.progress`/`cs.mastery`)
- Remove `getGroupProgress`/`getGroupMastery` (replaced by `cs.groupProgress`/`cs.groupMastery`)
- Manual verify: run `npm run dev`, test with real data, confirm stats display matches before/after
