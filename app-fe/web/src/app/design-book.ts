import { mount } from 'svelte'
import '../components/core/style/anuka.css'
import DesignBook from './design/index.svelte'

mount(DesignBook, {
  target: document.getElementById('app')!,
})
