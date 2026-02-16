import { mount } from 'svelte'
import '@std/style/anuka.css'
import DesignBook from './design-book.svelte'

mount(DesignBook, {
  target: document.getElementById('app')!,
})
