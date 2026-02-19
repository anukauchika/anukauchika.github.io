<script>
  import { goto } from '$app/navigation'
  import { sttDataset } from '@stt/dataset.svelte.js'
  import { sttStats } from '@stt/kind/chinese/stats.svelte.js'
  import { sttAuth } from '@stt/auth.svelte.js'
  import { sortGroupsByLastDrilled } from '@std/kind/chinese/stats'
  import { buildProps as buildCompactProps } from '@uic/kind/chinese/compact-group-list'
  import ProgressGroups from '@uic/kind/chinese/progress-groups.svelte'

  const basePath = $derived.by(() => `/${sttDataset.current?.kind ?? 'chinese'}`)
  const drilledGroupsSorted = $derived(sortGroupsByLastDrilled(sttDataset.filtered, sttStats.groupProgress))

  const groupCtx = $derived({
    basePath,
    datasetId: sttDataset.id,
    isAuthenticated: sttAuth.isAuthenticated,
    groupSessions: sttStats.groupProgress,
    groupSessionsStroke: sttStats.groupProgressStroke,
    groupSessionsPinyin: sttStats.groupProgressPinyin,
    statsStroke: sttStats.wordProgressStroke,
    statsPinyin: sttStats.wordProgressPinyin,
  })
</script>

<svelte:head>
  <title>Progress Groups - Anuka Uchika</title>
</svelte:head>

<main class="anuka-page">
  <ProgressGroups
    groups={drilledGroupsSorted.map(g => buildCompactProps(g, groupCtx, 'groups'))}
    drilledCount={drilledGroupsSorted.filter(g => sttStats.groupProgress.has(g.id)).length}
    totalCount={drilledGroupsSorted.length}
    onclose={() => goto('/chinese/')}
  />
</main>
