<script>
  import { datasets, datasetId, currentDataset } from './state/registry.js'
  import { loadDatasetGroupSessions, datasetGroupSessions } from './state/practice-stats.js'
  import { groupsSelectedTags, loadGroupsTags, addGroupsTag, removeGroupsTag } from './state/filters.js'
  import { formatGroup } from './utils/format.js'

  const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, '') || ''
  const basePath = $derived.by(() => `${baseUrl}/${$currentDataset.kind}`)
  const groups = $derived.by(() => $currentDataset?.data?.groups ?? [])

  const practiceType = 'stroke'

  $effect(() => {
    if ($datasetId) {
      loadDatasetGroupSessions($datasetId, practiceType)
      loadGroupsTags($datasetId)
    }
  })

  const allTags = $derived.by(() => {
    const tagSet = new Set()
    groups.forEach((g) => g.tags?.forEach((t) => tagSet.add(t)))
    return Array.from(tagSet).sort()
  })

  let tagQuery = $state('')
  let showSuggestions = $state(false)
  let highlightedIndex = $state(0)

  const suggestions = $derived.by(() => {
    const q = tagQuery.trim().toLowerCase()
    return allTags.filter((t) =>
      (!q || t.toLowerCase().includes(q)) && !$groupsSelectedTags.includes(t)
    )
  })

  $effect(() => {
    suggestions
    highlightedIndex = 0
  })

  const addTag = (tag) => {
    addGroupsTag(tag)
    tagQuery = ''
    showSuggestions = false
    highlightedIndex = 0
  }

  const removeTag = (tag) => {
    removeGroupsTag(tag)
  }

  const handleKeydown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      highlightedIndex = Math.min(highlightedIndex + 1, suggestions.length - 1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      highlightedIndex = Math.max(highlightedIndex - 1, 0)
    } else if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault()
      addTag(suggestions[highlightedIndex])
    } else if (e.key === 'Backspace' && tagQuery === '' && $groupsSelectedTags.length > 0) {
      removeTag($groupsSelectedTags[$groupsSelectedTags.length - 1])
    } else if (e.key === 'Escape') {
      showSuggestions = false
    }
  }

  const formatDate = (isoString) => {
    if (!isoString) return '—'
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const filteredGroups = $derived.by(() => {
    const sessions = $datasetGroupSessions
    const selected = $groupsSelectedTags
    return [...groups]
      .filter((g) => {
        if (selected.length === 0) return true
        return selected.every((t) => g.tags?.includes(t))
      })
      .sort((a, b) => {
        const sa = sessions.get(a.group)?.lastPracticedAt ?? ''
        const sb = sessions.get(b.group)?.lastPracticedAt ?? ''
        if (!sa && !sb) return a.group - b.group
        if (!sa) return 1
        if (!sb) return -1
        return sb.localeCompare(sa)
      })
  })

  const groupCount = $derived.by(() => filteredGroups.length)
  const totalWords = $derived.by(() => filteredGroups.reduce((sum, g) => sum + g.items.length, 0))
  const uniqueChars = $derived.by(() => {
    const chars = new Set()
    const isCJK = (c) => c >= '\u4E00' && c <= '\u9FFF'
    filteredGroups.forEach((g) => {
      g.items.forEach((item) => {
        const word = item.word || ''
        for (const char of word) {
          if (isCJK(char)) chars.add(char)
        }
      })
    })
    return chars.size
  })
</script>

<main>
  <header class="header">
    <div class="header-top">
      <a href={`${basePath}/`} class="back-link">
        <span class="eyebrow">MEMRIS</span>
      </a>
      <div class="stats">
        <div class="stat"><span class="stat-value">{groupCount}</span><span class="stat-label">groups</span></div>
        <div class="stat"><span class="stat-value">{totalWords}</span><span class="stat-label">words</span></div>
        <div class="stat"><span class="stat-value">{uniqueChars}</span><span class="stat-label">chars</span></div>
      </div>
      <select class="dataset-picker" bind:value={$datasetId}>
        {#each datasets as dataset}
          <option value={dataset.id}>{dataset.name}</option>
        {/each}
      </select>
    </div>
    {#if allTags.length > 0}
      <div class="tag-input-wrap">
        {#each $groupsSelectedTags as tag (tag)}
          <span class="selected-tag">#{tag}<button type="button" onmousedown={(e) => { e.preventDefault(); e.stopPropagation(); removeTag(tag) }}>&times;</button></span>
        {/each}
        <div class="autocomplete">
          <input
            type="text"
            placeholder="Filter by tag..."
            bind:value={tagQuery}
            onfocus={() => showSuggestions = true}
            onblur={() => setTimeout(() => showSuggestions = false, 150)}
            oninput={() => showSuggestions = true}
            onkeydown={handleKeydown}
          />
          {#if showSuggestions && suggestions.length > 0}
            <ul class="suggestions">
              {#each suggestions as tag, i}
                <li><button type="button" class:highlighted={i === highlightedIndex} onmousedown={() => addTag(tag)}>#{tag}</button></li>
              {/each}
            </ul>
          {/if}
        </div>
      </div>
    {/if}
  </header>

  <section class="groups-list">
    {#if filteredGroups.length === 0}
      <div class="empty">
        <p>No groups found.</p>
      </div>
    {:else}
      {#each filteredGroups as group (group.group)}
        {@const gs = $datasetGroupSessions.get(group.group)}
        <article class="group-row">
          <div class="row-main">
            <span class="gid">{formatGroup(group.group)}</span>
            <span class="passes">{#if gs}[{gs.full} of {gs.total}]{/if}</span>
            <span class="date">{#if gs}{formatDate(gs.lastPracticedAt)}{/if}</span>
            <span class="actions">
              {#if $currentDataset?.kind === 'chinese'}
                <a class="action-icon" href={`${basePath}/practice.html?group=${group.group}&dataset=${$datasetId}`} title="Practice">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                </a>
              {/if}
              <a class="action-icon" href={`${basePath}/workbook.html?group=${group.group}&dataset=${$datasetId}`} target="_blank" rel="noreferrer" title="Workbook">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
              </a>
            </span>
          </div>
          {#if group.tags?.length}
            <div class="tags">
              {#each group.tags as tag}<button type="button" class="tag" onclick={() => addTag(tag)}>#{tag}</button>{/each}
            </div>
          {/if}
        </article>
      {/each}
    {/if}
  </section>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .header {
    background: var(--card);
    padding: 0.75rem 1rem;
    border-radius: 12px;
    box-shadow: var(--shadow);
    border: 1px solid rgba(31, 111, 92, 0.08);
  }

  .header-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  .back-link {
    text-decoration: none;
  }

  .back-link:hover .eyebrow {
    color: var(--accent);
  }

  .eyebrow {
    text-transform: uppercase;
    letter-spacing: 0.2em;
    font-size: 0.75rem;
    color: var(--muted);
    margin: 0;
    transition: color 0.15s ease;
  }

  .stats {
    display: flex;
    gap: 1rem;
  }

  .stat {
    display: flex;
    align-items: baseline;
    gap: 0.3rem;
  }

  .stat-value {
    font-weight: 700;
    font-size: 1.1rem;
  }

  .stat-label {
    font-size: 0.75rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .dataset-picker {
    border: 1px solid rgba(31, 111, 92, 0.3);
    background: #fffdf7;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    font-size: 1rem;
    color: var(--ink);
    outline: none;
    cursor: pointer;
  }

  .dataset-picker:focus {
    border-color: var(--accent);
    box-shadow: 0 0 0 3px rgba(31, 111, 92, 0.2);
  }

  .tag-input-wrap {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.4rem;
    margin-top: 0.75rem;
  }

  .selected-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    background: var(--accent);
    color: #fff;
    padding: 0.25rem 0.5rem;
    border-radius: 999px;
    font-size: 0.85rem;
  }

  .selected-tag button {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    padding: 0;
    font-size: 1rem;
    line-height: 1;
    opacity: 0.8;
  }

  .selected-tag button:hover {
    opacity: 1;
  }

  .autocomplete {
    position: relative;
  }

  .autocomplete input {
    border: 1px solid rgba(31, 111, 92, 0.3);
    background: #fffdf7;
    padding: 0.4rem 0.75rem;
    border-radius: 8px;
    font-size: 0.9rem;
    color: var(--ink);
    outline: none;
    width: 140px;
  }

  .autocomplete input:focus {
    border-color: var(--accent);
  }

  .suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--card);
    border: 1px solid rgba(31, 111, 92, 0.2);
    border-radius: 8px;
    margin-top: 0.25rem;
    padding: 0.25rem;
    list-style: none;
    z-index: 10;
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    max-height: 200px;
    overflow-y: auto;
  }

  .suggestions li button {
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    padding: 0.4rem 0.6rem;
    cursor: pointer;
    font-size: 0.85rem;
    color: var(--ink);
    border-radius: 4px;
  }

  .suggestions li button:hover,
  .suggestions li button.highlighted {
    background: rgba(31, 111, 92, 0.1);
  }

  .groups-list {
    background: var(--card);
    border-radius: 16px;
    box-shadow: var(--shadow);
    border: 1px solid rgba(31, 111, 92, 0.08);
    overflow: hidden;
  }

  .group-row {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.5rem 1rem;
    border-bottom: 1px solid rgba(31, 111, 92, 0.06);
    transition: background 0.15s ease;
  }

  .group-row:last-child {
    border-bottom: none;
  }

  .group-row:hover {
    background: rgba(31, 111, 92, 0.03);
  }

  .row-main {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .gid {
    font-weight: 700;
    font-size: 1.1rem;
  }

  .passes {
    font-weight: 600;
    color: var(--accent);
    font-size: 1rem;
  }

  .date {
    color: var(--muted);
    font-size: 0.9rem;
  }

  .actions {
    display: flex;
    gap: 0.35rem;
    margin-left: auto;
  }

  .action-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(31, 111, 92, 0.1);
    color: var(--ink);
    transition: background 0.15s ease, color 0.15s ease;
  }

  .action-icon:hover {
    background: var(--accent);
    color: white;
  }

  .tags {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    padding-left: 0;
  }

  .tag {
    background: rgba(244, 192, 122, 0.35);
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    font-size: 0.75rem;
    color: var(--muted);
    border: none;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .tag:hover {
    background: rgba(244, 192, 122, 0.55);
  }

  .empty {
    padding: 3rem;
    text-align: center;
    color: var(--muted);
  }

  @media (max-width: 600px) {
    .header-top {
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .stats {
      order: 3;
      width: 100%;
      justify-content: space-around;
    }

    .dataset-picker {
      flex: 1;
    }

    .row-main {
      flex-wrap: wrap;
    }

    .date {
      margin-left: 0;
    }
  }
</style>
