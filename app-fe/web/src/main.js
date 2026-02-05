import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'
import { initAnalytics } from './utils/analytics.js'

initAnalytics()

const app = mount(App, {
  target: document.getElementById('app'),
})

export default app
