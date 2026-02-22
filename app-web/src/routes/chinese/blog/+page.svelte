<script>
  import { goto } from '$app/navigation'
  import BtnIcon     from '@std/ui/btn-icon.svelte'
  import Tags        from '@std/ui/tags.svelte'
  import Island      from '@std/ui/island.svelte'
  import IslandTitle from '@std/ui/island-title.svelte'
</script>

<svelte:head>
  <title>Blog - Learn Chinese - Anuka Uchika</title>
  <meta name="description" content="Articles about learning Chinese — characters, pronunciation, grammar, and culture." />
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
  <Island sticky>
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
</main>
