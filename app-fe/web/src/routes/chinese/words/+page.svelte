<script>
  import { goto } from '$app/navigation'
  import { datasetStats, datasetStatsStroke, datasetStatsPinyin } from '@app/state/kind/chinese/practice-stats.js'
  import { filteredGroups } from '@app/state/filters.js'
  import { buildPracticedItems, buildChartData } from '@app/std/kind/chinese/stats'
  import PracticedWords from '@app/ui/practiced-words.svelte'
  import GroupItemChinese from '@app/ui/chinese/group-item.svelte'
  import WordCardChinese from '@app/ui/chinese/word-card.svelte'
  import Modal from '@std/ui/modal.svelte'

  const practicedItems = $derived(buildPracticedItems($filteredGroups, $datasetStats))
  const totalCount = $derived($filteredGroups.reduce((sum, g) => sum + g.items.length, 0))
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
      <GroupItemChinese item={entry.item} strokeStat={$datasetStatsStroke.get(`${entry.group.group}::${entry.item.id}`)} pinyinStat={$datasetStatsPinyin.get(`${entry.group.group}::${entry.item.id}`)} onclick={() => openWord(entry.item)} />
    {/snippet}
  </PracticedWords>

  {#if modalOpen && activeWord}
    <Modal onclose={closeModal}>
      <WordCardChinese item={activeWord} onClose={closeModal} />
    </Modal>
  {/if}
</main>
