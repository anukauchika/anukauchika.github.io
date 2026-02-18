<script>
  import { onMount } from 'svelte'
  import { datasets, datasetId, currentDataset, setDatasetByKind } from '@app/state/registry.js'
  import { mainSearch, mainTags, mainGroups, mainListViewStyle, groups, filteredGroups } from '@app/state/filters.js'
  import { user, isAuthenticated, signInWithGoogle, signInWithEmail, signOut } from '@app/state/auth.js'
  import { formatGroup } from '@std/format.js'
  import WordCardEnglish from '@app/ui/kind/english/word-card.svelte'
  import Hero from '@app/ui/hero'
  import Toolbar from '@app/ui/hero/toolbar.svelte'
  import Filters from '@app/ui/hero/filters.svelte'
  import Groups from '@app/ui/groups'
  import Modal from '@std/ui/modal.svelte'
  import AuthModal from '@app/ui/auth-modal.svelte'

  onMount(() => { setDatasetByKind('english') })

  const basePath = $derived.by(() => `/${$currentDataset?.kind ?? 'english'}`)

  let activeWord = $state(null)
  let modalOpen = $state(false)
  let showAuthDropdown = $state(false)

  const openWord = (item) => { activeWord = item; modalOpen = true }
  const closeModal = () => { modalOpen = false; activeWord = null }

  const fullGroupProps = (group) => ({
    groupId: formatGroup(group.group),
    tags: group.tags,
    kind: $currentDataset?.kind,
    workbookHref: `${basePath}/workbook?group=${group.group}&dataset=${$datasetId}`,
    printHref: `${basePath}/workbook?group=${group.group}&dataset=${$datasetId}&autoprint=1`,
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

  <Groups
    groups={$filteredGroups.map(g => fullGroupProps(g))}
    viewStyle={$mainListViewStyle}
    hasSearch={$mainSearch.trim().length > 0}
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
