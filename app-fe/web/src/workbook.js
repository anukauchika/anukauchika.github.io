import { mount } from 'svelte'
import './workbook.css'
import Workbook from './Workbook.svelte'
import { initAnalytics } from './utils/analytics.js'

initAnalytics()

mount(Workbook, {
  target: document.getElementById('app'),
})
