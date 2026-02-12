import { mount } from 'svelte'
import '../components/core/style/anuka.css'
import DesignBook from './DesignBook.svelte'

mount(DesignBook, {
  target: document.getElementById('app')!,
})
