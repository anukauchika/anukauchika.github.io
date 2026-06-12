<script>
  import Island from '@std/ui/island.svelte'
  import IslandTitle from '@std/ui/island-title.svelte'
  import { gaHeadSnippet } from '@low/google/analytics'

  let { data } = $props()

  const total = data.levels.reduce((sum, l) => sum + l.count, 0)
</script>

<svelte:head>
  <title>HSK 3.0 Word Lists by Level (2026) — Pinyin & English | Anuka Uchika</title>
  <meta
    name="description"
    content="Complete HSK 3.0 (2026) vocabulary lists: HSK 1–6 and the advanced 7–9 band. {total.toLocaleString('en-US')} words with pinyin and English translations, free to browse and drill."
  />
  <link rel="canonical" href="https://anukauchika.com/chinese/hsk/" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="HSK 3.0 Word Lists by Level (2026)" />
  <meta property="og:description" content="All HSK 3.0 vocabulary with pinyin and English — levels 1 through 7–9." />
  <meta property="og:url" content="https://anukauchika.com/chinese/hsk/" />
  <meta property="og:site_name" content="Anuka Uchika" />
  <meta property="og:image" content="https://anukauchika.com/og-image.png" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="https://anukauchika.com/og-image.png" />
  {@html gaHeadSnippet}
</svelte:head>

<main class="anuka-page">
  <Island sticky>
    <div class="anuka-row anuka-justify">
      <IslandTitle level={3}><span>HSK 3.0 Word Lists</span></IslandTitle>
      <a class="anuka-quick" href="/chinese/" title="Open the app">
        <span class="anuka-icon anuka-icon-close"></span>
      </a>
    </div>
  </Island>

  <Island prose>
    <IslandTitle level={1}>HSK 3.0 Word Lists by Level</IslandTitle>
    <p>
      <strong>HSK 3.0</strong> (effective 2026) is the current version of the Hànyǔ Shuǐpíng Kǎoshì, the official
      Chinese proficiency test. It organizes vocabulary into six numbered levels plus a combined advanced band, HSK
      7–9. The lists below cover {total.toLocaleString('en-US')} words, each with pinyin and an English translation.
    </p>
    <table>
      <thead>
        <tr><th>Level</th><th>Words</th><th>What it covers</th></tr>
      </thead>
      <tbody>
        {#each data.levels as level (level.slug)}
          <tr>
            <td><a href="/chinese/hsk/{level.slug}/">{level.name} word list</a></td>
            <td>{level.count.toLocaleString('en-US')}</td>
            <td>{level.blurb}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    <p>
      Every word here can be practiced in the app: stroke-by-stroke
      <a href="/chinese/">writing drills</a>, pinyin drills, and printable A4 worksheets. New to the test? Start with
      <a href="/chinese/blog/hsk-elementary/">our guide to HSK Elementary</a>.
    </p>
  </Island>

  <Island>
    <div class="anuka-row anuka-center">
      <a href="/chinese/blog/" class="anuka-btn">Read the Blog</a>
      <a href="/chinese/" class="anuka-btn anuka-main">Practice These Words</a>
    </div>
  </Island>
</main>
