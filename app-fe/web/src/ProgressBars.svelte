<script>
  let { strokeProgress = 0, strokeMastery = 0, pinyinProgress = 0, pinyinMastery = 0, strokePracticedCount = 0, pinyinPracticedCount = 0, totalCount = 0 } = $props()

  let tooltip = $state(null)

  function show(label, e) {
    e.stopPropagation()
    tooltip = tooltip === label ? null : label
  }

  function close() { tooltip = null }
</script>

<svelte:document onclick={close} />

<div class="progress-bars">
  <div class="bar-wrap">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="bar" onclick={(e) => show('stroke', e)}>
      <div class="fill-words" style="width: {strokeProgress}%"></div>
      <div class="fill-mastery" style="width: {strokeMastery}%"></div>
    </div>
    {#if tooltip === 'stroke'}
      <div class="tooltip below">Stroke practice · {strokePracticedCount}/{totalCount} words<div class="arrow"></div></div>
    {/if}
  </div>
  <div class="bar-wrap">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="bar" onclick={(e) => show('pinyin', e)}>
      <div class="fill-words" style="width: {pinyinProgress}%"></div>
      <div class="fill-mastery" style="width: {pinyinMastery}%"></div>
    </div>
    {#if tooltip === 'pinyin'}
      <div class="tooltip above">Pinyin practice · {pinyinPracticedCount}/{totalCount} words<div class="arrow"></div></div>
    {/if}
  </div>
</div>

<style>
  .progress-bars {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 1.5rem;
    margin-bottom: -0.5rem;
  }

  .bar-wrap {
    position: relative;
  }

  .bar {
    position: relative;
    height: 6px;
    background: rgba(31, 111, 92, 0.12);
    overflow: hidden;
    border-radius: 2px;
    cursor: pointer;
  }

  .fill-words {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: rgba(31, 111, 92, 0.5);
    border-radius: 2px;
    transition: width 0.4s ease;
  }

  .fill-mastery {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: var(--accent);
    border-radius: 2px;
    transition: width 0.4s ease;
  }

  .tooltip {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    background: var(--ink);
    color: white;
    font-size: 0.75rem;
    padding: 4px 10px;
    border-radius: 6px;
    white-space: nowrap;
    z-index: 10;
    pointer-events: none;
  }

  .tooltip.below {
    top: calc(100% + 6px);
  }

  .tooltip.above {
    bottom: calc(100% + 6px);
  }

  .arrow {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
  }

  .tooltip.below .arrow {
    top: -5px;
    border-bottom: 5px solid var(--ink);
  }

  .tooltip.above .arrow {
    bottom: -5px;
    border-top: 5px solid var(--ink);
  }
</style>
