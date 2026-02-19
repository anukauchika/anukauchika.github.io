<script>
  import { goto } from '$app/navigation'
  import { sttStats } from '@stt/kind/chinese/stats.svelte.js'
  import { sttDataset } from '@stt/dataset.svelte.js'
  import { buildDrilledCharsData } from '@std/kind/chinese/stats'
  import ProgressChars from '@uic/progress-chars.svelte'

  const uniqueChars = $derived(sttStats.datasetStats.chars)
  const drilledCharsData = $derived(buildDrilledCharsData(sttDataset.filtered, sttStats.wordProgressStroke, sttStats.wordProgressPinyin))
  const drilledCharsCount = $derived(drilledCharsData.filter(c => c.drilled).length)
</script>

<svelte:head>
  <title>Progress Characters - Anuka Uchika</title>
</svelte:head>

<main class="anuka-page">
  <ProgressChars
    chars={drilledCharsData}
    drilledCount={drilledCharsCount}
    {uniqueChars}
    onclose={() => goto('/chinese/')}
  />
</main>
