<script>
  import { goto } from '$app/navigation'
  import { ps } from '@stt/kind/chinese/practice-stats.js'
  import { sttDataset } from '@stt/dataset.svelte.js'
  import { compositeKey } from '@dom/dataset'
  import { buildPracticedItems, buildChartData } from '@std/kind/chinese/stats'
  import PracticedWords from '@uic/practiced-words.svelte'
  import GroupItemChinese from '@uic/kind/chinese/group-item.svelte'
  import WordCardChinese from '@uic/kind/chinese/word-card.svelte'
  import Modal from '@std/ui/modal.svelte'

  const practicedItems = $derived(buildPracticedItems(sttDataset.filtered, $ps.datasetStats))
  const totalCount = $derived(sttDataset.filtered.reduce((sum, g) => sum + g.items.length, 0))
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
      <GroupItemChinese item={entry.item} strokeStat={$ps.datasetStatsStroke.get(compositeKey(entry.group.id, entry.item.id))} pinyinStat={$ps.datasetStatsPinyin.get(compositeKey(entry.group.id, entry.item.id))} onclick={() => openWord(entry.item)} />
    {/snippet}
  </PracticedWords>

  {#if modalOpen && activeWord}
    <Modal onclose={closeModal}>
      <WordCardChinese item={activeWord} onClose={closeModal} />
    </Modal>
  {/if}
</main>
