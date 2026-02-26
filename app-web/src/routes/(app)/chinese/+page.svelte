<script>
  import { sttDataset } from '@stt/dataset.svelte.js'
  import { sttStats } from '@stt/kind/chinese/stats.svelte.js'
  import { svcStats } from '@svc/kind/chinese/stats'
  import { sttAuth } from '@stt/auth.svelte.js'
  import { buildProps as buildCompactProps } from '@uic/kind/chinese/compact-group-list'
  import { buildProps as buildFullProps } from '@uic/kind/chinese/group-item'
  import CompactGroupList from '@uic/kind/chinese/compact-group-list.svelte'
  import FullGroup from '@uic/kind/chinese/full-group.svelte'
  import WordCardChinese from '@uic/kind/chinese/word-card.svelte'
  import Groups from '@uic/groups'
  import Modal from '@std/ui/modal.svelte'
  import Dataset from '@routes/chinese/dataset.svelte'

  const basePath = $derived.by(() => `/${sttDataset.current.kind}`)

  const reloadStats = () => {
    if (sttDataset.id) {
      svcStats.loadWordProgressAll(sttDataset.id)
      svcStats.loadDayProgressAll(sttDataset.id)
    }
  }

  $effect(() => {
    sttAuth.dbVersion
    if (sttDataset.id) reloadStats()
  })

let activeWord = $state(null)

  const groupCtx = $derived({
    basePath,
    datasetId: sttDataset.id,
    isAuthenticated: sttAuth.isAuthenticated,
    groupSessions: sttStats.groupProgress,
    groupSessionsStroke: sttStats.groupProgressStroke,
    groupSessionsPinyin: sttStats.groupProgressPinyin,
    statsStroke: sttStats.wordProgressStroke,
    statsPinyin: sttStats.wordProgressPinyin,
    wordProgress: sttStats.wordProgress,
  })
</script>

<svelte:head>
  <title>Anuka Uchika - Chinese</title>
  <meta
    name="description"
    content="HSK Chinese characters with stroke & pinyin drills, focused word groups, stats-driven repetition and progress tracking"
  />
</svelte:head>

<main class="anuka-page">
  <Dataset />

  <Groups
    groups={sttDataset.filtered.map((g) => buildFullProps(g, groupCtx))}
    viewStyle={sttDataset.prefViewMode}
    hasSearch={sttDataset.prefSearch.trim().length > 0}
    datasetId={sttDataset.id}
  >
    {#snippet full(visibleGroups)}
      {#each visibleGroups as group (group.groupId)}
        <FullGroup {...group} onItemClick={(item) => (activeWord = item)} />
      {/each}
    {/snippet}
    {#snippet compact()}
      <CompactGroupList groups={sttDataset.filtered.map((g) => buildCompactProps(g, groupCtx))} />
    {/snippet}
  </Groups>

  {#if activeWord}
    <Modal onclose={() => (activeWord = null)}>
      <WordCardChinese item={activeWord} onClose={() => (activeWord = null)} />
    </Modal>
  {/if}
</main>
