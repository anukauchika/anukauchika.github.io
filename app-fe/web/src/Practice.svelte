<script>
  import { onMount } from 'svelte'
  import { datasetId, currentDataset, setDatasetById } from './state/registry.js'
  import { formatGroup } from './utils/format.js'
  import { loadDatasetGroupSessions, datasetGroupSessions } from './state/practice-stats.js'
  import { isAuthenticated } from './state/auth.js'
  import Island from './components/core/Island.svelte'
  import IslandTitle from './components/core/IslandTitle.svelte'
  import Tags from './components/core/Tags.svelte'
  import PracticeChinese from './kind/chinese/Practice.svelte'
  import PracticePinyin from './kind/chinese/PracticePinyin.svelte'

  const getSearchParams = () => {
    if (typeof window === 'undefined') return new URLSearchParams()
    return new URLSearchParams(window.location.search)
  }

  const practiceType = getSearchParams().get('type') || 'stroke'

  onMount(() => {
    const params = getSearchParams()
    const requested = params.get('dataset')
    if (requested) setDatasetById(requested)
  })

  $effect(() => {
    if ($datasetId) {
      loadDatasetGroupSessions($datasetId, practiceType)
    }
  })

  const groupStats = $derived.by(() =>
    activeGroup ? $datasetGroupSessions.get(activeGroup.group) : null
  )

  const groupId = $derived.by(() => {
    const value = Number(getSearchParams().get('group'))
    return Number.isFinite(value) && value > 0 ? value : 1
  })

  const groups = $derived.by(() => $currentDataset?.data?.groups ?? [])

  const activeGroup = $derived.by(() =>
    groups.find((g) => g.group === groupId) || groups[0]
  )

  const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, '') || ''
  const basePath = $derived.by(() => $currentDataset?.kind ? `${baseUrl}/${$currentDataset.kind}` : null)

  const headerTitle = practiceType === 'pinyin' ? 'Pinyin Practice' : 'Stroke Practice'
</script>

<main class="anuka-page">
  {#if activeGroup}
    {@const from = getSearchParams().get('from')}
    {@const backUrl = `${basePath ?? baseUrl}/?dataset=${$datasetId}${from ? `&from=${from}` : ''}`}
    {#if practiceType === 'pinyin'}
      <PracticePinyin group={activeGroup} datasetId={$datasetId} translationField={$currentDataset?.data?.to} {backUrl} />
    {:else}
      <PracticeChinese group={activeGroup} datasetId={$datasetId} translationField={$currentDataset?.data?.to} {backUrl} />
    {/if}
  {/if}

  <Island>
    <IslandTitle level={1}>{headerTitle}</IslandTitle>
    {#if activeGroup}
      <div class="anuka-row anuka-center">
        <span class="anuka-sm anuka-mute">{formatGroup(activeGroup.group)}</span>
        {#if activeGroup.tags?.length}
          <Tags tags={activeGroup.tags} />
        {/if}
        <span class="anuka-sm anuka-mute">{activeGroup.items.length} words</span>
        {#if $isAuthenticated && groupStats}
          <span class="anuka-sm anuka-main">{groupStats.total} passes ({groupStats.full} full)</span>
        {/if}
      </div>
    {/if}
  </Island>
</main>

