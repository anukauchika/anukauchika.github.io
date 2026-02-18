<script>
  import { datasetId, currentDataset, search, viewMode, filteredGroups } from '@stt/dataset.js'
  import {
    datasetStatsStroke,
    datasetStatsPinyin,
    datasetGroupSessions,
    datasetGroupSessionsStroke,
    datasetGroupSessionsPinyin,
    loadDatasetStatsAll,
    loadDatasetGroupSessionsAll,
    loadDailyActivityAll,
  } from '@stt/kind/chinese/practice-stats.js'
  import { isAuthenticated, dbVersion } from '@stt/auth.js'
  import { buildProps as buildCompactProps } from '@uic/kind/chinese/compact-group-list'
  import { buildProps as buildFullProps } from '@uic/kind/chinese/group-item'
  import CompactGroupList from '@uic/kind/chinese/compact-group-list.svelte'
  import WordCardChinese from '@uic/kind/chinese/word-card.svelte'
  import Groups from '@uic/groups'
  import Modal from '@std/ui/modal.svelte'
  import Island from '@std/ui/island.svelte'
  import BrowseHero from '@routes/chinese/browse-hero.svelte'

  const basePath = $derived.by(() => `/${$currentDataset.kind}`)

  const reloadStats = () => {
    if ($datasetId) {
      loadDatasetStatsAll($datasetId)
      loadDatasetGroupSessionsAll($datasetId)
      loadDailyActivityAll($datasetId)
    }
  }

  $effect(() => {
    $dbVersion
    if ($datasetId) reloadStats()
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
  <title>Anuka Uchika - Chinese</title>
  <meta
    name="description"
    content="HSK Chinese characters with stroke & pinyin practice, focused word groups, stats-driven repetition and progress tracking"
  />
</svelte:head>

<main class="anuka-page">
  <BrowseHero />

  <Groups
    groups={$filteredGroups.map((g) => buildFullProps(g, groupCtx))}
    viewStyle={$viewMode}
    hasSearch={$search.trim().length > 0}
    datasetId={$datasetId}
  >
    {#snippet compact()}
      <CompactGroupList groups={$filteredGroups.map((g) => buildCompactProps(g, groupCtx))} />
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
