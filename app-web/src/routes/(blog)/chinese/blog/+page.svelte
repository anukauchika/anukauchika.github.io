<script>
  import { goto } from '$app/navigation'
  import BtnIcon from '@std/ui/btn-icon.svelte'
  import Tags from '@std/ui/tags.svelte'
  import Island from '@std/ui/island.svelte'
  import IslandTitle from '@std/ui/island-title.svelte'
  import { getPost } from '@blog/chinese/blog/posts.js'

  const whenToAddWords = getPost('when-to-add-words')
  const hskElementary = getPost('hsk-elementary')
  const nihao = getPost('nihao')

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const fmtDate = (iso) => {
    const [y, m, d] = iso.split('-')
    return `${months[Number(m) - 1]} ${Number(d)}, ${y}`
  }
</script>

{#snippet postMeta(post)}
  <div class="anuka-row anuka-justify">
    <IslandTitle level={3}>{post.title}</IslandTitle>
    <time datetime={post.datePublished} class="anuka-mute anuka-sm">{fmtDate(post.datePublished)}</time>
  </div>
{/snippet}

{#snippet postLink(post)}
  <div class="anuka-row anuka-justify">
    <Tags tags={post.tags} />
    <a href="/chinese/blog/{post.slug}/" class="anuka-btn anuka-main">Read ~{post.readMinutes} min</a>
  </div>
{/snippet}

<svelte:head>
  <title>Learning Chinese — Blog | Anuka Uchika</title>
  <meta
    name="description"
    content="Articles about learning Chinese — characters, pronunciation, grammar, and system."
  />
  <link rel="canonical" href="https://anukauchika.com/chinese/blog/" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Learning Chinese — Blog" />
  <meta
    property="og:description"
    content="Articles about learning Chinese — characters, pronunciation, grammar, and system"
  />
  <meta property="og:url" content="https://anukauchika.com/chinese/blog/" />
  <meta property="og:site_name" content="Anuka Uchika" />
  <meta property="og:image" content="https://anukauchika.com/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="https://anukauchika.com/og-image.png" />
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
    {@render postMeta(whenToAddWords)}
    <p>
      The question is not which pack of words to drill next — the algorithm handles that. The real issues is knowing
      whether I'm keeping up, and when to add new material the current learning.
    </p>
    {@render postLink(whenToAddWords)}
  </Island>
  <Island prose>
    {@render postMeta(hskElementary)}
    <p>
      If you're learning Chinese, you've heard of HSK.
      <strong>HSK</strong> (Hànyǔ Shuǐpíng Kǎoshì, <span>&#27721;&#35821;&#27700;&#24179;&#32771;&#35797;</span>,
      "Chinese Proficiency Test") is the only official standardized test for Mandarin Chinese proficiency, administered
      by the Chinese Ministry of Education. It's the Chinese equivalent of TOEFL/IELTS for English.
    </p>
    <p>You need HSK for:</p>
    {@render postLink(hskElementary)}
  </Island>
  <Island prose>
    {@render postMeta(nihao)}
    <p>
      I'm a software engineer learning Chinese. I started learning two years ago. First streak was 300+ days. My current
      attempt is 250+ daily lessons and counting. It's a comforting illusion.
    </p>
    <p>
      In this blog I'm going to break out of the neat bubble created by some of the popular language apps and start
      building a system that pushes me to make real progress instead of just making me feel good.
    </p>
    {@render postLink(nihao)}
  </Island>
</main>
