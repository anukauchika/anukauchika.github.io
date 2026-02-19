<script>
  import { onMount } from 'svelte'
  import { sttDataset } from '@stt/dataset.svelte.js'
  import { svcDataset } from '@svc/dataset'
  import { sttAuth } from '@stt/auth.svelte.js'
  import { svcAuth } from '@svc/auth'
  import { formatGroup } from '@std/format.js'
  import { GroupViewMode } from '@dom/dataset'
  import WordCardEnglish from '@uic/kind/english/word-card.svelte'
  import Hero from '@uic/hero'
  import Toolbar from '@uic/hero/toolbar.svelte'
  import Filters from '@uic/hero/filters.svelte'
  import Groups from '@uic/groups'
  import Modal from '@std/ui/modal.svelte'
  import AuthModal from '@uic/auth-modal.svelte'

  onMount(() => {
    const m = sttDataset.meta.find((m) => m.kind === 'english')
    if (m) svcDataset.selectDataset(m.id)
  })

  const basePath = $derived.by(() => `/${sttDataset.current?.kind ?? 'english'}`)

  let activeWord = $state(null)
  let modalOpen = $state(false)
  let showAuthDropdown = $state(false)

  const openWord = (item) => { activeWord = item; modalOpen = true }
  const closeModal = () => { modalOpen = false; activeWord = null }

  const fullGroupProps = (group) => ({
    groupId: formatGroup(group.id),
    tags: group.tags,
    kind: sttDataset.current?.kind,
    workbookHref: `${basePath}/workbook?group=${group.id}&dataset=${sttDataset.id}`,
    printHref: `${basePath}/workbook?group=${group.id}&dataset=${sttDataset.id}&autoprint=1`,
    strokeSessions: 0,
    pinyinSessions: 0,
    strokeProgress: 0,
    strokeMastery: 0,
    pinyinProgress: 0,
    pinyinMastery: 0,
    showProgress: false,
    items: group.items.map(item => ({ item, strokeStat: null, pinyinStat: null })),
  })
</script>

<svelte:head>
  <title>Anuka Uchika - English</title>
  <meta name="description" content="English vocabulary learning app with spaced repetition and progress tracking" />
</svelte:head>

<main class="anuka-page">
  <Hero
    datasetName={sttDataset.current?.name}
    datasetDescription={sttDataset.current?.description}
    datasetTags={sttDataset.current?.tags}
    datasetId={sttDataset.id}
    dailyActivity={new Map()}
    isAuthenticated={sttAuth.isAuthenticated}
    groupCount={sttDataset.filtered.length}
    totalCount={sttDataset.filtered.reduce((s, g) => s + g.items.length, 0)}
    uniqueChars={0}
    strokePracticedCount={0}
    strokeProgress={0} strokeMastery={0} pinyinProgress={0} pinyinMastery={0}
    practiceHref={null}
    onShowAuthDropdown={() => showAuthDropdown = true}
    onShowPracticedGroups={() => {}}
    onShowPracticedList={() => {}}
    onShowPracticedChars={() => {}}
    onShowHowItWorks={() => {}}
    onShowStatInfo={() => {}}
  >
    {#snippet toolbar()}
      <Toolbar
        datasets={sttDataset.meta}
        datasetId={sttDataset.id}
        appTitle={sttDataset.current?.appTitle}
        user={sttAuth.user}
        onDatasetChange={(id) => svcDataset.selectDataset(id)}
        onShowAuthDropdown={() => showAuthDropdown = true}
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
        onTagAdd={(tag) => { if (!sttDataset.prefTags.includes(tag)) svcDataset.setTags([...sttDataset.prefTags, tag]) }}
        onTagRemove={(tag) => svcDataset.setTags(sttDataset.prefTags.filter(t => t !== tag))}
        onTagsClear={() => svcDataset.setTags([])}
        onGroupAdd={(id) => { if (!sttDataset.prefGroups.includes(id)) svcDataset.setGroups([...sttDataset.prefGroups, id]) }}
        onGroupRemove={(id) => svcDataset.setGroups(sttDataset.prefGroups.filter(g => g !== id))}
        onGroupsClear={() => svcDataset.setGroups([])}
        onToggleView={() => svcDataset.setViewMode(sttDataset.prefViewMode === GroupViewMode.Full ? GroupViewMode.Compact : GroupViewMode.Full)}
      />
    {/snippet}
  </Hero>

  <Groups
    groups={sttDataset.filtered.map(g => fullGroupProps(g))}
    viewStyle={sttDataset.prefViewMode}
    hasSearch={sttDataset.prefSearch.trim().length > 0}
    datasetId={sttDataset.id}
  />

  {#if modalOpen && activeWord}
    <Modal onclose={closeModal}>
      <WordCardEnglish item={activeWord} onClose={closeModal} />
    </Modal>
  {/if}

  {#if showAuthDropdown}
    <AuthModal
      user={sttAuth.user}
      onclose={() => showAuthDropdown = false}
      onSignInWithGoogle={svcAuth.signInWithGoogle}
      onSignInWithEmail={svcAuth.signInWithEmail}
      onSignOut={svcAuth.signOut}
    />
  {/if}
</main>
