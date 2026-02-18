<script>
  import { goto } from '$app/navigation'
  import { datasetsMeta, datasetId, currentDataset, search, tags, selectedGroups, viewMode, groups, filteredGroups } from '@stt/dataset.js'
  import { datasetService } from '@svc/dataset-service'
  import {
    datasetStatsStroke,
    datasetStatsPinyin,
    datasetGroupSessions,
    datasetGroupSessionsStroke,
    datasetGroupSessionsPinyin,
    dailyActivity,
  } from '@stt/kind/chinese/practice-stats.js'
  import { user, isAuthenticated, signInWithGoogle, signInWithEmail, signOut } from '@stt/auth.js'
  import { pickNextPractice } from '@std/kind/chinese/pick-next-practice.js'
  import { calcStats, countPracticed, calcProgress, calcMastery } from '@std/kind/chinese/stats'
  import { GroupViewMode } from '@dom/dataset'
  import Hero from '@uic/hero'
  import Toolbar from '@uic/hero/toolbar.svelte'
  import Filters from '@uic/hero/filters.svelte'
  import AuthModal from '@uic/auth-modal.svelte'

  let showAuthDropdown = $state(false)

  const basePath = $derived.by(() => `/${$currentDataset?.kind}`)

  const nextPractice = $derived.by(() => {
    if ($isAuthenticated) {
      return pickNextPractice(
        $filteredGroups,
        $datasetGroupSessions,
        $datasetGroupSessionsStroke,
        $datasetGroupSessionsPinyin,
      )
    }
    return $filteredGroups.length > 0 ? { groupId: $filteredGroups[0].id, type: 'stroke' } : null
  })
  const practiceHref = $derived.by(() => {
    const np = nextPractice
    const typeToPath = { stroke: 'hanzi', pinyin: 'pinyin' }
    return np
      ? `${basePath}/practice/${typeToPath[np.type] || 'hanzi'}?group=${np.groupId}&dataset=${$datasetId}`
      : null
  })

  const stats = $derived(calcStats($filteredGroups))
  const groupCount = $derived(stats.groups)
  const totalCount = $derived(stats.words)
  const uniqueChars = $derived(stats.chars)
  const strokePracticedCount = $derived(countPracticed($filteredGroups, $datasetStatsStroke))
  const strokeProgress = $derived(calcProgress($filteredGroups, $datasetStatsStroke))
  const strokeMastery = $derived(calcMastery($filteredGroups, $datasetStatsStroke))
  const pinyinProgress = $derived(calcProgress($filteredGroups, $datasetStatsPinyin))
  const pinyinMastery = $derived(calcMastery($filteredGroups, $datasetStatsPinyin))

  let dayCounts = $state(new Map())

  $effect(() => {
    return dailyActivity.subscribe((value) => {
      dayCounts = value
    })
  })
</script>

<Hero
  datasetName={$currentDataset?.name}
  datasetDescription={$currentDataset?.description}
  datasetTags={$currentDataset?.tags}
  datasetId={$datasetId}
  dailyActivity={dayCounts}
  isAuthenticated={$isAuthenticated}
  {groupCount}
  {totalCount}
  {uniqueChars}
  {strokePracticedCount}
  {strokeProgress}
  {strokeMastery}
  {pinyinProgress}
  {pinyinMastery}
  {practiceHref}
  onShowAuthDropdown={() => (showAuthDropdown = true)}
  onShowPracticedGroups={() => goto('/chinese/groups')}
  onShowPracticedList={() => goto('/chinese/words')}
  onShowPracticedChars={() => goto('/chinese/chars')}
  onShowHowItWorks={() => goto('/chinese/how-it-works')}
>
  {#snippet toolbar()}
    <Toolbar
      datasets={$datasetsMeta}
      datasetId={$datasetId}
      appTitle={$currentDataset?.appTitle}
      user={$user}
      onDatasetChange={(id) => datasetService.selectDataset(id)}
      onShowAuthDropdown={() => (showAuthDropdown = true)}
    />
  {/snippet}
  {#snippet filters()}
    <Filters
      groups={$groups}
      search={$search}
      tags={$tags}
      selectedGroups={$selectedGroups}
      listViewStyle={$viewMode}
      onSearchChange={(v) => datasetService.setSearch(v)}
      onTagAdd={(tag) => {
        if (!$tags.includes(tag)) datasetService.setTags([...$tags, tag])
      }}
      onTagRemove={(tag) => datasetService.setTags($tags.filter((t) => t !== tag))}
      onTagsClear={() => datasetService.setTags([])}
      onGroupAdd={(id) => {
        if (!$selectedGroups.includes(id)) datasetService.setGroups([...$selectedGroups, id])
      }}
      onGroupRemove={(id) => datasetService.setGroups($selectedGroups.filter((g) => g !== id))}
      onGroupsClear={() => datasetService.setGroups([])}
      onToggleView={() => datasetService.setViewMode($viewMode === GroupViewMode.Full ? GroupViewMode.Compact : GroupViewMode.Full)}
    />
  {/snippet}
</Hero>

{#if showAuthDropdown}
  <AuthModal
    user={$user}
    onclose={() => (showAuthDropdown = false)}
    onSignInWithGoogle={signInWithGoogle}
    onSignInWithEmail={signInWithEmail}
    onSignOut={signOut}
  />
{/if}
