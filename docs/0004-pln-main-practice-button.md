
# Plan: Main Practice Button

Two phases, each = one commit.

---

## Phase 1 — Pure function `pickNextPractice`

**Scope:** new file `app-fe/web/src/utils/pick-next-practice.js`

Create a pure function with this signature:

```js
pickNextPractice(groups, groupSessions, strokeSessions, pinyinSessions)
// groups: array of { group: number, ... } (filtered group list)
// groupSessions: Map<groupId, { full, lastPracticedAt, ... }> (merged)
// strokeSessions: Map<groupId, { full, ... }> (stroke-only)
// pinyinSessions: Map<groupId, { full, ... }> (pinyin-only)
// returns: { groupId, type: 'stroke' | 'pinyin' } | null
```

Logic:
1. Filter `groups` to those where `groupSessions.get(g.group)?.full >= 1`
2. Sort eligible by `groupSessions.get(g.group).lastPracticedAt` ascending (least recent first)
3. Pick first → `groupId`
4. Compare `strokeSessions.get(groupId)?.full ?? 0` vs `pinyinSessions.get(groupId)?.full ?? 0`
5. Pick type with fewer full sessions; tie-break → `'stroke'`
6. Return `{ groupId, type }` or `null` if no eligible groups

---

## Phase 2 — Button in App.svelte

**Scope:** `app-fe/web/src/App.svelte`

**Script:**
- Import `pickNextPractice` from `./utils/pick-next-practice.js`
- Add a `$derived` that computes `nextPractice`:
  - If authenticated: call `pickNextPractice(filteredGroups, $datasetGroupSessions, $datasetGroupSessionsStroke, $datasetGroupSessionsPinyin)`
  - If anonymous: `filteredGroups.length > 0 ? { groupId: filteredGroups[0].group, type: 'stroke' } : null`
- Derive `practiceHref` from `nextPractice`: `` `${basePath}/practice.html?group=${np.groupId}&dataset=${$datasetId}&type=${np.type}` `` or `null`

**Template — place after `</div>` of `hero-content` (line 822), before the `{#if $isAuthenticated}` block (line 823):**

```svelte
{#if practiceHref}
  <a class="practice-btn" href={practiceHref}>Practice</a>
{/if}
```

- `<a>` tag (not button) — it navigates to a different page, same as group practice links
- Only rendered when there's a valid target (hides when all groups filtered out)

**Styles:**
- `.practice-btn` — prominent inline-block link, centered, stands out from the muted hero palette
- Keep it simple: padding, border-radius, background accent color, white text, no hover animations beyond opacity
