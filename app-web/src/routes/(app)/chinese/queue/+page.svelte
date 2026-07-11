<script lang="ts">
  import { goto } from '$app/navigation'
  import { sttDataset } from '@stt/dataset.svelte.js'
  import { sttStats } from '@stt/kind/chinese/stats.svelte.js'
  import { sttAuth } from '@stt/auth.svelte.js'
  import { svcStats } from '@svc/kind/chinese/stats'
  import type { ChineseGroup } from '@dom/kind/chinese/dataset'
  import type { GroupProgress } from '@dom/stats'
  import { calcTypeReview } from '@std/kind/chinese/stats'
  import Island from '@std/ui/island.svelte'
  import BtnIcon from '@std/ui/btn-icon.svelte'

  type DrillType = 'stroke' | 'pinyin'

  interface QueueItem {
    group: ChineseGroup
    type: DrillType
    state: 'new' | 'repeat' | 'due' | 'upcoming'
    dueAt: number
    lastFullAt: number
    href: string
  }

  interface QueueSection {
    key: string
    label: string
    items: QueueItem[]
    sortAt: number
  }

  const DAY_MS = 24 * 60 * 60 * 1000
  const typePath: Record<DrillType, string> = { stroke: 'hanzi', pinyin: 'pinyin' }
  const typeLabel: Record<DrillType, string> = { stroke: 'Writing', pinyin: 'Pinyin' }

  let queueLoaded = $state(false)

  function dayStart(ts = Date.now()): number {
    const d = new Date(ts)
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }

  function sectionInfo(item: QueueItem): { key: string; label: string; sortAt: number } {
    if (item.state === 'repeat' || item.state === 'due') return { key: 'today', label: 'Today', sortAt: 0 }

    const today = dayStart()
    const dueDay = dayStart(item.dueAt)
    const days = Math.round((dueDay - today) / DAY_MS)
    if (days === 0) return { key: 'later-today', label: 'Later today', sortAt: 0.5 }
    if (days === 1) return { key: 'tomorrow', label: 'Tomorrow', sortAt: 1 }
    return { key: `in-${days}`, label: `In ${days}d`, sortAt: days }
  }

  function addItem(
    items: QueueItem[],
    group: ChineseGroup,
    type: DrillType,
    progress: GroupProgress | undefined,
  ): void {
    const review = calcTypeReview(progress)
    if (review.state === 'new') return
    const href = `/chinese/drill/${typePath[type]}/?group=${group.id}&dataset=${sttDataset.id}&from=queue&source=queue`
    items.push({
      group,
      type,
      state: review.state,
      dueAt: review.dueAt,
      lastFullAt: progress?.lastFullDrillAt ? new Date(progress.lastFullDrillAt).getTime() : 0,
      href,
    })
  }

  function addStarterItem(items: QueueItem[], group: ChineseGroup, type: DrillType): void {
    items.push({
      group,
      type,
      state: 'new',
      dueAt: 0,
      lastFullAt: 0,
      href: `/chinese/drill/${typePath[type]}/?group=${group.id}&dataset=${sttDataset.id}&from=queue&source=queue`,
    })
  }

  const queueSections = $derived.by(() => {
    const items: QueueItem[] = []
    for (const group of sttDataset.groups as ChineseGroup[]) {
      addItem(items, group, 'stroke', sttStats.groupProgressStroke.get(group.id))
      addItem(items, group, 'pinyin', sttStats.groupProgressPinyin.get(group.id))
    }

    // A fresh account has no review state yet. Seed its otherwise-empty queue
    // with both lessons from the first vocabulary group.
    const firstGroup = sttDataset.groups[0] as ChineseGroup | undefined
    if (items.length === 0 && firstGroup) {
      addStarterItem(items, firstGroup, 'stroke')
      addStarterItem(items, firstGroup, 'pinyin')
    }

    items.sort((a, b) => {
      const rank = (item: QueueItem) => (item.state === 'repeat' ? 0 : item.state === 'due' ? 1 : 2)
      const rankDiff = rank(a) - rank(b)
      if (rankDiff !== 0) return rankDiff
      if (a.state === 'repeat' && b.state === 'repeat' && a.lastFullAt !== b.lastFullAt) {
        return b.lastFullAt - a.lastFullAt
      }
      if (a.dueAt !== b.dueAt) return a.dueAt - b.dueAt
      if (a.group.id !== b.group.id) return a.group.id - b.group.id
      return a.type === 'stroke' ? -1 : 1
    })

    const sections = new Map<string, QueueSection>()
    for (const item of items) {
      const info = sectionInfo(item)
      const section = sections.get(info.key) ?? { ...info, items: [] }
      section.items.push(item)
      sections.set(info.key, section)
    }

    return [...sections.values()].sort((a, b) => a.sortAt - b.sortAt)
  })

  const totalQueued = $derived(queueSections.reduce((sum, section) => sum + section.items.length, 0))

  // Not keyed on sttAuth.dbVersion — see the same note on the main page's effect.
  $effect(() => {
    const datasetId = sttDataset.id
    const isAuthenticated = sttAuth.isAuthenticated
    const groupCount = sttDataset.groups.length

    if (!isAuthenticated) {
      queueLoaded = true
      return
    }
    if (!datasetId || groupCount === 0) {
      queueLoaded = false
      return
    }

    let cancelled = false
    queueLoaded = false
    svcStats
      .loadGroupProgressAll(datasetId)
      .catch((err) => console.error('queue progress load failed:', err))
      .finally(() => {
        if (!cancelled) queueLoaded = true
      })

    return () => {
      cancelled = true
    }
  })
</script>

<svelte:head>
  <title>Drill Queue - Anuka Uchika</title>
</svelte:head>

<main class="anuka-page">
  <Island sticky>
    <div class="anuka-row anuka-justify">
      <h3>
        Drill Queue |
        {#if sttAuth.isAuthenticated && !queueLoaded}
          <span class="anuka-mute">...</span> due
        {:else}
          <span class={sttStats.dueCount > 0 ? 'anuka-warn' : 'anuka-main'}>{sttStats.dueCount}</span> due
        {/if}
      </h3>
      <BtnIcon icon="close" label="Close" onclick={() => goto('/chinese/')} />
    </div>
  </Island>

  {#if !sttAuth.isAuthenticated}
    <Island>
      <p class="anuka-mute anuka-center">Log in to see your drill queue.</p>
    </Island>
  {:else if !queueLoaded}
    <Island>
      <div class="queue-loading" aria-busy="true" aria-label="Loading drill queue">
        <div class="queue-loading-head"></div>
        <div class="queue-loading-row"></div>
        <div class="queue-loading-row short"></div>
        <div class="queue-loading-row"></div>
      </div>
    </Island>
  {:else if totalQueued === 0}
    <Island>
      <p class="anuka-mute anuka-center">No scheduled drills yet.</p>
    </Island>
  {:else}
    {#each queueSections as section (section.key)}
      <Island>
        <div class="anuka-stack">
          <div class="anuka-row anuka-justify">
            <h3>{section.label}</h3>
            <span class="anuka-mute anuka-sm">{section.items.length}</span>
          </div>

          <div class="anuka-stack anuka-compact">
            {#each section.items as item (`${item.group.id}-${item.type}`)}
              <a class="anuka-row anuka-justify anuka-btn" href={item.href}>
                <span class="anuka-row anuka-compact">
                  <span>{item.group.displayId}</span>
                  <span class="anuka-mute">{typeLabel[item.type]}</span>
                </span>
                <span
                  class="anuka-badge anuka-sm"
                  class:anuka-warn={item.state !== 'upcoming'}
                  class:anuka-mute={item.state === 'upcoming'}
                >
                  {item.state}
                </span>
              </a>
            {/each}
          </div>
        </div>
      </Island>
    {/each}
  {/if}
</main>

<style>
  .queue-loading {
    display: flex;
    flex-direction: column;
    gap: 0.7rem;
  }

  .queue-loading-head,
  .queue-loading-row {
    overflow: hidden;
    border-radius: 999px;
    background: color-mix(in srgb, var(--anuka-color-text) 10%, transparent);
    position: relative;
  }

  .queue-loading-head {
    width: 7rem;
    height: 1rem;
  }

  .queue-loading-row {
    width: 100%;
    height: 2.6rem;
  }

  .queue-loading-row.short {
    width: 78%;
  }

  .queue-loading-head::after,
  .queue-loading-row::after {
    content: '';
    position: absolute;
    inset: 0;
    transform: translateX(-100%);
    background: linear-gradient(
      90deg,
      transparent,
      color-mix(in srgb, var(--anuka-color-surface-raised) 74%, transparent),
      transparent
    );
    animation: queue-loading-sweep 1.15s ease-in-out infinite;
  }

  @keyframes queue-loading-sweep {
    to {
      transform: translateX(100%);
    }
  }
</style>
