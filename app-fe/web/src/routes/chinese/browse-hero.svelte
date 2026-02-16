<script>
  import { goto } from '$app/navigation'
  import { datasets, datasetId, currentDataset } from '@app/state/registry.js'
  import { datasetStatsStroke, datasetStatsPinyin, datasetGroupSessions, datasetGroupSessionsStroke, datasetGroupSessionsPinyin, dailyActivity } from '@app/state/kind/chinese/practice-stats.js'
  import { mainSearch, mainTags, mainGroups, mainListViewStyle, groups, filteredGroups } from '@app/state/filters.js'
  import { user, isAuthenticated, signInWithGoogle, signInWithEmail, signOut } from '@app/state/auth.js'
  import { pickNextPractice } from '@std/kind/chinese/pick-next-practice.js'
  import { calcStats, countPracticed, calcProgress, calcMastery } from '@app/std/kind/chinese/stats'
  import Hero from '@app/ui/hero'
  import Toolbar from '@app/ui/hero/toolbar.svelte'
  import Filters from '@app/ui/hero/filters.svelte'
  import AuthModal from '@app/ui/auth-modal.svelte'

  let { onShowStatInfo } = $props()

  let showAuthDropdown = $state(false)

  const basePath = $derived.by(() => `/${$currentDataset.kind}`)

  const nextPractice = $derived.by(() => {
    if ($isAuthenticated) {
      return pickNextPractice($filteredGroups, $datasetGroupSessions, $datasetGroupSessionsStroke, $datasetGroupSessionsPinyin)
    }
    return $filteredGroups.length > 0 ? { groupId: $filteredGroups[0].group, type: 'stroke' } : null
  })
  const practiceHref = $derived.by(() => {
    const np = nextPractice
    const typeToPath = { stroke: 'hanzi', pinyin: 'pinyin' }
    return np ? `${basePath}/practice/${typeToPath[np.type] || 'hanzi'}?group=${np.groupId}&dataset=${$datasetId}` : null
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
    return dailyActivity.subscribe(value => {
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
  {groupCount} {totalCount} {uniqueChars} {strokePracticedCount}
  {strokeProgress} {strokeMastery} {pinyinProgress} {pinyinMastery}
  {practiceHref}
  onShowAuthDropdown={() => showAuthDropdown = true}
  onShowPracticedGroups={() => goto('/chinese/groups')}
  onShowPracticedList={() => goto('/chinese/words')}
  onShowPracticedChars={() => goto('/chinese/chars')}
  onShowHowItWorks={() => goto('/chinese/how-it-works')}
  {onShowStatInfo}
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
      groups={$groups}
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

{#if showAuthDropdown}
  <AuthModal
    user={$user}
    onclose={() => showAuthDropdown = false}
    onSignInWithGoogle={signInWithGoogle}
    onSignInWithEmail={signInWithEmail}
    onSignOut={signOut}
  />
{/if}
