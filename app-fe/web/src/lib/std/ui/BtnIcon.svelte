<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    class?: string
    icon?: string
    label?: string
    active?: boolean
    onclick?: (e: MouseEvent) => void
    children?: Snippet
  }

  let { class: cls = '', icon, label, active = false, onclick, children }: Props = $props()
</script>

<button
  class="anuka-btn-icon {cls}"
  class:anuka-main={active}
  type="button"
  aria-label={label}
  {onclick}
>
  {#if icon}
    <span class="anuka-icon anuka-icon-{icon}"></span>
  {/if}
  {#if children}
    {@render children()}
  {/if}
</button>
