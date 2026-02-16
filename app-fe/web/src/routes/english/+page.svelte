<script>
  import { onMount } from 'svelte'
  import { datasets, datasetId, currentDataset, setDatasetByKind } from '@app/state/registry.js'
  import { mainSearch, mainTags, mainGroups, mainListViewStyle, loadMainFilters } from '@app/state/filters.js'
  import { user, isAuthenticated, dbVersion, signInWithGoogle, signInWithEmail, signOut } from '@app/state/auth.js'
  import { formatGroup } from '@std/format.js'
  import { filterGroups } from '@app/std/dataset'
  import GroupItemEnglish from '@app/ui/english/GroupItem.svelte'
  import WordCardEnglish from '@app/ui/english/WordCard.svelte'
  import Hero from '@app/ui/hero'
  import Toolbar from '@app/ui/hero/Toolbar.svelte'
  import Filters from '@app/ui/hero/Filters.svelte'
  import Groups from '@app/ui/groups'
  import Modal from '@std/ui/Modal.svelte'
  import AuthModal from '@app/ui/auth-modal.svelte'

  onMount(() => { setDatasetByKind('english') })

  const basePath = $derived.by(() => `/${$currentDataset?.kind ?? 'english'}`)
  const groups = $derived.by(() => $currentDataset?.data?.groups ?? [])

  $effect(() => {
    $dbVersion
    if ($datasetId) loadMainFilters($datasetId)
  })

  let activeWord = $state(null)
  let modalOpen = $state(false)
  let showAuthDropdown = $state(false)

  const openWord = (item) => { activeWord = item; modalOpen = true }
  const closeModal = () => { modalOpen = false; activeWord = null }

  $effect(() => {
    if ($mainGroups.length > 0) {
      const validIds = new Set(groups.map((g) => g.group))
      const filtered = $mainGroups.filter((id) => validIds.has(id))
      if (filtered.length !== $mainGroups.length) $mainGroups = filtered
    }
  })

  const searchFields = $derived($currentDataset?.data?.search || [])
  const filteredGroups = $derived(filterGroups(groups, $mainSearch, $mainTags, $mainGroups, searchFields))

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
    groupCount={filteredGroups.length}
    totalCount={filteredGroups.reduce((s, g) => s + g.items.length, 0)}
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
