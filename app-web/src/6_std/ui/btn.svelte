<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    class?: string
    main?: boolean
    onclick?: (e: MouseEvent) => void
    children?: Snippet
  }

  let { class: cls = '', main = false, onclick, children }: Props = $props()
</script>

<button
  class="anuka-btn {cls}"
  class:anuka-main={main}
  type="button"
  {onclick}
>
  {#if children}
    {@render children()}
  {/if}
</button>
