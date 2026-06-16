<script>
  import { goto } from '$app/navigation'
  import { svcUserPrefs } from '@svc/user-prefs'
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

  <div class="anuka-row anuka-right">
    <button class="anuka-btn-icon" onclick={svcUserPrefs.toggleTheme} aria-label="Toggle theme">
      <span class="anuka-icon anuka-icon-moon"></span>
    </button>
  </div>

  <!-- Hero -->
  <div class="anuka-island">
    <div class="anuka-hero">
      <HanziAnimate char="汉" size={250} frameClass="" />
      <div class="anuka-stack">
        <h1 class="anuka-island-title">Learn to write<br>Chinese characters</h1>
        <p class="anuka-mute">
          Stroke-by-stroke drills · Smart repetition · Printable worksheets.<br>
          Prepare for the HSK exam. No streak theater.
        </p>
        <div class="anuka-row">
          <a
            href="/chinese/drill/pinyin/?dataset=chinese-hskv3-elementary&group=1"
            class="anuka-btn anuka-main lesson-cta lesson-cta-desktop"
          >
            Try a free lesson →
          </a>
          <a
            href="/chinese/drill/hanzi/?dataset=chinese-hskv3-elementary&group=1"
            class="anuka-btn anuka-main lesson-cta lesson-cta-mobile"
          >
            Try a free lesson →
          </a>
        </div>
      </div>
    </div>

    <div class="anuka-divider">choose your level</div>

    <div class="anuka-stack">
      <button class="anuka-card" onclick={() => open('chinese-hskv3-elementary')}>
        <div class="anuka-row anuka-justify">
          <div class="anuka-stack anuka-compact">
            <strong>HSK Elementary</strong>
            <span class="anuka-sm anuka-mute">Levels 1–3 · The 1,000 most-used words</span>
          </div>
          <span class="anuka-tag anuka-main">Start here</span>
        </div>
      </button>
      <div class="anuka-grid">
        <button class="anuka-card" onclick={() => open('chinese-hskv3-intermediate')}>
          <div class="anuka-stack anuka-compact">
            <strong>HSK Intermediate</strong>
            <span class="anuka-sm anuka-mute">Levels 4–6</span>
          </div>
        </button>
        <button class="anuka-card" onclick={() => open('chinese-hskv3-advanced')}>
          <div class="anuka-stack anuka-compact">
            <strong>HSK Advanced</strong>
            <span class="anuka-sm anuka-mute">Levels 7–9</span>
          </div>
        </button>
      </div>
    </div>
  </div>

  <!-- How it works -->
  <div class="anuka-island">
    <h2 class="anuka-island-title">How it works</h2>
    <div class="anuka-grid">
      <div class="anuka-card">
        <div class="anuka-stack">
          <div class="anuka-row anuka-compact">
            <div class="anuka-tile anuka-sm anuka-main">1</div>
            <strong>Drill daily</strong>
          </div>
          <span class="anuka-mute anuka-sm">
            Trace each character stroke by stroke and get instant feedback.
            Words come in small groups — one group is one lesson.
          </span>
        </div>
      </div>
      <div class="anuka-card">
        <div class="anuka-stack">
          <div class="anuka-row anuka-compact">
            <div class="anuka-tile anuka-sm anuka-main">2</div>
            <strong>Repeat on schedule</strong>
          </div>
          <span class="anuka-mute anuka-sm">
            Every word you drill is tracked. The repetition algorithm picks your next group
            and brings words back right before you forget them.
          </span>
        </div>
      </div>
      <div class="anuka-card">
        <div class="anuka-stack">
          <div class="anuka-row anuka-compact">
            <div class="anuka-tile anuka-sm anuka-main">3</div>
            <strong>Take it to paper</strong>
          </div>
          <span class="anuka-mute anuka-sm">
            Print any group as an A4 worksheet, fold it accordion-style, and practice
            writing, pinyin & translation offline.
            <a href="/chinese/method/">How the folding works →</a>
          </span>
        </div>
      </div>
    </div>
  </div>

  <!-- Why this app -->
  <div class="anuka-island">
    <h2 class="anuka-island-title">Why this app exists</h2>
    <p class="anuka-mute anuka-md">
      I'm a software engineer learning Chinese. My first streak in a popular language app lasted 300+ days —
      and turned out to be a comforting illusion: lessons completed, little retained.
      Anuka Uchika is the system I built to make real progress instead — honest drills, real stats, no streak theater.
    </p>
    <a href="/chinese/blog/nihao/" class="anuka-btn-link">Read the full story →</a>
  </div>

  <!-- Footer links -->
  <div class="anuka-island">
    <div class="anuka-row anuka-center">
      <a href="/chinese/hsk/" class="anuka-btn">HSK Word Lists</a>
      <a href="/chinese/blog/" class="anuka-btn">Read the Blog</a>
    </div>
  </div>

</main>

<style>
  .lesson-cta-mobile {
    display: none;
  }

  @media (max-width: 640px) {
    .lesson-cta-desktop {
      display: none;
    }

    .lesson-cta-mobile {
      display: inline-flex;
    }
  }
</style>
