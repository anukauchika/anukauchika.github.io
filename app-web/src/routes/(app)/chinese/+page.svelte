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

  const DAILY_GOAL_MIN = 60

  const basePath = $derived.by(() => `/${sttDataset.current?.kind ?? 'chinese'}`)
  const datasetName = $derived(sttDataset.current?.name ?? 'Vocabulary')
  const plannedToday = $derived(sttHome.dueCount)

  const wordsDrilled = $derived(sttHome.drilledWords)
  const totalWords = $derived(sttDataset.groups.reduce((sum, group) => sum + group.items.length, 0))
  const progressPercent = $derived(totalWords > 0 ? Math.round((wordsDrilled / totalWords) * 100) : 0)

  const minutesToday = $derived(Math.floor(sttHome.todayDurationMs / 60_000))
  const lessonsDone = $derived(sttHome.todaySessions)
  const lessonsTotal = $derived(lessonsDone + sttHome.dueCount)

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
      ? `${basePath}/drill/${typeToPath[next.type] || 'hanzi'}/?group=${next.groupId}&dataset=${sttDataset.id}`
      : `${basePath}/drill/hanzi/?group=1&dataset=${sttDataset.id}`
  })

  function selectDataset(id) {
    showDatasetPicker = false
    goto(`/chinese/?dataset=${id}`)
  }

  function plannedTodayLabel(count) {
    return `${count} ${count === 1 ? 'session' : 'sessions'} planned for today`
  }

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
  <title>Chinese Vocabulary Drills — Stroke & Pinyin | Anuka Uchika</title>
  <meta
    name="description"
    content="Browse HSK 3.0 Chinese vocabulary in focused word groups. Practice with stroke-by-stroke writing drills, pinyin drills, printable A4 worksheets, and smart repetition."
  />
  <link rel="canonical" href="https://anukauchika.com/chinese/" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Chinese Vocabulary Drills — Stroke & Pinyin" />
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
            aria-label={sttHome.loaded ? `${lessonsDone} of ${lessonsTotal} lessons done today` : 'Loading your progress'}
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
                <line
                  class:major={tick.major}
                  x1={tick.x1}
                  y1={tick.y1}
                  x2={tick.x2}
                  y2={tick.y2}
                />
              {/each}
            </svg>

            <a
              class="app-drill-circle"
              href={drillHref}
              aria-label={sttHome.loaded ? `Start drill. ${minutesToday} of ${DAILY_GOAL_MIN} minutes trained today.` : 'Loading your progress'}
            >
              <span class="app-drill-zi">练</span>
              <span class="app-drill-label" class:app-drill-label-loading={!sttHome.loaded}>Drill</span>
              <span class="app-drill-meta">
                {#if sttHome.loaded}
                  <strong>{minutesToday}</strong> / {DAILY_GOAL_MIN} min today
                {:else}
                  Hang tight&hellip;
                {/if}
              </span>
            </a>
          </div>

          <p class="app-truth">
            You know <strong>{wordsDrilled.toLocaleString('en-US')}</strong> of
            <strong>{totalWords.toLocaleString('en-US')}</strong> words.<br>
            <span>The only limit is you.</span>
          </p>

          <div class="app-footer-actions">
            <div class="app-dataset-progress" aria-label={`${datasetName}: ${progressPercent}% complete`}>
              <span>{datasetName}</span>
              <span class="app-progress-track"><span style={`width: ${progressPercent}%`}></span></span>
              <strong>{progressPercent}%</strong>
            </div>
            <a class="anuka-btn app-queue-btn" href="/chinese/queue/" aria-label={plannedTodayLabel(plannedToday)}>
              <span>Queue</span>
              <span class="app-queue-count">{plannedToday}</span>
            </a>
          </div>
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

{#if showAuthDropdown}
  <AuthModal
    user={sttAuth.user}
    onclose={() => (showAuthDropdown = false)}
    onSignInWithGoogle={svcAuth.signInWithGoogle}
    onSignInWithEmail={svcAuth.signInWithEmail}
    onSignOut={svcAuth.signOut}
  />
{/if}

<style>
  .app-main-page {
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
    background-position: 12px 0, 12px 0;
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
    position: relative;
    width: min(19rem, 78vw);
    aspect-ratio: 1;
    margin: 0.65rem auto 0;
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
    stroke: var(--app-accent);
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
    stroke: color-mix(in srgb, var(--app-accent) 42%, transparent);
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
    border: 1px solid color-mix(in srgb, var(--app-accent) 32%, transparent);
    border-radius: 50%;
    background: radial-gradient(
      circle at 35% 30%,
      color-mix(in srgb, var(--anuka-color-surface) 96%, var(--app-accent)),
      color-mix(in srgb, var(--anuka-color-bg-accent) 95%, var(--app-accent)) 70%
    );
    color: var(--anuka-color-text);
    text-decoration: none;
    box-shadow: 0 0 0 0 transparent;
    transition:
      transform 160ms ease,
      border-color 200ms ease,
      box-shadow 200ms ease;
  }

  .app-drill-circle:hover {
    border-color: color-mix(in srgb, var(--app-accent) 60%, transparent);
    box-shadow: 0 0 70px -10px color-mix(in srgb, var(--app-accent) 45%, transparent);
  }

  .app-drill-circle:active {
    transform: scale(0.97);
  }

  .app-drill-zi {
    font-family: var(--font-hanzi);
    color: var(--app-accent);
    font-size: clamp(1.6rem, 6vw, 2rem);
    font-weight: 900;
    line-height: 1;
  }

  .app-drill-label {
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

  .app-drill-meta {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    color: var(--anuka-color-muted);
    font-size: 0.72rem;
    font-weight: 800;
    line-height: 1;
    text-transform: uppercase;
  }

  .app-drill-meta strong {
    color: var(--app-accent);
    font-weight: inherit;
  }

  .app-truth {
    color: var(--anuka-color-muted);
    font-size: 0.95rem;
    font-weight: 700;
    line-height: 1.75;
    text-align: center;
  }

  .app-truth strong {
    color: var(--anuka-color-text);
  }

  .app-truth span {
    color: var(--app-accent);
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

  .dataset-modal {
    width: min(34rem, calc(100vw - 2rem));
    max-height: min(42rem, calc(100vh - 2rem));
    overflow: auto;
  }

  .dataset-modal-title {
    font-size: 1.25rem;
    line-height: 1.2;
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
    .app-main-copy {
      gap: 0.85rem;
    }

    .app-gauge {
      width: min(17.25rem, 82vw);
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
  }
</style>
