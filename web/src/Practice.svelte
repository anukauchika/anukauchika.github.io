<script>
  import { onMount } from 'svelte'
  import { datasetId, currentDataset, setDatasetById } from './state/registry.js'
  import { formatGroup } from './utils/format.js'
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

  const getInitialGroup = () => {
    const value = Number(getSearchParams().get('group'))
    return Number.isFinite(value) && value > 0 ? value : 1
  }

  let groupFilter = $state(getInitialGroup())
  const groups = $derived.by(() => $currentDataset?.data?.groups ?? [])

  const updateUrl = () => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    url.searchParams.set('group', String(groupFilter))
    if ($datasetId) url.searchParams.set('dataset', $datasetId)
    window.history.replaceState({}, '', url)
  }

  $effect(() => {
    updateUrl()
  })

  const activeGroup = $derived.by(() =>
    groups.find((g) => g.group === Number(groupFilter)) || groups[0]
  )

  const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, '') || ''
  const basePath = $derived.by(() => `${baseUrl}/${$currentDataset.kind}`)
</script>

<main>
  {#if activeGroup}
    <PracticeChinese group={activeGroup} datasetId={$datasetId} />
  {/if}

  <header class="practice-header">
    <div class="header-top">
      <a class="back-link" href="{basePath}/?dataset={$datasetId}">Back to browser</a>
    </div>
    <h1>Stroke Practice</h1>
    <div class="header-controls">
      <label>
        Group
        <select bind:value={groupFilter}>
          {#each groups as g}
            <option value={g.group}>{formatGroup(g.group)}</option>
          {/each}
        </select>
      </label>
    </div>
    {#if activeGroup}
      <div class="group-meta">
        <span class="group-title">{formatGroup(activeGroup.group)}</span>
        <span class="group-tags">
          {#each activeGroup.tags as tag}
            <span>#{tag}</span>
          {/each}
        </span>
        <span class="item-count">{activeGroup.items.length} words</span>
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
    padding: 2rem 2.5rem;
    border-radius: 28px;
    box-shadow: var(--shadow);
    border: 1px solid rgba(31, 111, 92, 0.08);
  }

  .header-top {
    margin-bottom: 1rem;
  }

  .back-link {
    text-decoration: none;
    color: var(--accent);
    font-weight: 600;
    font-size: 0.9rem;
  }

  .back-link:hover {
    text-decoration: underline;
  }

  h1 {
    font-family: var(--font-serif);
    font-size: 2.2rem;
    margin: 0 0 1.2rem;
  }

  .header-controls {
    display: flex;
    gap: 1rem;
    align-items: end;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: var(--muted);
  }

  select {
    border: 1px solid rgba(31, 111, 92, 0.3);
    background: #fffdf7;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    font-size: 1rem;
    color: var(--ink);
    outline: none;
  }

  select:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(31, 111, 92, 0.2);
  }

  .group-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: 1.2rem;
    flex-wrap: wrap;
  }

  .group-title {
    font-size: 1.1rem;
    font-weight: 700;
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
</style>
