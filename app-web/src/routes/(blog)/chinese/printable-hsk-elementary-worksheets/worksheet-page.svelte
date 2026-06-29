<script>
  import { onMount } from 'svelte'
  import {
    trackFullAppConversion,
    trackPracticeOnlineConversion,
    trackWorksheetPrintConversion,
  } from '@low/google/analytics'
  import { formatGroup } from '@std/format'
  import WorkbookChinese from '@uic/kind/chinese/workbook.svelte'
  import '@uic/workbook.css'
  import {
    appendAttributionParams,
    initAttributionParams,
    getCurrentAttributionParams,
    trackWorksheetEvent,
  } from '@low/worksheet/attribution'
  import {
    hskElementaryWorksheetLevel,
    worksheetBasePath,
    getWorksheetGroupUrl,
    getWorksheetGroupDrillUrl,
    getChineseAppUrl,
    getChineseLevelAppUrl,
    getWordGroupId,
  } from './worksheet-data'

  let { group, groups, variant = 'collection' } = $props()

  const isCollection = $derived(variant === 'collection')
  const title = $derived(
    isCollection
      ? 'Printable HSK Elementary Chinese Writing Worksheets'
      : `Printable HSK Elementary Worksheet - Group ${group.group}`,
  )
  const description = $derived(
    isCollection
      ? 'Print free HSK Elementary Chinese writing worksheets with hanzi, pinyin, English meanings, and handwriting boxes. Practice all groups online.'
      : `Print HSK Elementary Group ${group.group} Chinese writing practice sheet with hanzi, pinyin, English meanings, and handwriting boxes.`,
  )
  const canonical = $derived(
    isCollection
      ? `https://anukauchika.com${worksheetBasePath}/`
      : `https://anukauchika.com${getWorksheetGroupUrl(group.group)}`,
  )

  let attributionParams = $state({})

  const payloadFor = (targetGroup) => ({
    page_url: canonical,
    word_group_id: getWordGroupId(targetGroup.group),
    hsk_level: hskElementaryWorksheetLevel,
    group_number: targetGroup.group,
  })

  const drillHref = (targetGroup) => appendAttributionParams(getWorksheetGroupDrillUrl(targetGroup.group), attributionParams)
  const groupHref = (targetGroup) => appendAttributionParams(getWorksheetGroupUrl(targetGroup.group), attributionParams)
  const appHref = $derived(appendAttributionParams(getChineseAppUrl(), attributionParams))
  const advancedLevels = [
    {
      label: 'HSK 4',
      href: getChineseLevelAppUrl('chinese-hskv3-intermediate', 'L4'),
      description: 'Intermediate vocabulary, wider topics, and formal registers.',
    },
    {
      label: 'HSK 5',
      href: getChineseLevelAppUrl('chinese-hskv3-intermediate', 'L5'),
      description: 'More work, study, media, and abstract vocabulary.',
    },
    {
      label: 'HSK 6',
      href: getChineseLevelAppUrl('chinese-hskv3-intermediate', 'L6'),
      description: 'Completes the intermediate band for fluent everyday use.',
    },
    {
      label: 'HSK 7-9',
      href: getChineseLevelAppUrl('chinese-hskv3-advanced'),
      description: 'Advanced academic and professional vocabulary.',
    },
  ]
  const formatPrintDate = () => {
    const now = new Date()
    const day = String(now.getDate()).padStart(2, '0')
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = String(now.getFullYear())
    const weekday = now.toLocaleDateString('en-US', { weekday: 'short' })
    return `${day}-${month}-${year} ${weekday}`
  }
  const printDate = formatPrintDate()

  const handlePrint = (targetGroup) => {
    trackWorksheetEvent('hsk_worksheet_print_clicked', payloadFor(targetGroup))
    trackWorksheetPrintConversion()
    globalThis.print()
  }

  const handlePractice = (event, targetGroup) => {
    event.preventDefault()
    const params = getCurrentAttributionParams()
    trackWorksheetEvent('hsk_practice_online_clicked', payloadFor(targetGroup))
    trackPracticeOnlineConversion()
    globalThis.location.href = appendAttributionParams(getWorksheetGroupDrillUrl(targetGroup.group), params)
  }

  const handleFullApp = (event) => {
    event.preventDefault()
    const params = getCurrentAttributionParams()
    const targetUrl = appendAttributionParams(getChineseAppUrl(), params)
    trackWorksheetEvent('hsk_full_app_clicked', {
      ...payloadFor(group),
      target_url: targetUrl,
    })
    trackFullAppConversion()
    globalThis.location.href = targetUrl
  }

  onMount(() => {
    attributionParams = initAttributionParams()
    trackWorksheetEvent('worksheet_landing_viewed', payloadFor(group))
  })
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonical} />
  <meta property="og:type" content="website" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={canonical} />
  <meta property="og:site_name" content="Anuka Uchika" />
  <meta property="og:image" content="https://anukauchika.com/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="https://anukauchika.com/og-image.png" />
</svelte:head>

<main class="worksheet-landing">
  <section class="hero no-print">
    <div class="hero-copy">
      <p class="eyebrow">Free printable Chinese handwriting practice</p>
      <h1>{title}</h1>
      {#if isCollection}
        <p class="subtitle">
          Print HSK Elementary Chinese writing practice sheets and memorize words by handwriting.
        </p>
      {:else}
        <p class="subtitle">
          Print HSK Elementary Group {group.group} as a Chinese character writing practice sheet with hanzi, pinyin,
          meaning, and handwriting boxes.
        </p>
      {/if}
      <p class="helper">No login needed. Works best on A4 paper in landscape mode with narrow margins.</p>
      <div class="actions">
        <button class="anuka-btn anuka-main anuka-lg" type="button" onclick={() => handlePrint(group)}>
          <span class="anuka-icon anuka-icon-print"></span>
          {isCollection ? `Print Group ${group.group} Worksheet` : 'Print Worksheet'}
        </button>
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
        <a class="anuka-btn anuka-lg" href={drillHref(group)} onclick={(event) => handlePractice(event, group)}>
          <span class="anuka-icon anuka-icon-stroke"></span>
          {isCollection ? `Practice Group ${group.group} Online` : 'Practice These Words Online'}
        </a>
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
        <a class="app-link" href={appHref} onclick={handleFullApp}>Explore Full Chinese Practice App &rarr;</a>
      </div>
      <p class="print-note">
        For best results: choose Landscape orientation and Narrow / Minimum margins in the print dialog.
      </p>
    </div>
    <aside class="hero-facts">
      <strong>{groups.length} worksheet groups</strong>
      <span>Real HSK Elementary word groups from the existing worksheet data.</span>
      <span>No PDF required. Print directly from the browser.</span>
    </aside>
  </section>

  <section class="worksheet-section worksheet" aria-labelledby="worksheet-title">
    <div class="worksheet-title-row no-print">
      <div>
        <p class="eyebrow">Featured printable worksheet</p>
        <h2 id="worksheet-title">HSK Elementary Worksheet - Group {group.group}</h2>
      </div>
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
      <a class="site-mark" href={appendAttributionParams('/', attributionParams)}>anukauchika.com</a>
    </div>

    <p class="worksheet-intro no-print">
      Use Look-Cover-Write-Check with this printable Chinese worksheet: look at one clue, cover the answers,
      write the Chinese word from memory, then check yourself.
    </p>

    <div class="workbook-page landing-workbook">
      <header class="sheet-header worksheet-sheet-header">
        <div class="group-line">
          <span class="group-title">HSK Elementary</span>
          <span class="sheet-separator">|</span>
          <span class="group-title">{formatGroup(group.group)}</span>
          <span class="sheet-separator">|</span>
          <span class="print-date">{printDate}</span>
        </div>
      </header>
      <WorkbookChinese {group} exerciseSets={2} />
    </div>

    <div class="below-worksheet-actions no-print">
      <button class="anuka-btn anuka-main" type="button" onclick={() => handlePrint(group)}>
        <span class="anuka-icon anuka-icon-print"></span>
        Print Worksheet
      </button>
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
      <a class="anuka-btn" href={drillHref(group)} onclick={(event) => handlePractice(event, group)}>
        Practice These Words Online
      </a>
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
      <a class="app-link" href={appHref} onclick={handleFullApp}>Explore Full Chinese Practice App &rarr;</a>
    </div>
  </section>

  <section class="how-to no-print" aria-labelledby="how-to-title">
    <h2 id="how-to-title">Look-Cover-Write-Check</h2>
    <ol>
      <li>Print a worksheet.</li>
      <li>Cover all columns except one.</li>
      <li>Look at the visible clue, then write the Chinese word from memory.</li>
      <li>Uncover the answer and check yourself.</li>
      <li>Repeat with another column: meaning, pinyin, or characters.</li>
      <li>Click "Practice Online" to review the same words with drills.</li>
    </ol>
    <p>
      These worksheets are designed for active recall: instead of only reading Chinese words, you cover the answers
      and write them from memory.
    </p>
  </section>

  {#if isCollection}
    <section class="groups-section no-print" aria-labelledby="all-groups-title">
      <div class="section-head">
        <h2 id="all-groups-title">All HSK Elementary Printable Worksheet Groups</h2>
        <p>
          Choose any group to print the worksheet or practice the same words online with drills.
        </p>
      </div>
      <div class="group-list">
        {#each groups as targetGroup (targetGroup.group)}
          <div class="group-row">
            <div>
              <h3>Group {targetGroup.group}</h3>
              <p>{targetGroup.items.length} words: {targetGroup.items.slice(0, 3).map((item) => item.word).join(', ')}</p>
            </div>
            <div class="group-actions">
              <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
              <a href={groupHref(targetGroup)}>Print</a>
              <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
              <a href={drillHref(targetGroup)} onclick={(event) => handlePractice(event, targetGroup)}>Practice Online</a>
            </div>
          </div>
        {/each}
      </div>
    </section>
  {:else}
    <section class="groups-section no-print" aria-labelledby="more-groups-title">
      <div class="section-head">
        <h2 id="more-groups-title">More HSK Elementary Printable Worksheet Groups</h2>
        <p>
          <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
          <a href={appendAttributionParams(`${worksheetBasePath}/`, attributionParams)}>Back to all 67 groups</a>
        </p>
      </div>
      <div class="group-list compact">
        {#each groups as targetGroup (targetGroup.group)}
          <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
          <a class:current={targetGroup.group === group.group} href={groupHref(targetGroup)}>Group {targetGroup.group}</a>
        {/each}
      </div>
    </section>
  {/if}

  <section class="advanced-section no-print" aria-labelledby="advanced-title">
    <div class="section-head">
      <h2 id="advanced-title">HSK Advanced Levels</h2>
      <p>
        HSK Elementary worksheets are printable here. For higher HSK levels, open the app with the level selected.
      </p>
    </div>
    <div class="advanced-list">
      {#each advancedLevels as level (level.label)}
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
        <a class="advanced-link" href={appendAttributionParams(level.href, attributionParams)}>
          <strong>{level.label}</strong>
          <span>{level.description}</span>
        </a>
      {/each}
    </div>
  </section>
</main>

<style>
  .worksheet-landing {
    --anuka-color-bg-base: #f7f5f1;
    --anuka-color-bg-accent: #edeae4;
    --anuka-color-surface: #ffffff;
    --anuka-color-surface-raised: #f8f6f2;
    --anuka-color-text: #1a1814;
    --anuka-color-muted: #6b6258;
    --anuka-color-accent: rgba(31, 111, 92, 0.15);
    --anuka-color-accent-strong: rgba(31, 111, 92, 0.38);
    --anuka-color-border: rgba(0, 0, 0, 0.07);
    --anuka-color-primary: #1f6f5c;
    --anuka-color-on-primary: #ffffff;
    --radius-full: 999px;
    min-height: 100vh;
    background: #f7f5f1;
    color: #1a1814;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.25rem;
  }

  .worksheet-landing > section {
    width: 100%;
    max-width: 1180px;
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(240px, 340px);
    gap: 1.25rem;
    align-items: end;
    padding: 1.5rem 0 0.25rem;
  }

  .hero-copy {
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .eyebrow {
    color: #1f6f5c;
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  h1 {
    max-width: 760px;
    font-size: clamp(2.2rem, 5vw, 4.4rem);
    line-height: 1.02;
    letter-spacing: 0;
  }

  h2 {
    font-size: clamp(1.45rem, 2.4vw, 2rem);
    line-height: 1.18;
    letter-spacing: 0;
  }

  h3 {
    font-size: 1rem;
    letter-spacing: 0;
  }

  .subtitle {
    max-width: 680px;
    color: #4f4840;
    font-size: 1.18rem;
  }

  .helper,
  .print-note,
  .worksheet-intro,
  .section-head p,
  .how-to p,
  .group-row p,
  .hero-facts span {
    color: #6b6258;
  }

  .actions,
  .below-worksheet-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
  }

  .app-link {
    color: #4f4840;
    font-size: 0.92rem;
    font-weight: 700;
    text-decoration-color: rgba(79, 72, 64, 0.35);
    text-underline-offset: 0.18em;
  }

  .app-link:hover {
    color: #1f6f5c;
    text-decoration-color: currentColor;
  }

  .hero-facts {
    background: #ffffff;
    border: 1px solid rgba(0, 0, 0, 0.07);
    border-radius: 8px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .worksheet-section,
  .groups-section,
  .advanced-section,
  .how-to {
    background: #ffffff;
    border: 1px solid rgba(0, 0, 0, 0.07);
    border-radius: 8px;
    padding: 1rem;
  }

  .worksheet-title-row,
  .section-head {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    align-items: flex-start;
    margin-bottom: 0.8rem;
  }

  .site-mark {
    color: #6b6258;
    font-size: 0.85rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .worksheet-intro {
    max-width: 850px;
    margin-bottom: 0.9rem;
  }

  :global(.landing-workbook.workbook-page .worksheet-sheet-header) {
    margin-bottom: 0.25rem;
  }

  :global(.landing-workbook.workbook-page .worksheet-sheet-header .group-line) {
    gap: 0.45rem;
    line-height: 1;
  }

  :global(.landing-workbook.workbook-page .worksheet-sheet-header .group-title),
  :global(.landing-workbook.workbook-page .worksheet-sheet-header .print-date),
  :global(.landing-workbook.workbook-page .worksheet-sheet-header .sheet-separator) {
    font-size: 0.75rem;
    font-weight: 700;
    color: #4f4840;
  }

  .below-worksheet-actions {
    margin-top: 0.9rem;
  }

  .group-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 0.55rem;
  }

  .group-row {
    min-height: 78px;
    border: 1px solid rgba(0, 0, 0, 0.07);
    border-radius: 8px;
    padding: 0.7rem;
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    align-items: center;
    background: #f8f6f2;
  }

  .group-row p {
    font-size: 0.86rem;
    margin-top: 0.15rem;
  }

  .group-actions {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    align-items: flex-end;
    flex: 0 0 auto;
    font-size: 0.9rem;
  }

  a {
    color: #1f6f5c;
    text-underline-offset: 0.16em;
  }

  .site-mark {
    color: #6b6258;
    text-decoration: none;
  }

  .site-mark:hover {
    text-decoration: underline;
  }

  .group-list.compact {
    grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
  }

  .advanced-list {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
    gap: 0.55rem;
  }

  .advanced-link {
    border: 1px solid rgba(0, 0, 0, 0.07);
    border-radius: 8px;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    background: #f8f6f2;
    color: #1a1814;
    text-decoration: none;
  }

  .advanced-link strong {
    color: #1f6f5c;
  }

  .advanced-link span {
    color: #6b6258;
    font-size: 0.88rem;
  }

  .advanced-link:hover strong {
    text-decoration: underline;
  }

  .group-list.compact a {
    border: 1px solid rgba(0, 0, 0, 0.07);
    border-radius: 8px;
    padding: 0.45rem 0.6rem;
    text-align: center;
    text-decoration: none;
    background: #f8f6f2;
  }

  .group-list.compact a.current {
    background: #1f6f5c;
    color: #ffffff;
  }

  .how-to {
    margin-bottom: 1rem;
  }

  .how-to ol {
    padding-left: 1.25rem;
    margin: 0.75rem 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  @media screen and (max-width: 820px) {
    .worksheet-landing {
      padding: 0.75rem;
    }

    .hero {
      grid-template-columns: 1fr;
      padding-top: 0.5rem;
    }

    .worksheet-title-row,
    .section-head {
      flex-direction: column;
    }

    .worksheet-section {
      overflow: hidden;
      padding: 0.75rem;
    }

    :global(.landing-workbook.workbook-page) {
      max-width: none;
      padding: 0;
      gap: 0.35rem;
    }

    :global(.landing-workbook.workbook-page .worksheet-sheet-header) {
      padding: 0 0.1rem;
    }

    :global(.landing-workbook.workbook-page .sheet) {
      border-radius: 8px;
      max-height: 430px;
      overflow: hidden;
      padding: 0.45rem;
      position: relative;
    }

    :global(.landing-workbook.workbook-page .sheet::after) {
      content: "";
      position: absolute;
      inset: auto 0 0;
      height: 4rem;
      background: linear-gradient(to bottom, rgba(255, 255, 255, 0), #ffffff);
      pointer-events: none;
    }

    :global(.landing-workbook.workbook-page .grid) {
      min-width: 900px;
    }

    :global(.landing-workbook.workbook-page .cell) {
      min-height: 40px;
      font-size: 0.82rem;
    }

    :global(.landing-workbook.workbook-page .cell.pinyin),
    :global(.landing-workbook.workbook-page .cell.english) {
      font-size: 0.72rem;
    }

    :global(.landing-workbook.workbook-page .cell.chinese) {
      font-size: 1rem;
    }

    .group-row {
      align-items: flex-start;
      flex-direction: column;
    }

    .group-actions {
      flex-direction: row;
      align-items: center;
    }
  }

  @media print {
    :global(body) {
      background: white !important;
    }

    :global(.no-print) {
      display: none !important;
    }

    .worksheet-landing {
      background: white;
      color: black;
      padding: 0;
      display: block;
    }

    .worksheet-landing > section {
      max-width: none;
    }

    .worksheet {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .worksheet-section {
      border: none;
      border-radius: 0;
      padding: 0;
    }

  }
</style>
