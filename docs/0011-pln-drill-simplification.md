# Plan: Drill Simplification — Clean Vertical

Implements RFC 0011. Four phases, bottom-up through the vertical.

## Phase 1: Extract codes, expand sttDrill

**Scope:** `@svc/kind/chinese/codes.ts`, `@stt/kind/chinese/drill.svelte.ts`, `@svc/kind/chinese/drill.ts`, `@svc/kind/chinese/stats.ts`

**Steps:**

1. Create `@svc/kind/chinese/codes.ts` — extract `dsCode()`, `dtCode()`, `DT_CODES` from `svcDrill`
2. Update `svcDrill` and `svcStats` to import from `codes.ts`, remove their local copies
3. Expand `sttDrill` with session state fields:
   - `datasetId`, `drillType`, `groupId` — session identity
   - `items`, `currentIndex`, `completedWords`, `drilledCount`, `skippedCount`, `sessionDone` — session flow
   - `wordDelay`, `wordDelayProgress` — inter-word delay
   - Derived: `currentItem`, `currentStat`, `hanChars`, `progress`
   - Keep existing `drillId`, `wordProgress` (rename from `progress`), `nextDrill`
4. Verify app still compiles — sttDrill expansion is additive, nothing reads the new fields yet

## Phase 2: Expand svcDrill

**Scope:** `@svc/kind/chinese/drill.ts`

**Steps:**

1. Add private state: `sessionIdPromise`, `delayTimerId`, `delayAnimationId`, `delayCallback`
2. Add internal helpers:
   - `startDelay(durationMs)` — setTimeout + rAF loop updating `sttDrill.wordDelay` / `sttDrill.wordDelayProgress`, on complete calls `advanceToNext()`
   - `clearDelay()` — clears timers, resets delay state
   - `advanceToNext()` — increments `sttDrill.currentIndex`, clears delay state
   - `finishSession()` — sets `sttDrill.sessionDone = true`, if drillId exists: `datDrill.endDrill`, optimistic `sttStats.groupProgress` update, `svcSync.syncPending()`, clear drillId
3. Implement new public interface:
   - `initSession(datasetId, drillType, groupId)` — calls `datDrill.getGroupWordsProgress`, sets `sttDrill.wordProgress`, sorts items by successCount into `sttDrill.items`, resets all session fields
   - `completeWord(wordStartedAt, wordDoneAt, chars)` — reads `sttDrill.currentItem`, marks completed, if authenticated: lazy session creation + `datDrill.recordAttempt` + optimistic updates to `sttDrill.wordProgress` + `sttStats`, then if last word → `finishSession()`, else → `startDelay(...)` with duration based on `sttDrill.drillType`
   - `skipWord()` — marks skipped in `sttDrill.completedWords`, increments `skippedCount`, if last word → `finishSession()`, else → `advanceToNext()`
   - `skipDelay()` — if delay active: `clearDelay()`, `advanceToNext()`
   - `restart()` — `clearDelay()`, clear `sessionIdPromise`, re-sort items by `sttDrill.wordProgress`, reset all session fields
4. Keep old interface (`startDrill`, `endDrill`, `recordAttempt`, `loadProgress`) temporarily — components still use them
5. Verify app compiles

## Phase 3: Thin down drill-pinyin.svelte

**Scope:** `@uic/kind/chinese/drill-pinyin.svelte`, `routes/chinese/drill/pinyin/+page.svelte`

**Steps:**

1. Update component props — replace current props with:
   ```ts
   let {
     item, hanChars, stat, wordDelay, wordDelayProgress,
     isAuthenticated,
     onWordComplete, onSkipWord, onSkipDelay,
   } = $props()
   ```
2. Remove from component all session-level code:
   - `rawItems`, `items`, `currentIndex`, `completedWords`, `drilledCount`, `skippedCount`, `sessionDone` — now in sttDrill
   - `sessionIdPromise`, `sessionStartedAt` — now in svcDrill
   - `startDelay`, `clearDelay`, `skipDelay`, `delayTimerId`, `delayAnimationId`, `delayCallback`, `wordDelay`, `wordDelayProgress` — now in svcDrill
   - `maybeFinishSession`, `restartSession`, `skipWord` — now in svcDrill
   - `completeWord` — replace with local `completeAllChars()` that calls `onWordComplete(wordStartedAt, doneAt, charData)`
   - Derived `progress`, `currentItem`, `currentStat` — now in sttDrill
   - Group-change `$effect` (sort + load stats) — now `svcDrill.initSession` called from route
3. Keep in component:
   - `charIndex`, `charStartedAt`, `charErrorCount`, `charData` — char-level tracking
   - `inputValue`, `feedback`, `charDoneMap`, `showHint`, `showTranslation`, `wordStartedAt` — pinyin-specific
   - `handleInput`, `advanceChar` — pinyin input validation
   - `speak()`, `focusInput()` — local utilities
   - `$effect` on `item` change → reset char state, set `wordStartedAt`
   - F1 keybinding for hint toggle
4. Remove session-level template (progress bar, tags, session complete screen) — moves to route page
5. Keep char-level template: translation, char tiles with pinyin tabs, input field (or delay progress bar when `wordDelay`), action buttons (speak, Tr, Hint, Skip)
6. Update route page:
   - Replace `onLoadGroupStats` / `onStartSession` / `onEndSession` / `onRecordAttempt` callbacks with single `$effect` calling `svcDrill.initSession`
   - Read all session state from `sttDrill.*`
   - Wire component: `onWordComplete={svcDrill.completeWord}`, `onSkipWord={svcDrill.skipWord}`, `onSkipDelay={svcDrill.skipDelay}`
   - Add session complete screen, progress bar, tag list (from old component template)
   - Restart button calls `svcDrill.restart()`
7. Test pinyin drill end-to-end: start session, complete words, skip words, delay, session complete, restart

## Phase 4: Thin down drill-stroke.svelte

**Scope:** `@uic/kind/chinese/drill-stroke.svelte`, `routes/chinese/drill/hanzi/+page.svelte`

**Steps:**

1. Same prop change as Phase 3
2. Remove same session-level code as Phase 3
3. Keep in component:
   - `charIndex`, `charStartedAt`, `charErrorCount`, `charData` — char-level tracking
   - `writer`, `quizResult`, `showHint`, `showPinyin`, `wordStartedAt`, `hintManuallySet` — stroke-specific
   - `initQuiz`, `destroyWriter`, `repeatWord` — HanziWriter lifecycle
   - Inter-char delay (1500ms between chars within a word) — stays local, uses own timer
   - `speak()` — local utility
   - `$effect` on `item` change → reset char state, destroy/reinit writer
   - Auto-hint `$effect` (enable hint for unpracticed words)
   - F1 keybinding
4. Key difference from pinyin: HanziWriter `onComplete` callback for last char calls `onWordComplete(wordStartedAt, doneAt, charData)` — the inter-word delay is then managed by svcDrill, but the inter-char delay (1500ms) stays component-local
5. Remove session-level template, keep char-level template: translation+pinyin, char tiles, canvas with delay overlay, action buttons
6. Update route page — same pattern as Phase 3 but with `drillType="stroke"` and `DrillStroke` component
7. Remove old svcDrill interface (`startDrill`, `endDrill`, `recordAttempt`, `loadProgress`) — no longer used
8. Test stroke drill end-to-end
9. Verify: both drills work, stats update correctly, sync works, session complete screen works
