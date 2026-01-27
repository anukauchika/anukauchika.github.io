<script>
  import { onMount } from 'svelte'
  import { datasetId, currentDataset, setDatasetById } from './state/registry.js'
  import { formatGroup } from './utils/format.js'
  const givenCols = 3
  const exerciseSets = 2
  const exerciseChineseRepeats = 3
  const totalCols = givenCols + exerciseSets * 3

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

  const handlePrint = () => {
    if (typeof window !== 'undefined') window.print()
  }

  const shouldAutoPrint = () => getSearchParams().get('autoprint') === '1'

  $effect(() => {
    if (typeof window === 'undefined') return
    if (shouldAutoPrint()) {
      setTimeout(() => window.print(), 300)
    }
  })

  const renderGivenCell = (item, col) => {
    if (col === 'Chinese') return item.word
    if (col === 'Pinyin') return item.pinyin
    return item.english
  }
</script>

<main>
  <header class="sheet-header">
    <div class="group-line">
      <span class="group-title">{formatGroup(activeGroup.group)}</span>
      <span class="group-tags">
        {#each activeGroup.tags as tag}
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
            <option value={g.group}>{formatGroup(g.group)}</option>
          {/each}
        </select>
      </label>
      <button type="button" onclick={handlePrint}>Print</button>
    </div>
  </header>

  <section class="sheet">
    <div class="grid" style={`--sets:${totalCols}`}>
      {#each activeGroup.items as item}
        <div class="cell filled chinese">{renderGivenCell(item, 'Chinese')}</div>
        <div class="cell filled pinyin">{renderGivenCell(item, 'Pinyin')}</div>
        <div class="cell filled english">{renderGivenCell(item, 'English')}</div>

        {#each Array(exerciseSets) as _, setIndex}
          <div class="cell blank chinese"></div>
          <div class="cell blank pinyin"></div>
          <div class="cell blank english"></div>
        {/each}
      {/each}
    </div>
  </section>
</main>
