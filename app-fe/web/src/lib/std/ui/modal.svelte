<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    onclose: () => void
    children: Snippet
  }

  let { onclose, children }: Props = $props()

  function portal(node: HTMLElement) {
    document.body.appendChild(node)
    return { destroy() { node.remove() } }
  }
</script>

<div class="anuka-modal" use:portal>
  <button
    class="anuka-modal-overlay"
    type="button"
    aria-label="Close dialog"
    onclick={onclose}
  ></button>
  {@render children()}
</div>
