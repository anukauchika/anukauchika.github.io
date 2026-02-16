import { mount } from 'svelte'
import '@std/style/anuka.css'
import Practice from './Practice.svelte'
import { initAnalytics } from '@app/data/google/analytics.js'
import { initAuth } from '@app/state/auth.js'
import { maintenanceService } from '@app/services/maintenance-service'

initAnalytics()
maintenanceService.runStartupTasks()
await initAuth()

mount(Practice, {
  target: document.getElementById('app')!,
})
