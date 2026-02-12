<script>
  import { datasets, datasetId, currentDataset } from '../../../state/registry.js'
  import { dailyActivity } from '../../../state/practice-stats.js'
  import { mainSearch, mainTags, mainGroups, mainListViewStyle } from '../../../state/filters.js'
  import { user, isAuthenticated } from '../../../state/auth.js'
  import { formatGroup } from '../../../utils/format.js'
  import Island from '../../core/Island.svelte'
  import AppTitle from '../../core/AppTitle.svelte'
  import IslandTitle from '../../core/IslandTitle.svelte'
  import Tags from '../../core/Tags.svelte'
  import ProgressBars from '../chinese/ProgressBars.svelte'
  import DailyActivityHeatmap from '../DailyActivityHeatmap.svelte'

  let {
    groupCount,
    totalCount,
    uniqueChars,
    strokePracticedCount,
    strokeProgress,
    strokeMastery,
    pinyinProgress,
    pinyinMastery,
    strokeFullSessions,
    pinyinFullSessions,
    practiceHref,
    onShowAuthDropdown,
    onShowPracticedGroups,
    onShowPracticedList,
    onShowPracticedChars,
    onShowHowItWorks,
    onShowStatInfo,
  } = $props()

  const groups = $derived.by(() => $currentDataset?.data?.groups ?? [])

  const allTags = $derived.by(() => {
    const tagSet = new Set()
    groups.forEach((g) => {
      g.tags?.forEach((t) => tagSet.add(t))
      g.items?.forEach((item) => item.tags?.forEach((t) => tagSet.add(t)))
    })
    return Array.from(tagSet).sort()
  })

  let tagQuery = $state('')
  let showSuggestions = $state(false)
  let highlightedIndex = $state(0)
  let groupQuery = $state('')
  let showGroupSuggestions = $state(false)
  let groupHighlightedIndex = $state(0)
  let avatarError = $state(false)

  const avatarUrl = $derived($user?.user_metadata?.avatar_url)
  const userInitials = $derived.by(() => {
    const meta = $user?.user_metadata
    const fullName = meta?.full_name || meta?.name
    if (fullName) {
      const parts = fullName.trim().split(/\s+/)
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      }
      return parts[0][0].toUpperCase()
    }
    const email = $user?.email
    return email ? email[0].toUpperCase() : '?'
  })

  // Reset avatar error when user changes
  $effect(() => {
    $user
    avatarError = false
  })

  const suggestions = $derived.by(() => {
    const q = tagQuery.trim().toLowerCase()
    return allTags.filter((t) =>
      (!q || t.toLowerCase().includes(q)) && !$mainTags.includes(t)
    )
  })

  $effect(() => {
    suggestions
    highlightedIndex = 0
  })

  const addTag = (tag) => {
    if (!$mainTags.includes(tag)) {
      $mainTags = [...$mainTags, tag]
    }
    tagQuery = ''
    showSuggestions = false
    highlightedIndex = 0
  }

  const removeTag = (tag) => {
    $mainTags = $mainTags.filter((t) => t !== tag)
  }

  const handleTagKeydown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      highlightedIndex = Math.min(highlightedIndex + 1, suggestions.length - 1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      highlightedIndex = Math.max(highlightedIndex - 1, 0)
    } else if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault()
      addTag(suggestions[highlightedIndex])
    } else if (e.key === 'Backspace' && tagQuery === '' && $mainTags.length > 0) {
      removeTag($mainTags[$mainTags.length - 1])
    } else if (e.key === 'Escape') {
      showSuggestions = false
    }
  }

  const groupSuggestions = $derived.by(() => {
    const q = groupQuery.trim().toLowerCase()
    return groups.filter((g) =>
      (!q || formatGroup(g.group).toLowerCase().includes(q)) && !$mainGroups.includes(g.group)
    )
  })

  $effect(() => {
    groupSuggestions
    groupHighlightedIndex = 0
  })

  const addGroup = (groupId) => {
    if (!$mainGroups.includes(groupId)) {
      $mainGroups = [...$mainGroups, groupId]
    }
    groupQuery = ''
    showGroupSuggestions = false
    groupHighlightedIndex = 0
  }

  const removeGroup = (groupId) => {
    $mainGroups = $mainGroups.filter((id) => id !== groupId)
  }

  const handleGroupKeydown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      groupHighlightedIndex = Math.min(groupHighlightedIndex + 1, groupSuggestions.length - 1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      groupHighlightedIndex = Math.max(groupHighlightedIndex - 1, 0)
    } else if (e.key === 'Enter' && groupSuggestions.length > 0) {
      e.preventDefault()
      addGroup(groupSuggestions[groupHighlightedIndex].group)
    } else if (e.key === 'Backspace' && groupQuery === '' && $mainGroups.length > 0) {
      removeGroup($mainGroups[$mainGroups.length - 1])
    } else if (e.key === 'Escape') {
      showGroupSuggestions = false
    }
  }

  // Activity heatmap
  const ACTIVITY_MAX = 50
  const CELL_SIZE = 10
  const CELL_GAP = 3
  const FUTURE_DAYS_DESKTOP = 10
  const FUTURE_DAYS_MOBILE = 3

  let activityContainer = $state(null)
  let totalCells = $state(60)
  let futureDays = $state(FUTURE_DAYS_DESKTOP)
  let selectedActivityDate = $state(null)

  $effect(() => {
    if (!activityContainer) return
    const updateCells = () => {
      const isMobile = window.innerWidth <= 600
      futureDays = isMobile ? FUTURE_DAYS_MOBILE : FUTURE_DAYS_DESKTOP
      const width = activityContainer.offsetWidth
      totalCells = Math.floor((width + CELL_GAP) / (CELL_SIZE + CELL_GAP))
    }
    updateCells()
    const observer = new ResizeObserver(updateCells)
    observer.observe(activityContainer)
    return () => observer.disconnect()
  })

  const toLocalDateKey = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const activityDays = $derived.by(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const pastDays = totalCells - futureDays

    const days = []
    for (let i = pastDays - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = toLocalDateKey(d)
      const entry = $dailyActivity.get(key) || { count: 0, durationMs: 0, sessions: 0 }
      days.push({
        date: key,
        count: entry.count,
        durationMs: entry.durationMs,
        sessions: entry.sessions,
        isFuture: false,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })
    }
    for (let i = 1; i <= futureDays; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      days.push({
        date: toLocalDateKey(d),
        count: 0,
        durationMs: 0,
        sessions: 0,
        isFuture: true,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })
    }
    return days
  })

  // Reset activity selection on dataset change
  $effect(() => {
    $datasetId
    selectedActivityDate = null
  })

  // Auto-select today
  $effect(() => {
    if (!selectedActivityDate) selectedActivityDate = toLocalDateKey(new Date())
  })
</script>

<Island>
  <div class="anuka-row anuka-justify" style="flex-wrap: wrap; margin-bottom: 1rem">
    <div class="anuka-row">
      <a class="github-link" href="https://github.com/anukauchika/anukauchika.github.io" target="_blank" rel="noreferrer">
        <svg viewBox="0 0 16 16" width="24" height="24" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>
        <span class="github-text">Want to add vocabulary?<br>Contributions welcome</span>
      </a>
    </div>
    <AppTitle parts={$currentDataset?.appTitle ? ['Anuka Uchika', $currentDataset.appTitle] : ['Anuka Uchika']} />

    <select class="anuka-input" bind:value={$datasetId} style="min-width: 280px; cursor: pointer">
      {#each datasets as dataset}
        <option value={dataset.id}>{dataset.name}</option>
      {/each}
    </select>

    <div class="auth-section">
      {#if $user}
        <div class="auth-user">
          <button type="button" class="auth-avatar-btn" onclick={onShowAuthDropdown}>
            {#if avatarUrl && !avatarError}
              <img class="auth-avatar" src={avatarUrl} alt="Avatar" onerror={() => avatarError = true} />
            {:else}
              <span class="auth-avatar-fallback">{userInitials}</span>
            {/if}
          </button>
        </div>
      {:else}
        <div class="auth-signin">
          <button type="button" class="auth-icon-btn" onclick={onShowAuthDropdown} title="Sign in">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
          </button>
        </div>
      {/if}
    </div>
  </div>

  <div class="anuka-row anuka-justify" style="flex-wrap: wrap">
    <div>
      <IslandTitle level={1}>{$currentDataset?.name ?? 'Vocabulary'}</IslandTitle>
      <p>{$currentDataset?.description ?? ''}</p>
      {#if $currentDataset?.tags?.length}
        <Tags tags={$currentDataset.tags} />
      {/if}
    </div>
    <div class="stats">
      <button type="button" class="stat-btn" onclick={() => { if ($isAuthenticated) onShowPracticedGroups() }}>
        <span class="stat-label">Groups</span>
        <span class="stat-value">{groupCount}</span>
      </button>
      <button type="button" class="stat-btn" onclick={() => onShowStatInfo('words')}>
        <span class="stat-label">Words</span>
        <span class="stat-value">{totalCount}</span>
      </button>
      <button type="button" class="stat-btn" onclick={() => { if ($isAuthenticated) onShowPracticedChars() }}>
        <span class="stat-label">Chars</span>
        <span class="stat-value">{uniqueChars}</span>
      </button>
      {#if $isAuthenticated}
        <button type="button" class="stat-btn" onclick={onShowPracticedList}>
          <span class="stat-label">Practiced</span>
          <span class="stat-value">{strokePracticedCount}</span>
        </button>
      {/if}
    </div>
  </div>
  {#if $isAuthenticated}
    <ProgressBars {strokeProgress} {strokeMastery} {pinyinProgress} {pinyinMastery} {strokeFullSessions} {pinyinFullSessions} />

    <div class="activity-line" bind:this={activityContainer}>
      <DailyActivityHeatmap days={activityDays} max={ACTIVITY_MAX} selectedDate={selectedActivityDate} onselect={(d) => selectedActivityDate = d} />
    </div>
  {:else}
    <p class="login-hint"><button type="button" class="login-hint-link" onclick={onShowAuthDropdown}>Log in</button> to track your learning progress</p>
  {/if}
  <p class="how-it-works-link"><button type="button" class="login-hint-link" onclick={onShowHowItWorks}>How it works?</button></p>
  {#if practiceHref}
    <a class="practice-btn" href={practiceHref}>Practice</a>
  {/if}

  <div class="controls">
    <label class="search">
      <span>Search</span>
      <div class="search-row">
        <input
          type="search"
          placeholder="word, pinyin, English, tags"
          bind:value={$mainSearch}
        />
        <div class="view-buttons">
          <button type="button" class:active={$mainListViewStyle === 'full'} onclick={() => $mainListViewStyle = 'full'} title="Grid view">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          </button>
          <button type="button" class:active={$mainListViewStyle === 'compact'} onclick={() => $mainListViewStyle = 'compact'} title="List view">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        </div>
      </div>
    </label>

    {#if allTags.length > 0}
      <label class="tags-filter">
        <span>Tags</span>
        <div class="tag-input-wrap">
          {#each $mainTags as tag (tag)}
            <span class="selected-tag">#{tag}<button type="button" onmousedown={(e) => { e.preventDefault(); e.stopPropagation(); removeTag(tag) }}>&times;</button></span>
          {/each}
          <div class="autocomplete">
            <input
              type="text"
              placeholder="Filter..."
              bind:value={tagQuery}
              onfocus={() => showSuggestions = true}
              onblur={() => setTimeout(() => showSuggestions = false, 150)}
              oninput={() => showSuggestions = true}
              onkeydown={handleTagKeydown}
            />
            {#if showSuggestions && suggestions.length > 0}
              <ul class="suggestions">
                {#each suggestions as tag, i}
                  <li><button type="button" class:highlighted={i === highlightedIndex} onmousedown={() => addTag(tag)}>#{tag}</button></li>
                {/each}
              </ul>
            {/if}
          </div>
          {#if $mainTags.length > 0}
            <button type="button" class="input-clear" onmousedown={(e) => { e.preventDefault(); e.stopPropagation(); $mainTags = [] }}>&times;</button>
          {/if}
        </div>
      </label>
    {/if}

    <label class="group-filter">
      <span>Groups</span>
      <div class="tag-input-wrap">
        {#each $mainGroups as groupId (groupId)}
          <span class="selected-tag">{formatGroup(groupId)}<button type="button" onmousedown={(e) => { e.preventDefault(); e.stopPropagation(); removeGroup(groupId) }}>&times;</button></span>
        {/each}
        <div class="autocomplete">
          <input
            type="text"
            placeholder="Filter..."
            bind:value={groupQuery}
            onfocus={() => showGroupSuggestions = true}
            onblur={() => setTimeout(() => showGroupSuggestions = false, 150)}
            oninput={() => showGroupSuggestions = true}
            onkeydown={handleGroupKeydown}
          />
          {#if showGroupSuggestions && groupSuggestions.length > 0}
            <ul class="suggestions">
              {#each groupSuggestions as g, i}
                <li><button type="button" class:highlighted={i === groupHighlightedIndex} onmousedown={() => addGroup(g.group)}>{formatGroup(g.group)}</button></li>
              {/each}
            </ul>
          {/if}
        </div>
        {#if $mainGroups.length > 0}
          <button type="button" class="input-clear" onmousedown={(e) => { e.preventDefault(); e.stopPropagation(); $mainGroups = [] }}>&times;</button>
        {/if}
      </div>
    </label>

  </div>
</Island>
