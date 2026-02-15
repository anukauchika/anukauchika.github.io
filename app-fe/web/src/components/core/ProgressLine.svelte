<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    class?: string
    fill?: number
    fillStrong?: number
    top?: Snippet
    bottom?: Snippet
  }

  let { class: cls = '', fill = 0, fillStrong = 0, top, bottom }: Props = $props()
  const hasContent = $derived(!!top || !!bottom)
</script>

{#snippet bar()}
  <div class="anuka-progress-line {hasContent ? '' : cls}">
    {#if fill > 0}
      <div class="anuka-progress-line-fill" style="width: {fill}%"></div>
    {/if}
    {#if fillStrong > 0}
      <div class="anuka-progress-line-fill-strong" style="width: {fillStrong}%"></div>
    {/if}
  </div>
{/snippet}

{#if hasContent}
  <div class="anuka-progress-line-group anuka-stack anuka-compact {cls}">
    {#if top}{@render top()}{/if}
    {@render bar()}
    {#if bottom}{@render bottom()}{/if}
  </div>
{:else}
  {@render bar()}
{/if}
