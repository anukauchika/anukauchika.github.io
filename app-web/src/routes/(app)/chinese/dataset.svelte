<script>
  import { goto } from '$app/navigation'
  import { sttDataset } from '@stt/dataset.svelte.js'
  import { svcDataset } from '@svc/dataset'
  import { sttStats } from '@stt/kind/chinese/stats.svelte.js'
  import { svcDrill } from '@svc/kind/chinese/drill'
  import { sttAuth } from '@stt/auth.svelte.js'
  import { svcAuth } from '@svc/auth'
  import { svcUserPrefs } from '@svc/user-prefs'
  import AppTitle from '@std/ui/app-title.svelte'
  import { GroupViewMode } from '@dom/dataset'
  import Hero from '@uic/hero'
  import Toolbar from '@uic/hero/toolbar.svelte'
  import Filters from '@uic/hero/filters.svelte'
  import AuthModal from '@uic/auth-modal.svelte'

  let showAuthDropdown = $state(false)

  const basePath = $derived.by(() => `/${sttDataset.current?.kind}`)

  const drillHref = $derived.by(() => {
    const nd = svcDrill.pickNextDrill()
    const typeToPath = { stroke: 'hanzi', pinyin: 'pinyin' }
    return nd
      ? `${basePath}/drill/${typeToPath[nd.type] || 'hanzi'}?group=${nd.groupId}&dataset=${sttDataset.id}`
      : null
  })

  const datasetTitle = $derived.by(() => sttDataset.current?.appTitle)
  const appTitle = $derived.by(() => (datasetTitle ? ['Anuka Uchika', datasetTitle] : ['Anuka Uchika']))
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
  uniqueWordCount={sttStats.datasetStats.uniqueWords}
  uniqueChars={sttStats.datasetStats.chars}
  avgDailyTime={sttStats.avgDailyTime}
  strokeDrilledCount={sttStats.strokeDrilledCount}
  overdueCount={sttStats.overdueCount}
  strokeProgress={sttStats.strokeProgress}
  strokeMastery={sttStats.strokeMastery}
  pinyinProgress={sttStats.pinyinProgress}
  pinyinMastery={sttStats.pinyinMastery}
  {drillHref}
  onShowAuthDropdown={() => (showAuthDropdown = true)}
  onShowProgressGroups={() => goto('/chinese/groups')}
  onShowProgressWords={() => goto('/chinese/words')}
  onShowProgressChars={() => goto('/chinese/chars')}
>
  <AppTitle parts={appTitle} />

  {#snippet toolbar()}
    <Toolbar
      datasets={sttDataset.meta}
      datasetId={sttDataset.id}
      user={sttAuth.user}
      showAvatar={sttAuth.showAvatar}
      avatarUrl={sttAuth.avatarUrl}
      userInitials={sttAuth.userInitials}
      onDatasetChange={(id) => goto(`/chinese/?dataset=${id}`)}
      onShowAuthDropdown={() => (showAuthDropdown = true)}
      onAvatarError={() => (sttAuth.avatarError = true)}
      onToggleTheme={() => svcUserPrefs.toggleTheme()}
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
      onToggleView={() =>
        svcDataset.setViewMode(
          sttDataset.prefViewMode === GroupViewMode.Full ? GroupViewMode.Compact : GroupViewMode.Full,
        )}
      onShare={async () => {
        const url = new URL(window.location.href)
        url.searchParams.set('dataset', sttDataset.id)
        if (sttDataset.prefTags.length) url.searchParams.set('tags', sttDataset.prefTags.join(','))
        else url.searchParams.delete('tags')
        if (sttDataset.prefGroups.length) url.searchParams.set('groups', sttDataset.prefGroups.join(','))
        else url.searchParams.delete('groups')
        if (sttDataset.prefSearch) url.searchParams.set('search', sttDataset.prefSearch)
        else url.searchParams.delete('search')
        const shareUrl = url.toString()
        if (navigator.share) {
          await navigator.share({ title: sttDataset.current?.name ?? 'Anuka Uchika', url: shareUrl })
        } else {
          navigator.clipboard.writeText(shareUrl)
        }
      }}
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
