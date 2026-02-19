<script>
  import '@std/style/anuka.css'
  import { initAnalytics } from '@low/google/analytics'
  import { initAuth, setDatasetReloadHook } from '@stt/auth'
  import { svcDataset } from '@svc/dataset'
  import { maintenanceService } from '@svc/maintenance-service'

  let { children } = $props()

  let ready = $state(false)

  setDatasetReloadHook(() => svcDataset.reloadPrefs())
  initAnalytics()
  maintenanceService.runStartupTasks()
  initAuth().then(() => svcDataset.init()).then(() => { ready = true })
</script>

{#if ready}
  {@render children()}
{/if}
