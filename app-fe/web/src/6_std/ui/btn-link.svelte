<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    onclick?: (e: MouseEvent) => void
    children?: Snippet
  }

  let { onclick, children }: Props = $props()
</script>

<button class="anuka-btn-link" type="button" {onclick}>
  {#if children}
    {@render children()}
  {/if}
</button>
