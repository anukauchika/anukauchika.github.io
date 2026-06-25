<script>
  import { browser } from '$app/environment'
  import { sttDataset } from '@stt/dataset.svelte.js'
  import { sttStats } from '@stt/kind/chinese/stats.svelte.js'
  import { svcStats } from '@svc/kind/chinese/stats'
  import { sttAuth } from '@stt/auth.svelte.js'
  import { buildProps as buildCompactProps } from '@uic/kind/chinese/compact-group-list'
  import { buildProps as buildFullProps } from '@uic/kind/chinese/group-item'
  import CompactGroupList from '@uic/kind/chinese/compact-group-list.svelte'
  import FullGroup from '@uic/kind/chinese/full-group.svelte'
  import WordCardChinese from '@uic/kind/chinese/word-card.svelte'
  import Groups from '@uic/groups'
  import Modal from '@std/ui/modal.svelte'
  import Island from '@std/ui/island.svelte'
  import IslandTitle from '@std/ui/island-title.svelte'
  import Dataset from '@routes/chinese/dataset.svelte'
  import { hskLevelDefs } from '@blog/chinese/hsk/levels-data.js'

  const basePath = $derived.by(() => `/${sttDataset.current.kind}`)

  const reloadStats = () => {
    if (sttDataset.id) {
      svcStats.loadWordProgressAll(sttDataset.id)
      svcStats.loadDayProgressAll(sttDataset.id)
    }
  }

  $effect(() => {
    sttAuth.dbVersion
    sttAuth.isAuthenticated
    sttDataset.groups.length
    if (sttDataset.id) reloadStats()
  })

let activeWord = $state(null)

  const groupCtx = $derived({
    basePath,
    datasetId: sttDataset.id,
    isAuthenticated: sttAuth.isAuthenticated,
    groupSessions: sttStats.groupProgress,
    groupSessionsStroke: sttStats.groupProgressStroke,
    groupSessionsPinyin: sttStats.groupProgressPinyin,
    statsStroke: sttStats.wordProgressStroke,
    statsPinyin: sttStats.wordProgressPinyin,
    wordProgress: sttStats.wordProgress,
  })
</script>

<svelte:head>
  <title>HSK Vocabulary Browser — Stroke & Pinyin Drills | Anuka Uchika</title>
  <meta
    name="description"
    content="Browse HSK 3.0 Chinese vocabulary in focused word groups. Practice with stroke-by-stroke writing drills, pinyin drills, printable A4 worksheets, and smart repetition."
  />
  <link rel="canonical" href="https://anukauchika.com/chinese/" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="HSK Vocabulary Browser — Stroke & Pinyin Drills" />
  <meta
    property="og:description"
    content="Browse HSK 3.0 vocabulary in focused word groups: writing drills, pinyin drills, printable worksheets, smart repetition."
  />
  <meta property="og:url" content="https://anukauchika.com/chinese/" />
  <meta property="og:site_name" content="Anuka Uchika" />
  <meta property="og:image" content="https://anukauchika.com/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="https://anukauchika.com/og-image.png" />
</svelte:head>

<main class="anuka-page">
  {#if browser}
    <Dataset />

    <Groups
      groups={sttDataset.filtered.map((g) => buildFullProps(g, groupCtx))}
      viewStyle={sttDataset.prefViewMode}
      hasSearch={sttDataset.prefSearch.trim().length > 0}
      datasetId={sttDataset.id}
    >
      {#snippet full(visibleGroups)}
        {#each visibleGroups as group (group.groupId)}
          <FullGroup {...group} onItemClick={(item) => (activeWord = item)} />
        {/each}
      {/snippet}
      {#snippet compact()}
        <CompactGroupList groups={sttDataset.filtered.map((g) => buildCompactProps(g, groupCtx))} />
      {/snippet}
    </Groups>

    {#if activeWord}
      <Modal onclose={() => (activeWord = null)}>
        <WordCardChinese item={activeWord} onClose={() => (activeWord = null)} />
      </Modal>
    {/if}
  {/if}

  <!-- Static intro: rendered at prerender time so crawlers see real content;
       shown to users as an about/footer section below the app -->
  <Island prose>
    <IslandTitle level={1}><span>HSK Vocabulary Browser</span></IslandTitle>
    <p>
      Browse the complete <strong>HSK 3.0 (2026)</strong> vocabulary in small, focused word groups — one group is one
      study session. Practice every word with stroke-by-stroke <strong>writing drills</strong> with instant feedback,
      <strong>pinyin drills</strong>, and printable A4 <strong>worksheets</strong> that fold accordion-style for
      self-checking paper practice. A smart repetition algorithm tracks your progress per word and tells you which
      group to review next.
    </p>
    <p>
      Word lists by level:
      {#each hskLevelDefs as def, i (def.slug)}
        {i > 0 ? ' · ' : ''}<a href="/chinese/hsk/{def.slug}/">{def.name}</a>
      {/each}
      · <a href="/chinese/hsk/">overview</a>
    </p>
    <p>
      More: <a href="/chinese/method/">the accordion workbook method</a> ·
      <a href="/chinese/blog/">blog</a> · <a href="/">about the app</a>
    </p>
  </Island>
</main>
