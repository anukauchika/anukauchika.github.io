<script>
  import { goto } from '$app/navigation'
  import { sttDataset } from '@stt/dataset.svelte.js'
  import { svcDataset } from '@svc/dataset'
  import { sttStats } from '@stt/kind/chinese/stats.svelte.js'
  import { sttDrill } from '@stt/kind/chinese/drill.svelte.js'
  import { sttAuth } from '@stt/auth.svelte.js'
  import { svcAuth } from '@svc/auth'
  import { GroupViewMode } from '@dom/dataset'
  import Hero from '@uic/hero'
  import Toolbar from '@uic/hero/toolbar.svelte'
  import Filters from '@uic/hero/filters.svelte'
  import AuthModal from '@uic/auth-modal.svelte'

  let showAuthDropdown = $state(false)

  const basePath = $derived.by(() => `/${sttDataset.current?.kind}`)

  const drillHref = $derived.by(() => {
    const nd = sttDrill.nextDrill
    const typeToPath = { stroke: 'hanzi', pinyin: 'pinyin' }
    return nd
      ? `${basePath}/drill/${typeToPath[nd.type] || 'hanzi'}?group=${nd.groupId}&dataset=${sttDataset.id}`
      : null
  })
</script>

<Hero
  datasetName={sttDataset.current?.name}
  datasetDescription={sttDataset.current?.description}
  datasetTags={sttDataset.current?.tags}
  datasetId={sttDataset.id}
  dailyActivity={sttStats.dayProgress}
  isAuthenticated={sttAuth.isAuthenticated}
  groupCount={sttStats.datasetStats.groups}
  totalCount={sttStats.datasetStats.words}
  uniqueChars={sttStats.datasetStats.chars}
  strokeDrilledCount={sttStats.strokeDrilledCount}
  strokeProgress={sttStats.strokeProgress}
  strokeMastery={sttStats.strokeMastery}
  pinyinProgress={sttStats.pinyinProgress}
  pinyinMastery={sttStats.pinyinMastery}
  {drillHref}
  onShowAuthDropdown={() => (showAuthDropdown = true)}
  onShowProgressGroups={() => goto('/chinese/groups')}
  onShowProgressWords={() => goto('/chinese/words')}
  onShowProgressChars={() => goto('/chinese/chars')}
  onShowHowItWorks={() => goto('/chinese/how-it-works')}
>
  {#snippet toolbar()}
    <Toolbar
      datasets={sttDataset.meta}
      datasetId={sttDataset.id}
      appTitle={sttDataset.current?.appTitle}
      user={sttAuth.user}
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
    user={sttAuth.user}
    onclose={() => (showAuthDropdown = false)}
    onSignInWithGoogle={svcAuth.signInWithGoogle}
    onSignInWithEmail={svcAuth.signInWithEmail}
    onSignOut={svcAuth.signOut}
  />
{/if}
