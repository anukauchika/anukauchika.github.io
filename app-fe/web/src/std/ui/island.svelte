<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    sticky?: boolean
    children: Snippet
  }

  let { sticky = false, children }: Props = $props()
</script>

<section class="anuka-island" class:anuka-island-sticky={sticky}>
  {@render children()}
</section>
