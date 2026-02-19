<script>
  import '@std/style/anuka.css'
  import { initAnalytics } from '@low/google/analytics'
  import { svcAuth } from '@svc/auth'
  import { svcDataset } from '@svc/dataset'
  import { svcMaintenance } from '@svc/maintenance'

  let { children } = $props()

  let ready = $state(false)

  initAnalytics()
  svcMaintenance.runStartupTasks()
  svcAuth.init().then(() => svcDataset.init()).then(() => { ready = true })
</script>

{#if ready}
  {@render children()}
{/if}
