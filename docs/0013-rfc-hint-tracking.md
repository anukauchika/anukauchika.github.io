# 0013 RFC — Hint Count Tracking

## Context

Hint usage during drills is ephemeral — not persisted. Adding per-character `hint_count` tracks how many characters were practiced with hint assistance. This is a strong signal for spaced repetition: words frequently needing hints should be prioritized for review.

## Approach

Follow the existing `error_count` pattern: add `hint_count` to `CharAttempt` → `StorageCharLog` → IDB → Supabase, aggregate into `WordProgress.hintCount`.

## Types & storage

- `CharAttempt` (`0_dom/kind/chinese/drill.ts`): add `hintCount: number`
- `WordProgress` (`0_dom/stats.ts`): add `hintCount: number`
- `StorageCharLog` (`4_dat/kind/chinese/types.ts`): add `hint_count: number`

## Counting method

Only explicit user toggles count. Each time user turns hint ON = +1. Auto-hint (for unpracticed words) does not count. Examples:
- Auto-hint on, user never touches hint button → 0
- User enables hint once → 1
- User enables → disables → enables → 2

Counter `charHintCount` lives on the drill session, increments in `toggleHint()` only when toggling ON, resets per character in `resetCharState()`.

## Drill session tracking

**Both drills**: add `charHintCount: number = $state(0)` session field. In `toggleHint()`, increment when enabling: `if (!this.showHint) this.charHintCount += 1`. Reset to 0 in `resetCharState()`.

**Stroke drill** (`drill-stroke.svelte.ts`): in `onStrokeCharComplete()`, record `hintCount: this.charHintCount` when pushing to `charData`.

**Pinyin drill** (`drill-pinyin.svelte.ts`): in `submitInput()`, record `hintCount: this.charHintCount` when pushing to `charData`. For `autoComplete` chars: `hintCount: 0`.

**Optimistic update** in both drills' `completeWord()`: aggregate `hintCount` from chars into `WordProgress.hintCount`.

## Recording pipeline

- `recordAttempt()` (`4_dat/kind/chinese/drill.ts`): pass `hint_count: c.hintCount` when mapping `CharAttempt` → `StorageCharLog`
- `pushCharLogsToRemote()` (`5_low/supabase/kind/chinese/stats.ts`): include `hint_count` in Supabase upsert payload
- `restoreFromServer()`: `hint_count` comes back automatically via `select('*')`

## Stats retrieval

- `getWordProgress()` (`4_dat/kind/chinese/stats.ts`): sum `hint_count` from char logs, same pattern as `error_count`
- `getGroupWordsProgress()` (`4_dat/kind/chinese/drill.ts`): same aggregation

## Supabase migration

New migration: `alter table char_log add column hint_count smallint not null default 0;`

User runs `supabase db push`.

## IDB

No version bump needed — `hint_count` is a new property on stored objects. IndexedDB is schemaless for object properties. Existing records without `hint_count` read as `undefined`, handled by `|| 0` in aggregation.
