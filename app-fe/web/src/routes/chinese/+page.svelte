<script>
  import { sttDataset } from '@stt/dataset.svelte.js'
  import { sttStats } from '@stt/kind/chinese/stats.svelte.js'
  import { svcStats } from '@svc/kind/chinese/stats'
  import { sttAuth } from '@stt/auth.svelte.js'
  import { buildProps as buildCompactProps } from '@uic/kind/chinese/compact-group-list'
  import { buildProps as buildFullProps } from '@uic/kind/chinese/group-item'
  import CompactGroupList from '@uic/kind/chinese/compact-group-list.svelte'
  import WordCardChinese from '@uic/kind/chinese/word-card.svelte'
  import Groups from '@uic/groups'
  import Modal from '@std/ui/modal.svelte'
  import Island from '@std/ui/island.svelte'
  import Dataset from '@routes/chinese/dataset.svelte'

  const basePath = $derived.by(() => `/${sttDataset.current.kind}`)

  const reloadStats = () => {
    if (sttDataset.id) {
      svcStats.loadWordProgressAll(sttDataset.id)
      svcStats.loadGroupProgressAll(sttDataset.id)
      svcStats.loadDayProgressAll(sttDataset.id)
    }
  }

  $effect(() => {
    sttAuth.dbVersion
    if (sttDataset.id) reloadStats()
  })

  $effect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') reloadStats()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  })

  let activeWord = $state(null)
  let modalOpen = $state(false)
  let activeStat = $state(null)

  const openWord = (item) => {
    activeWord = item
    modalOpen = true
  }

  const closeModal = () => {
    modalOpen = false
    activeWord = null
  }

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
  <title>Anuka Uchika - Chinese</title>
  <meta
    name="description"
    content="HSK Chinese characters with stroke & pinyin drill, focused word groups, stats-driven repetition and progress tracking"
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
    {#snippet compact()}
      <CompactGroupList groups={sttDataset.filtered.map((g) => buildCompactProps(g, groupCtx))} />
    {/snippet}
  </Groups>

  {#if activeStat}
    <Modal onclose={() => (activeStat = null)}>
      <Island>
        <div class="anuka-stack anuka-center" role="dialog" aria-modal="true">
          {#if activeStat === 'words'}
            <div>Total number of words in the filtered dataset.</div>
          {/if}
        </div>
      </Island>
    </Modal>
  {/if}

  {#if modalOpen && activeWord}
    <Modal onclose={closeModal}>
      <WordCardChinese item={activeWord} onClose={closeModal} />
    </Modal>
  {/if}
</main>
