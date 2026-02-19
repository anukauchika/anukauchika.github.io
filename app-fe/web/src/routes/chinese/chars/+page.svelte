<script>
  import { goto } from '$app/navigation'
  import { ps } from '@stt/kind/chinese/practice-stats.js'
  import { sttDataset } from '@stt/dataset.svelte.js'
  import { calcStats, buildPracticedCharsData } from '@std/kind/chinese/stats'
  import PracticedChars from '@uic/practiced-chars.svelte'

  const stats = $derived(calcStats(sttDataset.filtered))
  const uniqueChars = $derived(stats.chars)
  const practicedCharsData = $derived(buildPracticedCharsData(sttDataset.filtered, $ps.datasetStatsStroke, $ps.datasetStatsPinyin))
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
