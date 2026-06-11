<script>
  import { goto } from '$app/navigation'
  import BtnIcon from '@std/ui/btn-icon.svelte'
  import Island from '@std/ui/island.svelte'
  import IslandTitle from '@std/ui/island-title.svelte'
</script>

<svelte:head>
  <title>When to add new words to the pack?</title>
  <meta
    name="description"
    content="How I built a decision rule for spaced repetition: an overdue score that tells me when to add new words and when to catch up first."
  />
  <link rel="canonical" href="https://anukauchika.com/chinese/blog/when-to-add-words" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="When to add new words to the pack?" />
  <meta
    property="og:description"
    content="How I built a decision rule for spaced repetition: an overdue score that tells me when to add new words and when to catch up first."
  />
  <meta property="og:url" content="https://anukauchika.com/chinese/blog/when-to-add-words" />
  <meta property="og:site_name" content="Anuka Uchika" />
  <meta property="og:image" content="https://anukauchika.com/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="https://anukauchika.com/og-image.png" />
  {@html `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: 'When to add new words to the pack?',
    description:
      "How I built a decision rule for spaced repetition: an overdue score that tells me when to add new words and when to catch up first.",
    datePublished: '2026-02-26',
    author: { '@type': 'Person', name: 'Anuka' },
    publisher: { '@type': 'Organization', name: 'Anuka Uchika' },
    url: 'https://anukauchika.com/chinese/blog/when-to-add-words',
  })}</script>`}
</svelte:head>

<main class="anuka-page">
  <Island sticky>
    <div class="anuka-row anuka-justify">
      <IslandTitle level={3}>When to add new words to the pack?</IslandTitle>
      <BtnIcon icon="close" label="Back" onclick={() => goto('/chinese/blog')} />
    </div>
  </Island>
  <div class="anuka-stack">
    <Island prose>
      <p>
        After a few weeks with the spaced repetition system, the question that kept nagging me was whether I could
        already start learning a new group of words, or should I keep repeating the current ones.
      </p>

      <p><strong>I needed a decision rule.</strong></p>

      <p>
        So after a discussion with Claude Code I decided to introduce an overdue score. Now a new group is added to the
        pack only if nothing is in the overdue list.
      </p>

      <p>
        What I saw was not great — it turns out I have 17 (!) groups overdue at the time of this writing. These are top
        10 items:
      </p>
    </Island>
    <Island>
      <div class="anuka-stack anuka-compact">
        <div class="anuka-row anuka-justify">
          <h3>Groups 67 | <span class="anuka-main">24</span> drill | <span class="anuka-warn">17</span> overdue</h3>
        </div>

        <!-- G-023 -->
        <article class="anuka-stack anuka-compact">
          <div class="anuka-row anuka-justify">
            <span>G-023</span>
            <div class="anuka-tags"><span class="anuka-tag anuka-sm">#L2</span></div>
            <span class="anuka-row anuka-compact">
              <span class="anuka-btn anuka-btn-icon"><span class="anuka-icon anuka-icon-stroke"></span></span>
              <span class="anuka-btn anuka-btn-icon"><span class="anuka-icon anuka-icon-pinyin"></span></span>
            </span>
          </div>
          <div class="anuka-stack anuka-compact">
            <div class="anuka-progress-line">
              <div class="anuka-progress-line-fill" style="width:100%"></div>
              <div class="anuka-progress-line-fill-strong" style="width:10%"></div>
            </div>
            <div class="anuka-progress-line">
              <div class="anuka-progress-line-fill" style="width:100%"></div>
              <div class="anuka-progress-line-fill-strong" style="width:10%"></div>
            </div>
          </div>
          <div class="anuka-row anuka-compact anuka-center">
            <span class="anuka-mute anuka-sm">5d ago</span><span class="anuka-badge anuka-fail anuka-sm"
              >overdue 4d</span
            ><span class="anuka-mute anuka-sm">1W</span>
            <span class="anuka-mute anuka-sm">|</span>
            <span class="anuka-mute anuka-sm">P1</span><span class="anuka-badge anuka-fail anuka-sm">overdue 1d</span
            ><span class="anuka-mute anuka-sm">2d ago</span>
          </div>
        </article>

        <!-- G-010 -->
        <article class="anuka-stack anuka-compact">
          <div class="anuka-row anuka-justify">
            <span>G-010</span>
            <div class="anuka-tags"><span class="anuka-tag anuka-sm">#L1</span></div>
            <span class="anuka-row anuka-compact">
              <span class="anuka-btn anuka-btn-icon"><span class="anuka-icon anuka-icon-stroke"></span></span>
              <span class="anuka-btn anuka-btn-icon"><span class="anuka-icon anuka-icon-pinyin"></span></span>
            </span>
          </div>
          <div class="anuka-stack anuka-compact">
            <div class="anuka-progress-line">
              <div class="anuka-progress-line-fill" style="width:100%"></div>
              <div class="anuka-progress-line-fill-strong" style="width:10%"></div>
            </div>
            <div class="anuka-progress-line">
              <div class="anuka-progress-line-fill" style="width:100%"></div>
              <div class="anuka-progress-line-fill-strong" style="width:10%"></div>
            </div>
          </div>
          <div class="anuka-row anuka-compact anuka-center">
            <span class="anuka-mute anuka-sm">4d ago</span><span class="anuka-badge anuka-fail anuka-sm"
              >overdue 4d</span
            ><span class="anuka-mute anuka-sm">1W</span>
            <span class="anuka-mute anuka-sm">|</span>
            <span class="anuka-mute anuka-sm">P1</span><span class="anuka-badge anuka-fail anuka-sm">overdue 1d</span
            ><span class="anuka-mute anuka-sm">2d ago</span>
          </div>
        </article>

        <!-- G-018 -->
        <article class="anuka-stack anuka-compact">
          <div class="anuka-row anuka-justify">
            <span>G-018</span>
            <div class="anuka-tags"><span class="anuka-tag anuka-sm">#L1</span></div>
            <span class="anuka-row anuka-compact">
              <span class="anuka-btn anuka-btn-icon"><span class="anuka-icon anuka-icon-stroke"></span></span>
              <span class="anuka-btn anuka-btn-icon"><span class="anuka-icon anuka-icon-pinyin"></span></span>
            </span>
          </div>
          <div class="anuka-stack anuka-compact">
            <div class="anuka-progress-line">
              <div class="anuka-progress-line-fill" style="width:100%"></div>
              <div class="anuka-progress-line-fill-strong" style="width:20%"></div>
            </div>
            <div class="anuka-progress-line">
              <div class="anuka-progress-line-fill" style="width:100%"></div>
              <div class="anuka-progress-line-fill-strong" style="width:10%"></div>
            </div>
          </div>
          <div class="anuka-row anuka-compact anuka-center">
            <span class="anuka-mute anuka-sm">1w ago</span><span class="anuka-badge anuka-fail anuka-sm"
              >overdue 7d</span
            ><span class="anuka-mute anuka-sm">2W</span>
            <span class="anuka-mute anuka-sm">|</span>
            <span class="anuka-mute anuka-sm">P1</span><span class="anuka-badge anuka-fail anuka-sm">overdue 4d</span
            ><span class="anuka-mute anuka-sm">4d ago</span>
          </div>
        </article>

        <!-- G-011 -->
        <article class="anuka-stack anuka-compact">
          <div class="anuka-row anuka-justify">
            <span>G-011</span>
            <div class="anuka-tags"><span class="anuka-tag anuka-sm">#L1</span></div>
            <span class="anuka-row anuka-compact">
              <span class="anuka-btn anuka-btn-icon"><span class="anuka-icon anuka-icon-stroke"></span></span>
              <span class="anuka-btn anuka-btn-icon"><span class="anuka-icon anuka-icon-pinyin"></span></span>
            </span>
          </div>
          <div class="anuka-stack anuka-compact">
            <div class="anuka-progress-line">
              <div class="anuka-progress-line-fill" style="width:100%"></div>
              <div class="anuka-progress-line-fill-strong" style="width:50%"></div>
            </div>
            <div class="anuka-progress-line">
              <div class="anuka-progress-line-fill" style="width:93%"></div>
              <div class="anuka-progress-line-fill-strong" style="width:20%"></div>
            </div>
          </div>
          <div class="anuka-row anuka-compact anuka-center">
            <span class="anuka-mute anuka-sm">4d ago</span><span class="anuka-badge anuka-mute anuka-sm">in 12d</span
            ><span class="anuka-mute anuka-sm">5W</span>
            <span class="anuka-mute anuka-sm">|</span>
            <span class="anuka-mute anuka-sm">P2</span><span class="anuka-badge anuka-fail anuka-sm">overdue 7d</span
            ><span class="anuka-mute anuka-sm">1w ago</span>
          </div>
        </article>

        <!-- G-006 -->
        <article class="anuka-stack anuka-compact">
          <div class="anuka-row anuka-justify">
            <span>G-006</span>
            <div class="anuka-tags"><span class="anuka-tag anuka-sm">#L1</span></div>
            <span class="anuka-row anuka-compact">
              <span class="anuka-btn anuka-btn-icon"><span class="anuka-icon anuka-icon-stroke"></span></span>
              <span class="anuka-btn anuka-btn-icon"><span class="anuka-icon anuka-icon-pinyin"></span></span>
            </span>
          </div>
          <div class="anuka-stack anuka-compact">
            <div class="anuka-progress-line">
              <div class="anuka-progress-line-fill" style="width:100%"></div>
              <div class="anuka-progress-line-fill-strong" style="width:40%"></div>
            </div>
            <div class="anuka-progress-line">
              <div class="anuka-progress-line-fill" style="width:100%"></div>
              <div class="anuka-progress-line-fill-strong" style="width:30%"></div>
            </div>
          </div>
          <div class="anuka-row anuka-compact anuka-center">
            <span class="anuka-mute anuka-sm">5d ago</span><span class="anuka-badge anuka-mute anuka-sm">in 3d</span
            ><span class="anuka-mute anuka-sm">4W</span>
            <span class="anuka-mute anuka-sm">|</span>
            <span class="anuka-mute anuka-sm">P3</span><span class="anuka-badge anuka-fail anuka-sm">overdue 13d</span
            ><span class="anuka-mute anuka-sm">2w ago</span>
          </div>
        </article>

        <!-- G-003 -->
        <article class="anuka-stack anuka-compact">
          <div class="anuka-row anuka-justify">
            <span>G-003</span>
            <div class="anuka-tags"><span class="anuka-tag anuka-sm">#L1</span></div>
            <span class="anuka-row anuka-compact">
              <span class="anuka-btn anuka-btn-icon"><span class="anuka-icon anuka-icon-stroke"></span></span>
              <span class="anuka-btn anuka-btn-icon"><span class="anuka-icon anuka-icon-pinyin"></span></span>
            </span>
          </div>
          <div class="anuka-stack anuka-compact">
            <div class="anuka-progress-line">
              <div class="anuka-progress-line-fill" style="width:100%"></div>
              <div class="anuka-progress-line-fill-strong" style="width:40%"></div>
            </div>
            <div class="anuka-progress-line">
              <div class="anuka-progress-line-fill" style="width:100%"></div>
              <div class="anuka-progress-line-fill-strong" style="width:30%"></div>
            </div>
          </div>
          <div class="anuka-row anuka-compact anuka-center">
            <span class="anuka-mute anuka-sm">6d ago</span><span class="anuka-badge anuka-mute anuka-sm">in 2d</span
            ><span class="anuka-mute anuka-sm">4W</span>
            <span class="anuka-mute anuka-sm">|</span>
            <span class="anuka-mute anuka-sm">P3</span><span class="anuka-badge anuka-fail anuka-sm">overdue 9d</span
            ><span class="anuka-mute anuka-sm">1w ago</span>
          </div>
        </article>

        <!-- G-014 -->
        <article class="anuka-stack anuka-compact">
          <div class="anuka-row anuka-justify">
            <span>G-014</span>
            <div class="anuka-tags"><span class="anuka-tag anuka-sm">#L1</span></div>
            <span class="anuka-row anuka-compact">
              <span class="anuka-btn anuka-btn-icon"><span class="anuka-icon anuka-icon-stroke"></span></span>
              <span class="anuka-btn anuka-btn-icon"><span class="anuka-icon anuka-icon-pinyin"></span></span>
            </span>
          </div>
          <div class="anuka-stack anuka-compact">
            <div class="anuka-progress-line">
              <div class="anuka-progress-line-fill" style="width:100%"></div>
              <div class="anuka-progress-line-fill-strong" style="width:40%"></div>
            </div>
            <div class="anuka-progress-line">
              <div class="anuka-progress-line-fill" style="width:100%"></div>
              <div class="anuka-progress-line-fill-strong" style="width:20%"></div>
            </div>
          </div>
          <div class="anuka-row anuka-compact anuka-center">
            <span class="anuka-mute anuka-sm">6d ago</span><span class="anuka-badge anuka-mute anuka-sm">in 2d</span
            ><span class="anuka-mute anuka-sm">4W</span>
            <span class="anuka-mute anuka-sm">|</span>
            <span class="anuka-mute anuka-sm">P2</span><span class="anuka-badge anuka-fail anuka-sm">overdue 4d</span
            ><span class="anuka-mute anuka-sm">6d ago</span>
          </div>
        </article>

        <!-- G-009 -->
        <article class="anuka-stack anuka-compact">
          <div class="anuka-row anuka-justify">
            <span>G-009</span>
            <div class="anuka-tags"><span class="anuka-tag anuka-sm">#L1</span></div>
            <span class="anuka-row anuka-compact">
              <span class="anuka-btn anuka-btn-icon"><span class="anuka-icon anuka-icon-stroke"></span></span>
              <span class="anuka-btn anuka-btn-icon"><span class="anuka-icon anuka-icon-pinyin"></span></span>
            </span>
          </div>
          <div class="anuka-stack anuka-compact">
            <div class="anuka-progress-line">
              <div class="anuka-progress-line-fill" style="width:100%"></div>
              <div class="anuka-progress-line-fill-strong" style="width:30%"></div>
            </div>
            <div class="anuka-progress-line">
              <div class="anuka-progress-line-fill" style="width:100%"></div>
              <div class="anuka-progress-line-fill-strong" style="width:20%"></div>
            </div>
          </div>
          <div class="anuka-row anuka-compact anuka-center">
            <span class="anuka-mute anuka-sm">5d ago</span><span class="anuka-badge anuka-fail anuka-sm"
              >overdue 1d</span
            ><span class="anuka-mute anuka-sm">3W</span>
            <span class="anuka-mute anuka-sm">|</span>
            <span class="anuka-mute anuka-sm">P2</span><span class="anuka-badge anuka-fail anuka-sm">overdue 3d</span
            ><span class="anuka-mute anuka-sm">5d ago</span>
          </div>
        </article>

        <!-- G-022 -->
        <article class="anuka-stack anuka-compact">
          <div class="anuka-row anuka-justify">
            <span>G-022</span>
            <div class="anuka-tags"><span class="anuka-tag anuka-sm">#L2</span></div>
            <span class="anuka-row anuka-compact">
              <span class="anuka-btn anuka-btn-icon"><span class="anuka-icon anuka-icon-stroke"></span></span>
              <span class="anuka-btn anuka-btn-icon"><span class="anuka-icon anuka-icon-pinyin"></span></span>
            </span>
          </div>
          <div class="anuka-stack anuka-compact">
            <div class="anuka-progress-line">
              <div class="anuka-progress-line-fill" style="width:100%"></div>
              <div class="anuka-progress-line-fill-strong" style="width:20%"></div>
            </div>
            <div class="anuka-progress-line">
              <div class="anuka-progress-line-fill" style="width:100%"></div>
              <div class="anuka-progress-line-fill-strong" style="width:10%"></div>
            </div>
          </div>
          <div class="anuka-row anuka-compact anuka-center">
            <span class="anuka-mute anuka-sm">5d ago</span><span class="anuka-badge anuka-fail anuka-sm"
              >overdue 3d</span
            ><span class="anuka-mute anuka-sm">2W</span>
            <span class="anuka-mute anuka-sm">|</span>
            <span class="anuka-mute anuka-sm">P1</span><span class="anuka-badge anuka-fail anuka-sm">overdue 1d</span
            ><span class="anuka-mute anuka-sm">2d ago</span>
          </div>
        </article>

        <!-- G-016 -->
        <article class="anuka-stack anuka-compact">
          <div class="anuka-row anuka-justify">
            <span>G-016</span>
            <div class="anuka-tags"><span class="anuka-tag anuka-sm">#L1</span></div>
            <span class="anuka-row anuka-compact">
              <span class="anuka-btn anuka-btn-icon"><span class="anuka-icon anuka-icon-stroke"></span></span>
              <span class="anuka-btn anuka-btn-icon"><span class="anuka-icon anuka-icon-pinyin"></span></span>
            </span>
          </div>
          <div class="anuka-stack anuka-compact">
            <div class="anuka-progress-line">
              <div class="anuka-progress-line-fill" style="width:100%"></div>
              <div class="anuka-progress-line-fill-strong" style="width:20%"></div>
            </div>
            <div class="anuka-progress-line">
              <div class="anuka-progress-line-fill" style="width:100%"></div>
              <div class="anuka-progress-line-fill-strong" style="width:20%"></div>
            </div>
          </div>
          <div class="anuka-row anuka-compact anuka-center">
            <span class="anuka-mute anuka-sm">4d ago</span><span class="anuka-badge anuka-fail anuka-sm"
              >overdue 3d</span
            ><span class="anuka-mute anuka-sm">2W</span>
            <span class="anuka-mute anuka-sm">|</span>
            <span class="anuka-mute anuka-sm">P2</span><span class="anuka-badge anuka-mute anuka-sm">in 1h</span><span
              class="anuka-mute anuka-sm">1d ago</span
            >
          </div>
        </article>
      </div>
    </Island>

    <Island prose>
      <IslandTitle level={3}>How the overdue score works</IslandTitle>
      <p>
        Each time I complete a full session on a group, the next review is scheduled further out. The interval doubles
        with every session: <code>interval = 2^(sessions−1) days</code>. First review after 1 day, second after 2, third
        after 4. By the tenth session, the system expects me to remember the group for over a year without review.
      </p>

      <p>
        The interval also adjusts based on hint usage. The more hints I needed in a session, the shorter the next
        interval — the system schedules that group back sooner without me having to rate anything.
      </p>

      <p>
        The overdue score is <code>elapsed / effective_interval</code>. Below 1 — still on track. Above 1 — overdue. The
        group score is the worst of the two types: if pinyin is fine but strokes are overdue, the group is overdue.
      </p>
    </Island>
    <Island prose>
      <IslandTitle level={3}>Stroke and pinyin are scheduled independently</IslandTitle>
      <p>
        Each group has two independent schedules — one for stroke, one for pinyin. <strong>Completing a pinyin
        session does not affect the stroke schedule.</strong> A group can be current on pinyin and three days
        overdue on strokes at the same time.
      </p>

      <p>You can't offset a stroke debt by drilling pinyin. The system tracks each separately.</p>
    </Island>
    <Island prose>
      <IslandTitle level={3}>The rule: catch up before moving on</IslandTitle>
      <p>
        A new group enters only when every active group has an overdue score below 1 — both stroke and pinyin.
        <strong>If anything is overdue, catch up first.</strong>
      </p>

      <p>
        Spaced repetition only works if you show up for the reviews. Adding new material while old material decays
        defeats the purpose.
      </p>

      <p>Stay tuned for more updates on how the system evolves.</p>

      <div class="anuka-row anuka-right">
        <a href="/chinese/blog" class="anuka-btn">More insights</a>
        <a href="/chinese" class="anuka-btn anuka-main">Try a drill</a>
      </div>
    </Island>
  </div>
</main>
