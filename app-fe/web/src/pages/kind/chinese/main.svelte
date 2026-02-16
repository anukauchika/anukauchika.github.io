<script>
  import { onMount } from 'svelte'
  import { datasetId, currentDataset, setDatasetById } from '@app/state/registry.js'
  import { loadDatasetGroupSessions, datasetGroupSessions, loadGroupStats, groupStats as groupStatsStore, startGroupSession, endGroupSession, recordWordAttempt } from '@app/state/kind/chinese/practice-stats.js'
  import { isAuthenticated } from '@app/state/auth.js'
  import { formatGroup } from '@std/format.js'
  import { get } from 'svelte/store'
  import Island from '@std/ui/Island.svelte'
  import IslandTitle from '@std/ui/IslandTitle.svelte'
  import Tags from '@std/ui/Tags.svelte'
  import App from '../../App.svelte'
  import Workbook from '../../workbook.svelte'
  import PracticeStroke from './practice-stroke.svelte'
  import PracticePinyin from './practice-pinyin.svelte'

  // --- SPA routing ---

  let pathname = $state(window.location.pathname)

  const route = $derived.by(() => {
    const p = pathname.replace(/^\/chinese\/?/, '')
    if (p.startsWith('practice/hanzi')) return 'practice-hanzi'
    if (p.startsWith('practice/pinyin')) return 'practice-pinyin'
    if (p.startsWith('workbook')) return 'workbook'
    return 'browse'
  })

  $effect(() => {
    const onPopState = () => { pathname = window.location.pathname }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  })

  $effect(() => {
    const onClick = (e) => {
      const anchor = e.target.closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href) return
      if (!href.startsWith('/chinese/') && href !== '/chinese/') return
      if (anchor.target === '_blank' || e.ctrlKey || e.metaKey || e.shiftKey) return
      e.preventDefault()
      history.pushState(null, '', href)
      pathname = new URL(href, window.location.origin).pathname
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  })

  // --- Practice wiring (shared by both practice routes) ---

  const getSearchParams = () => new URLSearchParams(window.location.search)

  const practiceType = $derived(route === 'practice-pinyin' ? 'pinyin' : 'stroke')

  onMount(() => {
    const params = getSearchParams()
    const requested = params.get('dataset')
    if (requested) setDatasetById(requested)
  })

  $effect(() => {
    if ($datasetId && (route === 'practice-hanzi' || route === 'practice-pinyin')) {
      loadDatasetGroupSessions($datasetId, practiceType)
    }
  })

  const practiceGroupId = $derived.by(() => {
    if (route !== 'practice-hanzi' && route !== 'practice-pinyin') return null
    const value = Number(getSearchParams().get('group'))
    return Number.isFinite(value) && value > 0 ? value : 1
  })

  const groups = $derived.by(() => $currentDataset?.data?.groups ?? [])

  const practiceGroup = $derived.by(() =>
    practiceGroupId ? (groups.find((g) => g.group === practiceGroupId) || groups[0]) : null
  )

  const practiceGroupSessions = $derived.by(() =>
    practiceGroup ? $datasetGroupSessions.get(practiceGroup.group) : null
  )

  const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, '') || ''
  const basePath = $derived.by(() => $currentDataset?.kind ? `${baseUrl}/${$currentDataset.kind}` : null)

  const handleLoadGroupStats = async (dsId, pt, gId) => {
    await loadGroupStats(dsId, pt, gId)
    return get(groupStatsStore)
  }

  const practiceBackUrl = $derived.by(() => {
    if (route !== 'practice-hanzi' && route !== 'practice-pinyin') return ''
    const from = getSearchParams().get('from')
    return `${basePath ?? baseUrl}/?dataset=${$datasetId}${from ? `&from=${from}` : ''}`
  })

  const headerTitle = $derived(practiceType === 'pinyin' ? 'Pinyin Practice' : 'Stroke Practice')
</script>

{#if route === 'practice-hanzi' || route === 'practice-pinyin'}
  <main class="anuka-page">
    {#if practiceGroup}
      {@const from = getSearchParams().get('from')}
      {#if route === 'practice-pinyin'}
        <PracticePinyin group={practiceGroup} datasetId={$datasetId} translationField={$currentDataset?.data?.to} backUrl={practiceBackUrl}
          groupStats={$groupStatsStore} isAuthenticated={$isAuthenticated}
          onLoadGroupStats={handleLoadGroupStats} onStartSession={startGroupSession} onEndSession={endGroupSession} onRecordAttempt={recordWordAttempt} />
      {:else}
        <PracticeStroke group={practiceGroup} datasetId={$datasetId} translationField={$currentDataset?.data?.to} backUrl={practiceBackUrl}
          groupStats={$groupStatsStore} isAuthenticated={$isAuthenticated}
          onLoadGroupStats={handleLoadGroupStats} onStartSession={startGroupSession} onEndSession={endGroupSession} onRecordAttempt={recordWordAttempt} />
      {/if}
    {/if}

    <Island>
      <IslandTitle level={1}>{headerTitle}</IslandTitle>
      {#if practiceGroup}
        <div class="anuka-row anuka-center">
          <span class="anuka-sm anuka-mute">{formatGroup(practiceGroup.group)}</span>
          {#if practiceGroup.tags?.length}
            <Tags tags={practiceGroup.tags} />
          {/if}
          <span class="anuka-sm anuka-mute">{practiceGroup.items.length} words</span>
          {#if $isAuthenticated && practiceGroupSessions}
            <span class="anuka-sm anuka-main">{practiceGroupSessions.total} passes ({practiceGroupSessions.full} full)</span>
          {/if}
        </div>
      {/if}
    </Island>
  </main>
{:else if route === 'workbook'}
  <Workbook />
{:else}
  <App />
{/if}
