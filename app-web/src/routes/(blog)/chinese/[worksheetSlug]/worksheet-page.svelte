<script>
  import { onMount } from 'svelte'
  import { formatGroup } from '@std/format'
  import WorkbookChinese from '@uic/kind/chinese/workbook.svelte'
  import '@uic/workbook.css'
  import {
    appendAttributionParams,
    initAttributionParams,
    getCurrentAttributionParams,
  } from '@low/worksheet/attribution'
  import {
    trackPrintLandAuxiClicked,
    trackPrintLandCoreClicked,
    trackPrintLandViewed,
  } from '@low/google/landing-analytics'
  import {
    getWorksheetDatasetUrl,
    getWorksheetGroupUrl,
    getWorksheetGroupDrillUrl,
    getChineseAppUrl,
  } from '../worksheet-datasets'

  let { dataset, group, groups, variant = 'collection' } = $props()

  const isCollection = $derived(variant === 'collection')
  const title = $derived(
    isCollection
      ? `${dataset.name} Printable Chinese Worksheets`
      : `${dataset.name} Printable Chinese Worksheet - Group ${group.group}`,
  )
  const description = $derived(
    isCollection
      ? `Print free ${dataset.name} Chinese vocabulary memorization worksheets with hanzi, pinyin, English meanings, and structured active recall practice. Practice all groups online.`
      : `Print ${dataset.name} Group ${group.group} as a Chinese vocabulary memorization sheet with hanzi, pinyin, English meanings, and structured active recall practice.`,
  )
  const canonical = $derived(
    isCollection
      ? `https://anukauchika.com/chinese/${dataset.slug}/`
      : `https://anukauchika.com${getWorksheetGroupUrl(dataset, group.group)}`,
  )

  let attributionParams = $state({})
  let drillMode = $state('pinyin')

  const updateDrillMode = () => {
    drillMode = globalThis.matchMedia('(max-width: 820px)').matches ? 'hanzi' : 'pinyin'
  }

  const drillHref = (targetGroup) =>
    appendAttributionParams(getWorksheetGroupDrillUrl(dataset, targetGroup.group, drillMode), attributionParams)
  const groupHref = (targetGroup) => appendAttributionParams(getWorksheetGroupUrl(dataset, targetGroup.group), attributionParams)
  const appHref = $derived(appendAttributionParams(getChineseAppUrl(dataset), attributionParams))
  const formatPrintDate = () => {
    const now = new Date()
    const day = String(now.getDate()).padStart(2, '0')
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = String(now.getFullYear())
    const weekday = now.toLocaleDateString('en-US', { weekday: 'short' })
    return `${day}-${month}-${year} ${weekday}`
  }
  const printDate = formatPrintDate()

  const handlePrint = () => {
    trackPrintLandCoreClicked('print_worksheet', dataset.id)
    globalThis.print()
  }

  const handlePractice = (event, targetGroup) => {
    event.preventDefault()
    const params = getCurrentAttributionParams()
    trackPrintLandAuxiClicked('practice_drill', dataset.id)
    globalThis.location.href = appendAttributionParams(getWorksheetGroupDrillUrl(dataset, targetGroup.group, drillMode), params)
  }

  const handleFullApp = (event) => {
    event.preventDefault()
    const params = getCurrentAttributionParams()
    const targetUrl = appendAttributionParams(getChineseAppUrl(dataset), params)
    trackPrintLandAuxiClicked('practice_app', dataset.id)
    globalThis.location.href = targetUrl
  }

  onMount(() => {
    attributionParams = initAttributionParams()
    trackPrintLandViewed(dataset.id)

    updateDrillMode()
    const media = globalThis.matchMedia('(max-width: 820px)')
    media.addEventListener('change', updateDrillMode)

    return () => media.removeEventListener('change', updateDrillMode)
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
  <section id="worksheet-top" class="hero no-print">
    <div class="hero-copy">
      <p class="eyebrow">Free Chinese worksheets</p>
      <h1 aria-label={title}>
        {#if isCollection}
          <span class="title-line">{dataset.name}</span>
          <span class="title-line">Printable Chinese Worksheets</span>
        {:else}
          {title}
        {/if}
      </h1>
      {#if isCollection}
        <p class="subtitle">
          Print {dataset.name} Chinese vocabulary memorization sheets and learn words with active recall.
        </p>
      {:else}
        <p class="subtitle">
          Print {dataset.name} Group {group.group} as a Chinese vocabulary memorization sheet with hanzi, pinyin,
          meaning, and structured active recall practice.
        </p>
      {/if}
      <div class="actions">
        <button class="anuka-btn anuka-main anuka-lg" type="button" onclick={handlePrint}>
          <span class="anuka-icon anuka-icon-print"></span>
          {isCollection ? `Print Group ${group.group} Worksheet` : 'Print Worksheet'}
        </button>
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
        <a class="anuka-btn anuka-lg" href="#learning-method" onclick={() => trackPrintLandAuxiClicked('method', dataset.id)}>
          See more
          <span class="down-arrow" aria-hidden="true"></span>
        </a>
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
        <a class="app-link" href={appHref} onclick={handleFullApp}>Try Chinese Drills Online &rarr;</a>
      </div>
      <p class="print-note">
        For best results: choose Landscape orientation and Narrow / Minimum margins in the print dialog.
      </p>
    </div>
    <aside class="hero-facts">
      <strong>{groups.length} worksheet groups</strong>
      <span>{dataset.name} is divided into 15-word groups for structured practice and systematic memorization. Print each group directly from the browser.</span>
    </aside>
  </section>

  <section class="worksheet-section worksheet" aria-labelledby="worksheet-title">
    <div class="worksheet-title-row no-print">
      <div>
        <p class="eyebrow">Featured printable worksheet</p>
        <h2 id="worksheet-title">{dataset.name} Worksheet - Group {group.group}</h2>
      </div>
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
      <a class="site-mark" href={appendAttributionParams('/', attributionParams)} onclick={() => trackPrintLandAuxiClicked('root', dataset.id)}>
        anukauchika.com
      </a>
    </div>

    <div class="workbook-page landing-workbook">
      <header class="sheet-header worksheet-sheet-header">
        <div class="group-line">
          <span class="group-title">{dataset.name}</span>
          <span class="sheet-separator">|</span>
          <span class="group-title">{formatGroup(group.group)}</span>
          <span class="sheet-separator">|</span>
          <span class="print-date">{printDate}</span>
        </div>
      </header>
      <WorkbookChinese {group} exerciseSets={2} />
    </div>

    <div class="below-worksheet-actions no-print">
      <button class="anuka-btn anuka-main" type="button" onclick={handlePrint}>
        <span class="anuka-icon anuka-icon-print"></span>
        Print Worksheet
      </button>
      <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
      <a class="anuka-btn" href={drillHref(group)} onclick={(event) => handlePractice(event, group)}>Practice Online</a>
    </div>
  </section>

  <section id="learning-method" class="how-to no-print" aria-labelledby="how-to-title">
    <div class="section-head">
      <h2 id="how-to-title">Learn by look-cover-write-check</h2>
      <a class="section-jump" href="#worksheet-top" aria-label="Go up">
        <span class="up-arrow" aria-hidden="true"></span>
      </a>
    </div>
    <ol>
      <li>Print a worksheet.</li>
      <li>Cover all columns except one.</li>
      <li>Look at the visible clue, then write the Chinese word from memory.</li>
      <li>Uncover the answer and check yourself.</li>
      <li>Repeat with another column: meaning, pinyin, or characters.</li>
      <li>Click "Practice Online" to review the same words with drills.</li>
    </ol>
  </section>

  {#if dataset.related.length}
    <section class="advanced-section no-print" aria-labelledby="advanced-title">
      <div class="section-head">
        <h2 id="advanced-title">More Sets</h2>
        <p>
          Explore related printable sets.
        </p>
      </div>
      <div class="advanced-list">
        {#each dataset.related as rel (rel.id)}
          <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
          <a class="advanced-link" href={appendAttributionParams(getWorksheetDatasetUrl(rel), attributionParams)} onclick={() => trackPrintLandAuxiClicked('related_collection', dataset.id)}>
            <strong>{rel.name}</strong>
            <span>{rel.description}</span>
          </a>
        {/each}
      </div>
    </section>
  {/if}

  <section class="groups-section no-print" aria-labelledby="all-groups-title">
    <div class="section-head">
      <h2 id="all-groups-title">All {dataset.name} Groups</h2>
      <p>
        Open any group as a printable worksheet.
      </p>
    </div>
    <div class="group-list compact">
      {#each groups as targetGroup (targetGroup.group)}
        <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
        <a class:current={targetGroup.group === group.group} href={groupHref(targetGroup)} onclick={() => trackPrintLandAuxiClicked('group', dataset.id)}>
          Group {targetGroup.group}
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
    scroll-behavior: smooth;
  }

  :global(html) {
    scroll-behavior: smooth;
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
    font-size: clamp(2.2rem, 5vw, 4.4rem);
    line-height: 1.02;
    letter-spacing: 0;
  }

  .title-line {
    display: block;
  }

  h2 {
    font-size: clamp(1.45rem, 2.4vw, 2rem);
    line-height: 1.18;
    letter-spacing: 0;
  }

  .subtitle {
    max-width: 680px;
    color: #4f4840;
    font-size: 1.18rem;
  }

  .print-note,
  .section-head p,
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

  .how-to {
    scroll-margin-top: 8rem;
  }

  .how-to .section-head {
    display: block;
    position: relative;
    padding-right: 2.75rem;
  }

  .how-to .section-jump {
    position: absolute;
    top: 0;
    right: 0;
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

  .section-jump {
    color: #6b6258;
    width: 2rem;
    height: 2rem;
    border: 1px solid rgba(0, 0, 0, 0.07);
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 1.05rem;
    font-weight: 700;
    line-height: 1;
    text-decoration: none;
    white-space: nowrap;
  }

  .section-jump:hover {
    color: #1f6f5c;
    border-color: rgba(31, 111, 92, 0.38);
  }

  .up-arrow {
    width: 0.58rem;
    height: 0.58rem;
    border-top: 2px solid currentColor;
    border-left: 2px solid currentColor;
    transform: translateY(0.14rem) rotate(45deg);
  }

  .down-arrow {
    width: 0.58rem;
    height: 0.58rem;
    border-right: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    transform: translateY(-0.14rem) rotate(45deg);
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
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(7.5rem, 1fr));
    gap: 0.55rem;
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
    font-size: 1rem;
    font-weight: 800;
    line-height: 1.2;
  }

  .advanced-link span {
    color: #6b6258;
    font-size: 0.88rem;
  }

  .advanced-link:hover strong {
    text-decoration: underline;
  }

  .group-list.compact a {
    min-height: 2.5rem;
    border: 1px solid rgba(0, 0, 0, 0.07);
    border-radius: 8px;
    padding: 0.45rem 0.75rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    text-decoration: none;
    background: #f8f6f2;
    white-space: nowrap;
  }

  .group-list.compact a.current {
    background: #1f6f5c;
    color: #ffffff;
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
