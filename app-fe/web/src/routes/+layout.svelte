<script>
  import '@std/style/anuka.css'
  import { initAnalytics } from '@app/data/google/analytics'
  import { initAuth } from '@app/state/auth'
  import { maintenanceService } from '@app/services/maintenance-service'

  let { children } = $props()

  let ready = $state(false)

  initAnalytics()
  maintenanceService.runStartupTasks()
  initAuth().then(() => { ready = true })
</script>

{#if ready}
  {@render children()}
{/if}
