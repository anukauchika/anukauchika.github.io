import { mount } from 'svelte'
import './workbook.css'
import Print from './Print.svelte'

mount(Print, {
  target: document.getElementById('app'),
})
