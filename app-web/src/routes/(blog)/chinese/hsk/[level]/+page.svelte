<script>
  import Island from '@std/ui/island.svelte'
  import IslandTitle from '@std/ui/island-title.svelte'
  import { gaHeadSnippet } from '@low/google/analytics'

  let { data } = $props()

  const level = $derived(data.level)
  const count = $derived(level.words.length)
  const url = $derived(`https://anukauchika.com/chinese/hsk/${level.slug}/`)
  const title = $derived(`${level.name} Word List — ${count.toLocaleString('en-US')} Words with Pinyin & English (HSK 3.0)`)
  const description = $derived(
    `Complete ${level.name} vocabulary list for HSK 3.0 (2026): ${count.toLocaleString('en-US')} words with pinyin and English translations. Free to browse, drill, and print.`,
  )
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={url} />
  <link rel="alternate" type="text/markdown" href="https://anukauchika.com/chinese/hsk/{level.slug}.md" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={url} />
  <meta property="og:site_name" content="Anuka Uchika" />
  <meta property="og:image" content="https://anukauchika.com/og-image.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="https://anukauchika.com/og-image.png" />
  {@html `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: `${level.name} word list (HSK 3.0 2026)`,
    description,
    url,
    creator: { '@type': 'Organization', name: 'Anuka Uchika', url: 'https://anukauchika.com/' },
    isAccessibleForFree: true,
  })}<\/script>`}
  {@html gaHeadSnippet}
</svelte:head>

<main class="anuka-page">
  <Island sticky>
    <div class="anuka-row anuka-justify">
      <IslandTitle level={3}><span>{level.name} Word List</span></IslandTitle>
      <a class="anuka-quick" href="/chinese/hsk/" title="All HSK levels">
        <span class="anuka-icon anuka-icon-close"></span>
      </a>
    </div>
  </Island>

  <Island prose>
    <IslandTitle level={1}>{level.name} Word List (HSK 3.0)</IslandTitle>
    <p>
      {level.blurb} This list contains all <strong>{count.toLocaleString('en-US')} words</strong> of
      {level.name} under the HSK 3.0 (2026) standard, with pinyin and English translations. You can practice every
      word in the app with stroke-by-stroke <a href="/chinese/?dataset={level.datasetId}">writing drills</a>, pinyin
      drills, and printable <a href="/chinese/method/">accordion-fold A4 worksheets</a>.
    </p>
    <p>
      Other levels:
      {#each data.others as other, i (other.slug)}
        {i > 0 ? ' · ' : ''}<a href="/chinese/hsk/{other.slug}/">{other.name}</a>
      {/each}
      · <a href="/chinese/hsk/">overview</a>
    </p>
    <table>
      <thead>
        <tr><th>#</th><th>汉字</th><th>Pinyin</th><th>English</th></tr>
      </thead>
      <tbody>
        {#each level.words as w, i (`${w.word}|${w.pinyin}`)}
          <tr>
            <td>{i + 1}</td>
            <td translate="no" lang="zh-CN">{w.word}</td>
            <td translate="no">{w.pinyin}</td>
            <td>{w.english}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </Island>

  <Island>
    <div class="anuka-row anuka-center">
      <a href="/chinese/hsk/" class="anuka-btn">All Levels</a>
      <a href="/chinese/?dataset={level.datasetId}" class="anuka-btn anuka-main">Practice These Words</a>
    </div>
  </Island>
</main>
