<script>
  import { goto } from '$app/navigation'
  import { currentDataset } from '@app/state/registry.js'
  import { datasetStatsStroke, datasetStatsPinyin } from '@app/state/kind/chinese/practice-stats.js'
  import { mainSearch, mainTags, mainGroups } from '@app/state/filters.js'
  import { calcStats, buildPracticedCharsData } from '@app/std/kind/chinese/stats'
  import { filterGroups } from '@app/std/dataset'
  import PracticedChars from '@app/ui/PracticedChars.svelte'

  const groups = $derived.by(() => $currentDataset?.data?.groups ?? [])
  const searchFields = $derived($currentDataset?.data?.search || [])
  const filteredGroups = $derived(filterGroups(groups, $mainSearch, $mainTags, $mainGroups, searchFields))
  const stats = $derived(calcStats(filteredGroups))
  const uniqueChars = $derived(stats.chars)
  const practicedCharsData = $derived(buildPracticedCharsData(filteredGroups, $datasetStatsStroke, $datasetStatsPinyin))
  const practicedCharsCount = $derived(practicedCharsData.filter(c => c.practiced).length)
</script>

<svelte:head>
  <title>Practiced Characters - Anuka Uchika</title>
</svelte:head>

<main class="anuka-page">
  <PracticedChars
    chars={practicedCharsData}
    practicedCount={practicedCharsCount}
    {uniqueChars}
    onclose={() => goto('/chinese/')}
  />
</main>
