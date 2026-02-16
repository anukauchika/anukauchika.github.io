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
  import Island from '@std/ui/Island.svelte'

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
  let emailInput = $state('')
  let emailSent = $state(false)
  let emailError = $state('')

  function focus(node) { node.focus() }

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
    <Modal onclose={() => { showAuthDropdown = false; emailSent = false; emailError = ''; emailInput = '' }}>
      {#if $user}
        <Island>
          <div class="anuka-stack anuka-center" role="dialog" aria-modal="true">
            <div class="anuka-stack anuka-compact anuka-center">
              <strong>{$user.user_metadata?.full_name || $user.email}</strong>
              <small class="anuka-mute">{$user.email}</small>
            </div>
            <button type="button" class="anuka-btn" onclick={() => { signOut(); showAuthDropdown = false }}>
              Sign out
            </button>
          </div>
        </Island>
      {:else}
        <Island>
          <div class="anuka-stack anuka-center" role="dialog" aria-modal="true">
            <p class="anuka-app-title">ANUKA UCHIKA</p>
            <button type="button" class="anuka-btn" onclick={() => { signInWithGoogle(); showAuthDropdown = false }}>
              <svg viewBox="0 0 24 24" width="20" height="20"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Sign in with Google
            </button>
            <div class="anuka-divider"><span>or</span></div>
            {#if emailSent}
              <div class="anuka-main anuka-sm">Check your email for the login link</div>
            {:else}
              <form class="anuka-stack anuka-compact" onsubmit={(e) => {
                e.preventDefault()
                emailError = ''
                signInWithEmail(emailInput)
                  .then(() => { emailSent = true })
                  .catch((err) => { emailError = err.message })
              }}>
                <input type="email" class="anuka-input" bind:value={emailInput} placeholder="Email" required use:focus />
                {#if emailError}<div class="anuka-fail anuka-sm">{emailError}</div>{/if}
                <button type="submit" class="anuka-btn">Send Sign In Link</button>
              </form>
            {/if}
          </div>
        </Island>
      {/if}
    </Modal>
  {/if}
</main>
