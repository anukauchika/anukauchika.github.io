<script>
  import { goto } from '$app/navigation'
  import { svcUserPrefs } from '@svc/user-prefs'
  import Quick from '@std/ui/quick.svelte'
  import HanziAnimate from '@uic/kind/chinese/hanzi-animate.svelte'

  function open(id) {
    goto(`/chinese/?dataset=${id}`)
  }
</script>

<svelte:head>
  <title>Anuka Uchika — Learn to Write Chinese Characters | HSK Drills</title>
  <meta
    name="description"
    content="Learn to write Chinese characters stroke by stroke. Free HSK 3.0 writing & pinyin drills with smart repetition and printable worksheets, for self-directed learners."
  />
  <link rel="canonical" href="https://anukauchika.com/" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Anuka Uchika — Learn to Write Chinese Characters" />
  <meta
    property="og:description"
    content="Free HSK writing & pinyin drills with smart repetition and printable worksheets."
  />
  <meta property="og:url" content="https://anukauchika.com/" />
  <meta property="og:site_name" content="Anuka Uchika" />
  <meta property="og:image" content="https://anukauchika.com/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Anuka Uchika — Learn to Write Chinese Characters" />
  <meta
    name="twitter:description"
    content="Free HSK writing & pinyin drills with smart repetition and printable worksheets."
  />
  <meta name="twitter:image" content="https://anukauchika.com/og-image.png" />
  {@html `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Anuka Uchika",
    "url": "https://anukauchika.com/",
    "description":
      "Learn to write Chinese characters stroke by stroke. HSK 3.0 writing & pinyin drills with smart repetition and printable A4 worksheets.",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "Web",
    "browserRequirements": "Requires JavaScript",
    "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
    "inLanguage": ["en", "zh"],
    "image": "https://anukauchika.com/og-image.png",
    "author": { "@type": "Person", "name": "Anuka" },
  })}<\/script>`}
</svelte:head>

<main class="anuka-page">
  <div class="anuka-island">
    <Quick icon="moon" label="Toggle theme" onclick={svcUserPrefs.toggleTheme} />
    <div class="anuka-stack">
      <h1 class="anuka-island-title">Anuka Uchika Chinese</h1>
      <p class="anuka-mute anuka-md">
        Learn to write Chinese characters — stroke by stroke.<br />
        Daily writing & pinyin drills, smart repetition, and printable worksheets. Prepare for the HSK exam.<br />
        Built for self-directed learners who are done with gamified apps.
      </p>

      <div class="anuka-stack">
        <button class="anuka-card" onclick={() => open('chinese-hskv3-elementary')}>
          <div class="anuka-stack anuka-center">
            <HanziAnimate char="汉" />
            <strong>HSK Elementary</strong>
            <span class="anuka-sm anuka-mute">Levels 1–3 · The 1,000 most-used words · Start here</span>
          </div>
        </button>

        <div class="anuka-grid">
          <button class="anuka-card" onclick={() => open('chinese-hskv3-intermediate')}>
            <div class="anuka-stack">
              <strong>HSK Intermediate</strong>
              <span class="anuka-sm anuka-mute">Levels 4–6</span>
            </div>
          </button>
          <button class="anuka-card" onclick={() => open('chinese-hskv3-advanced')}>
            <div class="anuka-stack">
              <strong>HSK Advanced</strong>
              <span class="anuka-sm anuka-mute">Levels 7–9</span>
            </div>
          </button>
        </div>
      </div>

    </div>
  </div>

  <div class="anuka-island">
    <h2 class="anuka-island-title">How it works</h2>
    <div class="anuka-grid">
      <div class="anuka-card">
        <div class="anuka-stack">
          <strong>Drill daily</strong>
          <span class="anuka-mute">
            Trace each character stroke by stroke and get instant feedback. Words come in small groups — one group is
            one lesson.
          </span>
        </div>
      </div>
      <div class="anuka-card">
        <div class="anuka-stack">
          <strong>Repeat on schedule</strong>
          <span class="anuka-mute">
            Every word you drill is tracked. The repetition algorithm picks your next group and brings words back right
            before you forget them.
          </span>
        </div>
      </div>
      <div class="anuka-card">
        <div class="anuka-stack">
          <strong>Take it to paper</strong>
          <span class="anuka-mute">
            Print any group as an A4 worksheet, fold it accordion-style, and practice writing, pinyin & translation
            offline.
          </span>
        </div>
      </div>
    </div>
  </div>

  <div class="anuka-island">
    <h2 class="anuka-island-title">Why this app exists</h2>
    <p class="anuka-mute anuka-md">
      I'm a software engineer learning Chinese. My first streak in a popular language app lasted 300+ days — and turned
      out to be a comforting illusion: lessons completed, little retained. Anuka Uchika is the system I built to make
      real progress instead — honest drills, real stats, no streak theater.
    </p>
    <div class="anuka-row anuka-center">
      <a href="/chinese/blog/nihao" class="anuka-btn">Read the story</a>
    </div>
  </div>

  <div class="anuka-island">
    <div class="anuka-row anuka-center">
      <a href="/chinese/hsk" class="anuka-btn">HSK Word Lists</a>
      <a href="/chinese/blog" class="anuka-btn">Read the Blog</a>
      <a href="/chinese/drill/hanzi?dataset=chinese-hskv3-elementary&group=1" class="anuka-btn anuka-main">Try a Lesson</a>
    </div>
  </div>
</main>
