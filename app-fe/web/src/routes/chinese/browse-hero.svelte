<script>
  import { goto } from '$app/navigation'
  import { sttDataset } from '@stt/dataset.svelte.js'
  import { svcDataset } from '@svc/dataset'
  import { ps } from '@stt/kind/chinese/practice-stats.js'
  import { user, isAuthenticated, signInWithGoogle, signInWithEmail, signOut } from '@stt/auth.js'
  import { pickNextPractice } from '@std/kind/chinese/pick-next-practice.js'
  import { calcStats, countPracticed, calcProgress, calcMastery } from '@std/kind/chinese/stats'
  import { GroupViewMode } from '@dom/dataset'
  import Hero from '@uic/hero'
  import Toolbar from '@uic/hero/toolbar.svelte'
  import Filters from '@uic/hero/filters.svelte'
  import AuthModal from '@uic/auth-modal.svelte'

  let showAuthDropdown = $state(false)

  const basePath = $derived.by(() => `/${sttDataset.current?.kind}`)

  const nextPractice = $derived.by(() => {
    if ($isAuthenticated) {
      return pickNextPractice(
        sttDataset.filtered,
        $ps.datasetGroupSessions,
        $ps.datasetGroupSessionsStroke,
        $ps.datasetGroupSessionsPinyin,
      )
    }
    return sttDataset.filtered.length > 0 ? { groupId: sttDataset.filtered[0].id, type: 'stroke' } : null
  })
  const practiceHref = $derived.by(() => {
    const np = nextPractice
    const typeToPath = { stroke: 'hanzi', pinyin: 'pinyin' }
    return np
      ? `${basePath}/practice/${typeToPath[np.type] || 'hanzi'}?group=${np.groupId}&dataset=${sttDataset.id}`
      : null
  })

  const stats = $derived(calcStats(sttDataset.filtered))
  const groupCount = $derived(stats.groups)
  const totalCount = $derived(stats.words)
  const uniqueChars = $derived(stats.chars)
  const strokePracticedCount = $derived(countPracticed(sttDataset.filtered, $ps.datasetStatsStroke))
  const strokeProgress = $derived(calcProgress(sttDataset.filtered, $ps.datasetStatsStroke))
  const strokeMastery = $derived(calcMastery(sttDataset.filtered, $ps.datasetStatsStroke))
  const pinyinProgress = $derived(calcProgress(sttDataset.filtered, $ps.datasetStatsPinyin))
  const pinyinMastery = $derived(calcMastery(sttDataset.filtered, $ps.datasetStatsPinyin))

  const dayCounts = $derived($ps.dailyActivity)
</script>

<Hero
  datasetName={sttDataset.current?.name}
  datasetDescription={sttDataset.current?.description}
  datasetTags={sttDataset.current?.tags}
  datasetId={sttDataset.id}
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
      datasets={sttDataset.meta}
      datasetId={sttDataset.id}
      appTitle={sttDataset.current?.appTitle}
      user={$user}
      onDatasetChange={(id) => svcDataset.selectDataset(id)}
      onShowAuthDropdown={() => (showAuthDropdown = true)}
    />
  {/snippet}
  {#snippet filters()}
    <Filters
      groups={sttDataset.groups}
      search={sttDataset.prefSearch}
      tags={sttDataset.prefTags}
      selectedGroups={sttDataset.prefGroups}
      listViewStyle={sttDataset.prefViewMode}
      onSearchChange={(v) => svcDataset.setSearch(v)}
      onTagAdd={(tag) => {
        if (!sttDataset.prefTags.includes(tag)) svcDataset.setTags([...sttDataset.prefTags, tag])
      }}
      onTagRemove={(tag) => svcDataset.setTags(sttDataset.prefTags.filter((t) => t !== tag))}
      onTagsClear={() => svcDataset.setTags([])}
      onGroupAdd={(id) => {
        if (!sttDataset.prefGroups.includes(id)) svcDataset.setGroups([...sttDataset.prefGroups, id])
      }}
      onGroupRemove={(id) => svcDataset.setGroups(sttDataset.prefGroups.filter((g) => g !== id))}
      onGroupsClear={() => svcDataset.setGroups([])}
      onToggleView={() => svcDataset.setViewMode(sttDataset.prefViewMode === GroupViewMode.Full ? GroupViewMode.Compact : GroupViewMode.Full)}
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
