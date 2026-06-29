<script>
  import { onMount } from 'svelte'

  let { target } = $props()
  const redirectScript = $derived(
    `<script>(function(){var t=${JSON.stringify(target)};location.replace(t+location.search+location.hash)})()</scr` +
      'ipt>',
  )

  onMount(() => {
    const nextUrl = `${target}${globalThis.location.search}${globalThis.location.hash}`
    globalThis.location.replace(nextUrl)
  })
</script>

<svelte:head>
  <title>Page moved</title>
  <meta name="robots" content="noindex, follow" />
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html redirectScript}
  <meta http-equiv="refresh" content={`0; url=${target}`} />
  <link rel="canonical" href={`https://anukauchika.com${target}`} />
</svelte:head>

<main>
  <h1>Page moved</h1>
  <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
  <p><a href={target}>Open Printable HSK Elementary Chinese Writing Worksheets</a></p>
</main>
