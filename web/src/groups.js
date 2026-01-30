import { mount } from 'svelte'
import './app.css'
import Groups from './Groups.svelte'
import { initAnalytics } from './utils/analytics.js'

initAnalytics()

const app = mount(Groups, {
  target: document.getElementById('app'),
})

export default app
