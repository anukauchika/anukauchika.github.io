# Plan: Per-Practice-Type Progress

Based on: `0003-req-practice-type-progress.md`

---

## Phase 1: Split stats stores

**Scope:** `web/src/state/practice-stats.js`

**Steps:**
1. Add two new stores: `datasetStatsStroke` and `datasetStatsPinyin` — same shape as `datasetStats` (`Map<"groupId::wordId", stat>`)
2. Add two new stores: `datasetGroupSessionsStroke` and `datasetGroupSessionsPinyin` — same shape as `datasetGroupSessions`
3. Rename `loadDatasetStatsAll` → keep it but also populate per-type stores during the same loop (load stroke + pinyin separately, set per-type stores, then merge into `datasetStats`)
4. Same for `loadDatasetGroupSessionsAll` — populate per-type stores alongside merged
5. Update `recordWordAttempt` — currently updates `datasetStats` (merged). Also update the correct per-type store based on session's `practice_type`. Requires reading `practice_type` from the session record (already fetched via `idb.getSessionById`)
6. Update `endGroupSession` — also update the correct per-type group sessions store

**Key point:** `datasetStats` (merged) stays for chart, activity calendar, and "Practiced" count in hero. Per-type stores are new additions, not replacements.

---

## Phase 2: Hero progress bars — split green/yellow

**Scope:** `web/src/App.svelte`, `web/src/app.css`

**Steps:**
1. Add derived states for per-type progress + mastery:
   - `strokeProgress`, `strokeMastery` — same formulas as `datasetProgress`/`datasetMastery` but using `$datasetStatsStroke`
   - `pinyinProgress`, `pinyinMastery` — same but using `$datasetStatsPinyin`
2. Replace single `.progress-bar` in hero with two bars:
   ```html
   <div class="progress-bar">...</div>           <!-- green, stroke -->
   <div class="progress-bar progress-pinyin">...</div>  <!-- yellow, pinyin -->
   ```
3. CSS: add yellow variant using `--sun` color (`#f4c07a`):
   - `.progress-bar.progress-pinyin` — background: `rgba(244, 192, 122, 0.12)`
   - `.progress-fill-words.pinyin` — background: `rgba(244, 192, 122, 0.5)`
   - `.progress-fill-mastery.pinyin` — background: `var(--sun)`
4. Adjust margins: first bar keeps `margin-top: 1.5rem`, second bar gets small `margin-top: 0.25rem`

---

## Phase 3: Per-group progress bars — split green/yellow

**Scope:** `web/src/App.svelte`, `web/src/app.css`

**Steps:**
1. Add per-type group helpers:
   - `getGroupProgressByType(group, statsStore)` — same as `getGroupProgress` but takes the per-type store
   - `getGroupMasteryByType(group, sessionsStore)` — same as `getGroupMastery` but takes per-type sessions store
2. Group card view (full): replace single `.group-progress` with two bars (green stroke + yellow pinyin)
3. Compact list view: replace single `.compact-progress` with two bars
4. Practiced groups view: replace single `.compact-progress` with two bars
5. CSS: add yellow variants for `.group-progress` and `.compact-progress` (same pattern as hero)

---

## Phase 4: GroupItem — split stat display

**Scope:** `web/src/kind/chinese/GroupItem.svelte`, `web/src/App.svelte`

**Steps:**
1. Change `GroupItem.svelte` props: replace single `stat` prop with `strokeStat` and `pinyinStat`
2. Update stat display in the word-tags section:
   ```
   strokeStat: {successCount}|{errorCount}  (green, existing .success-count style)
   pinyinStat: {successCount}|{errorCount}  (yellow/sun colored)
   ```
   Show each line only if the respective stat exists
3. CSS: add `.success-count-pinyin` style — same as `.success-count` but `color: var(--sun)` (or a slightly darker variant for readability)
4. Update all `GroupItem` call sites in `App.svelte`:
   - Group card view (line ~992): pass `strokeStat={$datasetStatsStroke.get(key)}` and `pinyinStat={$datasetStatsPinyin.get(key)}`
   - Practiced words list (line ~627): same split

---

## Phase 5: Practiced chars page — split stat display

**Scope:** `web/src/App.svelte`, `web/src/app.css`

**Steps:**
1. Update `practicedCharsData` derivation: for each char, track stroke and pinyin stats separately instead of merging:
   ```js
   { char, wordCount, stroke: { successCount, errorCount }, pinyin: { successCount, errorCount }, lastPracticedAt, practiced }
   ```
   A char is "practiced" if it has stats from either type
2. Update char tile template to show split stats:
   ```
   <span class="char-stat">{stroke.successCount}|{stroke.errorCount}</span>    <!-- green -->
   <span class="char-stat char-stat-pinyin">{pinyin.successCount}|{pinyin.errorCount}</span>  <!-- yellow -->
   ```
   Show each line only if respective count > 0
3. CSS: `.char-stat-pinyin` — `color: var(--sun)` or darker variant

---

## Phase 6: Practiced words page — split stat display

**Scope:** `web/src/App.svelte`

**Steps:**
1. Update `practicedItems` derivation: for each word, include both per-type stats:
   ```js
   { item, group, stat (merged), strokeStat, pinyinStat }
   ```
   `stat` (merged) still used for sorting by `lastPracticedAt`
2. Update practiced item template: show split counts similar to GroupItem
3. Pass split stats to `GroupItemChinese` in the practiced words list

**Key point:** Chart stays merged (out of scope). Sorting/ordering stays based on merged `lastPracticedAt`.

---

## Summary

| Phase | Scope | Key deliverable |
|-------|-------|-----------------|
| 1 | State | Per-type stores + populate alongside merged |
| 2 | Hero UI | Green + yellow progress bars |
| 3 | Group UI | Split progress bars in cards/compact/practiced groups |
| 4 | GroupItem | Split stat display per word card |
| 5 | Chars page | Split stat display per char tile |
| 6 | Words page | Split stat display in practiced words list |

---

## Dependencies

Sequential: Phase 1 → Phase 2-6 (all UI phases depend on stores being split first). Phases 2-6 are independent of each other.
