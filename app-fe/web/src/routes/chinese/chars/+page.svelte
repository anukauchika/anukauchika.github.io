<script>
  import { goto } from '$app/navigation'
  import { datasetStatsStroke, datasetStatsPinyin } from '@app/state/kind/chinese/practice-stats.js'
  import { filteredGroups } from '@app/state/filters.js'
  import { calcStats, buildPracticedCharsData } from '@app/std/kind/chinese/stats'
  import PracticedChars from '@app/ui/PracticedChars.svelte'

  const stats = $derived(calcStats($filteredGroups))
  const uniqueChars = $derived(stats.chars)
  const practicedCharsData = $derived(buildPracticedCharsData($filteredGroups, $datasetStatsStroke, $datasetStatsPinyin))
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
