# RFC: Drill Simplification — Clean Vertical

## Problem

Session state and logic leaked into UI components. Both `drill-pinyin.svelte` (452 lines) and `drill-stroke.svelte` (401 lines) manage items, word progression, delay timers, lazy session creation, auth checks, session completion. This is service + state layer work sitting in `@uic`.

Result: ~200 lines duplicated between components, business logic in wrong layer, hard to reason about.

## Solution

Move session state to `sttDrill`, session logic to `svcDrill`. Same pattern as the dataset vertical. No new abstractions — just data flowing through existing layers.

```
@dom/drill           — types (as-is)
@stt/chinese/drill   — session state (expanded)
@svc/chinese/drill   — session logic (expanded)
routes/drill/*       — assembly + template
@uic/drill-*         — char-level input only (thinned)
```

## sttDrill — expanded with session state

Currently holds only `drillId` and `progress` (25 lines). Expands to hold full session state.

```ts
class DrillState {
  // Session identity
  drillId: DrillId | null = $state(null)
  datasetId: DatasetId = $state('')
  drillType: ChineseDrillType = $state(ChineseDrillType.Stroke)
  groupId: GroupId = $state(0)

  // Per-word progress for current group (for sorting + stat display)
  wordProgress: Map<WordId, WordProgress> = $state(new Map())

  // Session flow
  items: ChineseWord[] = $state([])
  currentIndex: number = $state(0)
  completedWords: Set<number> = $state(new Set())
  drilledCount: number = $state(0)
  skippedCount: number = $state(0)
  sessionDone: boolean = $state(false)

  // Inter-word delay (managed by svcDrill timers)
  wordDelay: boolean = $state(false)
  wordDelayProgress: number = $state(100)

  // Derived
  readonly currentItem = $derived.by(...)   // items[currentIndex]
  readonly currentStat = $derived.by(...)   // wordProgress.get(currentItem.id)
  readonly hanChars = $derived.by(...)      // currentItem.word filtered to han chars
  readonly progress = $derived.by(...)      // completedWords.size / items.length * 100

  // Existing
  readonly nextDrill = $derived.by(...)
}
```

Pure reactive state. No services, no side effects. Same pattern as `sttDataset` / `sttStats`.

## svcDrill — expanded with session logic

Currently exposes raw primitives (`startDrill`, `endDrill`, `recordAttempt`). Components call these and manage orchestration themselves. New interface absorbs all orchestration.

```ts
interface DrillService {
  /** Load progress, sort items by successCount, reset session state. */
  initSession(datasetId, drillType, groupId): Promise<void>

  /**
   * Record completed word. Internally:
   * - No-op if not authenticated
   * - Lazily creates session on first call
   * - Records attempt via datDrill
   * - Optimistic update to sttDrill.wordProgress + sttStats
   * - Starts inter-word delay or finishes session
   * Delay duration: stroke=5000ms, pinyin=hanChars.length*1000ms
   */
  completeWord(wordStartedAt, wordDoneAt, chars: CharAttempt[]): Promise<void>

  /** Mark current word skipped, advance or finish. */
  skipWord(): void

  /** Clear delay timer, advance immediately. */
  skipDelay(): void

  /** Reset session, re-sort items. */
  restart(): void
}
```

### Session completion flow

Both `completeWord` and `skipWord` check after each word whether all words are done (`completedWords.size >= items.length`). When true, they call an internal `finishSession()`:

1. Sets `sttDrill.sessionDone = true`
2. If active `drillId` exists:
   - Calls `datDrill.endDrill(drillId)`
   - Optimistically updates `sttStats.groupProgress` (increment full count, update `lastFullDrillAt`)
   - Triggers `svcSync.syncPending()`
3. Clears `sttDrill.drillId`

This is the same `endDrill` logic that exists today, just triggered internally instead of via a component callback.

`completeWord` path: record attempt → if last word → `finishSession()`, else → start delay → on delay end → advance `currentIndex`.

`skipWord` path: mark skipped → if last word → `finishSession()`, else → advance `currentIndex`.

### Other internals

`completeWord` reads everything it needs from `sttDrill` — `currentItem.id`, `datasetId`, `drillType`, `groupId`, `hanChars.length`. No params needed except char-level data the service doesn't own.

Timer management (rAF + setTimeout for delay animation) lives here. Updates `sttDrill.wordDelay` and `sttDrill.wordDelayProgress`. This is a side effect, but services are the side-effect layer.

`dsCode()` / `dtCode()` — currently duplicated with `svcStats`. Extract to shared `@svc/kind/chinese/codes.ts`, both services import from there.

Lazy session promise — currently `sessionIdPromise` in each component. Moves to a private variable in svcDrill. Auth check via dynamic `import('@stt/auth.svelte.js')` stays as-is.

## UIC components — char-level only

Components shrink to only char-level interaction. They don't know about sessions, items list, or progression.

**Props (same shape for both):**

```ts
{
  item: ChineseWord           // current word to practice
  hanChars: string[]           // filtered han characters
  stat: WordProgress | null    // per-word stats (for auto-hint)
  wordDelay: boolean           // disable interaction during delay
  wordDelayProgress: number    // 0-100 for progress bar
  isAuthenticated: boolean     // show/hide stats

  onWordComplete: (startedAt: string, doneAt: string, chars: CharAttempt[]) => void
  onSkipWord: () => void
  onSkipDelay: () => void
}
```

**Component-local state (pinyin):**
`charIndex`, `charStartedAt`, `charErrorCount`, `charData`, `inputValue`, `feedback`, `charDoneMap`, `showHint`, `showTranslation`, `wordStartedAt`

**Component-local state (stroke):**
`charIndex`, `charStartedAt`, `charErrorCount`, `charData`, `writer`, `quizResult`, `showHint`, `showPinyin`, `wordStartedAt`, `hintManuallySet`

Components reset char state via `$effect` watching `item` prop change.

`speak()` stays in components — it's a 5-line browser utility, not worth abstracting.

Expected size: pinyin ~150 lines, stroke ~170 lines.

## Route pages — assembly

Route pages are entry points — they import state + services and wire everything together. They render shared template (progress bar, tags, session complete) and mount the thin char-input component.

```svelte
<!-- routes/chinese/drill/pinyin/+page.svelte -->
<script>
  // imports: sttDrill, svcDrill, sttDataset, sttAuth, svcDataset, svcStats, asChineseDataset
  // imports: DrillPinyin component

  onMount → dataset selection from URL
  $effect → svcDrill.initSession(sttDataset.id, 'pinyin', groupId)

  // derived: groupId from URL, group from dataset, backUrl
</script>

{#if sttDrill.currentItem && !sttDrill.sessionDone}
  <Island>
    <!-- close button, stat badge -->
    <DrillPinyin
      item={sttDrill.currentItem}
      hanChars={sttDrill.hanChars}
      stat={sttDrill.currentStat}
      wordDelay={sttDrill.wordDelay}
      wordDelayProgress={sttDrill.wordDelayProgress}
      isAuthenticated={sttAuth.isAuthenticated}
      onWordComplete={svcDrill.completeWord}
      onSkipWord={svcDrill.skipWord}
      onSkipDelay={svcDrill.skipDelay}
    />
  </Island>
{/if}

{#if sttDrill.sessionDone}
  <!-- session complete: drilled/skipped counts, restart/back buttons -->
{/if}

<!-- progress bar, tag list, footer island with group info -->
```

Both route pages share ~45 lines of template. This is declarative markup, not logic — acceptable for a clean vertical without extra abstraction layers.

Expected size: ~60 lines each.

## What does NOT change

- `@dom` types — `DrillId`, `WordAttempt`, `CharAttempt` unchanged
- `@dat/kind/chinese/drill` — repo interface unchanged
- `@low` / IDB schema — unchanged
- `sttStats` — unchanged
- Stats views / routes — unchanged consumers
- `pickNextDrill` logic — unchanged

## Impact

| File | Before | After |
|------|--------|-------|
| `sttDrill` | 25 lines | ~50 lines |
| `svcDrill` | 117 lines | ~150 lines |
| `drill-pinyin.svelte` | 452 lines | ~150 lines |
| `drill-stroke.svelte` | 401 lines | ~170 lines |
| Route pinyin | 89 lines | ~60 lines |
| Route hanzi | 83 lines | ~60 lines |
| `codes.ts` | (new) | ~15 lines |

**Before:** ~1170 lines, session logic scattered across UI.
**After:** ~655 lines, clean vertical — state in state, logic in service, UI renders.
