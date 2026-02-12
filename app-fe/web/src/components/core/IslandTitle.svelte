<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    level?: 1 | 2 | 3 | 4
    parts?: string[]
    children?: Snippet
  }

  let { level = 2, parts, children }: Props = $props()
</script>

{#if level === 1}
  <h1 class="anuka-island-title">
    {#if parts}{#each parts as part}<span>{part}</span>{/each}{:else if children}{@render children()}{/if}
  </h1>
{:else if level === 3}
  <h3 class="anuka-island-title">
    {#if parts}{#each parts as part}<span>{part}</span>{/each}{:else if children}{@render children()}{/if}
  </h3>
{:else if level === 4}
  <h4 class="anuka-island-title">
    {#if parts}{#each parts as part}<span>{part}</span>{/each}{:else if children}{@render children()}{/if}
  </h4>
{:else}
  <h2 class="anuka-island-title">
    {#if parts}{#each parts as part}<span>{part}</span>{/each}{:else if children}{@render children()}{/if}
  </h2>
{/if}
