<script>
  import { onMount } from 'svelte'
  import { sttAuth } from '@stt/auth.svelte.js'
  import { sttDataset } from '@stt/dataset.svelte.js'
  import { svcAuth } from '@svc/auth'
  import { svcDrill } from '@svc/kind/chinese/drill'
  import { svcUserPrefs } from '@svc/user-prefs'
  import AuthModal from '@uic/auth-modal.svelte'
  import HanziAnimate from '@uic/kind/chinese/hanzi-animate.svelte'
  import BtnIcon from '@std/ui/btn-icon.svelte'
  import {
    trackRootLandAuxiClicked,
    trackRootLandCoreClicked,
    trackRootLandViewed,
  } from '@low/google/landing-analytics'

  let showAuthDropdown = $state(false)
  let nextDrill = $state(null)

  const vocabularies = [
    {
      title: 'HSK Elementary',
      level: 'Levels 1-3',
      words: '1,000 words',
      hanzi: '初',
      printableHref: '/chinese/printable-hsk-elementary-worksheets/',
      practiceHref: '/chinese/?dataset=chinese-hskv3-elementary',
      featured: true,
    },
    {
      title: 'HSK Intermediate',
      level: 'Levels 4-6',
      words: '4,400 words',
      hanzi: '中',
      printableHref: '/chinese/printable-hsk-intermediate-worksheets/',
      practiceHref: '/chinese/?dataset=chinese-hskv3-intermediate',
      featured: false,
    },
    {
      title: 'HSK Advanced',
      level: 'Levels 7-9',
      words: '5,600 words',
      hanzi: '高',
      printableHref: '/chinese/printable-hsk-advanced-worksheets/',
      practiceHref: '/chinese/?dataset=chinese-hskv3-advanced',
      featured: false,
    },
  ]

  const drillHref = $derived.by(() => {
    const typeToPath = { stroke: 'hanzi', pinyin: 'pinyin' }
    const basePath = `/${sttDataset.current?.kind ?? 'chinese'}`
    return nextDrill && sttDataset.id
      ? `${basePath}/drill/${typeToPath[nextDrill.type] || 'hanzi'}/?group=${nextDrill.groupId}&dataset=${sttDataset.id}`
      : null
  })

  const openSignIn = () => {
    trackRootLandAuxiClicked('signin')
    showAuthDropdown = true
  }

  onMount(() => {
    trackRootLandViewed()
  })

  $effect(() => {
    const datasetId = sttDataset.id
    const groups = sttDataset.filtered
    sttAuth.dbVersion
    sttAuth.isAuthenticated

    if (!sttAuth.isAuthenticated || !datasetId || groups.length === 0) {
      nextDrill = null
      return
    }

    let cancelled = false
    svcDrill.pickNextDrill(datasetId, groups)
      .then((drill) => {
        if (!cancelled) nextDrill = drill
      })
      .catch((e) => {
        console.error('next drill failed', e)
      })

    return () => {
      cancelled = true
    }
  })
</script>

<svelte:head>
  <title>Anuka Uchika — Memorize Chinese Vocabulary | HSK Drills</title>
  <meta
    name="description"
    content="Memorize Chinese vocabulary with free HSK 3.0 pinyin and stroke-by-stroke writing drills, smart repetition, and printable worksheets for self-directed learners."
  />
  <link rel="canonical" href="https://anukauchika.com/" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Anuka Uchika — Memorize Chinese Vocabulary" />
  <meta
    property="og:description"
    content="Free HSK vocabulary drills with pinyin, stroke-by-stroke writing, smart repetition, and printable worksheets."
  />
  <meta property="og:url" content="https://anukauchika.com/" />
  <meta property="og:site_name" content="Anuka Uchika" />
  <meta property="og:image" content="https://anukauchika.com/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Anuka Uchika — Memorize Chinese Vocabulary" />
  <meta
    name="twitter:description"
    content="Free HSK vocabulary drills with pinyin, stroke-by-stroke writing, smart repetition, and printable worksheets."
  />
  <meta name="twitter:image" content="https://anukauchika.com/og-image.png" />
  {@html `<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Anuka Uchika",
    "url": "https://anukauchika.com/",
    "description":
      "Memorize Chinese vocabulary with HSK 3.0 pinyin and stroke-by-stroke writing drills, smart repetition, and printable A4 worksheets.",
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

  <!-- Hero -->
  <div class="anuka-island hero-island">
    <div class="hero-topbar">
      <a class="home-app-title" href="/">Anuka Uchika</a>

      <div class="island-controls">
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
          <BtnIcon onclick={openSignIn} label="Sign in">
            <span class="anuka-icon anuka-icon-user"></span>
          </BtnIcon>
        {/if}
      </div>
    </div>

    <div class="anuka-hero">
      <HanziAnimate char="汉" size={261} frameClass="" strokeColor="#000000" outlineColor="#dcdcdc" />
      <div class="anuka-stack">
        <h1 class="anuka-island-title hero-title">
          <span>Memorize</span>
          <span><span class="hero-title-accent">Chinese</span> Vocabulary</span>
        </h1>
        <p class="anuka-mute">
          Stroke-by-stroke writing drills on your phone · Memorize pinyin<br />
          Spaced repetition · Printable worksheets · Prepare for the HSK exam.
        </p>
        <div class="anuka-row hero-actions">
          {#if sttAuth.isAuthenticated && drillHref}
            <a
              href={drillHref}
              class="anuka-btn anuka-main anuka-lg lesson-cta"
              onclick={() => trackRootLandCoreClicked('next_drill')}
            >
              Drill
            </a>
          {:else}
            <a
              href="/chinese/drill/pinyin/?dataset=chinese-hskv3-elementary&group=1"
              class="anuka-btn anuka-main anuka-lg lesson-cta lesson-cta-desktop"
              onclick={() => trackRootLandCoreClicked('trial_drill')}
            >
              Try a free lesson →
            </a>
            <a
              href="/chinese/drill/hanzi/?dataset=chinese-hskv3-elementary&group=1"
              class="anuka-btn anuka-main anuka-lg lesson-cta lesson-cta-mobile"
              onclick={() => trackRootLandCoreClicked('trial_drill')}
            >
              Try a free lesson →
            </a>
          {/if}
        </div>
      </div>
    </div>

  </div>

  <!-- How it works -->
  <div class="anuka-island">
    <div class="section-title-row">
      <span class="section-title-mark"><span class="anuka-icon anuka-icon-trending"></span></span>
      <h2 class="anuka-island-title">How to make real progress</h2>
    </div>
    <div class="anuka-grid">
      <div class="anuka-card progress-card">
        <div class="anuka-stack">
          <div class="progress-heading">
            <span class="progress-icon"><span class="anuka-icon anuka-icon-clock"></span></span>
            <strong>Drill at least 1 hour daily</strong>
          </div>
          <span class="anuka-mute progress-copy">
            One lesson a day is a comforting lie. Less than 30 minutes will not move the needle.
            Mix writing drills with pinyin recall and keep going until the words stick.
          </span>
        </div>
      </div>
      <div class="anuka-card progress-card">
        <div class="anuka-stack">
          <div class="progress-heading">
            <span class="progress-icon"><span class="anuka-icon anuka-icon-calendar"></span></span>
            <strong>Use spaced repetition</strong>
          </div>
          <span class="anuka-mute progress-copy">
            Learn words in small groups and review them at growing intervals (1, 2, 4, 8+ days).
            Each group moves to the next review only after you complete a session without using any hints.
          </span>
        </div>
      </div>
      <div class="anuka-card progress-card">
        <div class="anuka-stack">
          <div class="progress-heading">
            <span class="progress-icon"><span class="anuka-icon anuka-icon-pen"></span></span>
            <strong>Use worksheets</strong>
          </div>
          <span class="anuka-mute progress-copy">
            Print a small word group and write each Chinese word on paper from memory.
            Fold the sheet to check pinyin and meaning after you write.
          </span>
        </div>
      </div>
    </div>
  </div>

  <!-- Vocabularies -->
  <div class="anuka-island">
    <div class="anuka-stack">
      <h2 class="anuka-island-title">HSK vocabularies</h2>
      <div class="vocab-grid">
        {#each vocabularies as vocab}
          <div class="anuka-card vocab-card" class:vocab-card-featured={vocab.featured}>
            <div class="vocab-image" role="img" aria-label="{vocab.title} vocabulary">
              <span lang="zh-CN">{vocab.hanzi}</span>
            </div>
            <div class="anuka-stack anuka-compact vocab-copy">
              <strong>{vocab.title}</strong>
              <span class="anuka-sm anuka-mute">{vocab.level} · {vocab.words}</span>
              <div class="vocab-actions">
                <a class="anuka-btn" href={vocab.printableHref} onclick={() => trackRootLandAuxiClicked('printables')}>
                  <span class="anuka-icon anuka-icon-print"></span>
                  Printable Worksheets
                </a>
                <a
                  class="anuka-btn anuka-main practice-btn"
                  href={vocab.practiceHref}
                  onclick={() => trackRootLandAuxiClicked('practice_app')}
                >
                  <span class="anuka-icon anuka-icon-pinyin"></span>
                  Practice Online
                </a>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- Footer links -->
  <div class="anuka-island">
    <div class="footer-link-grid">
      <a href="/chinese/hsk/" class="anuka-card footer-link-card" onclick={() => trackRootLandAuxiClicked('hsk_words')}>
        <span class="footer-link-icon"><span class="anuka-icon anuka-icon-book"></span></span>
        <span>
          <strong>HSK Word Lists</strong>
          <span class="anuka-sm anuka-mute">Browse all words by level</span>
        </span>
      </a>
      <a href="/chinese/blog/" class="anuka-card footer-link-card" onclick={() => trackRootLandAuxiClicked('blog')}>
        <span class="footer-link-icon"><span class="anuka-icon anuka-icon-list"></span></span>
        <span>
          <strong>Read the Blog</strong>
          <span class="anuka-sm anuka-mute">Learning tips and updates</span>
        </span>
      </a>
    </div>
  </div>

</main>

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
  @import url('https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap');

  /* ── Richer layered background (ported from redesign-preview) ── */

  .anuka-page {
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

  .hero-island {
    --hero-accent: #b8430c;
    position: relative;
    overflow: hidden;
    padding-top: 1.25rem;
  }

  :global([data-theme='dark']) .hero-island {
    --hero-accent: #e35d0f;
  }

  .hero-island::before {
    content: '';
    position: absolute;
    inset: -2rem;
    background-image:
      linear-gradient(var(--anuka-color-border) 1px, transparent 1px),
      linear-gradient(90deg, var(--anuka-color-border) 1px, transparent 1px);
    background-size: 34px 34px;
    -webkit-mask-image: radial-gradient(ellipse 95% 65% at 30% 45%, black, transparent 80%);
    mask-image: radial-gradient(ellipse 95% 65% at 30% 45%, black, transparent 80%);
    pointer-events: none;
    z-index: 0;
  }

  .hero-topbar,
  .anuka-hero {
    position: relative;
    z-index: 1;
  }

  .hero-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0;
  }

  .island-controls {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    flex: 0 0 auto;
  }

  .home-app-title {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 261px;
    color: inherit;
    text-decoration: none;
    min-width: 0;
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    opacity: 0.68;
  }

  .hero-title > span {
    display: block;
    white-space: nowrap;
  }

  .hero-title span + span::before {
    content: none;
  }

  .hero-actions {
    align-items: center;
    margin-top: 1.5rem;
  }

  .section-title-row {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  .section-title-mark {
    display: inline-grid;
    place-items: center;
    flex: 0 0 auto;
    width: 2.1rem;
    height: 2.1rem;
    color: var(--anuka-color-primary);
  }

  .section-title-mark .anuka-icon {
    width: 1.8rem;
    height: 1.8rem;
  }

  .anuka-icon-trending {
    -webkit-mask-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='23 6 13.5 15.5 8.5 10.5 1 18'/><polyline points='17 6 23 6 23 12'/></svg>");
    mask-image: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='23 6 13.5 15.5 8.5 10.5 1 18'/><polyline points='17 6 23 6 23 12'/></svg>");
  }

  .progress-card {
    min-height: 13rem;
  }

  .progress-copy {
    font-size: 1rem;
    line-height: 1.55;
  }

  .progress-heading {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .progress-icon {
    display: inline-grid;
    place-items: center;
    flex: 0 0 auto;
    color: var(--anuka-color-primary);
  }

  .progress-icon .anuka-icon {
    width: 1.6rem;
    height: 1.6rem;
  }

  .vocab-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }

  .vocab-card {
    position: relative;
    display: flex;
    flex-direction: row;
    gap: 1.2rem;
    align-items: center;
    text-align: left;
    min-height: 9.5rem;
  }

  .vocab-card-featured {
    grid-column: 1 / -1;
  }

  .vocab-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
    justify-content: flex-start;
    padding-top: 0.6rem;
  }

  .vocab-image {
    position: relative;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
    width: 6rem;
    height: 6rem;
    border-radius: 999px;
    overflow: hidden;
    background: var(--anuka-color-bg-accent);
    border: 1px solid var(--anuka-color-border);
  }

  .vocab-image span {
    font-family: 'Ma Shan Zheng', var(--font-hanzi);
    font-size: 3.4rem;
    font-weight: 400;
    line-height: 1;
    color: var(--anuka-color-primary);
  }

  .vocab-copy {
    flex: 1;
    min-width: 0;
  }

  a.anuka-btn.lesson-cta {
    min-height: 3.25rem;
    padding-inline: 2.2rem;
    border-radius: 0.85rem;
    background: var(--hero-accent);
    box-shadow: 0 12px 28px color-mix(in srgb, var(--hero-accent) 28%, transparent);
  }

  a.anuka-btn.lesson-cta:hover {
    background: color-mix(in srgb, var(--hero-accent) 90%, black);
  }

  a.anuka-btn.practice-btn {
    background: color-mix(in srgb, var(--anuka-color-primary) 70%, black);
  }

  a.anuka-btn.practice-btn:hover {
    background: color-mix(in srgb, var(--anuka-color-primary) 60%, black);
  }

  .hero-title-accent {
    color: var(--hero-accent);
  }

  .hero-island .anuka-hero > .anuka-stack {
    align-self: stretch;
    justify-content: flex-start;
    gap: 0.6rem;
  }

  .footer-link-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }

  .footer-link-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    color: inherit;
    text-decoration: none;
  }

  .footer-link-card > span:not(.footer-link-icon) {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    flex: 1;
    min-width: 0;
  }

  .footer-link-card::after {
    content: '>';
    color: var(--anuka-color-muted);
    font-size: 1.4rem;
    line-height: 1;
  }

  .footer-link-icon {
    display: inline-grid;
    place-items: center;
    flex: 0 0 auto;
    width: 3rem;
    height: 3rem;
    color: var(--anuka-color-primary);
    background: var(--anuka-color-accent);
    border-radius: 0.65rem;
  }

  .lesson-cta-mobile {
    display: none;
  }

  @media (max-width: 640px) {
    .hero-island {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .hero-title > span {
      white-space: normal;
    }

    .home-app-title {
      width: auto;
    }

    .hero-actions,
    .lesson-cta {
      width: 100%;
    }

    .lesson-cta-desktop {
      display: none;
    }

    .lesson-cta-mobile {
      display: inline-flex;
    }

    .vocab-grid,
    .footer-link-grid {
      grid-template-columns: 1fr;
    }

    .vocab-card-featured {
      grid-column: auto;
    }

    .vocab-card {
      align-items: center;
      padding-right: 1rem;
    }

    .vocab-image {
      width: 4.5rem;
      height: 4.5rem;
    }

    .vocab-actions {
      width: 100%;
    }

    .vocab-actions .anuka-btn {
      flex: 1 1 12rem;
    }
  }
</style>
