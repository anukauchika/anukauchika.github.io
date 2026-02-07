# Per-Practice-Type Progress

## Problem

Currently all practice types (stroke, pinyin) are merged into a single progress bar and single stats view. User cannot see how much of the dataset they've covered via each practice mode separately.

## Goal

Show separate stats per practice type across all views so the user can track coverage independently.

## Scope

### In scope
- Separate progress bar for stroke practice (green, existing style)
- Separate progress bar for pinyin practice (yellow, new style)
- Both global (hero section) and per-group progress bars
- Practiced Words page: per-word stats split by practice type
- Practiced Chars page: per-char stats split by practice type
- Practiced Groups page: already has stroke/pinyin actions, add split progress bars
- Stats aggregation split by practice type in stores

### Out of scope (future)
- Translation practice mode + its progress line
- Changes to activity calendar (stays unified/merged)
- Changes to the 30-day chart on practiced words page (stays merged)

## UI

### Hero section (under dataset title)
```
[===green stroke progress=========----------]  (word coverage + mastery)
[====yellow pinyin progress====--------------]  (word coverage + mastery)
```

### Per-group card & compact row
```
[===green stroke progress=========----------]
[====yellow pinyin progress====--------------]
```

### Practiced Words page
Each word shows split stats:
```
M | N  - stroke      (successCount | errorCount)
X | Y  - pinyin      (successCount | errorCount)
```

### Practiced Chars page
Each char shows split stats:
```
M | N  - stroke
X | Y  - pinyin
```

## Data

Raw data already stores `practice_type` per group session (IDB + Supabase). Change is in how in-memory stores aggregate — split by practice type instead of merging.
