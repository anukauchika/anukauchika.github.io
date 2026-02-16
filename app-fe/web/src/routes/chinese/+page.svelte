<script>
  import { datasetId, currentDataset } from '@app/state/registry.js'
  import { datasetStatsStroke, datasetStatsPinyin, datasetGroupSessions, datasetGroupSessionsStroke, datasetGroupSessionsPinyin, loadDatasetStatsAll, loadDatasetGroupSessionsAll, loadDailyActivityAll } from '@app/state/kind/chinese/practice-stats.js'
  import { mainSearch, mainListViewStyle, filteredGroups } from '@app/state/filters.js'
  import { isAuthenticated, dbVersion } from '@app/state/auth.js'
  import { buildProps as buildCompactProps } from '@app/ui/chinese/CompactGroupList'
  import { buildProps as buildFullProps } from '@app/ui/chinese/GroupItem'
  import CompactGroupList from '@app/ui/chinese/CompactGroupList.svelte'
  import WordCardChinese from '@app/ui/chinese/WordCard.svelte'
  import Groups from '@app/ui/groups'
  import Modal from '@std/ui/Modal.svelte'
  import Island from '@std/ui/Island.svelte'
  import BrowseHero from './BrowseHero.svelte'

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
  <meta name="description" content="HSK Chinese characters with stroke & pinyin practice, focused word groups, stats-driven repetition and progress tracking" />
</svelte:head>

<main class="anuka-page">
  <BrowseHero
    onShowStatInfo={(stat) => activeStat = stat}
  />

  <Groups
    groups={$filteredGroups.map(g => buildFullProps(g, groupCtx))}
    viewStyle={$mainListViewStyle}
    hasSearch={$mainSearch.trim().length > 0}
    datasetId={$datasetId}
  >
    {#snippet compact()}
      <CompactGroupList groups={$filteredGroups.map(g => buildCompactProps(g, groupCtx))} />
    {/snippet}
  </Groups>

  {#if activeStat}
    <Modal onclose={() => activeStat = null}>
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
