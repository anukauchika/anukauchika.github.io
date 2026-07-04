<script>
  import WorksheetPage from './worksheet-page.svelte'

  let { data } = $props()
</script>

<WorksheetPage {...data} />
