<script>
  import { page } from '$app/stores'
  import { ChineseDrillType } from '@dom/kind/chinese/dataset'
  import { svcDrill } from '@svc/kind/chinese/drill'
  import DrillStroke from '@uic/kind/chinese/drill/drill-stroke.svelte'

  const datasetId = $derived($page.url.searchParams.get('dataset') || '')
  const groupId = $derived(Number($page.url.searchParams.get('group')) || 1)
  const from = $derived($page.url.searchParams.get('from'))
  const backUrl = $derived(from ? `/chinese/${from}?dataset=${datasetId}` : `/chinese/?dataset=${datasetId}`)

  let drill = $state(null)

  $effect(() => {
    if (datasetId && groupId) {
      drill = null
      svcDrill.initDrill(datasetId, groupId, ChineseDrillType.Stroke).then((d) => (drill = d))
    }
  })
</script>

<svelte:head>
  <title>Stroke Drill - Anuka Uchika</title>
</svelte:head>

<main class="anuka-page">
  {#if drill}
    <DrillStroke
      group={drill.group}
      items={drill.items}
      wordProgress={drill.wordProgress}
      groupProgressStroke={drill.groupProgressStroke}
      groupProgressPinyin={drill.groupProgressPinyin}
      authenticated={drill.authenticated}
      {backUrl}
      onWordDone={(a, c) => drill.recordAttempt(a, c)}
      onDrillDone={(r) => drill.endSession(r)}
    />
  {/if}
</main>
