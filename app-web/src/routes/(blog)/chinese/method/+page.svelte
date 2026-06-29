<script>
  import Island from '@std/ui/island.svelte'
  import IslandTitle from '@std/ui/island-title.svelte'

  const url = 'https://anukauchika.com/chinese/method/'
  const title = 'The Accordion Workbook Method — Printable Chinese Writing Practice'
  const description =
    'Print an HSK vocabulary worksheet, fold it accordion-style, and practice writing Chinese characters on paper with built-in self-checking. One sheet, three practice passes.'

  const steps = [
    {
      name: 'Print the worksheet',
      text: 'Print the workbook grid for a word group on A4: given columns (characters, pinyin, translation) plus empty practice columns.',
    },
    {
      name: 'Fold accordion-style',
      text: 'Fold the sheet so only one reference column and the empty practice columns are visible. The answers hide in the folds.',
    },
    {
      name: 'Fill in the blanks',
      text: 'Work through the visible column: read the prompt and write the answer by hand in the empty column next to it.',
    },
    {
      name: 'Unfold and self-check',
      text: 'Unfold the sheet to reveal the answer column and check your work. Mark the words you missed and revisit them next session.',
    },
  ]
</script>

<svelte:head>
  <title>{title} | Anuka Uchika</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={url} />
  <meta property="og:type" content="website" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={url} />
  <meta property="og:site_name" content="Anuka Uchika" />
  <meta property="og:image" content="https://anukauchika.com/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="https://anukauchika.com/og-image.png" />
  {@html `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Practice writing Chinese characters with an accordion-folded worksheet',
    description,
    totalTime: 'PT20M',
    supply: [{ '@type': 'HowToSupply', name: 'Printed A4 worksheet' }, { '@type': 'HowToSupply', name: 'Pen or pencil' }],
    step: steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
    url,
  })}<\/script>`}
</svelte:head>

<main class="anuka-page">
  <Island sticky>
    <div class="anuka-row anuka-justify">
      <IslandTitle level={3}><span>The Accordion Workbook Method</span></IslandTitle>
      <a class="anuka-quick" href="/chinese/" title="Open the app">
        <span class="anuka-icon anuka-icon-close"></span>
      </a>
    </div>
  </Island>

  <Island prose>
    <IslandTitle level={1}>The Accordion Workbook Method</IslandTitle>
    <p>
      Writing Chinese characters by hand is the most effective way to remember them — and the easiest practice to skip,
      because checking your own handwriting usually needs a teacher or an app. The accordion workbook fixes that:
      <strong>one printed sheet becomes a self-checking practice session</strong>, no screen required.
    </p>
    <p>
      Each worksheet covers one <strong>word group</strong> — a small, immutable set of words sized for a single study
      session. The grid has given columns (characters, pinyin, English) and empty practice columns.
    </p>

    <h2>How it works</h2>
    <ol>
      {#each steps as step (step.name)}
        <li><strong>{step.name}.</strong> {step.text}</li>
      {/each}
    </ol>

    <h2>Three practice passes from one sheet</h2>
    <p>Each fold turns the same sheet into a different exercise:</p>
    <ul>
      <li><strong>Pinyin → characters:</strong> see the pinyin, write the hanzi from memory.</li>
      <li><strong>English → pinyin:</strong> see the translation, write the pinyin with tones.</li>
      <li><strong>Characters → English:</strong> see the hanzi, write the meaning.</li>
    </ul>
    <p>
      That makes the practice tactile and bidirectional: you recall the character from its sound, the sound from the
      meaning, and the meaning from the character — the three links that actually get tested in real reading and
      writing.
    </p>

    <h2>Why it sticks</h2>
    <p>
      Because groups are immutable with stable numbers, your brain anchors memories to them — "that word is in group
      12" is a real retrieval cue. Combined with <strong>spaced repetition</strong> (the app tracks which groups are
      due for review), the same sheet gets reprinted and refolded over days and weeks until the group is mastered.
    </p>
    <p>
      Print worksheets for any <a href="/chinese/hsk/">HSK 3.0 level</a> from the
      <a href="/chinese/">vocabulary browser</a> — every group has a print button. The same groups are also available
      as on-screen <a href="/chinese/">stroke-by-stroke writing drills</a> with instant feedback.
    </p>
  </Island>

  <Island>
    <div class="anuka-row anuka-center">
      <a href="/chinese/hsk/" class="anuka-btn">HSK Word Lists</a>
      <a href="/chinese/" class="anuka-btn anuka-main">Print a Worksheet</a>
    </div>
  </Island>
</main>
