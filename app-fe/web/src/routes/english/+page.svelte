<script>
  import { onMount } from 'svelte'
  import { datasetsMeta, datasetId, currentDataset, search, tags, selectedGroups, viewMode, groups, filteredGroups } from '@stt/dataset.js'
  import { datasetService } from '@svc/dataset-service'
  import { user, isAuthenticated, signInWithGoogle, signInWithEmail, signOut } from '@stt/auth.js'
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
    const m = $datasetsMeta.find((m) => m.kind === 'english')
    if (m) datasetService.selectDataset(m.id)
  })

  const basePath = $derived.by(() => `/${$currentDataset?.kind ?? 'english'}`)

  let activeWord = $state(null)
  let modalOpen = $state(false)
  let showAuthDropdown = $state(false)

  const openWord = (item) => { activeWord = item; modalOpen = true }
  const closeModal = () => { modalOpen = false; activeWord = null }

  const fullGroupProps = (group) => ({
    groupId: formatGroup(group.id),
    tags: group.tags,
    kind: $currentDataset?.kind,
    workbookHref: `${basePath}/workbook?group=${group.id}&dataset=${$datasetId}`,
    printHref: `${basePath}/workbook?group=${group.id}&dataset=${$datasetId}&autoprint=1`,
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
    datasetName={$currentDataset?.name}
    datasetDescription={$currentDataset?.description}
    datasetTags={$currentDataset?.tags}
    datasetId={$datasetId}
    dailyActivity={new Map()}
    isAuthenticated={$isAuthenticated}
    groupCount={$filteredGroups.length}
    totalCount={$filteredGroups.reduce((s, g) => s + g.items.length, 0)}
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
        datasets={$datasetsMeta}
        datasetId={$datasetId}
        appTitle={$currentDataset?.appTitle}
        user={$user}
        onDatasetChange={(id) => datasetService.selectDataset(id)}
        onShowAuthDropdown={() => showAuthDropdown = true}
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
        onTagAdd={(tag) => { if (!$tags.includes(tag)) datasetService.setTags([...$tags, tag]) }}
        onTagRemove={(tag) => datasetService.setTags($tags.filter(t => t !== tag))}
        onTagsClear={() => datasetService.setTags([])}
        onGroupAdd={(id) => { if (!$selectedGroups.includes(id)) datasetService.setGroups([...$selectedGroups, id]) }}
        onGroupRemove={(id) => datasetService.setGroups($selectedGroups.filter(g => g !== id))}
        onGroupsClear={() => datasetService.setGroups([])}
        onToggleView={() => datasetService.setViewMode($viewMode === GroupViewMode.Full ? GroupViewMode.Compact : GroupViewMode.Full)}
      />
    {/snippet}
  </Hero>

  <Groups
    groups={$filteredGroups.map(g => fullGroupProps(g))}
    viewStyle={$viewMode}
    hasSearch={$search.trim().length > 0}
    datasetId={$datasetId}
  />

  {#if modalOpen && activeWord}
    <Modal onclose={closeModal}>
      <WordCardEnglish item={activeWord} onClose={closeModal} />
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
