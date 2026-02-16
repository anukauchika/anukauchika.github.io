<script>
  import { datasets, datasetId, currentDataset } from '@app/state/registry.js'
  import { datasetStats, datasetStatsStroke, datasetStatsPinyin, datasetGroupSessions, datasetGroupSessionsStroke, datasetGroupSessionsPinyin, dailyActivity, loadDatasetStatsAll, loadDatasetGroupSessionsAll, loadDailyActivityAll } from '@app/state/kind/chinese/practice-stats.js'
  import { mainSearch, mainTags, mainGroups, mainListViewStyle, loadMainFilters } from '@app/state/filters.js'
  import { user, isAuthenticated, dbVersion, signInWithGoogle, signInWithApple, signInWithEmail, signOut } from '@app/state/auth.js'
  import { formatGroup, timeAgo } from '@std/format.js'
  import { pickNextPractice } from '@std/kind/chinese/pick-next-practice.js'
  import { calcStats, countPracticed, buildPracticedItems, buildPracticedCharsData, buildChartData, calcProgress, calcMastery, calcGroupProgress, calcGroupMastery, sortGroupsByLastPracticed } from '@app/std/kind/chinese/stats'
  import { filterGroups } from '@app/std/dataset'
  import PracticedWords from '@app/ui/PracticedWords.svelte'
  import PracticedChars from '@app/ui/PracticedChars.svelte'
  import PracticedGroups from '@app/ui/chinese/PracticedGroups.svelte'
  import CompactGroupList from '@app/ui/chinese/CompactGroupList.svelte'
  import GroupItemChinese from '@app/ui/chinese/GroupItem.svelte'
  import GroupItemEnglish from '@app/ui/english/GroupItem.svelte'
  import WordCardChinese from '@app/ui/chinese/WordCard.svelte'
  import WordCardEnglish from '@app/ui/english/WordCard.svelte'
  import HowItWorks from './how-it-works.svelte'
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

  const searchFields = $derived($currentDataset?.data?.search || [])
  const filteredGroups = $derived(filterGroups(groups, $mainSearch, $mainTags, $mainGroups, searchFields))

  const nextPractice = $derived.by(() => {
    if ($isAuthenticated) {
      return pickNextPractice(filteredGroups, $datasetGroupSessions, $datasetGroupSessionsStroke, $datasetGroupSessionsPinyin)
    }
    return filteredGroups.length > 0 ? { groupId: filteredGroups[0].group, type: 'stroke' } : null
  })
  const practiceHref = $derived.by(() => {
    const np = nextPractice
    const typeToPath = { stroke: 'hanzi', pinyin: 'pinyin' }
    return np ? `${basePath}/practice/${typeToPath[np.type] || 'hanzi'}?group=${np.groupId}&dataset=${$datasetId}` : null
  })

  const stats = $derived(calcStats(filteredGroups))
  const groupCount = $derived(stats.groups)
  const totalCount = $derived(stats.words)
  const uniqueChars = $derived(stats.chars)
  const practicedCharsData = $derived(buildPracticedCharsData(filteredGroups, $datasetStatsStroke, $datasetStatsPinyin))
  const practicedCharsCount = $derived(practicedCharsData.filter(c => c.practiced).length)
  const strokePracticedCount = $derived(countPracticed(filteredGroups, $datasetStatsStroke))
  const pinyinPracticedCount = $derived(countPracticed(filteredGroups, $datasetStatsPinyin))
  const practicedItems = $derived(buildPracticedItems(filteredGroups, $datasetStats))
  const chartData = $derived(buildChartData(practicedItems, dayCounts))
  const strokeProgress = $derived(calcProgress(filteredGroups, $datasetStatsStroke))
  const strokeMastery = $derived(calcMastery(filteredGroups, $datasetStatsStroke))
  const pinyinProgress = $derived(calcProgress(filteredGroups, $datasetStatsPinyin))
  const pinyinMastery = $derived(calcMastery(filteredGroups, $datasetStatsPinyin))

  const compactRowProps = (group, from) => {
    const fromParam = from ? `&from=${from}` : ''
    const isChinese = $currentDataset?.kind === 'chinese'
    const gsStroke = $datasetGroupSessionsStroke.get(group.group)
    const gsPinyin = $datasetGroupSessionsPinyin.get(group.group)
    return {
      groupId: formatGroup(group.group),
      lastPracticed: $isAuthenticated ? timeAgo($datasetGroupSessions.get(group.group)?.lastPracticedAt) : undefined,
      tags: group.tags,
      strokeHref: isChinese ? `${basePath}/practice/hanzi?group=${group.group}&dataset=${$datasetId}${fromParam}` : undefined,
      pinyinHref: isChinese ? `${basePath}/practice/pinyin?group=${group.group}&dataset=${$datasetId}${fromParam}` : undefined,
      strokeSessions: gsStroke?.full ?? 0,
      pinyinSessions: gsPinyin?.full ?? 0,
      strokeProgress: $isAuthenticated ? calcGroupProgress(group, $datasetStatsStroke) : 0,
      strokeMastery: $isAuthenticated ? calcGroupMastery(group, $datasetGroupSessionsStroke) : 0,
      pinyinProgress: $isAuthenticated ? calcGroupProgress(group, $datasetStatsPinyin) : 0,
      pinyinMastery: $isAuthenticated ? calcGroupMastery(group, $datasetGroupSessionsPinyin) : 0,
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
      strokeHref: isChinese ? `${basePath}/practice/hanzi?group=${group.group}&dataset=${$datasetId}` : undefined,
      pinyinHref: isChinese ? `${basePath}/practice/pinyin?group=${group.group}&dataset=${$datasetId}` : undefined,
      workbookHref: `${basePath}/workbook?group=${group.group}&dataset=${$datasetId}`,
      printHref: `${basePath}/workbook?group=${group.group}&dataset=${$datasetId}&autoprint=1`,
      strokeSessions: gsStroke?.full ?? 0,
      pinyinSessions: gsPinyin?.full ?? 0,
      strokeProgress: $isAuthenticated ? calcGroupProgress(group, $datasetStatsStroke) : 0,
      strokeMastery: $isAuthenticated ? calcGroupMastery(group, $datasetGroupSessionsStroke) : 0,
      pinyinProgress: $isAuthenticated ? calcGroupProgress(group, $datasetStatsPinyin) : 0,
      pinyinMastery: $isAuthenticated ? calcGroupMastery(group, $datasetGroupSessionsPinyin) : 0,
      showProgress: $isAuthenticated,
      items: group.items.map(item => ({
        item,
        strokeStat: $isAuthenticated ? $datasetStatsStroke.get(`${group.group}::${item.id}`) : null,
        pinyinStat: $isAuthenticated ? $datasetStatsPinyin.get(`${group.group}::${item.id}`) : null,
      })),
    }
  }

  const practicedGroupsSorted = $derived(sortGroupsByLastPracticed(filteredGroups, $datasetGroupSessions))

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
