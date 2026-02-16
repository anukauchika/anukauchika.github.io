<script>
  import { datasets, datasetId, currentDataset } from '@app/state/registry.js'
  import { datasetStats, datasetStatsStroke, datasetStatsPinyin, datasetGroupSessions, datasetGroupSessionsStroke, datasetGroupSessionsPinyin, dailyActivity, loadDatasetStatsAll, loadDatasetGroupSessionsAll, loadDailyActivityAll } from '@app/state/kind/chinese/practice-stats.js'
  import { mainSearch, mainTags, mainGroups, mainListViewStyle, loadMainFilters } from '@app/state/filters.js'
  import { user, isAuthenticated, dbVersion, signInWithGoogle, signInWithApple, signInWithEmail, signOut } from '@app/state/auth.js'
  import { formatGroup, toLocalDateKey, timeAgo } from '@std/format.js'
  import { pickNextPractice } from '@std/kind/chinese/pick-next-practice.js'
  import PracticedWords from '@app/ui/PracticedWords.svelte'
  import PracticedChars from '@app/ui/PracticedChars.svelte'
  import PracticedGroups from '@app/ui/chinese/PracticedGroups.svelte'
  import CompactGroupList from '@app/ui/chinese/CompactGroupList.svelte'
  import GroupItemChinese from '@app/ui/chinese/GroupItem.svelte'
  import GroupItemEnglish from '@app/ui/english/GroupItem.svelte'
  import WordCardChinese from '@app/ui/chinese/WordCard.svelte'
  import WordCardEnglish from '@app/ui/english/WordCard.svelte'
  import HowItWorks from './HowItWorks.svelte'
  import Hero from '@app/ui/hero'
  import Toolbar from '@app/ui/hero/Toolbar.svelte'
  import Filters from '@app/ui/hero/Filters.svelte'
  import Groups from '@app/ui/groups'
  import Modal from '@std/ui/Modal.svelte'
  import Island from '@std/ui/Island.svelte'

  const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, '') || ''
  const basePath = $derived.by(() => `${baseUrl}/${$currentDataset.kind}`)
  const groups = $derived.by(() => $currentDataset?.data?.groups ?? [])

  const reloadStats = () => {
    if ($datasetId) {
      loadDatasetStatsAll($datasetId)
      loadDatasetGroupSessionsAll($datasetId)
      loadDailyActivityAll($datasetId)
    }
  }

  $effect(() => {
    $dbVersion
    if ($datasetId) {
      reloadStats()
      loadMainFilters($datasetId)
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

  let activeWord = $state(null)
  let modalOpen = $state(false)
  let showAuthDropdown = $state(false)
  let showPracticedList = $state(false)
  let showPracticedGroups = $state(false)
  let showPracticedChars = $state(false)
  let showHowItWorks = $state(false)
  let activeStat = $state(null)
  let emailInput = $state('')
  let emailSent = $state(false)
  let emailError = $state('')

  // Restore page view from URL param (e.g., returning from practice)
  {
    const params = new URLSearchParams(window.location.search)
    const from = params.get('from')
    if ($isAuthenticated) {
      if (from === 'groups') showPracticedGroups = true
      if (from === 'words') showPracticedList = true
      if (from === 'chars') showPracticedChars = true
    }
    if (from) {
      params.delete('from')
      const qs = params.toString()
      history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`)
    }
  }

  function focus(node) { node.focus() }


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
    if ($mainGroups.length === 0) return true
    return $mainGroups.includes(groupId)
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
    if ($mainGroups.length > 0) {
      const validIds = new Set(groups.map((g) => g.group))
      const filtered = $mainGroups.filter((id) => validIds.has(id))
      if (filtered.length !== $mainGroups.length) {
        $mainGroups = filtered
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

  const nextPractice = $derived.by(() => {
    if ($isAuthenticated) {
      return pickNextPractice(filteredGroups, $datasetGroupSessions, $datasetGroupSessionsStroke, $datasetGroupSessionsPinyin)
    }
    return filteredGroups.length > 0 ? { groupId: filteredGroups[0].group, type: 'stroke' } : null
  })
  const practiceHref = $derived.by(() => {
    const np = nextPractice
    return np ? `${basePath}/practice.html?group=${np.groupId}&dataset=${$datasetId}&type=${np.type}` : null
  })

  const groupCount = $derived.by(() => filteredGroups.length)
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
  const practicedCharsData = $derived.by(() => {
    const isCJK = (c) => c >= '\u4E00' && c <= '\u9FFF'
    const addStat = (obj, stat) => {
      if (!stat) return
      obj.successCount += stat.successCount ?? 0
      obj.errorCount += stat.errorCount ?? 0
    }
    const emptyStat = () => ({ successCount: 0, errorCount: 0 })
    const charMap = new Map()
    filteredGroups.forEach((g) => {
      g.items.forEach((item) => {
        const word = item.word || ''
        const key = `${g.group}::${item.id}`
        const sStat = $datasetStatsStroke.get(key)
        const pStat = $datasetStatsPinyin.get(key)
        const hasStat = sStat || pStat
        for (const char of word) {
          if (!isCJK(char)) continue
          const existing = charMap.get(char)
          if (existing) {
            existing.wordCount++
            if (hasStat) {
              existing.practiced = true
              addStat(existing.stroke, sStat)
              addStat(existing.pinyin, pStat)
              const lp = sStat?.lastPracticedAt > (pStat?.lastPracticedAt ?? '') ? sStat.lastPracticedAt : pStat?.lastPracticedAt
              if (lp && (!existing.lastPracticedAt || lp > existing.lastPracticedAt)) {
                existing.lastPracticedAt = lp
              }
            }
          } else {
            const stroke = emptyStat()
            const pinyin = emptyStat()
            addStat(stroke, sStat)
            addStat(pinyin, pStat)
            const lp = (sStat?.lastPracticedAt ?? '') > (pStat?.lastPracticedAt ?? '') ? sStat?.lastPracticedAt : pStat?.lastPracticedAt
            charMap.set(char, {
              char,
              wordCount: 1,
              stroke,
              pinyin,
              lastPracticedAt: lp ?? null,
              practiced: !!hasStat,
            })
          }
        }
      })
    })
    const chars = Array.from(charMap.values())
    chars.sort((a, b) => (b.lastPracticedAt ?? '').localeCompare(a.lastPracticedAt ?? ''))
    return chars
  })
  const practicedCharsCount = $derived(practicedCharsData.filter(c => c.practiced).length)
  const practicedCount = $derived.by(() => {
    let count = 0
    filteredGroups.forEach((g) => {
      g.items.forEach((item) => {
        if ($datasetStats.has(`${g.group}::${item.id}`)) count++
      })
    })
    return count
  })
  const countPracticed = (statsMap) => {
    let count = 0
    filteredGroups.forEach((g) => {
      g.items.forEach((item) => {
        if (statsMap.has(`${g.group}::${item.id}`)) count++
      })
    })
    return count
  }
  const strokePracticedCount = $derived(countPracticed($datasetStatsStroke))
  const pinyinPracticedCount = $derived(countPracticed($datasetStatsPinyin))
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
      const entry = dayCounts.get(key) || { count: 0, durationMs: 0, sessions: 0 }
      const count = entry.count
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
        if (stat.lastPracticedAt && toLocalDateKey(new Date(stat.lastPracticedAt)) <= bar.date) cum++
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

  // Per-type progress/mastery helpers
  const calcProgress = (statsMap) => {
    if (totalCount === 0) return 0
    let count = 0
    filteredGroups.forEach((g) => {
      g.items.forEach((item) => {
        if (statsMap.has(`${g.group}::${item.id}`)) count++
      })
    })
    return Math.round((count / totalCount) * 100)
  }
  const calcMastery = (statsMap) => {
    if (totalCount === 0) return 0
    let sum = 0
    filteredGroups.forEach((g) => {
      g.items.forEach((item) => {
        const stat = statsMap.get(`${g.group}::${item.id}`)
        sum += Math.min((stat?.successCount ?? 0) / 10, 1)
      })
    })
    return Math.round((sum / totalCount) * 100)
  }
  const strokeProgress = $derived(calcProgress($datasetStatsStroke))
  const strokeMastery = $derived(calcMastery($datasetStatsStroke))
  const pinyinProgress = $derived(calcProgress($datasetStatsPinyin))
  const pinyinMastery = $derived(calcMastery($datasetStatsPinyin))

  const getGroupProgress = (group, statsMap) => {
    const practiced = group.items.filter(item =>
      statsMap.has(`${group.group}::${item.id}`)
    ).length
    return group.items.length > 0 ? Math.round((practiced / group.items.length) * 100) : 0
  }
  const getGroupMastery = (group, sessionsMap) => {
    const fullSessions = sessionsMap.get(group.group)?.full ?? 0
    return Math.min(Math.round((fullSessions / 10) * 100), 100)
  }

  const compactRowProps = (group, from) => {
    const fromParam = from ? `&from=${from}` : ''
    const isChinese = $currentDataset?.kind === 'chinese'
    const gsStroke = $datasetGroupSessionsStroke.get(group.group)
    const gsPinyin = $datasetGroupSessionsPinyin.get(group.group)
    return {
      groupId: formatGroup(group.group),
      lastPracticed: $isAuthenticated ? timeAgo($datasetGroupSessions.get(group.group)?.lastPracticedAt) : undefined,
      tags: group.tags,
      strokeHref: isChinese ? `${basePath}/practice.html?group=${group.group}&dataset=${$datasetId}&type=stroke${fromParam}` : undefined,
      pinyinHref: isChinese ? `${basePath}/practice.html?group=${group.group}&dataset=${$datasetId}&type=pinyin${fromParam}` : undefined,
      strokeSessions: gsStroke?.full ?? 0,
      pinyinSessions: gsPinyin?.full ?? 0,
      strokeProgress: $isAuthenticated ? getGroupProgress(group, $datasetStatsStroke) : 0,
      strokeMastery: $isAuthenticated ? getGroupMastery(group, $datasetGroupSessionsStroke) : 0,
      pinyinProgress: $isAuthenticated ? getGroupProgress(group, $datasetStatsPinyin) : 0,
      pinyinMastery: $isAuthenticated ? getGroupMastery(group, $datasetGroupSessionsPinyin) : 0,
    }
  }

  const fullGroupProps = (group) => {
    const isChinese = $currentDataset?.kind === 'chinese'
    const gsStroke = $datasetGroupSessionsStroke.get(group.group)
    const gsPinyin = $datasetGroupSessionsPinyin.get(group.group)
    return {
      groupId: formatGroup(group.group),
      tags: group.tags,
      kind: $currentDataset?.kind,
      strokeHref: isChinese ? `${basePath}/practice.html?group=${group.group}&dataset=${$datasetId}&type=stroke` : undefined,
      pinyinHref: isChinese ? `${basePath}/practice.html?group=${group.group}&dataset=${$datasetId}&type=pinyin` : undefined,
      workbookHref: `${basePath}/workbook.html?group=${group.group}&dataset=${$datasetId}`,
      printHref: `${basePath}/workbook.html?group=${group.group}&dataset=${$datasetId}&autoprint=1`,
      strokeSessions: gsStroke?.full ?? 0,
      pinyinSessions: gsPinyin?.full ?? 0,
      strokeProgress: $isAuthenticated ? getGroupProgress(group, $datasetStatsStroke) : 0,
      strokeMastery: $isAuthenticated ? getGroupMastery(group, $datasetGroupSessionsStroke) : 0,
      pinyinProgress: $isAuthenticated ? getGroupProgress(group, $datasetStatsPinyin) : 0,
      pinyinMastery: $isAuthenticated ? getGroupMastery(group, $datasetGroupSessionsPinyin) : 0,
      showProgress: $isAuthenticated,
      items: group.items.map(item => ({
        item,
        strokeStat: $isAuthenticated ? $datasetStatsStroke.get(`${group.group}::${item.id}`) : null,
        pinyinStat: $isAuthenticated ? $datasetStatsPinyin.get(`${group.group}::${item.id}`) : null,
      })),
    }
  }

  const practicedGroupsSorted = $derived.by(() => {
    return [...filteredGroups].sort((a, b) => {
      const gsA = $datasetGroupSessions.get(a.group)
      const gsB = $datasetGroupSessions.get(b.group)
      const tA = gsA?.lastPracticedAt ?? ''
      const tB = gsB?.lastPracticedAt ?? ''
      return tB.localeCompare(tA)
    })
  })

  let dayCounts = $state(new Map())

  // Sync store to reactive state
  $effect(() => {
    return dailyActivity.subscribe(value => {
      dayCounts = value
    })
  })


</script>

<main class="anuka-page">
  {#if showPracticedList}
    <PracticedWords
      items={practicedItems}
      {chartData}
      practicedCount={practicedItems.length}
      {totalCount}
      onclose={() => showPracticedList = false}
    >
      {#snippet itemSnippet(entry)}
        {#if $currentDataset?.kind === 'chinese'}
          <GroupItemChinese item={entry.item} strokeStat={$datasetStatsStroke.get(`${entry.group.group}::${entry.item.id}`)} pinyinStat={$datasetStatsPinyin.get(`${entry.group.group}::${entry.item.id}`)} onclick={() => openWord(entry.item)} />
        {:else if $currentDataset?.kind === 'english'}
          <GroupItemEnglish item={entry.item} onclick={() => openWord(entry.item)} />
        {/if}
      {/snippet}
    </PracticedWords>
  {:else if showPracticedGroups}
    <PracticedGroups
      groups={practicedGroupsSorted.map(g => compactRowProps(g, 'groups'))}
      practicedCount={practicedGroupsSorted.filter(g => $datasetGroupSessions.has(g.group)).length}
      totalCount={practicedGroupsSorted.length}
      onclose={() => showPracticedGroups = false}
    />
  {:else if showPracticedChars}
    <PracticedChars
      chars={practicedCharsData}
      practicedCount={practicedCharsCount}
      {uniqueChars}
      onclose={() => showPracticedChars = false}
    />
  {:else if showHowItWorks}
    <HowItWorks onClose={() => showHowItWorks = false} />
  {:else}
  <Hero
    datasetName={$currentDataset?.name}
    datasetDescription={$currentDataset?.description}
    datasetTags={$currentDataset?.tags}
    datasetId={$datasetId}
    dailyActivity={dayCounts}
    isAuthenticated={$isAuthenticated}
    {groupCount} {totalCount} {uniqueChars} {strokePracticedCount}
    {strokeProgress} {strokeMastery} {pinyinProgress} {pinyinMastery}
    {practiceHref}
    onShowAuthDropdown={() => showAuthDropdown = true}
    onShowPracticedGroups={() => showPracticedGroups = true}
    onShowPracticedList={() => showPracticedList = true}
    onShowPracticedChars={() => showPracticedChars = true}
    onShowHowItWorks={() => showHowItWorks = true}
    onShowStatInfo={(stat) => activeStat = stat}
  >
    {#snippet toolbar()}
      <Toolbar
        {datasets}
        datasetId={$datasetId}
        appTitle={$currentDataset?.appTitle}
        user={$user}
        onDatasetChange={(id) => $datasetId = id}
        onShowAuthDropdown={() => showAuthDropdown = true}
      />
    {/snippet}
    {#snippet filters()}
      <Filters
        groups={groups}
        search={$mainSearch}
        tags={$mainTags}
        selectedGroups={$mainGroups}
        listViewStyle={$mainListViewStyle}
        onSearchChange={(v) => $mainSearch = v}
        onTagAdd={(tag) => { if (!$mainTags.includes(tag)) $mainTags = [...$mainTags, tag] }}
        onTagRemove={(tag) => $mainTags = $mainTags.filter(t => t !== tag)}
        onTagsClear={() => $mainTags = []}
        onGroupAdd={(id) => { if (!$mainGroups.includes(id)) $mainGroups = [...$mainGroups, id] }}
        onGroupRemove={(id) => $mainGroups = $mainGroups.filter(g => g !== id)}
        onGroupsClear={() => $mainGroups = []}
        onToggleView={() => $mainListViewStyle = $mainListViewStyle === 'full' ? 'compact' : 'full'}
      />
    {/snippet}
  </Hero>

  <Groups
    groups={filteredGroups.map(g => fullGroupProps(g))}
    viewStyle={$mainListViewStyle}
    hasSearch={$mainSearch.trim().length > 0}
    datasetId={$datasetId}
  >
    {#snippet compact()}
      <CompactGroupList groups={filteredGroups.map(g => compactRowProps(g))} />
    {/snippet}
  </Groups>
  {/if}

  {#if activeStat}
    <Modal onclose={() => activeStat = null}>
      <Island>
        <div class="anuka-stack anuka-center" role="dialog" aria-modal="true">
          {#if activeStat === 'words'}
            <div>Total number of words in the filtered dataset.</div>
          {/if}
        </div>
      </Island>
    </Modal>
  {/if}

  {#if modalOpen && activeWord}
    <Modal onclose={closeModal}>
      {#if $currentDataset?.kind === 'chinese'}
        <WordCardChinese item={activeWord} onClose={closeModal} />
      {:else if $currentDataset?.kind === 'english'}
        <WordCardEnglish item={activeWord} onClose={closeModal} />
      {/if}
    </Modal>
  {/if}

  {#if showAuthDropdown}
    <Modal onclose={() => { showAuthDropdown = false; emailSent = false; emailError = ''; emailInput = '' }}>
      {#if $user}
        <Island>
          <div class="anuka-stack anuka-center" role="dialog" aria-modal="true">
            <div class="anuka-stack anuka-compact anuka-center">
              <strong>{$user.user_metadata?.full_name || $user.email}</strong>
              <small class="anuka-mute">{$user.email}</small>
            </div>
            <button type="button" class="anuka-btn" onclick={() => { signOut(); showAuthDropdown = false }}>
              Sign out
            </button>
          </div>
        </Island>
      {:else}
        <Island>
          <div class="anuka-stack anuka-center" role="dialog" aria-modal="true">
            <p class="anuka-app-title">ANUKA UCHIKA</p>
            <button type="button" class="anuka-btn" onclick={() => { signInWithGoogle(); showAuthDropdown = false }}>
              <svg viewBox="0 0 24 24" width="20" height="20"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Sign in with Google
            </button>
            <div class="anuka-divider"><span>or</span></div>
            {#if emailSent}
              <div class="anuka-main anuka-sm">Check your email for the login link</div>
            {:else}
              <form class="anuka-stack anuka-compact" onsubmit={(e) => {
                e.preventDefault()
                emailError = ''
                signInWithEmail(emailInput)
                  .then(() => { emailSent = true })
                  .catch((err) => { emailError = err.message })
              }}>
                <input type="email" class="anuka-input" bind:value={emailInput} placeholder="Email" required use:focus />
                {#if emailError}<div class="anuka-fail anuka-sm">{emailError}</div>{/if}
                <button type="submit" class="anuka-btn">Send Sign In Link</button>
              </form>
            {/if}
          </div>
        </Island>
      {/if}
    </Modal>
  {/if}
</main>
