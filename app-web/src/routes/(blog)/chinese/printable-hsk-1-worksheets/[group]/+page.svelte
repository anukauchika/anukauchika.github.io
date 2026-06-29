<script>
  import RedirectPage from '../redirect-page.svelte'

  let { data } = $props()
</script>

<RedirectPage {...data} />
