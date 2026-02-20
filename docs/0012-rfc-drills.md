DrillPinyin component is fully self sufficient parametric component with zero deps.
It can be parametrized with a group & can conduct a fully fledged practice session.
All the external needs are done by props. Props are typed.
Not a singleton — each mount creates its own instance with independent state.

## Drill Vertical

Drill is a vertical that orchestrates the learning process.
It does not own state — it coordinates Dataset and Stats verticals via their services.

```
svcDrill   : orchestration — sort words, pick next group, manage sessions
```

`svcDrill` uses `svcDataset` and `svcStats` (services, not states) to:
- produce sorted items for a group (learning strategy: least practiced first)
- pick next drill suggestion (least recently drilled group)
- record attempts and end sessions (updates stats via svcStats)

`pickNextDrill` moves from `6_std` into the vertical — it's app learning logic, not a generic utility.

## Component Structure

```
uic/kind/chinese/drill/
  drill-pinyin.svelte    : pure ui + props
  drill-pinyin.svelte.ts : instance-based internal state & session logic

  drill-stroke.svelte
  drill-stroke.svelte.ts
```

Same props shape for both. Drill type is implicit in which component you mount.
Shared session logic (delay, advance) can be extracted to `6_std/kind/chinese/drill.ts` if duplication warrants it.

### Instance-based state

`drill-pinyin.svelte.ts` exports a class, not a singleton.
Each component mount creates its own instance — multiple independent drills can coexist.

```typescript
// drill-pinyin.svelte.ts
export class DrillPinyinSession {
  // all internal: charIndex, inputValue, feedback, delays, timers, etc.
  constructor(props: DrillPinyinProps) { ... }
}
```

```svelte
<!-- drill-pinyin.svelte -->
<script>
  import { DrillPinyinSession } from './drill-pinyin.svelte.ts'
  let { group, items, ... }: DrillPinyinProps = $props()
  const session = new DrillPinyinSession(/* props */)
</script>
```

## Props Interface

Minimal external surface — only what the component can't produce on its own.

```typescript
interface DrillPinyinProps {
  group: ChineseGroup                                      // group metadata (id, displayId, tags)
  items: ChineseWord[]                                     // pre-sorted by svcDrill (learning strategy)
  wordProgress: Map<WordId, WordProgress>                   // per-word stats (display + auto-hint)
  groupProgress: GroupProgress | null                       // session counts (total / full passes)
  backUrl: string                                           // navigation on close / done
  onWordDone: (attempt: WordAttempt, chars: CharAttempt[]) => void
  onDrillDone: (attempt: GroupAttempt) => void
}
```

`GroupAttempt` goes to `0_dom/drill.ts` alongside `WordAttempt` and `CharAttempt`:

```typescript
interface GroupAttempt {
  drilledCount: number
  skippedCount: number
}
```

Everything else is internal to the component (`drill-pinyin.svelte.ts`):
- session flow: current index, advance, delays
- character-level state: char index, char timings, error counts
- pinyin input: value, feedback flash, done map, slot matching
- ui toggles: hint, translation visibility
- HanziWriter lifecycle (stroke variant)

## Route Wiring

The route page is a thin assembly layer:

```
+page.svelte
  only talks to svcDrill
  svcDrill.initDrill(datasetId, groupId) → sorted items, wordProgress, groupProgress, group
  pass to <DrillPinyin>
  onWordDone → svcDrill.recordAttempt()
  onDrillDone → svcDrill.endSession()
```
