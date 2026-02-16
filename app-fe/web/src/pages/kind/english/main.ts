import { mount } from 'svelte'
import '@std/style/anuka.css'
import Main from './main.svelte'
import { initAnalytics } from '@app/data/google/analytics'
import { initAuth } from '@app/state/auth'
import { maintenanceService } from '@app/services/maintenance-service'

initAnalytics()
maintenanceService.runStartupTasks()
await initAuth()

mount(Main, {
  target: document.getElementById('app')!,
})
