import { mount } from 'svelte'
import '@std/style/anuka.css'
import './workbook.css'
import Workbook from './Workbook.svelte'
import { initAnalytics } from '@app/data/google/analytics.js'

initAnalytics()

mount(Workbook, {
  target: document.getElementById('app')!,
})
