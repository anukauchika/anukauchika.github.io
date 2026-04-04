<script lang="ts" generics="T">
  interface Props {
    items: T[]
    range: [number, number]
    value: (item: T) => number
    title?: (item: T) => string
    muted?: (item: T) => boolean
    selectedIndex?: number | null
    onselect?: (index: number) => void
  }

  let { items, range, value, title, muted, selectedIndex = null, onselect }: Props = $props()

  let scrollEl = $state<HTMLDivElement | null>(null)

  $effect(() => {
    if (scrollEl) scrollEl.scrollLeft = scrollEl.scrollWidth
  })

  function level(v: number): number {
    if (v <= range[0]) return 0
    if (v >= range[1]) return 4
    return Math.min(4, Math.ceil(((v - range[0]) / (range[1] - range[0])) * 4))
  }
</script>

<div class="anuka-activity-heatmap-scroll" bind:this={scrollEl}>
  <div class="anuka-activity-heatmap">
    {#each items as item, i}
      {@const lv = level(value(item))}
      {#if onselect}
        <button
          type="button"
          class="anuka-activity-heatmap-cell"
          data-level={lv || undefined}
          data-muted={muted?.(item) || undefined}
          data-selected={selectedIndex === i || undefined}
          title={title?.(item)}
          onclick={() => onselect(i)}
        ></button>
      {:else}
        <div
          class="anuka-activity-heatmap-cell"
          data-level={lv || undefined}
          data-muted={muted?.(item) || undefined}
        ></div>
      {/if}
    {/each}
  </div>
</div>
{#if selectedIndex !== null && title}
  <div class="anuka-activity-heatmap-title">{title(items[selectedIndex])}</div>
{/if}
