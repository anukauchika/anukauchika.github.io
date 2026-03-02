<script>
  import { goto } from '$app/navigation'
  import { svcDataset } from '@svc/dataset'
  import { svcUserPrefs } from '@svc/user-prefs'
  import Quick from '@std/ui/quick.svelte'

  async function open(id) {
    await svcDataset.selectDataset(id)
    goto('/chinese/')
  }
</script>

<svelte:head>
  <title>Anuka Uchika — Learn Chinese</title>
  <meta
    name="description"
    content="Study HSK Chinese vocabulary with stroke drills, spaced repetition, and printable workbooks."
  />
</svelte:head>

<main class="anuka-page">
  <div class="anuka-island">
    <Quick icon="moon" label="Toggle theme" onclick={svcUserPrefs.toggleTheme} />
    <div class="anuka-stack">
      <h1 class="anuka-island-title">Anuka Uchika Chinese</h1>
      <p class="anuka-mute anuka-md">
        The 1000 most-used Chinese words.<br />Practice writing & memo pronunciation. Prepare for the HSK exam.
      </p>

      <div class="anuka-stack">
        <button class="anuka-card" onclick={() => open('chinese-hskv3-elementary')}>
          <div class="anuka-stack anuka-center">
            <span class="anuka-hanzi anuka-lg">汉字</span>
            <strong>HSK Elementary</strong>
            <span class="anuka-sm anuka-mute">Levels 1–3 · Start here</span>
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
          <strong>Structured</strong>
          <span class="anuka-mute">1,000 words organized into groups. One group — one lesson.</span>
          <span class="anuka-mute">Includes in-app writing practice and dedicated pinyin drills.</span>
        </div>
      </div>
      <div class="anuka-card">
        <div class="anuka-stack">
          <strong>Track progress</strong>
          <span class="anuka-mute"> Advanced statistics & personalized smart repetition algorithm. </span>
        </div>
      </div>
      <div class="anuka-card">
        <div class="anuka-stack">
          <strong>Add offline practice</strong>
          <span class="anuka-mute">
            Each group prints as an A4 worksheet for writing, pinyin & translation practice on paper.
          </span>
        </div>
      </div>
    </div>
    <span class="anuka-mute anuka-md">
      Understand reality to be effective. Target the Sun to reach the Moon — but you still need physics to build the rocket.
    </span>
  </div>

  <div class="anuka-island">
    <div class="anuka-row anuka-center">
      <a href="/chinese/blog" class="anuka-btn">Read the Blog</a>
      <a href="/chinese/drill/hanzi?dataset=chinese-hskv3-elementary&group=1" class="anuka-btn anuka-main">Try a Lesson</a>
    </div>
  </div>
</main>
