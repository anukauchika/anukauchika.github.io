<script>
  let { post } = $props()

  const url = `https://anukauchika.com/chinese/blog/${post.slug}/`
</script>

<svelte:head>
  <title>{post.title} | Anuka Uchika</title>
  <meta name="description" content={post.description} />
  <link rel="canonical" href={url} />
  <meta property="og:type" content="article" />
  <meta property="og:title" content={post.title} />
  <meta property="og:description" content={post.description} />
  <meta property="og:url" content={url} />
  <meta property="og:site_name" content="Anuka Uchika" />
  <meta property="og:image" content="https://anukauchika.com/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="article:published_time" content={post.datePublished} />
  <meta property="article:modified_time" content={post.dateModified} />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={post.title} />
  <meta name="twitter:description" content={post.description} />
  <meta name="twitter:image" content="https://anukauchika.com/og-image.png" />
  {@html `<script type="application/ld+json">${JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    datePublished: post.datePublished,
    dateModified: post.dateModified,
    author: { '@type': 'Person', name: 'Anuka' },
    publisher: { '@type': 'Organization', name: 'Anuka Uchika' },
    url,
  })}<\/script>`}
</svelte:head>
