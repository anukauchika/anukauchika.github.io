<script>
  import { tick } from 'svelte'
  import HanziWriter from 'hanzi-writer'
  import { datasets, datasetId, currentDataset } from './state/registry.js'
  import { formatGroup } from './utils/format.js'

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
  const writers = new Map()

  const wordChars = $derived.by(() => (activeWord ? activeWord.word.split('') : []))

  const isHanChar = (char) => /[\u4e00-\u9fff]/.test(char)

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
    const raw = [item.word, item.pinyin, item.english, ...(item.tags || [])].join(' ')
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
    writers.forEach((writer) => writer?.cancelAnimation?.())
    writers.clear()
  }

  const animateChar = (idx) => {
    const writer = writers.get(idx)
    if (writer) writer.animateCharacter()
  }

  const initWriters = async () => {
    writers.forEach((writer) => writer?.cancelAnimation?.())
    writers.clear()
    await tick()
    wordChars.forEach((char, idx) => {
      const target = document.getElementById(`hanzi-${idx}`)
      if (!target || !isHanChar(char)) return
      const writer = HanziWriter.create(target, char, {
        width: 140,
        height: 140,
        padding: 8,
        showCharacter: false,
      })
      writers.set(idx, writer)
      writer.animateCharacter()
    })
  }

  $effect(() => {
    if (modalOpen && activeWord) {
      initWriters()
    }
  })

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
      <div class="title-row">
        <div class="top-bar">
          <p class="eyebrow">MEMRIS</p>
          <label class="dataset-picker">
            <span>Dataset</span>
            <select bind:value={$datasetId}>
              {#each datasets as dataset}
                <option value={dataset.id}>{dataset.name}</option>
              {/each}
            </select>
          </label>
        </div>
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
              <button class="word-card" type="button" onclick={() => openWord(item)}>
                <div class="word-top">
                  <span class="hanzi">{item.word}</span>
                  <span class="id">{(item.id ?? 0).toString().padStart(2, '0')}</span>
                </div>
                <div class="pinyin">{item.pinyin}</div>
                <div class="english">{item.english}</div>
                <div class="word-tags">
                  {#each item.tags as tag}
                    <span>#{tag}</span>
                  {/each}
                </div>
              </button>
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
      <div class="modal-card" role="dialog" aria-modal="true">
        <header class="modal-header">
          <div>
            <h3>{activeWord.word}</h3>
            <p>{activeWord.pinyin} · {activeWord.english}</p>
          </div>
          <button class="close" type="button" onclick={closeModal}>Close</button>
        </header>

        <div class="stroke-grid">
          {#each wordChars as char, idx}
            <div class="stroke-card">
              <div class="stroke-title">{char}</div>
              {#if isHanChar(char)}
                <div class="stroke-canvas" id={`hanzi-${idx}`}></div>
                <button class="stroke-btn" type="button" onclick={() => animateChar(idx)}>
                  Animate
                </button>
              {:else}
                <div class="stroke-fallback">No stroke data</div>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</main>
