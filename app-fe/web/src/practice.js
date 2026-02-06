import { mount } from 'svelte'
import './practice.css'
import Practice from './Practice.svelte'
import { initAnalytics } from './utils/analytics.js'
import { initAuth } from './state/auth.js'

initAnalytics()
await initAuth()

mount(Practice, {
  target: document.getElementById('app'),
})
