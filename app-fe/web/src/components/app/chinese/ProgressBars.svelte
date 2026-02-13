<script lang="ts">
  import ProgressLine from '../../core/ProgressLine.svelte'

  interface Props {
    strokeProgress?: number
    strokeMastery?: number
    pinyinProgress?: number
    pinyinMastery?: number
    strokeFullSessions?: number
    pinyinFullSessions?: number
  }

  let {
    strokeProgress = 0,
    strokeMastery = 0,
    pinyinProgress = 0,
    pinyinMastery = 0,
    strokeFullSessions = 0,
    pinyinFullSessions = 0,
  }: Props = $props()

  let tooltip = $state<string | null>(null)

  function show(label: string, e: MouseEvent) {
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
    <div onclick={(e) => show('stroke', e)}>
      <ProgressLine fill={strokeProgress} fillStrong={strokeMastery} />
    </div>
    {#if tooltip === 'stroke'}
      <div class="tooltip below">Stroke practice · {strokeFullSessions} sessions<div class="arrow"></div></div>
    {/if}
  </div>
  <div class="bar-wrap">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div onclick={(e) => show('pinyin', e)}>
      <ProgressLine fill={pinyinProgress} fillStrong={pinyinMastery} />
    </div>
    {#if tooltip === 'pinyin'}
      <div class="tooltip above">Pinyin practice · {pinyinFullSessions} sessions<div class="arrow"></div></div>
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

  .tooltip {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    background: var(--anuka-color-text);
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
    border-bottom: 5px solid var(--anuka-color-text);
  }

  .tooltip.above .arrow {
    bottom: -5px;
    border-top: 5px solid var(--anuka-color-text);
  }
</style>
