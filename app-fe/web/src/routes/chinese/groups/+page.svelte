<script>
  import { goto } from '$app/navigation'
  import { datasetId, currentDataset } from '@app/state/registry.js'
  import { datasetStatsStroke, datasetStatsPinyin, datasetGroupSessions, datasetGroupSessionsStroke, datasetGroupSessionsPinyin } from '@app/state/kind/chinese/practice-stats.js'
  import { filteredGroups } from '@app/state/filters.js'
  import { isAuthenticated } from '@app/state/auth.js'
  import { sortGroupsByLastPracticed } from '@app/std/kind/chinese/stats'
  import { buildProps as buildCompactProps } from '@app/ui/chinese/CompactGroupList'
  import PracticedGroups from '@app/ui/chinese/PracticedGroups.svelte'

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
    practicedCount={practicedGroupsSorted.filter(g => $datasetGroupSessions.has(g.group)).length}
    totalCount={practicedGroupsSorted.length}
    onclose={() => goto('/chinese/')}
  />
</main>
