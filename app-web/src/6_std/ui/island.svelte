<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    sticky?: boolean
    prose?: boolean
    children: Snippet
  }

  let { sticky = false, prose = false, children }: Props = $props()
</script>

<section class="anuka-island" class:anuka-island-sticky={sticky} class:anuka-prose={prose}>
  {@render children()}
</section>
