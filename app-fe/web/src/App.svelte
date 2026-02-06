<script>
  import { datasets, datasetId, currentDataset } from './state/registry.js'
  import { loadDatasetStats, datasetStats, loadDatasetGroupSessions, datasetGroupSessions, dailyActivity, loadDailyActivity } from './state/practice-stats.js'
  import { mainSearch, mainTags, mainGroup, mainCompact, loadMainFilters } from './state/filters.js'
  import { user, isAuthenticated, signInWithGoogle, signInWithApple, signOut } from './state/auth.js'
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

  const reloadStats = () => {
    if ($datasetId) {
      loadDatasetStats($datasetId, practiceType)
      loadDatasetGroupSessions($datasetId, practiceType)
      loadDailyActivity($datasetId, practiceType)
    }
  }

  $effect(() => {
    if ($datasetId) {
      reloadStats()
      loadMainFilters($datasetId)
      showAllGroups = false
      selectedDay = null
    }
  })

  // Reload stats when returning to the page (e.g., after practicing)
  $effect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') reloadStats()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  })

  const allTags = $derived.by(() => {
    const tagSet = new Set()
    groups.forEach((g) => {
      g.tags?.forEach((t) => tagSet.add(t))
      g.items?.forEach((item) => item.tags?.forEach((t) => tagSet.add(t)))
    })
    return Array.from(tagSet).sort()
  })

  let activeWord = $state(null)
  let modalOpen = $state(false)
  let tagQuery = $state('')
  let showSuggestions = $state(false)
  let highlightedIndex = $state(0)
  let groupQuery = $state('')
  let showGroupSuggestions = $state(false)
  let groupHighlightedIndex = $state(0)
  let showAllGroups = $state(false)
  let showAuthDropdown = $state(false)
  let showPracticedList = $state(false)
  let activeStat = $state(null)
  let avatarError = $state(false)
  let hoveredBar = $state(null)

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
  
  const timeAgo = (ts) => {
    if (!ts) return ''
    const diff = Date.now() - (typeof ts === 'number' ? ts : new Date(ts).getTime())
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    const weeks = Math.floor(days / 7)
    if (weeks < 5) return `${weeks}w ago`
    const months = Math.floor(days / 30)
    return `${months}mo ago`
  }

  const formatDate = (isoString) => {
    if (!isoString) return ''
    const date = new Date(isoString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

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
      (!q || formatGroup(g.group).toLowerCase().includes(q)) && !$mainGroup.includes(g.group)
    )
  })

  $effect(() => {
    groupSuggestions
    groupHighlightedIndex = 0
  })

  const addGroup = (groupId) => {
    if (!$mainGroup.includes(groupId)) {
      $mainGroup = [...$mainGroup, groupId]
    }
    groupQuery = ''
    showGroupSuggestions = false
    groupHighlightedIndex = 0
  }

  const removeGroup = (groupId) => {
    $mainGroup = $mainGroup.filter((id) => id !== groupId)
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
    } else if (e.key === 'Backspace' && groupQuery === '' && $mainGroup.length > 0) {
      removeGroup($mainGroup[$mainGroup.length - 1])
    } else if (e.key === 'Escape') {
      showGroupSuggestions = false
    }
  }

  const normalize = (value) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

  const matchesQuery = (item) => {
    const q = $mainSearch.trim()
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
    if ($mainTags.length === 0) return true
    const tags = item.tags || []
    return $mainTags.every((t) => tags.includes(t))
  }

  const matchesGroupTags = (group) => {
    if ($mainTags.length === 0) return true
    const tags = group.tags || []
    return $mainTags.every((t) => tags.includes(t))
  }

  const matchesGroup = (groupId) => {
    if ($mainGroup.length === 0) return true
    return $mainGroup.includes(groupId)
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
    if ($mainGroup.length > 0) {
      const validIds = new Set(groups.map((g) => g.group))
      const filtered = $mainGroup.filter((id) => validIds.has(id))
      if (filtered.length !== $mainGroup.length) {
        $mainGroup = filtered
      }
    }
  })


  const filteredGroups = $derived.by(() => {
    return groups
      .filter((g) => matchesGroup(g.group))
      .map((g) => {
        const groupMatches = matchesGroupTags(g)
        const items = g.items.filter(
          (item) => matchesQuery(item) && (groupMatches || matchesTags(item))
        )
        return { ...g, items, _groupMatches: groupMatches }
      })
      .filter((g) => {
        const hasSearch = $mainSearch.trim().length > 0
        // When searching, only show groups with matching items
        if (hasSearch) return g.items.length > 0
        return g._groupMatches || g.items.length > 0
      })
  })

  const groupCount = $derived.by(() => filteredGroups.length)
  const MAX_MAIN_GROUPS = 10
  const hasActiveSearch = $derived.by(() => $mainSearch.trim().length > 0)
  const isLimited = $derived.by(() => !hasActiveSearch && !showAllGroups && filteredGroups.length > MAX_MAIN_GROUPS)
  const fullViewGroups = $derived.by(() =>
    hasActiveSearch || showAllGroups ? filteredGroups : filteredGroups.slice(0, MAX_MAIN_GROUPS)
  )
  const totalCount = $derived.by(() =>
    filteredGroups.reduce((sum, g) => sum + g.items.length, 0)
  )
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
  const practicedCount = $derived.by(() => {
    let count = 0
    filteredGroups.forEach((g) => {
      g.items.forEach((item) => {
        if ($datasetStats.has(`${g.group}::${item.id}`)) count++
      })
    })
    return count
  })
  const practicedItems = $derived.by(() => {
    const items = []
    filteredGroups.forEach((g) => {
      g.items.forEach((item) => {
        const key = `${g.group}::${item.id}`
        const stat = $datasetStats.get(key)
        if (stat) items.push({ item, group: g, stat })
      })
    })
    items.sort((a, b) => (b.stat.lastPracticedAt ?? '').localeCompare(a.stat.lastPracticedAt ?? ''))
    return items
  })
  const chartData = $derived.by(() => {
    if (practicedItems.length === 0) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const DAYS = 30

    // Build 30-day range: today - 29 days through today
    const bars = []
    let maxCount = 0
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = toLocalDateKey(d)
      const count = dayCounts.get(key) || 0
      if (count > maxCount) maxCount = count
      bars.push({
        date: key,
        count,
        label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        monthLabel: d.getDate() === 1 || i === DAYS - 1
          ? d.toLocaleDateString('en-US', { month: 'short' })
          : null
      })
    }

    // Cumulative unique words: count words whose lastPracticedAt <= each day
    const cumulativeData = []
    let maxCumulative = 0
    for (const bar of bars) {
      let cum = 0
      for (const { stat } of practicedItems) {
        if (stat.lastPracticedAt && stat.lastPracticedAt.slice(0, 10) <= bar.date) cum++
      }
      cumulativeData.push(cum)
      if (cum > maxCumulative) maxCumulative = cum
    }

    // Shared scale: both bars and line use the same y-axis
    const yMax = Math.max(maxCount, maxCumulative)

    // Compute nice tick values for grid lines (3-4 lines)
    const niceStep = (max) => {
      if (max <= 0) return []
      const rough = max / 4
      const mag = Math.pow(10, Math.floor(Math.log10(rough)))
      const candidates = [1, 2, 5, 10].map(m => m * mag)
      const step = candidates.find(s => s >= rough) || candidates[candidates.length - 1]
      const ticks = []
      for (let v = step; v <= max; v += step) ticks.push(v)
      return ticks
    }

    return { bars, maxCount, cumulativeData, maxCumulative, yMax, ticks: niceStep(yMax) }
  })

  const datasetProgress = $derived.by(() =>
    totalCount > 0 ? Math.round((practicedCount / totalCount) * 100) : 0
  )
  const datasetMastery = $derived.by(() => {
    if (totalCount === 0) return 0
    let sum = 0
    filteredGroups.forEach((g) => {
      g.items.forEach((item) => {
        const stat = $datasetStats.get(`${g.group}::${item.id}`)
        sum += Math.min((stat?.successCount ?? 0) / 10, 1)
      })
    })
    return Math.round((sum / totalCount) * 100)
  })
  const getGroupProgress = (group) => {
    const practiced = group.items.filter(item =>
      $datasetStats.has(`${group.group}::${item.id}`)
    ).length
    return group.items.length > 0 ? Math.round((practiced / group.items.length) * 100) : 0
  }
  const getGroupMastery = (group) => {
    const gs = $datasetGroupSessions.get(group.group)
    const fullSessions = gs?.full ?? 0
    return Math.min(Math.round((fullSessions / 10) * 100), 100)
  }

  // Activity line: practice activity with fixed 0-50 gradation
  const ACTIVITY_MAX = 50
  const CELL_SIZE = 10
  const CELL_GAP = 3
  const FUTURE_DAYS_DESKTOP = 10
  const FUTURE_DAYS_MOBILE = 3

  let activityContainer = $state(null)
  let totalCells = $state(60)
  let futureDays = $state(FUTURE_DAYS_DESKTOP)
  let selectedDay = $state(null)
  let dayCounts = $state(new Map())

  // Sync store to reactive state
  $effect(() => {
    return dailyActivity.subscribe(value => {
      dayCounts = value
    })
  })

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

  // Helper to format date as YYYY-MM-DD in local timezone
  const toLocalDateKey = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const activityData = $derived.by(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const pastDays = totalCells - futureDays

    const days = []
    // Past days (including today)
    for (let i = pastDays - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = toLocalDateKey(d)
      const count = dayCounts.get(key) || 0
      let level = 0
      if (count > 0) {
        level = Math.min(4, Math.ceil((count / ACTIVITY_MAX) * 4))
      }
      days.push({
        date: key,
        count,
        level,
        isFuture: false,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })
    }
    // Future days
    for (let i = 1; i <= futureDays; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      const key = toLocalDateKey(d)
      days.push({
        date: key,
        count: 0,
        level: 0,
        isFuture: true,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      })
    }
    return days
  })
</script>

<main>
  {#if showPracticedList}
    <div class="page-header">
      <h3>Unique Words Practiced <span class="practiced-count">| {practicedItems.length}</span></h3>
      <button type="button" class="page-close-btn" onclick={() => showPracticedList = false}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
      </button>
    </div>
    <section class="practiced-page">
      {#if chartData}
        {@const yMax = chartData.yMax}
        {@const ML = 44}
        {@const chartW = 600}
        {@const W = ML + chartW}
        {@const H = 140}
        {@const chartH = 100}
        {@const barW = 16}
        {@const gap = 4}
        {@const step = barW + gap}
        {@const toY = (v) => yMax > 0 ? chartH - (v / yMax) * chartH : chartH}
        <div class="chart-container" onmouseleave={() => hoveredBar = null}>
          <svg class="progress-chart" viewBox="0 0 {W} {H}">
            {#each chartData.ticks as tick}
              {@const y = toY(tick)}
              <line x1={ML} y1={y} x2={ML + chartW} y2={y} stroke="var(--muted)" stroke-opacity="0.12" stroke-width="1" />
              <text x={ML - 4} y={y + 6} text-anchor="end" font-size="21" fill="var(--muted)" opacity="0.5">{tick}</text>
            {/each}
            {#each chartData.bars as bar, i}
              {@const barH = yMax > 0 ? (bar.count / yMax) * chartH : 0}
              <rect
                x={ML + i * step}
                y={chartH - barH}
                width={barW}
                height={barH}
                rx="2"
                fill="var(--accent)"
                opacity={hoveredBar?.index === i ? 0.5 : 0.25}
              />
              <rect
                x={ML + i * step}
                y="0"
                width={step}
                height={chartH}
                fill="transparent"
                onmouseenter={() => hoveredBar = { index: i, bar, cumulative: chartData.cumulativeData[i] }}
                onclick={() => hoveredBar = hoveredBar?.index === i ? null : { index: i, bar, cumulative: chartData.cumulativeData[i] }}
              />
              {#if bar.monthLabel}
                <text
                  x={ML + i * step}
                  y={H - 4}
                  font-size="21"
                  fill="var(--muted)"
                  opacity="0.5"
                >{bar.monthLabel}</text>
              {/if}
            {/each}
            {#if chartData.maxCumulative > 0}
              <polyline
                fill="none"
                stroke="var(--accent)"
                stroke-width="2"
                points={chartData.cumulativeData.map((v, i) => `${ML + i * step + barW / 2},${toY(v)}`).join(' ')}
              />
            {/if}
          </svg>
          {#if hoveredBar}
            <div class="chart-tooltip" style="left: {((ML + hoveredBar.index * step + barW / 2) / W) * 100}%">
              <strong>{hoveredBar.bar.label}</strong><br>
              {hoveredBar.bar.count} attempt{hoveredBar.bar.count !== 1 ? 's' : ''} &middot; {hoveredBar.cumulative} word{hoveredBar.cumulative !== 1 ? 's' : ''}
            </div>
          {/if}
        </div>
      {/if}
      <div class="word-grid">
        {#each practicedItems as { item, group, stat } (`${group.group}-${item.id}`)}
          <div class="practiced-item">
            <span class="practiced-time">{timeAgo(stat.lastPracticedAt)}</span>
            {#if $currentDataset?.kind === 'chinese'}
              <GroupItemChinese {item} {stat} onclick={() => openWord(item)} />
            {:else if $currentDataset?.kind === 'english'}
              <GroupItemEnglish {item} onclick={() => openWord(item)} />
            {/if}
          </div>
        {/each}
      </div>
    </section>
  {:else}
  <header class="hero">
    <div class="hero-top">
      <div class="hero-brand">
        <a class="github-link" href="https://github.com/anukauchika/anukauchika.github.io" target="_blank" rel="noreferrer">
          <svg viewBox="0 0 16 16" width="24" height="24" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>
          <span class="github-text">Want to add vocabulary?<br>Contributions welcome</span>
        </a>
      </div>
      <h2 class="app-title">Anuka Uchika</h2>

      <select class="dataset-picker" bind:value={$datasetId}>
        {#each datasets as dataset}
          <option value={dataset.id}>{dataset.name}</option>
        {/each}
      </select>

      <div class="auth-section">
        {#if $user}
          <div class="auth-user">
            <button type="button" class="auth-avatar-btn" onclick={() => showAuthDropdown = true}>
              {#if avatarUrl && !avatarError}
                <img class="auth-avatar" src={avatarUrl} alt="Avatar" onerror={() => avatarError = true} />
              {:else}
                <span class="auth-avatar-fallback">{userInitials}</span>
              {/if}
            </button>
          </div>
        {:else}
          <div class="auth-signin">
            <button type="button" class="auth-icon-btn" onclick={() => showAuthDropdown = true} title="Sign in">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
            </button>
          </div>
        {/if}
      </div>
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
        <button type="button" class="stat-btn" onclick={() => activeStat = 'groups'}>
          <span class="stat-label">Groups</span>
          <span class="stat-value">{groupCount}</span>
        </button>
        <button type="button" class="stat-btn" onclick={() => activeStat = 'words'}>
          <span class="stat-label">Words</span>
          <span class="stat-value">{totalCount}</span>
        </button>
        <button type="button" class="stat-btn" onclick={() => activeStat = 'chars'}>
          <span class="stat-label">Chars</span>
          <span class="stat-value">{uniqueChars}</span>
        </button>
        {#if $isAuthenticated}
          <button type="button" class="stat-btn" onclick={() => showPracticedList = true}>
            <span class="stat-label">Practiced</span>
            <span class="stat-value">{practicedCount}</span>
          </button>
        {/if}
      </div>
    </div>
    {#if $isAuthenticated}
      <div class="progress-bar">
        <div class="progress-fill-words" style="width: {datasetProgress}%"></div>
        <div class="progress-fill-mastery" style="width: {datasetMastery}%"></div>
      </div>

      <div class="activity-line" bind:this={activityContainer}>
        {#each activityData as day}
          <button
            type="button"
            class="activity-cell"
            class:future={day.isFuture}
            class:selected={selectedDay?.date === day.date}
            data-level={day.level}
            title="{day.label}{day.isFuture ? '' : `: ${day.count} word${day.count !== 1 ? 's' : ''}`}"
            onclick={() => selectedDay = selectedDay?.date === day.date ? null : day}
          ></button>
        {/each}
      </div>
      {#if selectedDay}
        <div class="activity-info">
          <span class="activity-info-date">{selectedDay.label}</span>
          {#if !selectedDay.isFuture}
            <span class="activity-info-count">{selectedDay.count} word{selectedDay.count !== 1 ? 's' : ''}</span>
          {/if}
        </div>
      {/if}
    {:else}
      <p class="login-hint"><button type="button" class="login-hint-link" onclick={() => showAuthDropdown = true}>Log in</button> to track your learning progress</p>
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
            <button type="button" class:active={!$mainCompact} onclick={() => $mainCompact = false} title="Grid view">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            </button>
            <button type="button" class:active={$mainCompact} onclick={() => $mainCompact = true} title="List view">
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
          {#each $mainGroup as groupId (groupId)}
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
          {#if $mainGroup.length > 0}
            <button type="button" class="input-clear" onmousedown={(e) => { e.preventDefault(); e.stopPropagation(); $mainGroup = [] }}>&times;</button>
          {/if}
        </div>
      </label>

    </div>
  </header>

  <section class="groups" class:compact={$mainCompact}>
    {#if filteredGroups.length === 0}
      <div class="empty">
        <p>No matches. Try clearing filters or searching a different term.</p>
      </div>
    {:else if $mainCompact}
      <div class="compact-list">
        {#each filteredGroups as group (group.group)}
          {@const gs = $isAuthenticated ? $datasetGroupSessions.get(group.group) : null}
          <article class="compact-row">
            <div class="compact-main">
              <span class="compact-gid">{formatGroup(group.group)}</span>
              <span class="compact-passes">{#if gs}{gs.full}/{gs.total}{/if}</span>
              <span class="compact-date">{#if gs}{formatDate(gs.lastFullSessionAt)}{/if}</span>
              <span class="compact-actions">
                {#if $currentDataset?.kind === 'chinese'}
                  <a class="compact-icon" href={`${basePath}/practice.html?group=${group.group}&dataset=${$datasetId}`} title="Practice">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                  </a>
                {/if}
                <a class="compact-icon compact-icon-workbook" href={`${basePath}/workbook.html?group=${group.group}&dataset=${$datasetId}`} target="_blank" rel="noreferrer" title="Workbook">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                </a>
                <a class="compact-icon compact-icon-workbook" href={`${basePath}/workbook.html?group=${group.group}&dataset=${$datasetId}&autoprint=1`} target="_blank" rel="noreferrer" title="Print workbook">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                </a>
              </span>
            </div>
            {#if group.tags?.length}
              <div class="compact-tags">
                {#each group.tags as tag}<span class="compact-tag">#{tag}</span>{/each}
              </div>
            {/if}
            {#if $isAuthenticated}
              <div class="compact-progress">
                <div class="compact-progress-words" style="width: {getGroupProgress(group)}%"></div>
                <div class="compact-progress-mastery" style="width: {getGroupMastery(group)}%"></div>
              </div>
            {/if}
          </article>
        {/each}
      </div>
    {:else}
      {#each fullViewGroups as group, i (group.group)}
        {@const gs = $isAuthenticated ? $datasetGroupSessions.get(group.group) : null}
        <article class="group-card" style={`--delay:${i * 70}ms`}>
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
            {#if $isAuthenticated}
              <div class="group-progress">
                <div class="group-progress-words" style="width: {getGroupProgress(group)}%"></div>
                <div class="group-progress-mastery" style="width: {getGroupMastery(group)}%"></div>
              </div>
            {/if}
          </div>

          <div class="word-grid">
            {#each group.items as item (`${group.group}-${item.id}`)}
              {#if $currentDataset?.kind === 'chinese'}
                <GroupItemChinese {item} stat={$isAuthenticated ? $datasetStats.get(`${group.group}::${item.id}`) : null} onclick={() => openWord(item)} />
              {:else if $currentDataset?.kind === 'english'}
                <GroupItemEnglish {item} onclick={() => openWord(item)} />
              {/if}
            {/each}
          </div>
        </article>
      {/each}
      {#if isLimited}
        <button type="button" class="show-all-btn" onclick={() => showAllGroups = true}>
          Show all {filteredGroups.length} groups
        </button>
      {/if}
    {/if}
  </section>
  {/if}

  {#if activeStat}
    <div class="modal-backdrop">
      <button
        class="modal-overlay"
        type="button"
        aria-label="Close dialog"
        onclick={() => activeStat = null}
      ></button>
      <div class="stat-info-modal" role="dialog" aria-modal="true">
        {#if activeStat === 'groups'}
          <p>Number of vocabulary groups matching current filters.</p>
        {:else if activeStat === 'words'}
          <p>Total number of words in the filtered dataset.</p>
        {:else if activeStat === 'chars'}
          <p>Number of unique Chinese characters in the filtered dataset.</p>
        {/if}
      </div>
    </div>
  {/if}

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

  {#if showAuthDropdown}
    <div class="modal-backdrop">
      <button
        class="modal-overlay"
        type="button"
        aria-label="Close dialog"
        onclick={() => showAuthDropdown = false}
      ></button>
      {#if $user}
        <div class="auth-modal" role="dialog" aria-modal="true">
          <div class="auth-modal-user">
            <span class="auth-modal-name">{$user.user_metadata?.full_name || $user.email}</span>
            <span class="auth-modal-email">{$user.email}</span>
          </div>
          <button type="button" class="auth-modal-btn" onclick={() => { signOut(); showAuthDropdown = false }}>
            Sign out
          </button>
        </div>
      {:else}
        <div class="auth-modal" role="dialog" aria-modal="true">
          <p class="auth-modal-title">Sign in to sync progress</p>
          <button type="button" class="auth-modal-btn" onclick={() => { signInWithGoogle(); showAuthDropdown = false }}>
            <svg viewBox="0 0 24 24" width="20" height="20"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Sign in with Google
          </button>
        </div>
      {/if}
    </div>
  {/if}
</main>
