<script>
  import AppTitle from '@std/ui/app-title.svelte'
  import Island from '@std/ui/island.svelte'
  import IslandTitle from '@std/ui/island-title.svelte'
  import Card from '@std/ui/card.svelte'
  import Btn from '@std/ui/btn.svelte'
</script>

<AppTitle parts={['Anuka', 'Layout']} />

<Island>
  <IslandTitle>Size Modifiers</IslandTitle>
  <p>Apply to any inline element. <code>anuka-sm</code> and <code>anuka-lg</code> reset direct children to 1rem.</p>
  <div class="anuka-stack anuka-compact">
    <span class="anuka-sm">anuka-sm — 0.75rem. For secondary labels and hints.</span>
    <span>Default — 1rem. Body text.</span>
    <span class="anuka-md">anuka-md — 1.25rem. For island-level descriptions.</span>
    <span class="anuka-lg">anuka-lg</span>
  </div>
</Island>

<Island>
  <IslandTitle>Small Grid</IslandTitle>
  <p>Dense grid for compact items like character tiles.</p>
  <div class="anuka-grid anuka-sm">
    {#each Array(16) as _}<Card>&nbsp;</Card>{/each}
  </div>
</Island>

<Island>
  <IslandTitle>Medium Grid</IslandTitle>
  <p>Standard grid for word cards and similar content.</p>
  <div class="anuka-grid">
    {#each Array(16) as _}<Card>&nbsp;</Card>{/each}
  </div>
</Island>

<Island>
  <IslandTitle>Large Grid</IslandTitle>
  <p>Wide grid for side-by-side content blocks.</p>
  <div class="anuka-grid anuka-lg">
    {#each Array(16) as _}<Card>&nbsp;</Card>{/each}
  </div>
</Island>

<Island>
  <IslandTitle level={3} parts={['Stack', 'Row', 'Grow', 'Alignment']} />
  <p>Stack arranges items vertically. Row arranges items horizontally. Combine them for any form or layout.</p>
  <div class="anuka-stack">
    <div class="anuka-row">
      <Card><div class="anuka-grow">grow</div></Card>
      <Card>fixed</Card>
    </div>
    <div class="anuka-row anuka-left">
      <Card>&nbsp;</Card><Card>&nbsp;</Card><Card>left</Card><Card>&nbsp;</Card><Card>&nbsp;</Card>
    </div>
    <div class="anuka-row anuka-center">
      <Card>&nbsp;</Card><Card>&nbsp;</Card><Card>center</Card><Card>&nbsp;</Card><Card>&nbsp;</Card>
    </div>
    <div class="anuka-row anuka-right">
      <Card>&nbsp;</Card><Card>&nbsp;</Card><Card>right</Card><Card>&nbsp;</Card><Card>&nbsp;</Card>
    </div>
    <div class="anuka-row anuka-justify">
      <Card>&nbsp;</Card><Card>&nbsp;</Card><Card>justify</Card><Card>&nbsp;</Card><Card>&nbsp;</Card>
    </div>
  </div>

  <IslandTitle level={3}>Center on stack</IslandTitle>
  <p>Add <code>anuka-center</code> to a stack to center items horizontally. On rows it centers the main axis (already shown above).</p>
  <Card>
    <div class="anuka-stack anuka-center">
      <Card>Centered card</Card>
      <Btn>Centered button</Btn>
    </div>
  </Card>

  <IslandTitle level={3}>Compact modifier</IslandTitle>
  <p>Add <code>anuka-compact</code> to any stack or row to tighten spacing. Useful for dense lists and compact cards.</p>
  <div class="anuka-stack anuka-compact">
    <div class="anuka-row anuka-justify">
      <Card>Row 1</Card><Card>Value</Card>
    </div>
    <div class="anuka-row anuka-justify">
      <Card>Row 2</Card><Card>Value</Card>
    </div>
    <div class="anuka-row anuka-justify">
      <Card>Row 3</Card><Card>Value</Card>
    </div>
  </div>
</Island>
