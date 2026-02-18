<script>
  import { page } from '$app/stores'
  import '@uic/workbook.css'
  import { onMount } from 'svelte'
  import { datasetId, currentDataset } from '@stt/dataset.js'
  import { datasetService } from '@svc/dataset-service'
  import WorkbookChinese from '@uic/kind/chinese/workbook.svelte'
  import WorkbookEnglish from '@uic/kind/english/workbook.svelte'

  const exerciseSets = 2

  onMount(() => {
    const requested = $page.url.searchParams.get('dataset')
    if (requested) datasetService.selectDataset(requested)
  })

  const getInitialGroup = () => {
    const value = Number($page.url.searchParams.get('group'))
    return Number.isFinite(value) && value > 0 ? value : 1
  }

  let groupFilter = $state(getInitialGroup())
  const groups = $derived.by(() => $currentDataset?.groups ?? [])

  const formatPrintDate = () => {
    const now = new Date()
    const day = String(now.getDate()).padStart(2, '0')
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = String(now.getFullYear())
    const weekday = now.toLocaleDateString('en-US', { weekday: 'short' })
    return `${day}-${month}-${year} | ${weekday}`
  }

  const printDate = formatPrintDate()

  const updateUrl = () => {
    const url = new URL(window.location.href)
    url.searchParams.set('group', String(groupFilter))
    if ($datasetId) url.searchParams.set('dataset', $datasetId)
    window.history.replaceState({}, '', url)
  }

  $effect(() => { updateUrl() })

  const activeGroup = $derived.by(() =>
    groups.find((g) => g.id === Number(groupFilter)) || groups[0]
  )

  const handlePrint = () => { window.print() }

  const shouldAutoPrint = () => $page.url.searchParams.get('autoprint') === '1'

  $effect(() => {
    if (shouldAutoPrint()) {
      setTimeout(() => window.print(), 300)
    }
  })
</script>

<svelte:head>
  <title>Workbook - Anuka Uchika</title>
</svelte:head>

<main class="workbook-page">
  <header class="sheet-header">
    <div class="group-line">
      <span class="group-title">{activeGroup?.displayId}</span>
      <span class="group-tags">
        {#each activeGroup?.tags ?? [] as tag}
          <span>#{tag}</span>
        {/each}
      </span>
      <span class="print-date">{printDate}</span>
    </div>
    <div class="header-actions">
      <label>
        Group
        <select bind:value={groupFilter}>
          {#each groups as g}
            <option value={g.id}>{g.displayId}</option>
          {/each}
        </select>
      </label>
      <button type="button" onclick={handlePrint}>Print</button>
    </div>
  </header>

  {#if $currentDataset?.kind === 'chinese'}
    <WorkbookChinese group={activeGroup} {exerciseSets} />
  {:else if $currentDataset?.kind === 'english'}
    <WorkbookEnglish group={activeGroup} {exerciseSets} />
  {/if}
</main>
