<script>
  import App from '../../App.svelte'
  import Workbook from '../../workbook.svelte'

  // --- SPA routing ---

  let pathname = $state(window.location.pathname)

  const route = $derived.by(() => {
    const p = pathname.replace(/^\/english\/?/, '')
    if (p.startsWith('workbook')) return 'workbook'
    return 'browse'
  })

  $effect(() => {
    const onPopState = () => { pathname = window.location.pathname }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  })

  $effect(() => {
    const onClick = (e) => {
      const anchor = e.target.closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href) return
      if (!href.startsWith('/english/') && href !== '/english/') return
      if (anchor.target === '_blank' || e.ctrlKey || e.metaKey || e.shiftKey) return
      e.preventDefault()
      history.pushState(null, '', href)
      pathname = new URL(href, window.location.origin).pathname
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  })
</script>

{#if route === 'workbook'}
  <Workbook />
{:else}
  <App />
{/if}
