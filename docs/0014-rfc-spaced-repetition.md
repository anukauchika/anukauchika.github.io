# RFC 0014 - Hint-Gated Spaced Repetition

## Context

The scheduler should keep a group in immediate practice while the learner still needs
hints. A group only enters spaced repetition after a completed session has zero hint
usage.

The app records enough raw data for this:

- `group_session.done_at` marks completed sessions.
- `char_log.hint_count` records hint usage per character attempt.
- Summing `hint_count` across a session gives the session hint count.

## Scheduling Rule

Scheduling is tracked independently per practice type: stroke and pinyin.

For each `(dataset, practice_type, group_id)`:

- `lastSessionHintCount > 0` means repeat this same group/type immediately.
- `lastSessionHintCount === 0` means schedule from the latest clean session.
- A clean session is a completed session where summed hint usage is `0`.

The spacing interval doubles with clean sessions:

| clean sessions | next interval |
|----------------|---------------|
| 1              | 1 day         |
| 2              | 2 days        |
| 3              | 4 days        |
| 4              | 8 days        |

Formula:

```ts
intervalDays = 2 ** (cleanCount - 1)
dueAt = lastCleanDrillAt + intervalDays
```

There is no difficulty modifier in the scheduler. Errors and historical hints still
affect word ordering inside a session, but not the group due date.

## Main Practice Button

The picker ranks candidates in this order:

1. Active group/type whose latest completed session used hints.
2. Active group/type whose clean-session interval is due.
3. Unstarted companion practice type for an active group.
4. Next new group by id, when all active work is scheduled for the future.
5. Earliest upcoming scheduled review, when no new group exists.

Tie breakers prefer the item queued earlier, then lower group id, then stroke before
pinyin.

## Group List

The group list uses the same review priority:

- repeat/due groups first
- upcoming scheduled groups next, sorted by next due date
- untouched groups last, sorted by group id

The UI count is `due`, not `overdue`, because it includes both immediate hint repeats
and spaced reviews due now.

## Local Maintenance Summary

Raw IndexedDB stats are still cleaned up to bound storage size on phones. Before synced
raw records are deleted, maintenance compacts them into `group_schedule_summaries`.

The summary preserves the fields required for scheduling:

- `total`
- `full`
- `clean`
- `first_drilled_at`
- `last_drilled_at`
- `last_full_drill_at`
- `last_clean_drill_at`
- `last_session_hint_count`

Stats loading combines compact summaries with the remaining raw sessions, so cleanup does
not reset spacing intervals.

Server restore clears local summaries before inserting full remote history to avoid
double counting.
