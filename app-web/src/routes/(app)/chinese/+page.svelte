<script>
  import { browser } from '$app/environment'
  import { goto } from '$app/navigation'
  import { sttDataset } from '@stt/dataset.svelte.js'
  import { sttHome } from '@stt/kind/chinese/home.svelte.js'
  import { sttAuth } from '@stt/auth.svelte.js'
  import { svcAuth } from '@svc/auth'
  import { svcHome } from '@svc/kind/chinese/home'
  import { svcUserPrefs } from '@svc/user-prefs'
  import AuthModal from '@uic/auth-modal.svelte'
  import BtnIcon from '@std/ui/btn-icon.svelte'
  import Modal from '@std/ui/modal.svelte'

  let showAuthDropdown = $state(false)
  let showDatasetPicker = $state(false)
  let showLessons = $state(false)
  let LessonsModal = $state()
  let showHowWorks = $state(false)

  const DAILY_GOAL_MIN = 60
  const motivationPhrases = [
    'Progress starts where comfort ends.',
    'The only limit is you.',
    'Build progress, not participation.',
    'Invest in yourself, not in the app.',
    'Build your vocabulary, not long streaks.',
  ]

  let motivationText = $state(motivationPhrases[0])
  let motivationTyping = $state(false)

  const basePath = $derived.by(() => `/${sttDataset.current?.kind ?? 'chinese'}`)
  const datasetName = $derived(sttDataset.current?.name ?? 'Vocabulary')

  const wordsDrilled = $derived(sttHome.drilledWords)
  const totalWords = $derived(sttDataset.groups.reduce((sum, group) => sum + group.items.length, 0))
  const totalGroups = $derived(sttDataset.groups.length)
  const plannedToday = $derived(
    sttHome.dueCount === 0 && sttHome.loaded && sttAuth.isAuthenticated && wordsDrilled === 0 && totalGroups > 0
      ? 2
      : sttHome.dueCount,
  )
  const progressPercent = $derived(totalWords > 0 ? Math.round((wordsDrilled / totalWords) * 100) : 0)

  const minutesToday = $derived(Math.floor(sttHome.todayDurationMs / 60_000))
  const lessonsDone = $derived(sttHome.todaySessions)
  const lessonsTotal = $derived(lessonsDone + plannedToday)
  const drillHanzi = $derived(!sttAuth.isAuthenticated || wordsDrilled === 0 ? '开始' : '进步')

  const ringCircumference = 2 * Math.PI * 132
  const lessonsRatio = $derived(lessonsTotal > 0 ? Math.min(lessonsDone / lessonsTotal, 1) : 0)
  const ringOffset = $derived(ringCircumference * (1 - lessonsRatio))

  const minuteTicks = Array.from({ length: 60 }, (_, i) => {
    const angle = (i / 60) * Math.PI * 2 - Math.PI / 2
    const major = i % 15 === 0
    const r1 = major ? 140 : 143
    const r2 = 149
    return {
      i,
      major,
      x1: 150 + r1 * Math.cos(angle),
      y1: 150 + r1 * Math.sin(angle),
      x2: 150 + r2 * Math.cos(angle),
      y2: 150 + r2 * Math.sin(angle),
    }
  })
  const drillHref = $derived.by(() => {
    const typeToPath = { stroke: 'hanzi', pinyin: 'pinyin' }
    const next = sttHome.next
    return next
      ? `${basePath}/drill/${typeToPath[next.type] || 'hanzi'}/?group=${next.groupId}&dataset=${sttDataset.id}&source=app_main`
      : `${basePath}/drill/hanzi/?group=1&dataset=${sttDataset.id}&source=app_main`
  })

  function selectDataset(id) {
    showDatasetPicker = false
    goto(`/chinese/?dataset=${id}`)
  }

  function plannedTodayLabel(count) {
    return `${count} ${count === 1 ? 'session' : 'sessions'} planned for today`
  }

  function handleDrillClick(event) {
    if (sttHome.loaded) return
    event.preventDefault()
  }

  async function openLessons() {
    if (!LessonsModal) LessonsModal = (await import('./lessons-modal.svelte')).default
    showLessons = true
  }

  $effect(() => {
    if (!browser) return

    let cancelled = false
    let phraseIndex = 0
    const timers = new Set()
    const sleep = (ms) =>
      new Promise((resolve) => {
        const timer = setTimeout(() => {
          timers.delete(timer)
          resolve()
        }, ms)
        timers.add(timer)
      })

    async function typePhrase(nextPhrase) {
      motivationTyping = true
      const currentPhrase = motivationText
      for (let i = currentPhrase.length; i >= 0 && !cancelled; i--) {
        motivationText = currentPhrase.slice(0, i)
        await sleep(18)
      }

      await sleep(120)

      for (let i = 1; i <= nextPhrase.length && !cancelled; i++) {
        motivationText = nextPhrase.slice(0, i)
        await sleep(34)
      }
      motivationTyping = false
    }

    async function loop() {
      while (!cancelled) {
        await sleep(15_000)
        if (cancelled) return
        phraseIndex = (phraseIndex + 1) % motivationPhrases.length
        await typePhrase(motivationPhrases[phraseIndex])
      }
    }

    loop()

    return () => {
      cancelled = true
      motivationTyping = false
      for (const timer of timers) clearTimeout(timer)
    }
  })

  // Runs on every mount (fresh gauge after a drill) and on dataset/auth changes.
  // Not keyed on sttAuth.dbVersion: chinese_home_summary is a direct server
  // read when authenticated, unaffected by local IDB state, so a dbVersion
  // bump (local db switch/restore) can't change its result — tracking it here
  // only produced duplicate refetches around sign-in.
  $effect(() => {
    sttAuth.isAuthenticated
    sttDataset.groups.length
    if (sttDataset.id) svcHome.load(sttDataset.id)
  })
</script>

<svelte:head>
  <title>HSK Vocabulary Drills — Stroke & Pinyin | Anuka Uchika</title>
  <meta
    name="description"
    content="Browse HSK 3.0 Chinese vocabulary in focused word groups. Practice with stroke-by-stroke writing drills, pinyin drills, printable A4 worksheets, and smart repetition."
  />
  <link rel="canonical" href="https://anukauchika.com/chinese/" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="HSK Vocabulary Drills — Stroke & Pinyin" />
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

<main class="anuka-page app-main-page">
  {#if browser}
    <section class="anuka-island app-main-island">
      <div class="app-topbar">
        <a class="app-mark" href="/">Anuka Uchika</a>

        <div class="app-controls">
          <BtnIcon onclick={svcUserPrefs.toggleTheme} label="Toggle theme" icon="moon" />
          {#if sttAuth.user}
            <BtnIcon onclick={() => (showAuthDropdown = true)} label="Account">
              {#if sttAuth.showAvatar}
                <img
                  class="anuka-avatar"
                  src={sttAuth.avatarUrl}
                  alt="Avatar"
                  onerror={() => (sttAuth.avatarError = true)}
                />
              {:else}
                <span>{sttAuth.userInitials}</span>
              {/if}
            </BtnIcon>
          {:else}
            <BtnIcon onclick={() => (showAuthDropdown = true)} label="Sign in">
              <span class="anuka-icon anuka-icon-user"></span>
            </BtnIcon>
          {/if}
        </div>
      </div>

      <div class="app-main-hero">
        <div class="app-main-copy">
          <button class="dataset-switch" type="button" onclick={() => (showDatasetPicker = true)}>
            <span>{datasetName}</span>
            <span class="dataset-caret" aria-hidden="true"></span>
          </button>

          <div
            class="app-gauge"
            class:app-watch-low={sttHome.loaded && lessonsRatio < 0.5}
            class:app-watch-progress={sttHome.loaded && lessonsRatio >= 0.5 && lessonsRatio < 0.9}
            class:app-watch-complete={sttHome.loaded && lessonsRatio >= 0.9}
            aria-label={sttHome.loaded
              ? `${lessonsDone} of ${lessonsTotal} lessons done today`
              : 'Loading your progress'}
          >
            <svg class="app-gauge-svg" viewBox="0 0 300 300" aria-hidden="true">
              <circle class="app-gauge-track" cx="150" cy="150" r="132" />
              {#if lessonsRatio > 0}
                <circle
                  class="app-gauge-progress"
                  cx="150"
                  cy="150"
                  r="132"
                  stroke-dasharray={ringCircumference}
                  stroke-dashoffset={ringOffset}
                />
              {/if}
              {#each minuteTicks as tick (tick.i)}
                <line class:major={tick.major} x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} />
              {/each}
            </svg>

            <a
              class="app-drill-circle"
              class:app-drill-circle-off={!sttHome.loaded}
              href={drillHref}
              aria-disabled={!sttHome.loaded}
              aria-label={sttHome.loaded
                ? `Start drill. ${minutesToday} of ${DAILY_GOAL_MIN} minutes trained today.`
                : 'Loading your progress'}
              onclick={handleDrillClick}
            >
              <span class="app-drill-zi">{drillHanzi}</span>
              <span
                class="app-drill-label"
                class:app-drill-label-loading={!sttHome.loaded}
                class:app-drill-label-try={!sttAuth.isAuthenticated}
              >
                {#if sttAuth.isAuthenticated}
                  Drill
                {:else}
                  <span>Try</span>
                  <span>a lesson</span>
                {/if}
              </span>
              <span class="app-drill-meta">
                {#if sttHome.loaded}
                  <span class="app-drill-stats">
                    <span
                      class="app-drill-stat"
                      class:app-lessons-complete={plannedToday === 0}
                      class:app-lessons-pending={plannedToday > 0}
                    >
                      <strong>{lessonsDone}</strong> lessons
                    </span>
                    <span
                      class="app-drill-stat"
                      class:app-time-low={minutesToday < 30}
                      class:app-time-progress={minutesToday >= 30 && minutesToday < 60}
                      class:app-time-complete={minutesToday >= 60}
                    >
                      <strong>{minutesToday}</strong> minutes
                    </span>
                  </span>
                  <span class="app-drill-done">done</span>
                {:else}
                  Loading
                {/if}
              </span>
            </a>
          </div>

          {#if sttAuth.isAuthenticated}
            <p class="app-truth">
              <span class="app-truth-main">
                You know <strong>{wordsDrilled.toLocaleString('en-US')}</strong> of
                <strong>{totalWords.toLocaleString('en-US')}</strong> words.
              </span>
              <span class="app-truth-tagline" class:typing={motivationTyping} aria-live="polite">{motivationText}</span>
            </p>
          {:else}
            <p class="app-truth app-truth-anon">
              <span class="app-truth-main">
                <button class="anuka-btn-link app-signin-link" type="button" onclick={() => (showAuthDropdown = true)}>
                  Sign in
                </button>
                <span>All {totalGroups.toLocaleString('en-US')} lessons, smart repetition & stats.</span>
              </span>
              <span class="app-truth-tagline" class:typing={motivationTyping} aria-live="polite">{motivationText}</span>
            </p>
          {/if}

          <div class="app-footer-actions">
            <div class="app-dataset-progress" aria-label={`${datasetName}: ${progressPercent}% complete`}>
              <span>{datasetName}</span>
              <span class="app-progress-track"><span style={`width: ${progressPercent}%`}></span></span>
              <strong>{progressPercent}%</strong>
            </div>
            {#if sttAuth.isAuthenticated}
              <a
                class="anuka-btn app-queue-btn"
                class:app-queue-btn-loading={!sttHome.loaded}
                href="/chinese/queue/"
                aria-busy={!sttHome.loaded}
                aria-label={sttHome.loaded ? plannedTodayLabel(plannedToday) : 'Loading queue'}
              >
                <span>Queue</span>
                <span class="app-queue-count">{sttHome.loaded ? plannedToday : '...'}</span>
              </a>
              <button class="anuka-btn app-help-btn" type="button" onclick={openLessons}>Lessons</button>
            {/if}
            <button class="anuka-btn app-help-btn" type="button" onclick={() => (showHowWorks = true)}>
              How it works
            </button>
          </div>
        </div>
      </div>
    </section>
  {:else}
    <section class="anuka-island app-main-island">
      <div class="app-topbar">
        <a class="app-mark" href="/">Anuka Uchika</a>
      </div>

      <div class="app-main-hero">
        <div class="app-main-copy">
          <div class="dataset-switch"><span>HSK Elementary</span></div>

          <div class="app-gauge" aria-label="Start an HSK Elementary drill">
            <svg class="app-gauge-svg" viewBox="0 0 300 300" aria-hidden="true">
              <circle class="app-gauge-track" cx="150" cy="150" r="132" />
              {#each minuteTicks as tick (tick.i)}
                <line class:major={tick.major} x1={tick.x1} y1={tick.y1} x2={tick.x2} y2={tick.y2} />
              {/each}
            </svg>

            <a
              class="app-drill-circle"
              href="/chinese/drill/hanzi/?group=1&dataset=chinese-hskv3-elementary&source=app_main"
              aria-label="Start an HSK Elementary drill"
            >
              <span class="app-drill-zi">开始</span>
              <span class="app-drill-label">Drill</span>
            </a>
          </div>

          <p class="app-truth app-truth-anon">
            <span class="app-truth-main">
              <button class="anuka-btn-link app-signin-link" type="button">Sign In</button>
              <span>All HSK Elementary 67 lessons, smart repetition & stats.</span>
            </span>
            <span class="app-truth-tagline">Progress starts where comfort ends</span>
          </p>
        </div>
      </div>
    </section>
  {/if}
</main>

{#if showDatasetPicker}
  <Modal onclose={() => (showDatasetPicker = false)}>
    <section class="anuka-island dataset-modal" aria-label="Pick a vocabulary">
      <div class="anuka-row anuka-justify">
        <h2 class="dataset-modal-title">Pick a vocabulary</h2>
        <BtnIcon icon="close" label="Close" onclick={() => (showDatasetPicker = false)} />
      </div>

      <div class="dataset-list">
        {#each sttDataset.meta.filter((dataset) => dataset.kind === 'chinese') as dataset (dataset.id)}
          <button
            class="dataset-option"
            class:current={dataset.id === sttDataset.id}
            type="button"
            onclick={() => selectDataset(dataset.id)}
          >
            <span>
              <strong>{dataset.name}</strong>
              <small>{dataset.description}</small>
            </span>
            {#if dataset.id === sttDataset.id}
              <span class="anuka-badge anuka-main">Current</span>
            {/if}
          </button>
        {/each}
      </div>
    </section>
  </Modal>
{/if}

{#if showLessons && LessonsModal}
  <LessonsModal onclose={() => (showLessons = false)} />
{/if}

{#if showHowWorks}
  <Modal onclose={() => (showHowWorks = false)}>
    <section class="anuka-island how-modal" aria-label="How it works">
      <div class="anuka-row anuka-justify">
        <h2 class="how-modal-title">How it works</h2>
        <BtnIcon icon="close" label="Close" onclick={() => (showHowWorks = false)} />
      </div>

      <div class="how-list">
        <section>
          <h3>Groups</h3>
          <p>Each vocabulary list is divided into groups of 15 words.</p>
        </section>

        <section>
          <h3>Learn one group</h3>
          <p>A lesson covers one group. You can practice both writing and pinyin.</p>
        </section>

        <section>
          <h3>Choose your device</h3>
          <p>Writing practice works best on mobile with a stylus. Pinyin lessons work on both mobile and desktop.</p>
        </section>

        <section>
          <h3>Start with Drill</h3>
          <p>
            Press Drill to start the next lesson. If you are new, it begins with the first group. Otherwise, it gives
            you the first item from your queue.
          </p>
        </section>

        <section>
          <h3>Use hints when stuck</h3>
          <p>
            Hints are fine. Use them when you are stuck. The app will keep giving you the same lesson until you pass it
            without hints.
          </p>
        </section>

        <section>
          <h3>Finish clean to move on</h3>
          <p>
            When you finish a full lesson without hints, it is scheduled for review later, with a longer interval each
            time.
          </p>
        </section>

        <section>
          <h3>Follow the queue</h3>
          <p>
            The queue shows what needs work now and what is coming next. Repeat due lessons first, then continue
            forward.
          </p>
        </section>
      </div>
    </section>
  </Modal>
{/if}

{#if showAuthDropdown}
  <AuthModal
    user={sttAuth.user}
    onclose={() => (showAuthDropdown = false)}
    onSignInWithGoogle={() => svcAuth.signInWithGoogle({ source: 'app_main' })}
    onSignInWithEmail={(email) => svcAuth.signInWithEmail(email, { source: 'app_main' })}
    onSignOut={svcAuth.signOut}
  />
{/if}

<style>
  .app-main-page {
    min-height: 100svh;
    background-image:
      radial-gradient(
        ellipse 75% 65% at 8% -12%,
        color-mix(in srgb, var(--anuka-color-glow-cool) 90%, transparent),
        transparent 75%
      ),
      radial-gradient(
        ellipse 70% 60% at 92% 100%,
        color-mix(in srgb, var(--anuka-color-glow-warm) 75%, transparent),
        transparent 75%
      ),
      linear-gradient(165deg, var(--anuka-color-bg-base) 0%, var(--anuka-color-bg-accent) 100%);
  }

  .app-main-island {
    --app-accent: #b8430c;
    overflow: hidden;
    padding-top: 1.25rem;
  }

  :global([data-theme='dark']) .app-main-island {
    --app-accent: #e35d0f;
  }

  .app-main-island::before {
    content: '';
    position: absolute;
    inset: -2rem;
    background-image:
      linear-gradient(var(--anuka-color-border) 1px, transparent 1px),
      linear-gradient(90deg, var(--anuka-color-border) 1px, transparent 1px);
    background-position:
      12px 0,
      12px 0;
    background-size: 34px 34px;
    -webkit-mask-image: radial-gradient(ellipse 95% 65% at 30% 45%, black, transparent 80%);
    mask-image: radial-gradient(ellipse 95% 65% at 30% 45%, black, transparent 80%);
    pointer-events: none;
    z-index: 0;
  }

  .app-topbar,
  .app-main-hero {
    position: relative;
    z-index: 1;
  }

  .app-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .app-mark {
    color: inherit;
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    opacity: 0.68;
  }

  .app-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .app-main-hero {
    padding-block: 1rem 0.5rem;
  }

  .app-main-copy {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: min(100%, 42rem);
    min-width: 0;
    margin-inline: auto;
  }

  .dataset-switch {
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    width: 100%;
    border: 1px solid color-mix(in srgb, var(--anuka-color-primary) 28%, var(--anuka-color-border));
    border-radius: 999px;
    background: color-mix(in srgb, var(--anuka-color-surface) 75%, transparent);
    color: var(--anuka-color-primary);
    padding: 0.45rem 0.8rem 0.45rem 1rem;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }

  .dataset-switch span:first-child {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dataset-caret {
    width: 0.45rem;
    height: 0.45rem;
    border-right: 2px solid currentColor;
    border-bottom: 2px solid currentColor;
    transform: rotate(45deg) translateY(-0.1rem);
    flex: 0 0 auto;
  }

  .app-gauge {
    --watch-color: var(--app-accent);
    position: relative;
    width: min(20.5rem, 82vw);
    aspect-ratio: 1;
    margin: 1.75rem auto 0;
  }

  .app-watch-low {
    --watch-color: var(--anuka-color-fail);
  }

  .app-watch-progress {
    --watch-color: var(--app-accent);
  }

  .app-watch-complete {
    --watch-color: var(--anuka-color-success);
  }

  .app-gauge-svg {
    position: absolute;
    inset: 0;
    overflow: visible;
  }

  .app-gauge-track,
  .app-gauge-progress {
    fill: none;
    stroke-width: 4;
  }

  .app-gauge-track {
    stroke: color-mix(in srgb, var(--anuka-color-text) 10%, transparent);
  }

  .app-gauge-progress {
    stroke: var(--watch-color);
    stroke-linecap: round;
    transform: rotate(-90deg);
    transform-origin: 150px 150px;
    transition: stroke-dashoffset 420ms ease;
  }

  .app-gauge line {
    stroke: color-mix(in srgb, var(--anuka-color-text) 14%, transparent);
    stroke-linecap: round;
    stroke-width: 2;
  }

  .app-gauge line.major {
    stroke: color-mix(in srgb, var(--watch-color) 42%, transparent);
  }

  .app-drill-circle,
  .dataset-switch,
  .app-queue-btn,
  .dataset-option {
    -webkit-tap-highlight-color: transparent;
    -webkit-user-select: none;
    user-select: none;
  }

  .app-drill-circle:focus-visible,
  .dataset-switch:focus-visible,
  .app-queue-btn:focus-visible {
    outline: 2px solid var(--app-accent);
    outline-offset: 4px;
  }

  .dataset-option:focus-visible {
    outline: 2px solid var(--anuka-color-primary);
    outline-offset: 2px;
  }

  .app-drill-circle {
    position: absolute;
    inset: 12%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    border: 1px solid color-mix(in srgb, var(--watch-color) 32%, transparent);
    border-radius: 50%;
    background: radial-gradient(
      circle at 35% 30%,
      color-mix(in srgb, var(--anuka-color-surface) 96%, var(--watch-color)),
      color-mix(in srgb, var(--anuka-color-bg-accent) 95%, var(--watch-color)) 70%
    );
    color: var(--anuka-color-text);
    text-decoration: none;
    box-shadow:
      inset 0 0 34px color-mix(in srgb, var(--watch-color) 16%, transparent),
      0 0 70px -10px color-mix(in srgb, var(--watch-color) 45%, transparent);
    transition:
      transform 160ms ease,
      border-color 200ms ease,
      box-shadow 200ms ease,
      filter 200ms ease,
      opacity 200ms ease;
  }

  .app-drill-circle:not(.app-drill-circle-off):hover {
    border-color: color-mix(in srgb, var(--watch-color) 60%, transparent);
    box-shadow:
      inset 0 0 40px color-mix(in srgb, var(--watch-color) 20%, transparent),
      0 0 90px -8px color-mix(in srgb, var(--watch-color) 52%, transparent);
    filter: saturate(1);
    opacity: 1;
  }

  .app-drill-circle:not(.app-drill-circle-off):active {
    transform: scale(0.97);
  }

  .app-drill-circle-off {
    border-color: color-mix(in srgb, var(--anuka-color-text) 14%, transparent);
    background: radial-gradient(
      circle at 35% 30%,
      color-mix(in srgb, var(--anuka-color-surface) 88%, var(--anuka-color-text)),
      color-mix(in srgb, var(--anuka-color-bg-accent) 96%, var(--anuka-color-text)) 70%
    );
    cursor: wait;
    filter: saturate(0.55);
    opacity: 0.82;
    box-shadow:
      inset 0 0 30px color-mix(in srgb, var(--anuka-color-text) 8%, transparent),
      0 0 0 0 transparent;
  }

  .app-drill-zi {
    font-family: var(--font-hanzi);
    color: var(--watch-color);
    font-size: clamp(1.6rem, 6vw, 2rem);
    font-weight: 900;
    line-height: 1;
  }

  .app-drill-circle-off .app-drill-zi {
    color: color-mix(in srgb, var(--anuka-color-text) 28%, transparent);
  }

  .app-drill-label {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    font-size: clamp(2.35rem, 9vw, 3.4rem);
    font-weight: 950;
    letter-spacing: 0.12em;
    line-height: 1;
    text-transform: uppercase;
    text-indent: 0.12em;
  }

  .app-drill-label-loading {
    color: color-mix(in srgb, var(--anuka-color-text) 32%, transparent);
  }

  .app-drill-label-try {
    gap: 0.16em;
    font-size: clamp(1.55rem, 6.4vw, 2.35rem);
    letter-spacing: 0.08em;
    line-height: 0.98;
    text-indent: 0.08em;
  }

  .app-drill-label-try span:last-child {
    font-size: 0.58em;
  }

  .app-drill-meta {
    display: inline-flex;
    align-items: center;
    flex-direction: column;
    gap: 0.35rem;
    color: var(--anuka-color-muted);
    font-size: 0.72rem;
    font-weight: 800;
    line-height: 1;
    text-transform: uppercase;
  }

  .app-drill-stats {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .app-drill-done {
    line-height: 0.8;
  }

  .app-drill-meta strong {
    color: var(--app-accent);
    font-weight: inherit;
  }

  .app-drill-stat {
    display: inline-flex;
    align-items: center;
    gap: 0.22rem;
  }

  .app-lessons-pending strong {
    color: var(--anuka-color-fail);
  }

  .app-lessons-complete strong {
    color: var(--anuka-color-success);
  }

  .app-time-low strong {
    color: var(--anuka-color-fail);
  }

  .app-time-progress strong {
    color: var(--app-accent);
  }

  .app-time-complete strong {
    color: var(--anuka-color-success);
  }

  .app-truth {
    color: var(--anuka-color-muted);
    display: flex;
    flex-direction: column;
    gap: 1.15rem;
    font-size: 0.95rem;
    font-weight: 700;
    line-height: 1.75;
    margin-block: 1.15rem 0.75rem;
    text-align: center;
  }

  .app-truth-main {
    color: var(--anuka-color-muted);
    font-size: clamp(1.15rem, 4.2vw, 1.65rem);
    line-height: 1.25;
  }

  .app-truth strong {
    color: var(--anuka-color-text);
  }

  .app-truth-tagline {
    color: var(--app-accent);
    font-size: clamp(1.05rem, 3.6vw, 1.35rem);
    min-height: 1.3em;
    line-height: 1.3;
  }

  .app-truth-tagline.typing::after {
    content: '';
    display: inline-block;
    width: 0.08em;
    height: 1em;
    margin-left: 0.12em;
    background: currentColor;
    transform: translateY(0.12em);
    animation: app-type-caret 1s steps(1) infinite;
  }

  @keyframes app-type-caret {
    50% {
      opacity: 0;
    }
  }

  .app-truth-anon {
    width: min(24rem, 100%);
    margin-inline: auto;
    gap: 1.9rem;
    line-height: 1.35;
  }

  .app-truth-anon .app-truth-main {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    font-size: clamp(1rem, 3.4vw, 1.2rem);
  }

  .app-signin-link {
    color: var(--app-accent);
    font-size: clamp(1.05rem, 3.6vw, 1.35rem);
    font-weight: 850;
  }

  .app-footer-actions {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    padding-top: 0.45rem;
  }

  .app-dataset-progress {
    display: grid;
    grid-template-columns: minmax(0, auto) minmax(5rem, 1fr) auto;
    align-items: center;
    gap: 0.8rem;
    width: min(30rem, 100%);
    color: var(--anuka-color-muted);
    font-size: 0.74rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .app-dataset-progress > span:first-child {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .app-dataset-progress strong {
    color: var(--anuka-color-text);
  }

  .app-progress-track {
    height: 0.24rem;
    overflow: hidden;
    border-radius: 999px;
    background: color-mix(in srgb, var(--anuka-color-text) 12%, transparent);
  }

  .app-progress-track span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--app-accent);
    transition: width 420ms ease;
  }

  .app-queue-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
  }

  .app-help-btn {
    border-color: color-mix(in srgb, var(--anuka-color-text) 12%, var(--anuka-color-border));
    background: color-mix(in srgb, var(--anuka-color-surface) 70%, transparent);
    color: var(--anuka-color-muted);
  }

  .app-queue-count {
    min-width: 1.65rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--anuka-color-primary) 12%, transparent);
    color: var(--anuka-color-primary);
    padding: 0.1rem 0.45rem;
    font-size: 0.78rem;
    font-weight: 800;
    line-height: 1.35;
    text-align: center;
  }

  .app-queue-btn-loading {
    opacity: 0.78;
  }

  .app-queue-btn-loading .app-queue-count {
    color: color-mix(in srgb, var(--anuka-color-primary) 55%, transparent);
    animation: app-queue-loading 1s ease-in-out infinite;
  }

  @keyframes app-queue-loading {
    0%,
    100% {
      opacity: 0.45;
    }

    50% {
      opacity: 1;
    }
  }

  .dataset-modal {
    width: min(34rem, calc(100vw - 2rem));
    max-height: min(42rem, calc(100vh - 2rem));
    overflow: auto;
  }

  .dataset-modal-title,
  .how-modal-title {
    font-size: 1.25rem;
    line-height: 1.2;
  }

  .how-modal {
    width: min(34rem, calc(100vw - 2rem));
    max-height: min(42rem, calc(100vh - 2rem));
    overflow: auto;
  }

  .how-list {
    display: grid;
    gap: 0.75rem;
  }

  .how-list section {
    border-top: 1px solid var(--anuka-color-border);
    padding-top: 0.75rem;
  }

  .how-list section:first-child {
    border-top: 0;
    padding-top: 0;
  }

  .how-list h3 {
    margin: 0 0 0.18rem;
    color: var(--anuka-color-text);
    font-size: 0.86rem;
    line-height: 1.25;
  }

  .how-list p {
    margin: 0;
    color: var(--anuka-color-muted);
    font-size: 0.88rem;
    line-height: 1.45;
  }

  .dataset-list {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .dataset-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    width: 100%;
    border: 1px solid var(--anuka-color-border);
    border-radius: 0.75rem;
    background: var(--anuka-color-surface-raised);
    color: var(--anuka-color-text);
    padding: 0.85rem 1rem;
    text-align: left;
    font: inherit;
    cursor: pointer;
  }

  .dataset-option:hover,
  .dataset-option.current {
    border-color: color-mix(in srgb, var(--anuka-color-primary) 45%, var(--anuka-color-border));
    background: color-mix(in srgb, var(--anuka-color-accent) 55%, var(--anuka-color-surface-raised));
  }

  .dataset-option span:first-child {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
  }

  .dataset-option small {
    color: var(--anuka-color-muted);
    font-size: 0.8rem;
  }

  @media (max-width: 720px) {
    .app-main-page {
      gap: 0;
      overflow: hidden;
    }

    .app-main-island {
      padding: 1rem;
    }

    .app-main-hero {
      padding-block: 0.45rem 0;
    }

    .app-main-copy {
      gap: 0.65rem;
    }

    .app-gauge {
      width: min(16.75rem, 82vw);
      margin-top: 1.05rem;
      margin-bottom: 0;
    }

    .app-truth {
      gap: 0.75rem;
      font-size: 0.86rem;
      line-height: 1.45;
      margin-block: 0.75rem 0.55rem;
    }

    .app-footer-actions {
      gap: 0.6rem;
      padding-top: 0.2rem;
    }

    .app-dataset-progress {
      grid-template-columns: 1fr auto;
      row-gap: 0.45rem;
    }

    .app-progress-track {
      grid-column: 1 / -1;
      grid-row: 2;
    }

    .app-queue-btn {
      width: 100%;
    }

    .app-help-btn {
      width: 100%;
    }
  }
</style>
