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
    <div class="anuka-row"><span class="anuka-mute anuka-sm anuka-grow" style="min-width: 80px;">fill + strong</span><div class="anuka-grow"><ProgressLine fill={70} fillStrong={35} /></div></div>
    <div class="anuka-row"><span class="anuka-mute anuka-sm anuka-grow" style="min-width: 80px;">fill only</span><div class="anuka-grow"><ProgressLine fill={45} /></div></div>
    <div class="anuka-row"><span class="anuka-mute anuka-sm anuka-grow" style="min-width: 80px;">complete</span><div class="anuka-grow"><ProgressLine fill={100} fillStrong={100} /></div></div>
  </div>

  <IslandTitle level={3}>Semantic Modifiers</IslandTitle>
  <div class="anuka-stack">
    <div class="anuka-row"><span class="anuka-mute anuka-sm anuka-grow" style="min-width: 80px;">main</span><div class="anuka-grow"><ProgressLine class="anuka-main" fill={70} fillStrong={35} /></div></div>
    <div class="anuka-row"><span class="anuka-mute anuka-sm anuka-grow" style="min-width: 80px;">success</span><div class="anuka-grow"><ProgressLine class="anuka-succ" fill={80} fillStrong={50} /></div></div>
    <div class="anuka-row"><span class="anuka-mute anuka-sm anuka-grow" style="min-width: 80px;">fail</span><div class="anuka-grow"><ProgressLine class="anuka-fail" fill={45} fillStrong={20} /></div></div>
    <div class="anuka-row"><span class="anuka-mute anuka-sm anuka-grow" style="min-width: 80px;">warn</span><div class="anuka-grow"><ProgressLine class="anuka-warn" fill={55} fillStrong={25} /></div></div>
  </div>

  <IslandTitle level={3}>Sizes</IslandTitle>
  <p>Size modifiers: <code>anuka-sm</code> (2px) / default (6px) / <code>anuka-lg</code> (10px).</p>
  <div class="anuka-stack">
    <div class="anuka-row"><span class="anuka-mute anuka-sm anuka-grow" style="min-width: 80px;">sm</span><div class="anuka-grow"><ProgressLine class="anuka-sm" fill={60} /></div></div>
    <div class="anuka-row"><span class="anuka-mute anuka-sm anuka-grow" style="min-width: 80px;">default</span><div class="anuka-grow"><ProgressLine fill={60} /></div></div>
    <div class="anuka-row"><span class="anuka-mute anuka-sm anuka-grow" style="min-width: 80px;">lg</span><div class="anuka-grow"><ProgressLine class="anuka-lg" fill={60} /></div></div>
  </div>

  <IslandTitle level={3}>With Content</IslandTitle>
  <p>Use <code>top</code> and <code>bottom</code> snippets to place content around the bar.</p>
  <div class="anuka-stack">
    <ProgressLine fill={70} fillStrong={35}>
      {#snippet top()}<div class="anuka-row anuka-justify"><span class="anuka-mute anuka-sm">Progress</span><span class="anuka-sm">70%</span></div>{/snippet}
    </ProgressLine>
    <ProgressLine class="anuka-sm anuka-succ" fill={60}>
      {#snippet bottom()}<span class="anuka-mute anuka-sm">3 / 5 completed</span>{/snippet}
    </ProgressLine>
    <ProgressLine class="anuka-main" fill={45}>
      {#snippet top()}<div class="anuka-row anuka-justify"><span class="anuka-sm">Session</span><span class="anuka-mute anuka-sm">9 / 20</span></div>{/snippet}
    </ProgressLine>
    <ProgressLine class="anuka-sm anuka-warn" fill={80}>
      {#snippet bottom()}<div class="anuka-row anuka-center"><span class="anuka-mute anuka-sm">80% complete</span></div>{/snippet}
    </ProgressLine>
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
