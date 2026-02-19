<script>
  import '@std/style/anuka.css'
  import { initAnalytics } from '@low/google/analytics'
  import { svcAuth } from '@svc/auth'
  import { svcDataset } from '@svc/dataset'
  import { maintenanceService } from '@svc/maintenance-service'

  let { children } = $props()

  let ready = $state(false)

  initAnalytics()
  maintenanceService.runStartupTasks()
  svcAuth.init().then(() => svcDataset.init()).then(() => { ready = true })
</script>

{#if ready}
  {@render children()}
{/if}
