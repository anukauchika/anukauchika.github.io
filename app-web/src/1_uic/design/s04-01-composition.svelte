<script>
  import AppTitle from '@std/ui/app-title.svelte'
  import Island from '@std/ui/island.svelte'
  import IslandTitle from '@std/ui/island-title.svelte'
  import ProgressLine from '@std/ui/progress-line.svelte'
</script>

<AppTitle parts={['Anuka', 'Composition']} />

<Island>
  <IslandTitle level={3}>Frame + Progress Line</IslandTitle>
  <p>A progress line inside a frame auto-attaches to the bottom edge. Semantic and size modifiers apply.</p>
  <div class="anuka-row">
    <div class="anuka-stack anuka-compact anuka-center">
      <div class="anuka-frame anuka-sm">
        <span class="anuka-mute anuka-sm">content</span>
        <ProgressLine fill={60} />
      </div>
      <span class="anuka-mute anuka-sm">default</span>
    </div>
    <div class="anuka-stack anuka-compact anuka-center">
      <div class="anuka-frame anuka-sm">
        <span class="anuka-mute anuka-sm">content</span>
        <ProgressLine class="anuka-sm anuka-main" fill={45} />
      </div>
      <span class="anuka-mute anuka-sm">main · sm</span>
    </div>
    <div class="anuka-stack anuka-compact anuka-center">
      <div class="anuka-frame anuka-sm">
        <span class="anuka-mute anuka-sm">content</span>
        <ProgressLine class="anuka-sm anuka-succ" fill={80} />
      </div>
      <span class="anuka-mute anuka-sm">success · sm</span>
    </div>
    <div class="anuka-stack anuka-compact anuka-center">
      <div class="anuka-frame anuka-sm">
        <span class="anuka-mute anuka-sm">content</span>
        <ProgressLine class="anuka-sm anuka-fail" fill={30} />
      </div>
      <span class="anuka-mute anuka-sm">fail · sm</span>
    </div>
  </div>
  <div class="anuka-row">
    <div class="anuka-stack anuka-compact anuka-center">
      <div class="anuka-frame anuka-sm">
        <span class="anuka-mute anuka-sm">content</span>
        <ProgressLine class="anuka-sm" fill={50} />
      </div>
      <span class="anuka-mute anuka-sm">sm</span>
    </div>
    <div class="anuka-stack anuka-compact anuka-center">
      <div class="anuka-frame anuka-sm">
        <span class="anuka-mute anuka-sm">content</span>
        <ProgressLine fill={50} />
      </div>
      <span class="anuka-mute anuka-sm">default</span>
    </div>
    <div class="anuka-stack anuka-compact anuka-center">
      <div class="anuka-frame anuka-sm">
        <span class="anuka-mute anuka-sm">content</span>
        <ProgressLine class="anuka-lg" fill={50} />
      </div>
      <span class="anuka-mute anuka-sm">lg</span>
    </div>
  </div>

  <IslandTitle level={3}>With Labels</IslandTitle>
  <p>Progress line <code>top</code> and <code>bottom</code> snippets work inside frames too.</p>
  <div class="anuka-row">
    <div class="anuka-frame anuka-sm">
      <span class="anuka-mute anuka-sm">sm</span>
      <ProgressLine class="anuka-sm" fill={70}>
        {#snippet top()}<div class="anuka-row anuka-center"><span class="anuka-mute anuka-sm">Next</span></div>{/snippet}
      </ProgressLine>
    </div>
    <div class="anuka-frame">
      <span class="anuka-mute anuka-sm">default</span>
      <ProgressLine class="anuka-sm anuka-succ" fill={60}>
        {#snippet top()}<div class="anuka-row anuka-center"><span class="anuka-mute anuka-sm">3 / 5</span></div>{/snippet}
        {#snippet bottom()}<div class="anuka-row anuka-center"><span class="anuka-mute anuka-sm">Session</span></div>{/snippet}
      </ProgressLine>
    </div>
    <div class="anuka-frame anuka-lg">
      <span class="anuka-mute anuka-sm">lg</span>
      <ProgressLine class="anuka-sm anuka-main" fill={45}>
        {#snippet bottom()}<div class="anuka-row anuka-center"><span class="anuka-mute anuka-sm">45%</span></div>{/snippet}
      </ProgressLine>
    </div>
  </div>
</Island>

<Island>
  <IslandTitle level={3}>Attach + Progress Line</IslandTitle>
  <p>Lightweight positioning context. Progress line overlays the bottom of any content without layout shift.</p>
  <div class="anuka-row">
    <div class="anuka-stack anuka-compact anuka-center anuka-grow">
      <div class="anuka-attach">
        <input class="anuka-input anuka-grow" type="text" disabled placeholder="Idle input" />
      </div>
      <span class="anuka-mute anuka-sm">no progress</span>
    </div>
    <div class="anuka-stack anuka-compact anuka-center anuka-grow">
      <div class="anuka-attach">
        <input class="anuka-input anuka-grow" type="text" disabled placeholder="Loading..." />
        <ProgressLine class="anuka-sm" fill={65} />
      </div>
      <span class="anuka-mute anuka-sm">with progress</span>
    </div>
    <div class="anuka-stack anuka-compact anuka-center anuka-grow">
      <div class="anuka-attach">
        <input class="anuka-input anuka-grow" type="text" disabled placeholder="Almost done..." />
        <ProgressLine class="anuka-sm anuka-main" fill={90} />
      </div>
      <span class="anuka-mute anuka-sm">main</span>
    </div>
  </div>
</Island>

<Island>
  <IslandTitle level={3}>Tile + Progress Line</IslandTitle>
  <p>Progress lines flush to the bottom edge of tiles. Best with <code>anuka-sm</code> size.</p>
  <div class="anuka-row">
    <div class="anuka-stack anuka-compact anuka-center">
      <span class="anuka-tile"><span>好</span><ProgressLine class="anuka-sm" fill={80} /></span>
      <span class="anuka-mute anuka-sm">default</span>
    </div>
    <div class="anuka-stack anuka-compact anuka-center">
      <span class="anuka-tile"><span>学</span><ProgressLine class="anuka-sm anuka-main" fill={60} /></span>
      <span class="anuka-mute anuka-sm">main</span>
    </div>
    <div class="anuka-stack anuka-compact anuka-center">
      <span class="anuka-tile"><span>习</span><ProgressLine class="anuka-sm anuka-succ" fill={100} /></span>
      <span class="anuka-mute anuka-sm">success</span>
    </div>
    <div class="anuka-stack anuka-compact anuka-center">
      <span class="anuka-tile"><span>中</span><ProgressLine class="anuka-sm anuka-fail" fill={30} /></span>
      <span class="anuka-mute anuka-sm">fail</span>
    </div>
    <div class="anuka-stack anuka-compact anuka-center">
      <span class="anuka-tile"><span>文</span><ProgressLine class="anuka-sm anuka-warn" fill={50} /></span>
      <span class="anuka-mute anuka-sm">warn</span>
    </div>
  </div>
  <div class="anuka-row">
    <div class="anuka-stack anuka-compact anuka-center">
      <span class="anuka-tile anuka-sm"><span>小</span><ProgressLine class="anuka-sm" fill={70} /></span>
      <span class="anuka-mute anuka-sm">sm</span>
    </div>
    <div class="anuka-stack anuka-compact anuka-center">
      <span class="anuka-tile"><span>大</span><ProgressLine class="anuka-sm" fill={70} /></span>
      <span class="anuka-mute anuka-sm">default</span>
    </div>
    <div class="anuka-stack anuka-compact anuka-center">
      <span class="anuka-tile anuka-lg"><span>美</span><ProgressLine class="anuka-sm" fill={70} /></span>
      <span class="anuka-mute anuka-sm">lg</span>
    </div>
  </div>
</Island>
