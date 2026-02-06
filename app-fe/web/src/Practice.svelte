<script>
  import { onMount } from 'svelte'
  import { datasetId, currentDataset, setDatasetById } from './state/registry.js'
  import { loadDatasetGroupSessions, datasetGroupSessions } from './state/practice-stats.js'
  import { isAuthenticated } from './state/auth.js'
  import PracticeChinese from './kind/chinese/Practice.svelte'

  const getSearchParams = () => {
    if (typeof window === 'undefined') return new URLSearchParams()
    return new URLSearchParams(window.location.search)
  }

  onMount(() => {
    const params = getSearchParams()
    const requested = params.get('dataset')
    if (requested) setDatasetById(requested)
  })

  $effect(() => {
    if ($datasetId) {
      loadDatasetGroupSessions($datasetId, 'stroke')
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
</script>

<main>
  {#if activeGroup}
    <PracticeChinese group={activeGroup} datasetId={$datasetId} translationField={$currentDataset?.data?.to} backUrl="{basePath ?? baseUrl}/?dataset={$datasetId}" />
  {/if}

  <header class="practice-header">
    <h1>Stroke Practice</h1>
    {#if activeGroup}
      <div class="group-meta">
        <span class="group-tags">
          {#each activeGroup.tags as tag}
            <span>#{tag}</span>
          {/each}
        </span>
        <span class="item-count">{activeGroup.items.length} words</span>
        {#if $isAuthenticated && groupStats}
          <span class="group-stats">{groupStats.total} passes ({groupStats.full} full)</span>
        {/if}
      </div>
    {/if}
  </header>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .practice-header {
    background: var(--card);
    padding: 1.5rem 2rem;
    border-radius: 20px;
    box-shadow: var(--shadow);
    border: 1px solid rgba(31, 111, 92, 0.08);
    text-align: center;
  }

  h1 {
    font-family: var(--font-serif);
    font-size: 1.8rem;
    margin: 0 0 0.5rem;
  }

  .group-meta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .group-tags {
    display: flex;
    gap: 0.5rem;
  }

  .group-tags span {
    background: rgba(244, 192, 122, 0.35);
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    font-size: 0.75rem;
    color: var(--muted);
    font-weight: 600;
  }

  .item-count {
    font-size: 0.85rem;
    color: var(--muted);
  }

  .group-stats {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--accent);
  }
</style>
