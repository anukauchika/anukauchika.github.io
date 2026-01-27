<script>
  import { datasets, datasetId, currentDataset } from './state/registry.js'
  import { formatGroup } from './utils/format.js'
  import GroupItemChinese from './kind/chinese/GroupItem.svelte'
  import GroupItemEnglish from './kind/english/GroupItem.svelte'
  import WordCardChinese from './kind/chinese/WordCard.svelte'
  import WordCardEnglish from './kind/english/WordCard.svelte'

  const basePath = $derived.by(() =>
    $currentDataset?.kind === 'english' ? '/english' : '/chinese'
  )
  const groups = $derived.by(() => $currentDataset?.data?.groups ?? [])

  const allTags = $derived.by(() => {
    const tagSet = new Set()
    groups.forEach((g) => {
      g.tags?.forEach((t) => tagSet.add(t))
      g.items?.forEach((item) => item.tags?.forEach((t) => tagSet.add(t)))
    })
    return Array.from(tagSet).sort()
  })

  let query = $state('')
  let selectedTags = $state([])
  let groupFilter = $state('all')
  let activeWord = $state(null)
  let modalOpen = $state(false)

  const toggleTag = (tag) => {
    selectedTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag]
  }

  const resetFilters = () => {
    query = ''
    selectedTags = []
    groupFilter = 'all'
  }

  const normalize = (value) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

  const matchesQuery = (item) => {
    const q = query.trim()
    if (!q) return true

    const searchFields = $currentDataset?.data?.search || []
    const values = searchFields.map((field) => item[field] || '').concat(item.tags || [])
    const raw = values.join(' ')

    const hayLower = raw.toLowerCase()
    const hayNorm = normalize(raw)
    const qLower = q.toLowerCase()
    const qNorm = normalize(q)
    return hayLower.includes(qLower) || (qNorm && hayNorm.includes(qNorm))
  }

  const matchesTags = (item) => {
    if (selectedTags.length === 0) return true
    const tags = item.tags || []
    return selectedTags.every((t) => tags.includes(t))
  }

  const matchesGroup = (groupId) => {
    if (groupFilter === 'all') return true
    return Number(groupFilter) === groupId
  }

  const openWord = (item) => {
    activeWord = item
    modalOpen = true
  }

  const closeModal = () => {
    modalOpen = false
    activeWord = null
  }

  $effect(() => {
    if (!groups.some((g) => g.group === Number(groupFilter))) {
      groupFilter = 'all'
    }
  })


  const filteredGroups = $derived.by(() =>
    groups
      .filter((g) => matchesGroup(g.group))
      .map((g) => ({
        ...g,
        items: g.items.filter((item) => matchesQuery(item) && matchesTags(item)),
      }))
      .filter((g) => g.items.length > 0)
  )

  const totalCount = $derived.by(() =>
    groups.reduce((sum, g) => sum + g.items.length, 0)
  )
  const filteredCount = $derived.by(() =>
    filteredGroups.reduce((sum, g) => sum + g.items.length, 0)
  )
  const groupCount = $derived.by(() => groups.length)
</script>

<main>
  <header class="hero">
    <div class="hero-top">
      <p class="eyebrow">MEMRIS</p>
      <select class="dataset-picker" bind:value={$datasetId}>
        {#each datasets as dataset}
          <option value={dataset.id}>{dataset.name}</option>
        {/each}
      </select>
    </div>

    <div class="hero-content">
      <div>
        <h1>{$currentDataset?.name ?? 'Vocabulary'}</h1>
        <p class="subhead">{$currentDataset?.description ?? ''}</p>
        {#if $currentDataset?.tags?.length}
          <div class="dataset-tags">
            {#each $currentDataset.tags as tag}
              <span>#{tag}</span>
            {/each}
          </div>
        {/if}
      </div>
      <div class="stats">
        <div>
          <span class="stat-label">Groups</span>
          <span class="stat-value">{groupCount}</span>
        </div>
        <div>
          <span class="stat-label">Words</span>
          <span class="stat-value">{totalCount}</span>
        </div>
        <div>
          <span class="stat-label">Shown</span>
          <span class="stat-value">{filteredCount}</span>
        </div>
      </div>
    </div>

    <div class="controls">
      <label class="search">
        <span>Search</span>
        <input
          type="search"
          placeholder="word, pinyin, English, tags"
          bind:value={query}
        />
      </label>

      <label class="group">
        <span>Group</span>
        <select bind:value={groupFilter}>
          <option value="all">All groups</option>
          {#each groups as g}
            <option value={g.group}>{formatGroup(g.group)}</option>
          {/each}
        </select>
      </label>

      <button class="reset" type="button" onclick={resetFilters}>Reset</button>
    </div>

    <div class="tag-row">
      {#each allTags as tag}
        <button
          type="button"
          class:active={selectedTags.includes(tag)}
          onclick={() => toggleTag(tag)}
        >
          #{tag}
        </button>
      {/each}
    </div>
  </header>

  <section class="groups">
    {#if filteredGroups.length === 0}
      <div class="empty">
        <p>No matches. Try clearing filters or searching a different term.</p>
      </div>
    {:else}
      {#each filteredGroups as group (group.group)}
        <article class="group-card" style={`--delay:${group.group * 70}ms`}>
          <div class="group-header">
            <div class="group-tags">
              {#each group.tags as tag}
                <span>#{tag}</span>
              {/each}
            </div>
            <div class="group-title">{formatGroup(group.group)}</div>
            <div class="group-actions">
              <a
                class="print-link"
                href={`${basePath}/workbook.html?group=${group.group}&dataset=${$datasetId}`}
                target="_blank"
                rel="noreferrer"
              >
                Open workbook
              </a>
              <a
                class="print-link"
                href={`${basePath}/workbook.html?group=${group.group}&dataset=${$datasetId}&autoprint=1`}
                target="_blank"
                rel="noreferrer"
              >
                Print workbook
              </a>
            </div>
          </div>

          <div class="word-grid">
            {#each group.items as item (item.word)}
              {#if $currentDataset?.kind === 'chinese'}
                <GroupItemChinese {item} onclick={() => openWord(item)} />
              {:else if $currentDataset?.kind === 'english'}
                <GroupItemEnglish {item} onclick={() => openWord(item)} />
              {/if}
            {/each}
          </div>
        </article>
      {/each}
    {/if}
  </section>

  {#if modalOpen && activeWord}
    <div class="modal-backdrop">
      <button
        class="modal-overlay"
        type="button"
        aria-label="Close dialog"
        onclick={closeModal}
      ></button>
      {#if $currentDataset?.kind === 'chinese'}
        <WordCardChinese item={activeWord} onClose={closeModal} />
      {:else if $currentDataset?.kind === 'english'}
        <WordCardEnglish item={activeWord} onClose={closeModal} />
      {/if}
    </div>
  {/if}
</main>
