<script lang="ts">
  import AppTitle from '../../components/core/AppTitle.svelte'
  import Island from '../../components/core/Island.svelte'
  import IslandTitle from '../../components/core/IslandTitle.svelte'
  import Stat from '../../components/core/Stat.svelte'
  import ProgressLine from '../../components/core/ProgressLine.svelte'
  import ActivityHeatmap from '../../components/core/ActivityHeatmap.svelte'

  let selectedCell = $state<number | null>(5)
  const demoItems = [
    0,0,8,0,20,10,0,35,18,50,40,12,15,50,48,30,22,5,0,6,16,38,50,25,0,0,0,0
  ].map((count, i) => ({ day: i + 1, count, future: i >= 24 }))
  const demoMax = 50
</script>

<AppTitle parts={['Anuka', 'Data']} />

<Island>
  <IslandTitle level={3}>Stat</IslandTitle>
  <p>Big number with label. Renders as <code>&lt;button&gt;</code> when <code>onclick</code> is provided. Semantic and size modifiers apply.</p>
  <div class="anuka-row anuka-center">
    <Stat value={42} label="Groups" />
    <Stat value={156} label="Words" />
    <Stat value={89} label="Chars" />
    <Stat value={37} label="Practiced" onclick={() => {}} />
  </div>
  <div class="anuka-row anuka-center">
    <Stat class="anuka-main" value={42} label="main" />
    <Stat class="anuka-succ" value={156} label="success" />
    <Stat class="anuka-fail" value={89} label="fail" />
    <Stat class="anuka-warn" value={37} label="warn" />
  </div>
  <div class="anuka-row anuka-center">
    <Stat class="anuka-sm" value={42} label="Small" />
    <Stat value={156} label="Default" />
    <Stat class="anuka-lg" value={89} label="Large" />
  </div>
</Island>

<Island>
  <IslandTitle level={3}>Progress Line</IslandTitle>
  <p>Single fill for progress, overlapping <code>fillStrong</code> for mastery.</p>
  <div class="anuka-stack">
    <ProgressLine fill={70} fillStrong={35} />
    <ProgressLine fill={45} fillStrong={20} />
    <ProgressLine fill={100} fillStrong={100} />
    <ProgressLine fill={30} />
  </div>
</Island>

<Island>
  <IslandTitle level={3}>Activity Heatmap</IslandTitle>
  <p>Maps items to 4 intensity levels via <code>value</code> accessor and <code>range</code>.</p>
  <ActivityHeatmap items={demoItems} range={[0, demoMax]} value={(d) => d.count} />

  <IslandTitle level={3}>Interactive Heatmap</IslandTitle>
  <p>With <code>onselect</code> — cells render as buttons. <code>title</code> accessor shows selection label.</p>
  <ActivityHeatmap
    items={demoItems}
    range={[0, demoMax]}
    value={(d) => d.count}
    title={(d) => `Day ${d.day} · ${d.count} words`}
    selectedIndex={selectedCell}
    onselect={(i) => selectedCell = selectedCell === i ? null : i}
  />

  <IslandTitle level={3}>Muted Cells</IslandTitle>
  <p>Per-item <code>muted</code> accessor dims cells (e.g. future slots).</p>
  <ActivityHeatmap items={demoItems} range={[0, demoMax]} value={(d) => d.count} muted={(d) => d.future} />
</Island>
