<script>
  import { goto } from '$app/navigation'
  import { datasetId, currentDataset } from '@app/state/registry.js'
  import { datasetStats, datasetStatsStroke, datasetStatsPinyin, loadDatasetStatsAll } from '@app/state/kind/chinese/practice-stats.js'
  import { mainSearch, mainTags, mainGroups } from '@app/state/filters.js'
  import { isAuthenticated, dbVersion } from '@app/state/auth.js'
  import { buildPracticedItems, buildChartData } from '@app/std/kind/chinese/stats'
  import { filterGroups } from '@app/std/dataset'
  import PracticedWords from '@app/ui/PracticedWords.svelte'
  import GroupItemChinese from '@app/ui/chinese/GroupItem.svelte'
  import GroupItemEnglish from '@app/ui/english/GroupItem.svelte'
  import WordCardChinese from '@app/ui/chinese/WordCard.svelte'
  import WordCardEnglish from '@app/ui/english/WordCard.svelte'
  import Modal from '@std/ui/Modal.svelte'

  const groups = $derived.by(() => $currentDataset?.data?.groups ?? [])
  const searchFields = $derived($currentDataset?.data?.search || [])
  const filteredGroups = $derived(filterGroups(groups, $mainSearch, $mainTags, $mainGroups, searchFields))
  const practicedItems = $derived(buildPracticedItems(filteredGroups, $datasetStats))
  const totalCount = $derived(filteredGroups.reduce((sum, g) => sum + g.items.length, 0))
  const chartData = $derived(buildChartData(practicedItems, new Map()))

  let activeWord = $state(null)
  let modalOpen = $state(false)

  const openWord = (item) => { activeWord = item; modalOpen = true }
  const closeModal = () => { modalOpen = false; activeWord = null }
</script>

<svelte:head>
  <title>Practiced Words - Anuka Uchika</title>
</svelte:head>

<main class="anuka-page">
  <PracticedWords
    items={practicedItems}
    {chartData}
    practicedCount={practicedItems.length}
    {totalCount}
    onclose={() => goto('/chinese/')}
  >
    {#snippet itemSnippet(entry)}
      {#if $currentDataset?.kind === 'chinese'}
        <GroupItemChinese item={entry.item} strokeStat={$datasetStatsStroke.get(`${entry.group.group}::${entry.item.id}`)} pinyinStat={$datasetStatsPinyin.get(`${entry.group.group}::${entry.item.id}`)} onclick={() => openWord(entry.item)} />
      {:else if $currentDataset?.kind === 'english'}
        <GroupItemEnglish item={entry.item} onclick={() => openWord(entry.item)} />
      {/if}
    {/snippet}
  </PracticedWords>

  {#if modalOpen && activeWord}
    <Modal onclose={closeModal}>
      {#if $currentDataset?.kind === 'chinese'}
        <WordCardChinese item={activeWord} onClose={closeModal} />
      {:else if $currentDataset?.kind === 'english'}
        <WordCardEnglish item={activeWord} onClose={closeModal} />
      {/if}
    </Modal>
  {/if}
</main>
