# RFC 0014 — Spaced Repetition Scheduling

## Context

Current scheduling is a simple round-robin: pick the group with the oldest `lastDrilledAt`.
This ignores how hard the content is and treats a group you've mastered the same as one
you keep struggling with. No forgetting curve is modeled.

Stats already collected give us everything we need to do much better.

---

## Part 1: Group Scheduling

### The core idea

The longer ago you drilled a group, the more you've forgotten. But how quickly you forget
depends on how many times you've successfully completed it — spaced repetition classic.

We assign each group an **expected interval** — how many days should ideally pass before
you revisit it. A group you've done once should come back in 1 day. A group you've done
10 times can wait 2 months.

Then we compute how **overdue** a group is relative to that expectation, and pick the
most overdue group first.

### Expected interval

Based on `full` (number of complete sessions):

| full | expected interval |
|------|------------------|
| 0    | new — only if all overdues < 1 |
| 1    | 1 day  |
| 2    | 2 days |
| 3    | 4 days |
| 4    | 8 days |
| 5    | 16 days |
| 6    | 32 days |
| 7    | 64 days |
| 8+   | 90 days (cap) |


Formula: `expected = min(2^(full - 1), 90)` days.

Each additional completed session roughly doubles the rest period, capped at 3 months.

### Overdue score

Computed **per drill type** (stroke and pinyin independently), then the **max** is taken
as the group's overdue score.

```
elapsed(type) = days since lastFullDrillAt for that type
expected(type) = min(2^(full(type) - 1), 90)
overdue(type)  = elapsed(type) / expected(type)

group_overdue_score = max(overdue(stroke), overdue(pinyin))
```

- Score = 1.0 → due right now
- Score = 2.0 → twice as overdue as expected
- Score = 0.5 → still has half the interval left (not yet due)

Using per-type scores prevents a recently completed stroke session from masking a
long-overdue pinyin session. If either type is overdue, the group surfaces.

Pick the group with the **highest group_overdue_score**. Groups that aren't due yet
(score < 1) are still candidates — they just rank lower than overdue ones.

A type with `full = 0` (never completed) has `overdue = Infinity` — it always counts
as maximally overdue for that type.

### Difficulty modifier

A group you keep making errors on should come back sooner. Compute group difficulty from
existing word stats:

```
group_difficulty = weighted average of per-word difficulty scores
  (see Part 2 for word difficulty formula)

effective_interval = expected_interval * max(0.4, 1 - 0.5 * group_difficulty)
```

- difficulty = 0 (perfect) → no change, full interval
- difficulty = 0.5 → interval shrinks to 75%
- difficulty = 1.0 (always hints/errors) → interval shrinks to 50% minimum

This means a hard group comes back roughly twice as often as an easy one at the same
repetition count.

### New groups (full = 0)

New groups are introduced into the learning context only when the review queue is clear —
i.e. when **all active groups** (full ≥ 1) have `overdue_score < 1` (none are due yet).

This prevents new material from piling on top of unfinished reviews. If you're already
behind, catch up first.

The next new group to introduce is `max(group.id of active groups) + 1` — the one
immediately following the furthest group already in the learning context.

### Summary: pick next group

```
1. Compute group_overdue_score = max(overdue(stroke), overdue(pinyin)) for all active groups
   active = groups where stroke.full ≥ 1 OR pinyin.full ≥ 1
2. If any active group has group_overdue_score ≥ 1 → pick highest score among them
3. Otherwise (all reviews are ahead of schedule):
   → if any new groups exist → pick group.id = max(active group ids) + 1
   → else → pick highest score (least-ahead active group)
```

Active group definition changes from `aggregated.full ≥ 1` to `stroke.full ≥ 1 OR pinyin.full ≥ 1`
— a group is active as soon as either drill type has been completed once.

---

## Part 2: Word Ordering Within Session

### Difficulty score per word

Uses `successCount`, `errorCount`, `hintCount` from `WordProgress`:

```
error_rate = errorCount / max(1, successCount + errorCount)
hint_rate  = hintCount  / max(1, successCount + hintCount)

difficulty = 0.4 * error_rate + 0.7 * hint_rate
  (clamped to [0, 1])
```

Hints are weighted higher than errors because requesting a hint is a direct signal
that the word isn't internalized — it's a stronger indicator of weakness than a
single stroke mistake which might be motor/typo.

### Word sort score

```
word_score = successCount * (1 - difficulty * 0.5)
```

Sort ascending by `word_score`. Effect:

- Never drilled (success=0, diff=0): score = 0 → first
- Low success + hard: score penalized down → comes earlier
- High success + easy: score high → comes later

Compared to current (sort by `successCount` only), this breaks ties toward harder words
and promotes struggling words above easier ones of similar practice count.

---

## Part 3: Drill Type Selection

Once the group is selected, pick the drill type with the **higher per-type overdue score**
— the same values already computed in Part 1.

```
pick type = argmax(overdue(stroke), overdue(pinyin))
```

This is a natural consequence of the per-type scoring: whichever type drove the group
to the top of the queue is the one that needs doing. No separate tiebreak needed.

---

## Data Used

All inputs already exist in `StatsState` / `WordProgress` / `GroupProgress`.
No new tracking needed.

| Field | Where | Used for |
|-------|-------|----------|
| `full` | `GroupProgress` (per-type) | expected interval per drill type |
| `lastFullDrillAt` | `GroupProgress` (per-type) | elapsed days per drill type |
| `successCount` | `WordProgress` | word sort score |
| `errorCount` | `WordProgress` | error_rate → difficulty |
| `hintCount` | `WordProgress` | hint_rate → difficulty |

Per-type maps available: `groupProgressStroke`, `groupProgressPinyin` in `StatsState`.

---

## Scope of Change

- `@std/kind/chinese/stats.ts` or `@svc/kind/chinese/drill.ts` — `pickNextDrill` replacement
- `@svc/kind/chinese/drill.ts` — `sortByProgress` replacement
- No schema changes, no new IDB stores, no API changes
- No UI changes in this RFC (difficulty could surface as a badge later, separate RFC)
