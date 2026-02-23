<script>
  import { goto } from '$app/navigation'
  import BtnIcon     from '@std/ui/btn-icon.svelte'
  import Tags        from '@std/ui/tags.svelte'
  import Island      from '@std/ui/island.svelte'
  import IslandTitle from '@std/ui/island-title.svelte'
</script>

<svelte:head>
  <title>Blog - Learn Chinese</title>
  <meta name="description" content="Articles about learning Chinese — characters, pronunciation, grammar, and system." />
  <link rel="canonical" href="https://anukauchika.com/chinese/blog" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Learning Chinese — Blog" />
  <meta property="og:description" content="Articles about learning Chinese — characters, pronunciation, grammar, and system" />
  <meta property="og:url" content="https://anukauchika.com/chinese/blog" />
  <meta property="og:site_name" content="Anuka Uchika" />
</svelte:head>

<main class="anuka-page">
  <Island sticky>
    <div class="anuka-row anuka-justify">
      <IslandTitle level={3}>
        <span>Learning Chinese</span>
      </IslandTitle>
      <BtnIcon icon="close" label="Close" onclick={() => goto('/chinese/')} />
    </div>
  </Island>
  <Island prose>
    <IslandTitle level={3}>"A lesson a day!" is the wrong focus</IslandTitle>
    <p>I'm a software engineer learning Chinese. I started learning two years ago.
      First streak was 300+ days. My current attempt is 250+ daily lessons and counting.
      It’s a comforting illusion.
    </p>

    <p>
      In this blog I'm going to break out of the neat bubble created by some of the popular language apps
      and start building a system that pushes me to make real progress instead of just making me feel good.
    </p>

    <div class="anuka-row anuka-justify">
      <Tags tags={['chinese/system']} />
      <a href="/chinese/blog/nihao" class="anuka-btn anuka-main">Read ~10 min</a>
    </div>
  </Island>
  <Island sticky prose>
    <IslandTitle level={3}>HSK Elementary: The Numbers</IslandTitle>
    <p>
      If you're learning Chinese, you've heard of HSK.
      <strong>HSK</strong> (Hànyǔ Shuǐpíng Kǎoshì, <span>&#27721;&#35821;&#27700;&#24179;&#32771;&#35797;</span>, "Chinese Proficiency Test") is the only official standardized test
      for Mandarin Chinese proficiency, administered by the Chinese Ministry of Education.
      It's the Chinese equivalent of TOEFL/IELTS for English.
    </p>
    <p>You need HSK for:</p>
    <div class="anuka-row anuka-justify">
      <Tags tags={['chinese/hsk']} />
      <a href="/chinese/blog/hsk-elementary" class="anuka-btn anuka-main">Read ~10 min</a>
    </div>
  </Island>
</main>
