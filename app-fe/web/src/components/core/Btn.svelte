<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    variant?: 'outline' | 'ghost' | 'toggle' | 'icon'
    active?: boolean
    label?: string
    icon?: string
    onclick?: (e: MouseEvent) => void
    children?: Snippet
  }

  let { variant, active = false, label, icon, onclick, children }: Props = $props()
</script>

<button
  class="anuka-btn"
  class:anuka-btn-outline={variant === 'outline'}
  class:anuka-btn-ghost={variant === 'ghost'}
  class:anuka-btn-toggle={variant === 'toggle'}
  class:anuka-btn-icon={variant === 'icon'}
  class:active
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
