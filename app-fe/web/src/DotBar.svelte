<script>
  let {
    progress = 0,
    mastery = 0,
    dots = 20,
    size = 10,
    gap = 3,
    emptyColor = 'rgba(31, 111, 92, 0.12)',
    progressColor = 'rgba(31, 111, 92, 0.5)',
    masteryColor = 'var(--accent)',
  } = $props()
</script>

<div class="dot-bar" style="gap: {gap}px">
  {#each Array(dots) as _, i}
    {@const pct = ((i + 0.5) / dots) * 100}
    <span
      class="dot"
      style="width: {size}px; height: {size}px; background: {pct <= mastery ? masteryColor : pct <= progress ? progressColor : emptyColor}"
    ></span>
  {/each}
</div>

<style>
  .dot-bar {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dot {
    border-radius: 50%;
    flex-shrink: 0;
  }
</style>
