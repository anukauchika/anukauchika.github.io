<script>
  let { bars, line, ticks, yMax } = $props()

  const ML = 44
  const chartW = 600
  const W = ML + chartW
  const H = 140
  const chartH = 100
  const barW = 16
  const gap = 4
  const step = barW + gap
  const toY = (v) => yMax > 0 ? chartH - (v / yMax) * chartH : chartH

  let hoveredBar = $state(null)
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="chart-container" onmouseleave={() => hoveredBar = null}>
  <svg class="chart-svg" viewBox="0 0 {W} {H}">
    {#each ticks as tick}
      {@const y = toY(tick)}
      <line x1={ML} y1={y} x2={ML + chartW} y2={y} stroke="var(--anuka-color-muted)" stroke-opacity="0.12" stroke-width="1" />
      <text x={ML - 4} y={y + 6} text-anchor="end" font-size="21" fill="var(--anuka-color-muted)" opacity="0.5">{tick}</text>
    {/each}
    {#each bars as bar, i}
      {@const barH = yMax > 0 ? (bar.count / yMax) * chartH : 0}
      <rect
        x={ML + i * step}
        y={chartH - barH}
        width={barW}
        height={barH}
        rx="2"
        fill="var(--anuka-color-primary)"
        opacity={hoveredBar?.index === i ? 0.5 : 0.25}
      />
      <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
      <rect
        x={ML + i * step}
        y="0"
        width={step}
        height={chartH}
        fill="transparent"
        role="button"
        tabindex="-1"
        onmouseenter={() => hoveredBar = { index: i, bar, cumulative: line[i] }}
        onclick={() => hoveredBar = hoveredBar?.index === i ? null : { index: i, bar, cumulative: line[i] }}
      />
      {#if bar.monthLabel}
        <text
          x={ML + i * step}
          y={H - 4}
          font-size="21"
          fill="var(--anuka-color-muted)"
          opacity="0.5"
        >{bar.monthLabel}</text>
      {/if}
    {/each}
    {#if line.some(v => v > 0)}
      <polyline
        fill="none"
        stroke="var(--anuka-color-primary)"
        stroke-width="2"
        points={line.map((v, i) => `${ML + i * step + barW / 2},${toY(v)}`).join(' ')}
      />
    {/if}
  </svg>
  {#if hoveredBar}
    <div class="chart-tooltip" style="left: {((ML + hoveredBar.index * step + barW / 2) / W) * 100}%">
      <strong>{hoveredBar.bar.label}</strong><br>
      {hoveredBar.bar.count} attempt{hoveredBar.bar.count !== 1 ? 's' : ''} &middot; {hoveredBar.cumulative} word{hoveredBar.cumulative !== 1 ? 's' : ''}
    </div>
  {/if}
</div>

<style>
  .chart-container { position: relative; margin-bottom: 0.4rem; }
  .chart-svg { width: 100%; height: 90px; display: block; }
  .chart-tooltip {
    position: absolute;
    top: -8px;
    transform: translateX(-50%) translateY(-100%);
    background: var(--anuka-color-surface);
    border: 1px solid var(--anuka-color-accent);
    border-radius: 8px;
    padding: 0.3rem 0.6rem;
    font-size: 0.75rem;
    pointer-events: none;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    line-height: 1.4;
  }
</style>
