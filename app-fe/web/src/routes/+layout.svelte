<script>
  import '@std/style/anuka.css'
  import { initAnalytics } from '@low/google/analytics'
  import { initAuth, setDatasetReloadHook } from '@stt/auth'
  import { datasetService } from '@svc/dataset-service'
  import { maintenanceService } from '@svc/maintenance-service'

  let { children } = $props()

  let ready = $state(false)

  setDatasetReloadHook(() => datasetService.reloadPrefs())
  initAnalytics()
  maintenanceService.runStartupTasks()
  initAuth().then(() => datasetService.init()).then(() => { ready = true })
</script>

{#if ready}
  {@render children()}
{/if}
