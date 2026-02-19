<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    class?: string
    main?: boolean
    disabled?: boolean
    onclick?: (e: MouseEvent) => void
    children?: Snippet
  }

  let { class: cls = '', main = false, disabled = false, onclick, children }: Props = $props()
</script>

<button
  class="anuka-btn {cls}"
  class:anuka-main={main}
  type="button"
  {disabled}
  {onclick}
>
  {#if children}
    {@render children()}
  {/if}
</button>
