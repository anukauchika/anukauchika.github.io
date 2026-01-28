<script>
  import { datasets, datasetId, currentDataset } from './state/registry.js'
  import { loadDatasetStats, datasetStats, loadDatasetGroupSessions, datasetGroupSessions } from './state/practice-stats.js'
  import { formatGroup } from './utils/format.js'
  import GroupItemChinese from './kind/chinese/GroupItem.svelte'
  import GroupItemEnglish from './kind/english/GroupItem.svelte'
  import WordCardChinese from './kind/chinese/WordCard.svelte'
  import WordCardEnglish from './kind/english/WordCard.svelte'

  const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, '') || ''
  const basePath = $derived.by(() => `${baseUrl}/${$currentDataset.kind}`)
  const groups = $derived.by(() => $currentDataset?.data?.groups ?? [])

  // TODO: when multiple practice types exist, aggregate or let user pick
  const practiceType = 'stroke'

  $effect(() => {
    if ($datasetId) {
      loadDatasetStats($datasetId, practiceType)
      loadDatasetGroupSessions($datasetId, practiceType)
    }
  })

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


  const filteredGroups = $derived.by(() => {
    const sessions = $datasetGroupSessions
    return groups
      .filter((g) => matchesGroup(g.group))
      .map((g) => ({
        ...g,
        items: g.items.filter((item) => matchesQuery(item) && matchesTags(item)),
      }))
      .filter((g) => g.items.length > 0)
      .sort((a, b) => {
        const sa = sessions.get(a.group)?.lastFullSessionAt ?? ''
        const sb = sessions.get(b.group)?.lastFullSessionAt ?? ''
        if (!sa && !sb) return 0
        if (!sa) return -1
        if (!sb) return 1
        return sa < sb ? -1 : sa > sb ? 1 : 0
      })
  })

  const practicedCount = $derived.by(() => $datasetStats.size)
  const totalCount = $derived.by(() =>
    groups.reduce((sum, g) => sum + g.items.length, 0)
  )
  const filteredCount = $derived.by(() =>
    filteredGroups.reduce((sum, g) => sum + g.items.length, 0)
  )
  const groupCount = $derived.by(() => groups.length)
  const datasetProgress = $derived.by(() =>
    totalCount > 0 ? Math.round((practicedCount / totalCount) * 100) : 0
  )
  const getGroupProgress = (group) => {
    const practiced = group.items.filter(item =>
      $datasetStats.has(`${group.group}::${item.id}`)
    ).length
    return group.items.length > 0 ? Math.round((practiced / group.items.length) * 100) : 0
  }
  const getGroupMastery = (group) => {
    const gs = $datasetGroupSessions.get(group.group)
    const fullSessions = gs?.full ?? 0
    return Math.min(Math.round((fullSessions / 5) * 100), 100)
  }
</script>

<main>
  <header class="hero">
    <div class="hero-top">
      <div class="hero-brand">
        <p class="eyebrow">MEMRIS</p>
        <a class="github-link" href="https://github.com/sherzodv/memris" target="_blank" rel="noreferrer">
          <svg viewBox="0 0 16 16" width="24" height="24" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>
          <span class="github-text">Want to add vocabulary?<br>Contributions welcome</span>
        </a>
      </div>
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
        <div>
          <span class="stat-label">Practiced</span>
          <span class="stat-value">{practicedCount}</span>
        </div>
      </div>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" style="width: {datasetProgress}%"></div>
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
        {@const gs = $datasetGroupSessions.get(group.group)}
        <article class="group-card" style={`--delay:${group.group * 70}ms`}>
          <div class="group-header">
            <div class="group-tags">
              {#each group.tags as tag}
                <span>#{tag}</span>
              {/each}
            </div>
            {#if gs}
              <div class="group-passes">{gs.total} passes ({gs.full} full)</div>
            {/if}
            <div class="group-title">{formatGroup(group.group)}</div>
            <div class="group-actions">
              {#if $currentDataset?.kind === 'chinese'}
                <a
                  class="print-link"
                  href={`${basePath}/practice.html?group=${group.group}&dataset=${$datasetId}`}
                >
                  Practice
                </a>
              {/if}
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
            <div class="group-progress">
              <div class="group-progress-words" style="width: {getGroupProgress(group)}%"></div>
              <div class="group-progress-mastery" style="width: {getGroupMastery(group)}%"></div>
            </div>
          </div>

          <div class="word-grid">
            {#each group.items as item (item.word)}
              {#if $currentDataset?.kind === 'chinese'}
                <GroupItemChinese {item} stat={$datasetStats.get(`${group.group}::${item.id}`)} onclick={() => openWord(item)} />
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
