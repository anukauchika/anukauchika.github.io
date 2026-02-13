import { mount } from 'svelte'
import './practice.css'
import './components/core/style/anuka.css'
import Practice from './Practice.svelte'
import { initAnalytics } from './utils/analytics.js'
import { initAuth } from './state/auth.js'
import { maintenanceService } from './services/maintenance-service'

initAnalytics()
maintenanceService.runStartupTasks()
await initAuth()

mount(Practice, {
  target: document.getElementById('app'),
})
