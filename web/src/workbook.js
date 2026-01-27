import { mount } from 'svelte'
import './workbook.css'
import Workbook from './Workbook.svelte'

mount(Workbook, {
  target: document.getElementById('app'),
})
