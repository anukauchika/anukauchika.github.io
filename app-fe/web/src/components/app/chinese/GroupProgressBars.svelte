<script lang="ts">
  import ProgressLine from '../../core/ProgressLine.svelte'

  interface Props {
    strokeProgress?: number
    strokeMastery?: number
    strokeSessions?: number
    pinyinProgress?: number
    pinyinMastery?: number
    pinyinSessions?: number
    variant?: 'group' | 'compact'
  }

  let {
    strokeProgress = 0,
    strokeMastery = 0,
    strokeSessions = 0,
    pinyinProgress = 0,
    pinyinMastery = 0,
    pinyinSessions = 0,
    variant = 'group',
  }: Props = $props()

  let tooltip = $state<string | null>(null)

  function show(label: string, e: MouseEvent) {
    e.stopPropagation()
    tooltip = tooltip === label ? null : label
  }

  function close() { tooltip = null }
</script>

<svelte:document onclick={close} />

<div class="bars" class:compact={variant === 'compact'}>
  <div class="bar-wrap">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div onclick={(e) => show('stroke', e)}>
      <ProgressLine fill={strokeProgress} fillStrong={strokeMastery} />
    </div>
    {#if tooltip === 'stroke'}
      <div class="tooltip below">Stroke practice · {strokeSessions} sessions<div class="arrow"></div></div>
    {/if}
  </div>
  <div class="bar-wrap">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div onclick={(e) => show('pinyin', e)}>
      <ProgressLine fill={pinyinProgress} fillStrong={pinyinMastery} />
    </div>
    {#if tooltip === 'pinyin'}
      <div class="tooltip above">Pinyin practice · {pinyinSessions} sessions<div class="arrow"></div></div>
    {/if}
  </div>
</div>

<style>
  .bars {
    display: flex;
    flex-direction: column;
    gap: 5px;
    width: 100%;
    margin-top: -1rem;
  }

  .bars.compact {
    margin-top: 0.25rem;
  }

  .bar-wrap {
    position: relative;
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
