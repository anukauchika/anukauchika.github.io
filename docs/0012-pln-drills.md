# Plan: Drill Refactoring (RFC 0012)

## Context

DrillPinyin and DrillStroke components import singleton state (`sttDrill`) and service (`svcDrill`) directly, violating the architecture: components must be pure with no state/service imports. The refactoring makes them prop-driven and instance-based. A Drill vertical (`svcDrill`) is introduced as an orchestration service coordinating Dataset and Stats verticals.

Key principle: drill route pages only talk to `svcDrill`.

---

## Phase 1 — Domain types + svcDrill orchestration API

**Scope**: `0_dom/drill.ts`, `2_svc/kind/chinese/drill.ts`

1. Add `GroupAttempt` to `0_dom/drill.ts`
   ```typescript
   export interface GroupAttempt { drilledCount: number; skippedCount: number }
   ```

2. Add new orchestration methods to `svcDrill` alongside existing legacy methods (coexist temporarily)

   ```typescript
   interface DrillHandle {
     group: ChineseGroup
     items: ChineseWord[]                    // pre-sorted
     wordProgress: Map<WordId, WordProgress>
     groupProgress: GroupProgress | null
     authenticated: boolean
     recordAttempt(attempt: WordAttempt, chars: CharAttempt[]): Promise<void>
     endSession(result: GroupAttempt): Promise<void>
   }

   interface DrillService {
     initDrill(datasetId, groupId, drillType): Promise<DrillHandle>
     pickNextDrill(): NextDrill | null
   }
   ```

3. `initDrill` internally:
   - `svcDataset.selectDataset(datasetId)`
   - `svcStats.loadGroupProgressAll(datasetId)`
   - Gets group from dataset, loads word progress via `datDrill.getGroupWordsProgress()`
   - Sorts items by `sortByProgress()`
   - Returns `DrillHandle` with closures capturing context

4. `DrillHandle.recordAttempt` closure:
   - Lazy-creates DB session on first call
   - `datDrill.recordAttempt()`, optimistic `sttStats` update, `svcSync.syncPending()`

5. `DrillHandle.endSession` closure:
   - If `drilledCount > 0`: `datDrill.endDrill()`, update group progress, sync
   - Only skips: no-op

6. `pickNextDrill()`: absorbs logic from `6_std/kind/chinese/drill.ts`

**Verify**: old drill flow unchanged, new methods exist but not called. TS compiles.

---

## Phase 2 — DrillPinyin: session class + component + route

**Scope**: new `1_uic/kind/chinese/drill/` directory, `routes/chinese/drill/pinyin/+page.svelte`

### 2a. `drill-pinyin.svelte.ts` — DrillPinyinSession class

Instance-based, not singleton. Constructor takes props.

**State** (pinyin-relevant, from current DrillState):
- Session: items, wordProgress, currentIndex, completedWords, drilledCount, skippedCount, sessionDone, wordDelay, wordDelayProgress
- Char-level: charIndex, wordStartedAt, charStartedAt, charErrorCount, charData
- UI: showHint, showTranslation, pinyinInputValue, pinyinFeedback, charDoneMap
- Derived: currentItem, currentStat, hanChars, currentChar, pinyinSlots, progress

**Methods**: `submitInput()`, `toggleHint()`, `skipWord()`, `skipDelay()`, `speak()`, `restart()`

Key: `completeWord()` calls `this.onWordDone(attempt, chars)` — no persistence. Updates local `this.wordProgress` optimistically.

Allowed imports: `@std/kind/chinese/pinyin`, `@dom/*`. No `@svc`, `@stt`, `@dat`.

### 2b. `drill-pinyin.svelte` — prop-driven component

Receives `DrillPinyinProps` via `$props()`, creates `DrillPinyinSession`.

Component renders full self-contained drill UI including session chrome currently in route:
close button, stat badge, session-done overlay, progress bar, word tag strip.

### 2c. Route: `routes/chinese/drill/pinyin/+page.svelte`

Only imports: `$page`, `svcDrill`, `DrillPinyin`.

```svelte
let drill = $state(null)
$effect(() => {
  if (datasetId && groupId)
    svcDrill.initDrill(datasetId, groupId, 'pinyin').then(d => drill = d)
})
```

**Verify**: pinyin drill end-to-end. Hanzi still on old system.

---

## Phase 3 — DrillStroke: session class + component + route

**Scope**: `1_uic/kind/chinese/drill/drill-stroke.svelte.ts`, `drill-stroke.svelte`, `routes/chinese/drill/hanzi/+page.svelte`

Same pattern as Phase 2. Stroke-specific:
- `DrillStrokeSession`: `writer`, `showPinyin`, `strokeQuizResult`, `charDelayTimerId`
- Methods: `initStrokeQuiz()`, `destroyStrokeQuiz()`, `onStrokeCharComplete()`, `repeatWord()`
- `applyAutoHint()`: auto-hint when `successCount === 0`
- Delay: 5000ms fixed (vs pinyin's `hanChars.length * 1000`)
- `$effect` for HanziWriter lifecycle

**Verify**: both drill routes work.

---

## Phase 4 — Cleanup

**Scope**: multiple files

1. `routes/chinese/dataset.svelte`: replace `sttDrill.nextDrill` → `svcDrill.pickNextDrill()`
2. Delete:
   - `3_stt/kind/chinese/drill.svelte.ts`
   - `1_uic/kind/chinese/drill-pinyin.svelte`
   - `1_uic/kind/chinese/drill-stroke.svelte`
   - `6_std/kind/chinese/drill.ts`
3. Remove legacy methods from `svcDrill`

**Verify**: `grep -r sttDrill src/` → 0 hits. TS compiles. Full app works.

---

## Verification (each phase)

- `npm run check`
- Pinyin drill: init → practice → complete → stats update → restart
- Stroke drill: init → practice → complete → stats update → restart
- Dataset page: next drill suggestion
- Skip, hint, back navigation
