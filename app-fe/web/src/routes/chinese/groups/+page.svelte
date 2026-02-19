<script>
  import { goto } from '$app/navigation'
  import { sttDataset } from '@stt/dataset.svelte.js'
  import { ps } from '@stt/kind/chinese/practice-stats.js'
  import { sttAuth } from '@stt/auth.svelte.js'
  import { sortGroupsByLastPracticed } from '@std/kind/chinese/stats'
  import { buildProps as buildCompactProps } from '@uic/kind/chinese/compact-group-list'
  import PracticedGroups from '@uic/kind/chinese/practiced-groups.svelte'

  const basePath = $derived.by(() => `/${sttDataset.current?.kind ?? 'chinese'}`)
  const practicedGroupsSorted = $derived(sortGroupsByLastPracticed(sttDataset.filtered, $ps.datasetGroupSessions))

  const groupCtx = $derived({
    basePath,
    datasetId: sttDataset.id,
    isAuthenticated: sttAuth.isAuthenticated,
    groupSessions: $ps.datasetGroupSessions,
    groupSessionsStroke: $ps.datasetGroupSessionsStroke,
    groupSessionsPinyin: $ps.datasetGroupSessionsPinyin,
    statsStroke: $ps.datasetStatsStroke,
    statsPinyin: $ps.datasetStatsPinyin,
  })
</script>

<svelte:head>
  <title>Practiced Groups - Anuka Uchika</title>
</svelte:head>

<main class="anuka-page">
  <PracticedGroups
    groups={practicedGroupsSorted.map(g => buildCompactProps(g, groupCtx, 'groups'))}
    practicedCount={practicedGroupsSorted.filter(g => $ps.datasetGroupSessions.has(g.id)).length}
    totalCount={practicedGroupsSorted.length}
    onclose={() => goto('/chinese/')}
  />
</main>
