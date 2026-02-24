# Plan 0014 — Spaced Repetition Scheduling

RFC: `0014-rfc-spaced-repetition.md`

## Overview

Three phases, each a single commit. Pure algorithm first, then scheduling logic,
then UI. No schema or API changes.

---

## Phase 1 — Pure algorithm functions

**Scope:** `app-web/src/6_std/kind/chinese/stats.ts`

Add the following pure functions (no state/service deps):

```typescript
// 0–1 difficulty for a single word
calcWordDifficulty(wp: WordProgress): number
  // 0.4 * error_rate + 0.7 * hint_rate, clamped [0, 1]

// avg word difficulty across all words in a group
calcGroupDifficulty(group: ChineseGroup, wordProgress: Map<WordKey, WordProgress>): number

// 2^(full-1) days, capped at 90; full=0 → Infinity
calcExpectedInterval(full: number): number

// expected * max(0.4, 1 - 0.5 * difficulty)
calcEffectiveInterval(full: number, difficulty: number): number

// elapsed_days / effectiveInterval; full=0 → Infinity
calcOverdueScore(gp: GroupProgress, effectiveInterval: number): number

// replaces sortGroupsByLastDrilled — sort desc by overdue score
sortGroupsByOverdue(
  groups: ChineseGroup[],
  groupProgress: Map<GroupId, GroupProgress>,
  wordProgress: Map<WordKey, WordProgress>,
): ChineseGroup[]
```

`sortGroupsByLastDrilled` stays for now (still used in other places), new function
is added alongside it.

---

## Phase 2 — Update scheduling logic

**Scope:** `app-web/src/2_svc/kind/chinese/drill.ts`

### Replace `pickNextDrillPure`

New logic per RFC summary:

```typescript
// Step 1: compute overdue scores for active groups (full >= 1)
// Step 2: if any score >= 1 → pick highest
// Step 3: else if new groups exist → pick group.id = max(active ids) + 1
// Step 4: else → pick highest score (least-ahead active group)
// Drill type: pick by lower full count; tiebreak by higher difficulty
```

Requires passing `wordProgress` (aggregated) to compute difficulty per group.
Update `pickNextDrillSuggestion()` to pull `sttStats.wordProgress` and forward it.

### Replace `sortByProgress`

```typescript
// word_score = successCount * (1 - difficulty * 0.5)
// sort ascending
```

Uses `calcWordDifficulty()` from `@std`.

---

## Phase 3 — Groups list UI

**Scope:**
- `app-web/src/1_uic/kind/chinese/compact-group-list.ts` — extend props
- `app-web/src/1_uic/kind/chinese/compact-group.svelte` — display new fields
- `app-web/src/routes/(app)/chinese/groups/+page.svelte` — switch sort function

### New fields on `CompactGroupProps`

```typescript
overdueScore: number       // e.g. 1.8 → 1.8× overdue
effectiveInterval: number  // days
groupDifficulty: number    // 0–1
elapsedDays: number        // days since lastFullDrillAt (or Infinity)
```

### Display in `compact-group.svelte`

Show a debug/check row below the existing content (can be styled plainly for now):

```
overdue: 1.8×   interval: 8d   difficulty: 0.42   elapsed: 14d
```

Values computable in `buildProps()` in `compact-group-list.ts` using the new
`@std` functions. Pass aggregated `wordProgress` (all drill types) from page.

### Page update

`/chinese/groups/+page.svelte`:
- Replace `sortGroupsByLastDrilled` → `sortGroupsByOverdue`
- Pass `sttStats.wordProgress` to `buildProps` (already available on the page)

---

## What doesn't change

- `CompactGroup` layout/design — only a new data row added
- IDB schema, Supabase tables, sync logic
- Stats aggregation (all inputs already computed)
- Pinyin/stroke drill components
