# RFC 0007: Stats Computation Layer

## Problem

App.svelte has ~200 lines of stats derivation logic (progress%, mastery%, chart data, char aggregation,
sorted lists, group props builders). `practice-stats.ts` mixes stores + loaders + session lifecycle.
This makes both files hard to maintain and impossible to reuse computations elsewhere.

## Goal

Clean separation: raw stats loading → pure computation → reactive state → UI consumption.

## Architecture: 3 Layers

```
┌─────────────────────────────────────────────────────┐
│  Pages (App.svelte, Practice.svelte)                │
│  Import stats object, bind to components            │
├─────────────────────────────────────────────────────┤
│  State: stats-store.ts                              │
│  Single reactive stats object, computed via $derived │
│  from raw stores + dataset groups                   │
├─────────────────────────────────────────────────────┤
│  Pure functions: std/kind/chinese/stats.ts           │
│  All derivation logic, zero imports, fully testable │
├─────────────────────────────────────────────────────┤
│  Existing: statsService → statsRepo → IDB/Supabase  │
└─────────────────────────────────────────────────────┘
```

### Layer 1: Pure computation functions (`lib/app/std/kind/chinese/stats.ts`)

Extends the existing file (which already has `uniqueChars` and `calcStats`).

Uses existing types — no redeclaration:
- Input: `ChineseGroup[]` from `api/data/kind/chinese/Dataset.ts`
- Input: `StatsMap`, `SessionsMap`, `DailyActivityMap` from `api/types.ts`
- Output: new types added to `api/data/kind/chinese/Dataset.ts` (ChineseCharData, ChinesePracticedItem, ChartData)

```ts
// Dataset-level
progress(groups: ChineseGroup[], statsMap: StatsMap): number
mastery(groups: ChineseGroup[], statsMap: StatsMap): number
practicedCount(groups: ChineseGroup[], statsMap: StatsMap): number

// Group-level
groupProgress(group: ChineseGroup, statsMap: StatsMap): number
groupMastery(group: ChineseGroup, sessionsMap: SessionsMap): number

// Chars
charsData(groups: ChineseGroup[], stroke: StatsMap, pinyin: StatsMap): ChineseCharData[]

// Lists
practicedItems(groups: ChineseGroup[], stats: StatsMap): ChinesePracticedItem[]
practicedGroupsSorted(groups: ChineseGroup[], sessions: SessionsMap): ChineseGroup[]

// Chart
chartData(items: ChinesePracticedItem[], daily: DailyActivityMap): ChartData | null
```

Each function is small, focused, independently testable.

See full architecture diagram: [0007-arch-stats-layer.md](./0007-arch-stats-layer.md)

### Layer 2: Reactive stats store (`lib/app/state/stats-store.ts`)

Replaces the ~200 lines in App.svelte. Single reactive object derived from raw stores + groups.

```ts
// createDatasetStats(groups, isAuthenticated) → reactive object
// Uses Svelte 5 $derived to compose pure functions with store values

export function createDatasetStats(groups, auth, rawStores) {
  // All derivations use $derived calling into compute.ts
  const progress = $derived(computeProgress(groups, $rawStores.statsStroke))
  const mastery = $derived(computeMastery(groups, $rawStores.statsStroke))
  // ... etc
  return { progress, mastery, ... }
}
```

This is where reactive wiring lives — but logic stays in `std/kind/chinese/stats.ts`.

### Layer 3: Raw stats (existing, minor refactor)

Split current `practice-stats.ts` into:
- `stats-raw.ts` — stores + loaders (datasetStats, datasetStatsStroke, load functions)
- `stats-session.ts` — session lifecycle (startGroupSession, endGroupSession, recordWordAttempt)

These stay largely as-is, just split for clarity.

## Data Flow

```
User practices → session lifecycle (stats-session.ts)
                    ↓ updates
              Raw stores (stats-raw.ts)
                    ↓ reactive
              Derived stats (stats-store.ts using compute.ts)
                    ↓ props
              Components (Hero, Groups, PracticedWords, etc.)
```

## What Changes in App.svelte

Before: ~200 lines of `$derived.by(() => { ... })` computing stats inline.
After: import one stats object, pass its fields as component props.

```svelte
<script>
  // Before: 20+ $derived blocks computing stats
  // After:
  const stats = createDatasetStats(filteredGroups, $isAuthenticated, rawStores)
</script>

<Hero strokeProgress={stats.strokeProgress} ... />
```

## Raw Input Data (existing)

group:word → { successCount, errorCount, lastPracticedAt }
group → { total, full, lastPracticedAt, lastFullSessionAt }
daily → { count, durationMs, sessions }

## Computed Stats Output (full catalog)

**Dataset-level:**
- groupCount, wordCount, uniqueCharsCount
- per practice type (stroke, pinyin, merged): practicedCount, progress, mastery

**Group-level:**
- per group × practice type: progress, mastery, sessions count

**Chars (chinese):**
- per char: wordCount, stroke stats, pinyin stats, lastPracticedAt, practiced

**Lists:**
- practicedItems: sorted by lastPracticedAt desc
- practicedGroups: sorted by lastPracticedAt desc

**Chart (30 days):**
- daily bars { date, count }
- cumulative unique words line

## File Structure

```
lib/app/
  std/
    kind/
      chinese/
        stats.ts       ← pure functions, all derivation logic (chinese-specific)
  state/
    stats-store.ts     ← reactive $derived layer, composes pure functions
    stats-raw.ts       ← raw stores + loaders (from practice-stats.ts)
    stats-session.ts   ← session lifecycle (from practice-stats.ts)
```

## Key Principles

1. **`std/kind/chinese/stats.ts` has zero imports** — just types + pure functions
2. **`stats-store.ts` is the only place mixing reactivity + computation**
3. **App.svelte becomes thin** — just wiring stats → component props
4. **Testable** — pure functions can be unit tested with plain data, no svelte runtime needed
5. **Extensible** — new kinds get their own `std/kind/{kind}/stats.ts`

