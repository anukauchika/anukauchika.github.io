<script>
  import { datasetStatsStroke, datasetStatsPinyin, datasetGroupSessionsStroke, datasetGroupSessionsPinyin } from './state/practice-stats.js'

  let { group, variant = 'group' } = $props()

  const getProgress = (statsMap) => {
    const practiced = group.items.filter(item =>
      statsMap.has(`${group.group}::${item.id}`)
    ).length
    return group.items.length > 0 ? Math.round((practiced / group.items.length) * 100) : 0
  }

  const getMastery = (sessionsMap) => {
    const gs = sessionsMap.get(group.group)
    const fullSessions = gs?.full ?? 0
    return Math.min(Math.round((fullSessions / 10) * 100), 100)
  }

  const strokeProgress = $derived(getProgress($datasetStatsStroke))
  const strokeMastery = $derived(getMastery($datasetGroupSessionsStroke))
  const pinyinProgress = $derived(getProgress($datasetStatsPinyin))
  const pinyinMastery = $derived(getMastery($datasetGroupSessionsPinyin))
</script>

<div class="bars" class:compact={variant === 'compact'}>
  <div class="bar">
    <div class="fill-words" style="width: {strokeProgress}%"></div>
    <div class="fill-mastery" style="width: {strokeMastery}%"></div>
  </div>
  <div class="bar">
    <div class="fill-words" style="width: {pinyinProgress}%"></div>
    <div class="fill-mastery" style="width: {pinyinMastery}%"></div>
  </div>
</div>

<style>
  .bars {
    display: flex;
    flex-direction: column;
    gap: 0;
    width: 100%;
    margin-top: -1rem;
  }

  .bars.compact {
    margin-top: 0.25rem;
  }

  .bar {
    position: relative;
    width: 100%;
    height: 3px;
    background: rgba(31, 111, 92, 0.1);
    overflow: hidden;
  }

  .bar:first-child {
    border-radius: 2px 2px 0 0;
  }

  .bar:last-child {
    border-radius: 0 0 2px 2px;
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
</style>
