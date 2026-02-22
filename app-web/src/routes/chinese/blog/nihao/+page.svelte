<script>
  import { goto }    from '$app/navigation'
  import AppTitle    from '@std/ui/app-title.svelte'
  import BtnIcon     from '@std/ui/btn-icon.svelte'
  import Card        from '@std/ui/card.svelte'
  import Island      from '@std/ui/island.svelte'
  import IslandTitle from '@std/ui/island-title.svelte'
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
    <Island>
      <p>I'm a software engineer learning Chinese, started two years ago.
        First streak was 300+ days. Current attempt is 250+ daily lessons and counting.
        It’s a comforting illusion.
      </p>

      <p>
        In this blog I'm going to break out of the neat bubble created by some of the popular language apps
        and start building a system that pushes me to make real progress instead of just making me feel good.
      </p>

      <p>
        The problem with "a lesson a day" is that it's totally not enough. I need a system.
        I'll start with a <strong>vocabulary</strong> learning and <strong>tracking</strong> my progress.
      </p>
    </Island>
    <AppTitle parts={['System', 'Vocabulary']} />
    <Island>
      <ul>
        <li>Target specific vocabulary. HSK 2026 levels 1-3: 1000 words in total.</li>
        <li>Break vocabulary in fixed groups 15 words each. Brain loves structure.</li>
        <li>Use smart spaced algorithm to decide which group to drill next.</li>
        <li>Track how many unique words I have learnt over time.</li>
        <li>Track how much time I'm devoting on daily basis.</li>
      </ul>
    </Island>
  </div>
</main>
