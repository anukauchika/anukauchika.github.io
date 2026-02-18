<script>
  import { goto } from '$app/navigation'
  import { datasetId, currentDataset, filteredGroups } from '@stt/dataset.js'
  import { datasetStatsStroke, datasetStatsPinyin, datasetGroupSessions, datasetGroupSessionsStroke, datasetGroupSessionsPinyin } from '@stt/kind/chinese/practice-stats.js'
  import { isAuthenticated } from '@stt/auth.js'
  import { sortGroupsByLastPracticed } from '@std/kind/chinese/stats'
  import { buildProps as buildCompactProps } from '@uic/kind/chinese/compact-group-list'
  import PracticedGroups from '@uic/kind/chinese/practiced-groups.svelte'

  const basePath = $derived.by(() => `/${$currentDataset?.kind ?? 'chinese'}`)
  const practicedGroupsSorted = $derived(sortGroupsByLastPracticed($filteredGroups, $datasetGroupSessions))

  const groupCtx = $derived({
    basePath,
    datasetId: $datasetId,
    isAuthenticated: $isAuthenticated,
    groupSessions: $datasetGroupSessions,
    groupSessionsStroke: $datasetGroupSessionsStroke,
    groupSessionsPinyin: $datasetGroupSessionsPinyin,
    statsStroke: $datasetStatsStroke,
    statsPinyin: $datasetStatsPinyin,
  })
</script>

<svelte:head>
  <title>Practiced Groups - Anuka Uchika</title>
</svelte:head>

<main class="anuka-page">
  <PracticedGroups
    groups={practicedGroupsSorted.map(g => buildCompactProps(g, groupCtx, 'groups'))}
    practicedCount={practicedGroupsSorted.filter(g => $datasetGroupSessions.has(g.id)).length}
    totalCount={practicedGroupsSorted.length}
    onclose={() => goto('/chinese/')}
  />
</main>
