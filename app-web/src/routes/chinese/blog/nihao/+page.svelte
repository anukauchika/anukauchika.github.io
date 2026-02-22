<script>
  import { goto }             from '$app/navigation'
  import ActivityHeatmap      from '@std/ui/activity-heatmap.svelte'
  import AppTitle             from '@std/ui/app-title.svelte'
  import BtnIcon              from '@std/ui/btn-icon.svelte'
  import Island               from '@std/ui/island.svelte'
  import IslandTitle          from '@std/ui/island-title.svelte'
  import Stat                 from '@std/ui/stat.svelte'
  import ProgressLine         from '@std/ui/progress-line.svelte'

  const dayData = [
    { date: '2026-02-06', count: 99, sessions: 7, dur: '39m' },
    { date: '2026-02-07', count: 190, sessions: 14, dur: '1h 39m' },
    { date: '2026-02-08', count: 0, sessions: 0, dur: '' },
    { date: '2026-02-09', count: 197, sessions: 14, dur: '54m' },
    { date: '2026-02-10', count: 62, sessions: 6, dur: '48m' },
    { date: '2026-02-11', count: 135, sessions: 12, dur: '1h 22m' },
    { date: '2026-02-12', count: 30, sessions: 4, dur: '14m' },
    { date: '2026-02-13', count: 51, sessions: 3, dur: '16m' },
    { date: '2026-02-14', count: 0, sessions: 0, dur: '' },
    { date: '2026-02-15', count: 70, sessions: 5, dur: '24m' },
    { date: '2026-02-16', count: 2, sessions: 0, dur: '' },
    { date: '2026-02-17', count: 80, sessions: 5, dur: '36m' },
    { date: '2026-02-18', count: 0, sessions: 0, dur: '' },
    { date: '2026-02-19', count: 25, sessions: 1, dur: '1m' },
    { date: '2026-02-20', count: 129, sessions: 8, dur: '28m' },
    { date: '2026-02-21', count: 211, sessions: 15, dur: '1h 20m' },
    { date: '2026-02-22', count: 15, sessions: 3, dur: '15m' },
  ]

  let selectedDay = $state(dayData.findIndex(d => d.date === '2026-02-21'))

  const fmtDate = (d) => `Feb ${parseInt(d.date.slice(8))}`

  const dayTitle = (d) => {
    if (d.count === 0) return `${fmtDate(d)} · No sessions`
    const parts = [fmtDate(d)]
    if (d.count > 0) parts.push(`${d.count} words`)
    if (d.sessions > 0) parts.push(`${d.sessions} sessions`)
    if (d.dur) parts.push(d.dur)
    return parts.join(' · ')
  }
</script>

<svelte:head>
  <title>你好 Nihao — Learn Chinese - Anuka Uchika</title>
  <meta name="description" content="Learn about 你好 (nǐ hǎo) — the most common Chinese greeting, its characters, tones, and usage." />
</svelte:head>

<main class="anuka-page">
  <Island sticky>
    <div class="anuka-row anuka-justify">
      <IslandTitle level={3}>"A lesson a day!" is the wrong focus</IslandTitle>
      <BtnIcon icon="close" label="Back" onclick={() => goto('/chinese/blog')} />
    </div>
  </Island>
  <div class="anuka-stack">
    <Island prose>
      <p>I’m a software engineer learning Chinese. I started learning two years ago.
        First streak was 300+ days. My current attempt is 250+ daily lessons and counting.
        It’s a comforting illusion.
      </p>

      <p>
        In this blog I'm going to break out of the neat bubble fed by some of the popular language apps
        and start building a system that pushes me to make real progress instead of just making me feel good.
      </p>

      <p>
        The problem with "a lesson a day" is that it's totally not enough. I need a system.
        I'll start with <strong>vocabulary</strong> learning and <strong>tracking</strong> my progress.
      </p>
    </Island>
    <AppTitle parts={['System', 'Vocabulary']} />
    <Island prose>
      <ul>
        <li>Target specific vocabulary. HSK 2026 levels 1-3: 1000 words in total.</li>
        <li>Break vocabulary into fixed groups of 15 words each. Brain loves structure.</li>
        <li>Use a smart spaced-repetition algorithm to decide which group to drill next.</li>
        <li>Start with a set of 5-6 groups, add more upon memorization.</li>
        <li>Track how many unique words I have learnt over time.</li>
        <li>Track how much time I'm devoting on a daily basis.</li>
      </ul>
      <div class="anuka-row anuka-center">
        <Stat value={67} label="Groups" />
        <Stat value={1000} label="Words" />
        <Stat value={988} label="Unique" />
        <Stat value={655} label="Chars" />
      </div>
    </Island>
    <AppTitle parts={['Current Progress']} />
    <Island prose>
      <p>I started with the new system two weeks ago. At the time of writing this blog post, as I already have some basic knowledge, I quickly drilled through the first 20 groups. You can see my daily activity in the heatmap below, it's clickable.</p>
      <ActivityHeatmap
        items={dayData}
        range={[0, 200]}
        value={(d) => d.count}
        title={dayTitle}
        selectedIndex={selectedDay}
        onselect={(i) => selectedDay = selectedDay === i ? null : i}
      />
      <div class="anuka-row anuka-center">
        <Stat value={22} label="Groups" />
        <Stat value={346} label="Words" />
        <Stat value="39m" label="Avg/Day" />
      </div>
      <p>Currently, I count 10 reps of a group as mastery and 1 rep as progress. This is the overall progress for the whole HSK 2026 levels 1-3:</p>
      <ProgressLine fill={35} fillStrong={11}>
        {#snippet bottom()}<div class="anuka-row anuka-justify"><span class="anuka-mute anuka-sm">Writing</span><span class="anuka-mute anuka-sm">35% · mastery 11%</span></div>{/snippet}
      </ProgressLine>
      <ProgressLine fill={29} fillStrong={6}>
        {#snippet bottom()}<div class="anuka-row anuka-justify"><span class="anuka-mute anuka-sm">Pinyin</span><span class="anuka-mute anuka-sm">29% · mastery 6%</span></div>{/snippet}
      </ProgressLine>
    </Island>
    <Island prose>
      <p>System cannot be static. It should evolve with the learning progress itself. To make the system work for me, instead of me struggling with it I have created this web app.</p>
      <p>It helps me pick a set of groups to drill, practice both writing and pinyin, and track learning statistics automatically.</p>
      <p>Hopefully I will not be too carried away with the system itself, and use it wisely to accelerate my learning progress.</p>
      <div class="anuka-row anuka-right">
        <a href="/chinese/blog" class="anuka-btn anuka-main">Read more insights</a>
        <a href="/chinese" class="anuka-btn anuka-main">Try a Writing Drill</a>
      </div>
    </Island>
  </div>
</main>
