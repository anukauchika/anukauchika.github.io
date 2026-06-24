# Plan 0014 - Hint-Gated Spaced Repetition

RFC: `0014-rfc-spaced-repetition.md`

## Implemented Scope

### Domain State

`GroupProgress` carries both raw completion and scheduling fields:

- `total`
- `full`
- `clean`
- `firstDrilledAt`
- `lastDrilledAt`
- `lastFullDrillAt`
- `lastCleanDrillAt`
- `lastSessionHintCount`

`full` remains completed sessions. `clean` is the repetition level used for spacing.

### Scheduler

`@std/kind/chinese/stats.ts` exposes:

- `calcReviewInterval(cleanCount)`
- `calcTypeReview(groupProgress)`
- `calcTypeDue(groupProgress)`
- `countDueGroups(groups, strokeProgress, pinyinProgress)`
- `sortGroupsByReview(groups, strokeProgress, pinyinProgress)`

Old difficulty-adjusted overdue-score helpers were removed.

### Main Drill Picker

`@svc/kind/chinese/drill.ts` uses clean-session scheduling:

1. repeat latest hint-using group/type immediately
2. review due clean-session intervals
3. start the unstarted companion type for active groups
4. introduce next new group
5. fall back to earliest upcoming review

Session hint count is tracked during the active drill and written into optimistic
`sttStats` updates when the session ends.

### Maintenance Summary

`@low/kind/chinese/idb-stats-repo.ts` upgrades `uch-stats` to version 2 and adds
`group_schedule_summaries`.

Before deleting old synced raw records, maintenance summarizes them and merges the compact
summary into that store. Stats loading merges summaries with remaining raw sessions.

Server restore clears local summaries before inserting full remote history.

### UI

Progress and drill badges show clean session counts. The dashboard and group list show
`due` instead of `overdue`.
