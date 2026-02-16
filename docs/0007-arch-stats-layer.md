# Architecture: Full App Layers

## Layer Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│  PAGES                                                              │
│  Entry points — import state & services, wire to components         │
│                                                                     │
│  App.svelte        Practice.svelte        Workbook.svelte           │
│  DesignBook.svelte HowItWorks.svelte                                │
├─────────────────────────────────────────────────────────────────────┤
│  STATE (lib/app/state/)                                             │
│  Svelte stores + reactive effects, load/mutate raw data             │
│                                                                     │
│  auth.ts           registry.ts            filters.ts                │
│  stats-raw.ts      stats-session.ts                                 │
│  (currently: practice-stats.ts — to be split)                       │
├─────────────────────────────────────────────────────────────────────┤
│  SERVICES (lib/app/services/)                                       │
│  Business logic — aggregates repo data into service outputs         │
│                                                                     │
│  stats-service.ts         group-session-service.ts                  │
│  sync-service.ts          maintenance-service.ts                    │
├─────────────────────────────────────────────────────────────────────┤
│  DATA (lib/app/data/)                                               │
│  Persistence — IDB read/write                                       │
│                                                                     │
│  idb.ts            idb-stats-repo.ts      idb-prefs-repo.ts        │
├─────────────────────────────────────────────────────────────────────┤
│  SUPABASE (lib/app/supabase/)                                       │
│  Remote durability — sync target                                    │
│                                                                     │
│  supabase-client.ts    supabase-auth.ts    supabase-stats.ts        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  API (lib/app/api/)                                                 │
│  Interfaces & types — contracts between layers, organized by layer  │
│                                                                     │
│  data/                                                              │
│    prefs-repo.ts           — PrefsRepo, MainFilters, ListViewStyle  │
│    kind/chinese/                                                    │
│      Dataset.ts            — ChineseItem, ChineseGroup,             │
│                               ChineseDataset, ChineseDatasetStats   │
│      types.ts              — PracticeType, SyncStatus,              │
│                               GroupSession, WordAttempt, CharLog     │
│      stats-repo.ts         — StatsRepo interface                    │
│                                                                     │
│  services/                                                          │
│    sync-service.ts         — SyncService (generic)                  │
│    maintenance-service.ts  — MaintenanceService (generic)            │
│    kind/chinese/                                                    │
│      types.ts              — StatEntry, StatsMap, SessionsMap,      │
│                               WordStat, DailyActivity, etc.         │
│      stats-service.ts      — StatsService interface                 │
│      group-session-service.ts — GroupSessionService interface        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  STD (lib/app/std/)                                                 │
│  Pure domain functions — no svelte, no state, no services           │
│  Imports only from api/ (types)                                     │
│                                                                     │
│  kind/chinese/                                                      │
│    stats.ts                — dataset stats, char counts (existing)   │
│                              + practice stats derivation (new)      │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  STD (lib/std/)                                                     │
│  Generic framework — zero domain knowledge                          │
│                                                                     │
│  format.ts          pinyin.ts                                       │
│  ui/                                                                │
│    ActivityHeatmap  ProgressLine  Stat  Modal  Island  Card  ...    │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  APP UI (lib/app/ui/)                                               │
│  Domain components — pure, stateless, parametric                    │
│  No state/service imports. Uses anuka css only.                     │
│                                                                     │
│  hero/              Stats, Toolbar, Filters                         │
│  groups/            FullGroup, index                                │
│  chinese/           GroupItem, WordCard, Practice, PracticePinyin,  │
│                     CompactGroup, CompactGroupList, PracticedGroups,│
│                     Workbook                                        │
│  english/           GroupItem, WordCard, Workbook                   │
│  PracticedWords     PracticedChars     PracticeChart                │
│  DailyActivityHeatmap                                               │
│  design/            DesignBook sections                             │
└─────────────────────────────────────────────────────────────────────┘

UTILS (utils/)
  pick-next-practice.ts    analytics.ts
```

## Type Flow

```
api/data/kind/chinese/              api/services/kind/chinese/
  Dataset.ts                          types.ts
    ChineseItem ─────────┐              StatEntry
    ChineseGroup ────────┤              StatsMap  ═ Map<string, StatEntry>
    ChineseDataset       │              SessionsMap ═ Map<string, GroupSessionSummary>
    ChineseDatasetStats  │              DailyActivityMap
                         │              GroupSessionSummary
  types.ts               │              DailyActivity
    PracticeType         │                    │
    SyncStatus           │                    │
    GroupSession         │                    │
    WordAttempt          │                    │
    CharLog              │                    │
                         ▼                    │
                std/kind/chinese/stats.ts     │
                  takes ChineseGroup[]        │
                  takes StatsMap, SessionsMap ◄┘
                  returns ChineseDatasetStats
                  returns CharData, ChartData, PracticedItem (local types)
```

## Existing types the pure functions should use (NOT redeclare)

From `api/data/kind/chinese/Dataset.ts`:
- `ChineseGroup` — `{ group: number; tags?: string[]; items: ChineseItem[] }`
- `ChineseItem` — `{ id: number; word: string; pinyin: string; english: string; tags?: string[] }`
- `ChineseDatasetStats` — `{ groups: number; words: number; chars: number }`

From `api/services/kind/chinese/types.ts`:
- `StatEntry` — `{ successCount; errorCount; lastPracticedAt }`
- `StatsMap` — `Map<string, StatEntry>`
- `SessionsMap` — `Map<string, GroupSessionSummary>`
- `DailyActivityMap` — `Map<string, DailyActivity>`
- `GroupSessionSummary` — `{ total; full; lastPracticedAt; lastFullSessionAt }`
- `DailyActivity` — `{ count; durationMs; sessions }`

## New types to add to `api/services/kind/chinese/types.ts`

Output types for practice stats derivation:

```ts
interface ChineseCharData {
  char: string
  wordCount: number
  stroke: { successCount: number; errorCount: number }
  pinyin: { successCount: number; errorCount: number }
  lastPracticedAt: string | null
  practiced: boolean
}

interface ChinesePracticedItem {
  item: ChineseItem
  group: ChineseGroup
  stat: StatEntry
}

interface ChartBar {
  date: string
  count: number
  label: string
  monthLabel: string | null
}

interface ChartData {
  bars: ChartBar[]
  maxCount: number
  cumulativeData: number[]
  maxCumulative: number
  yMax: number
  ticks: number[]
}
```

## Data Flow (detailed)

```
IDB / Supabase
    │
    ▼
idb-stats-repo ──implements──▶ StatsRepo (api/data/kind/chinese)
    │
    ▼
stats-service ──implements──▶ StatsService (api/services/kind/chinese)
    │  getWordStats() → WordStat[]
    │  getGroupSessionSummaries() → SessionsMap
    │  getDailyActivity() → DailyActivityMap
    ▼
stats-raw.ts (state)
    │  stores: datasetStats, datasetStatsStroke, datasetStatsPinyin
    │          datasetGroupSessions, datasetGroupSessionsStroke, ...
    │          dailyActivity
    │  loaders: loadDatasetStatsAll, loadDatasetGroupSessionsAll, ...
    ▼
App.svelte (page)
    │  $derived calls into ──▶ std/kind/chinese/stats.ts (pure functions)
    │                             progress(groups, statsMap)
    │                             mastery(groups, statsMap)
    │                             charsData(groups, stroke, pinyin)
    │                             chartData(items, daily)
    │                             ...
    ▼
Components (app/ui)
    Hero, Groups, PracticedWords, PracticedChars, PracticedGroups
```

## Import Rules

| Module | Can import from |
|--------|----------------|
| `api/` | only other `api/` types (leaf — only types & interfaces) |
| `lib/std/` | nothing (generic framework) |
| `lib/app/std/` | `api/` types only |
| `lib/app/ui/` | `api/` types, `lib/std/ui/`, `lib/app/std/` |
| `lib/app/data/` | `api/` types |
| `lib/app/services/` | `api/` types, `lib/app/data/` |
| `lib/app/supabase/` | `api/` types |
| `lib/app/state/` | `api/` types, `lib/app/services/`, `lib/app/data/`, `lib/app/state/` |
| `pages/` | everything |
| `utils/` | `api/` types |
