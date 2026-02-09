
# RFC: Main Practice Button

## Context

Currently practice is initiated only from individual group cards (Stroke / Pinyin links). The requirement is a "Practice" button on the hero that auto-selects the best group + practice type based on spaced repetition logic.

## Decision Algorithm

Pure function: `pickNextPractice(groups, groupSessions, strokeSessions, pinyinSessions) -> { groupId, type } | null`

**Inputs** (all derived from existing stores, scoped to current filters):
- `groups` — filtered group list (from `filteredGroups`)
- `groupSessions` — merged `datasetGroupSessions` Map
- `strokeSessions` / `pinyinSessions` — per-type `datasetGroupSessionsStroke` / `datasetGroupSessionsPinyin` Maps

**Step 1 — Pick group:**
- Filter to groups with `full >= 1` in merged sessions (at least 1 completed session)
- Sort by `lastPracticedAt` ascending (least recent first)
- Pick the first one

**Step 2 — Pick practice type for chosen group:**
- Get stroke session count (`strokeSessions.get(groupId)?.full ?? 0`)
- Get pinyin session count (`pinyinSessions.get(groupId)?.full ?? 0`)
- Pick the type with fewer full sessions; tie-break: `stroke` wins (character writing is the primary skill)

**Returns** `{ groupId, type: 'stroke' | 'pinyin' }` or `null` if no eligible group.

**Anonymous users:** No stats available, so the pure function isn't used. Hardcoded default: first filtered group, type `stroke`. The function signature stays clean — anonymous logic is handled at the call site.

## UI

- Button visible for all users (authenticated and anonymous)
- Styled as a prominent action button
- Navigates to `practice.html` with the computed group + type params
- Authenticated: uses algo result; disabled when algo returns `null` (no groups with completed sessions)
- Anonymous: always navigates to first filtered group + stroke

## File structure

- `app-fe/web/src/utils/pick-next-practice.js` — pure function + tests-friendly
- Button markup + wiring in `App.svelte`

## Edge cases

- No groups with completed sessions → button disabled / hidden
- All groups filtered out → same as above
- Single practice type with 0 sessions → always picks the other type (which has more), but the "least used" rule naturally picks the 0-session type anyway — correct behavior
