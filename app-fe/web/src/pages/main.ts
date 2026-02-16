import { mount } from 'svelte'
import '@std/style/anuka.css'
import App from './App.svelte'
import { initAnalytics } from '@app/data/google/analytics.js'
import { initAuth } from '@app/state/auth.js'
import { maintenanceService } from '@app/services/maintenance-service'

initAnalytics()
maintenanceService.runStartupTasks()
await initAuth()

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
