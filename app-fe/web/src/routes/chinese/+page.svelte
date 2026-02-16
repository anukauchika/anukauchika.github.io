<script>
  import { goto } from '$app/navigation'
  import { datasets, datasetId, currentDataset } from '@app/state/registry.js'
  import { datasetStats, datasetStatsStroke, datasetStatsPinyin, datasetGroupSessions, datasetGroupSessionsStroke, datasetGroupSessionsPinyin, dailyActivity, loadDatasetStatsAll, loadDatasetGroupSessionsAll, loadDailyActivityAll } from '@app/state/kind/chinese/practice-stats.js'
  import { mainSearch, mainTags, mainGroups, mainListViewStyle, loadMainFilters } from '@app/state/filters.js'
  import { user, isAuthenticated, dbVersion, signInWithGoogle, signInWithEmail, signOut } from '@app/state/auth.js'
  import { formatGroup, timeAgo } from '@std/format.js'
  import { pickNextPractice } from '@std/kind/chinese/pick-next-practice.js'
  import { calcStats, countPracticed, buildPracticedItems, buildPracticedCharsData, buildChartData, calcProgress, calcMastery, calcGroupProgress, calcGroupMastery, sortGroupsByLastPracticed } from '@app/std/kind/chinese/stats'
  import { filterGroups } from '@app/std/dataset'
  import CompactGroupList from '@app/ui/chinese/CompactGroupList.svelte'
  import GroupItemChinese from '@app/ui/chinese/GroupItem.svelte'
  import GroupItemEnglish from '@app/ui/english/GroupItem.svelte'
  import WordCardChinese from '@app/ui/chinese/WordCard.svelte'
  import WordCardEnglish from '@app/ui/english/WordCard.svelte'
  import Hero from '@app/ui/hero'
  import Toolbar from '@app/ui/hero/Toolbar.svelte'
  import Filters from '@app/ui/hero/Filters.svelte'
  import Groups from '@app/ui/groups'
  import Modal from '@std/ui/Modal.svelte'
  import Island from '@std/ui/Island.svelte'
  import AuthModal from '@app/ui/auth-modal.svelte'

  const basePath = $derived.by(() => `/${$currentDataset.kind}`)
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
  let activeStat = $state(null)

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

  $effect(() => {
    return dailyActivity.subscribe(value => {
      dayCounts = value
    })
  })
</script>

<svelte:head>
  <title>Anuka Uchika - Chinese</title>
  <meta name="description" content="HSK Chinese characters with stroke & pinyin practice, focused word groups, stats-driven repetition and progress tracking" />
</svelte:head>

<main class="anuka-page">
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
    onShowPracticedGroups={() => goto('/chinese/groups')}
    onShowPracticedList={() => goto('/chinese/words')}
    onShowPracticedChars={() => goto('/chinese/chars')}
    onShowHowItWorks={() => goto('/chinese/how-it-works')}
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
    <AuthModal
      user={$user}
      onclose={() => showAuthDropdown = false}
      onSignInWithGoogle={signInWithGoogle}
      onSignInWithEmail={signInWithEmail}
      onSignOut={signOut}
    />
  {/if}
</main>
