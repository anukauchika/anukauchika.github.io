<script>
  import '@std/style/anuka.css'
  import { initAnalytics } from '@low/google/analytics'
  import { initAuth } from '@stt/auth'
  import { maintenanceService } from '@svc/maintenance-service'

  let { children } = $props()

  let ready = $state(false)

  initAnalytics()
  maintenanceService.runStartupTasks()
  initAuth().then(() => { ready = true })
</script>

{#if ready}
  {@render children()}
{/if}
