import { mount } from 'svelte'
import '@std/style/anuka.css'
import DesignBook from './DesignBook.svelte'

mount(DesignBook, {
  target: document.getElementById('app')!,
})
