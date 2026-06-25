<script lang="ts">
  import { goto } from '$app/navigation'
  import { sttDataset } from '@stt/dataset.svelte.js'
  import { sttStats } from '@stt/kind/chinese/stats.svelte.js'
  import { sttAuth } from '@stt/auth.svelte.js'
  import type { ChineseGroup } from '@dom/kind/chinese/dataset'
  import type { GroupProgress } from '@dom/stats'
  import { calcTypeReview } from '@std/kind/chinese/stats'
  import Island from '@std/ui/island.svelte'
  import BtnIcon from '@std/ui/btn-icon.svelte'

  type DrillType = 'stroke' | 'pinyin'

  interface QueueItem {
    group: ChineseGroup
    type: DrillType
    state: 'repeat' | 'due' | 'upcoming'
    dueAt: number
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
  const typeLabel: Record<DrillType, string> = { stroke: 'Stroke', pinyin: 'Pinyin' }

  function dayStart(ts = Date.now()): number {
    const d = new Date(ts)
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }

  function sectionInfo(item: QueueItem): { key: string; label: string; sortAt: number } {
    if (item.state === 'repeat' || item.state === 'due') return { key: 'today', label: 'Today', sortAt: 0 }

    const today = dayStart()
    const dueDay = dayStart(item.dueAt)
    const days = Math.max(1, Math.round((dueDay - today) / DAY_MS))
    if (days === 1) return { key: 'tomorrow', label: 'Tomorrow', sortAt: 1 }
    return { key: `in-${days}`, label: `In ${days}d`, sortAt: days }
  }

  function addItem(items: QueueItem[], group: ChineseGroup, type: DrillType, progress: GroupProgress | undefined): void {
    const review = calcTypeReview(progress)
    if (review.state === 'new') return
    const href = `/chinese/drill/${typePath[type]}/?group=${group.id}&dataset=${sttDataset.id}&from=queue`
    items.push({ group, type, state: review.state, dueAt: review.dueAt, href })
  }

  const queueSections = $derived.by(() => {
    const items: QueueItem[] = []
    for (const group of sttDataset.groups as ChineseGroup[]) {
      addItem(items, group, 'stroke', sttStats.groupProgressStroke.get(group.id))
      addItem(items, group, 'pinyin', sttStats.groupProgressPinyin.get(group.id))
    }

    items.sort((a, b) => {
      const rank = (item: QueueItem) => item.state === 'repeat' ? 0 : item.state === 'due' ? 1 : 2
      const rankDiff = rank(a) - rank(b)
      if (rankDiff !== 0) return rankDiff
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
</script>

<svelte:head>
  <title>Drill Queue - Anuka Uchika</title>
</svelte:head>

<main class="anuka-page">
  <Island sticky>
    <div class="anuka-row anuka-justify">
      <h3>Drill Queue | <span class={sttStats.dueCount > 0 ? 'anuka-warn' : 'anuka-main'}>{sttStats.dueCount}</span> due</h3>
      <BtnIcon icon="close" label="Close" onclick={() => goto('/chinese/')} />
    </div>
  </Island>

  {#if !sttAuth.isAuthenticated}
    <Island>
      <p class="anuka-mute anuka-center">Log in to see your drill queue.</p>
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
                <span class="anuka-badge anuka-sm" class:anuka-warn={item.state !== 'upcoming'} class:anuka-mute={item.state === 'upcoming'}>
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
