import { mount } from 'svelte'
import './practice.css'
import Practice from './Practice.svelte'
import { initAnalytics } from './utils/analytics.js'

initAnalytics()

mount(Practice, {
  target: document.getElementById('app'),
})
