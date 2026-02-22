<script>
  import Island from '@std/ui/island.svelte'
  import IslandTitle from '@std/ui/island-title.svelte'
</script>

<Island>
  <IslandTitle level={3}>Icons</IslandTitle>
  <p>Mask-based icons that inherit <code>currentColor</code>. Default 20×20px.</p>
  <div class="anuka-row anuka-center">
    <div class="anuka-stack anuka-center anuka-compact">
      <span class="anuka-icon anuka-icon-close"></span>
      <span class="anuka-mute anuka-sm">close</span>
    </div>
    <div class="anuka-stack anuka-center anuka-compact">
      <span class="anuka-icon anuka-icon-dots"></span>
      <span class="anuka-mute anuka-sm">dots</span>
    </div>
    <div class="anuka-stack anuka-center anuka-compact">
      <span class="anuka-icon anuka-icon-speaker"></span>
      <span class="anuka-mute anuka-sm">speaker</span>
    </div>
    <div class="anuka-stack anuka-center anuka-compact">
      <span class="anuka-icon anuka-icon-user"></span>
      <span class="anuka-mute anuka-sm">user</span>
    </div>
    <div class="anuka-stack anuka-center anuka-compact">
      <span class="anuka-icon anuka-icon-moon"></span>
      <span class="anuka-mute anuka-sm">moon</span>
    </div>
    <div class="anuka-stack anuka-center anuka-compact">
      <span class="anuka-icon anuka-icon-share"></span>
      <span class="anuka-mute anuka-sm">share</span>
    </div>
    <div class="anuka-stack anuka-center anuka-compact">
      <span class="anuka-icon anuka-icon-github"></span>
      <span class="anuka-mute anuka-sm">github</span>
    </div>
  </div>
  <div class="anuka-row anuka-center">
    <div class="anuka-stack anuka-center anuka-compact">
      <span class="anuka-icon anuka-icon-stroke"></span>
      <span class="anuka-mute anuka-sm">stroke</span>
    </div>
    <div class="anuka-stack anuka-center anuka-compact">
      <span class="anuka-icon anuka-icon-pinyin"></span>
      <span class="anuka-mute anuka-sm">pinyin</span>
    </div>
    <div class="anuka-stack anuka-center anuka-compact">
      <span class="anuka-icon anuka-icon-book"></span>
      <span class="anuka-mute anuka-sm">book</span>
    </div>
    <div class="anuka-stack anuka-center anuka-compact">
      <span class="anuka-icon anuka-icon-print"></span>
      <span class="anuka-mute anuka-sm">print</span>
    </div>
    <div class="anuka-stack anuka-center anuka-compact">
      <span class="anuka-icon anuka-icon-grid"></span>
      <span class="anuka-mute anuka-sm">grid</span>
    </div>
    <div class="anuka-stack anuka-center anuka-compact">
      <span class="anuka-icon anuka-icon-list"></span>
      <span class="anuka-mute anuka-sm">list</span>
    </div>
  </div>

  <IslandTitle level={3}>Semantic Colors</IslandTitle>
  <p>Icons inherit color from their context via <code>currentColor</code>.</p>
  <div class="anuka-row anuka-center">
    <span class="anuka-icon anuka-icon-speaker"></span>
    <span class="anuka-icon anuka-icon-speaker anuka-main"></span>
    <span class="anuka-icon anuka-icon-speaker anuka-succ"></span>
    <span class="anuka-icon anuka-icon-speaker anuka-fail"></span>
    <span class="anuka-icon anuka-icon-speaker anuka-warn"></span>
    <span class="anuka-icon anuka-icon-speaker anuka-mute"></span>
  </div>
</Island>

<Island>
  <IslandTitle level={3}>Text Utilities</IslandTitle>
  <p>Specialized text modifiers for fonts and visibility.</p>
  <div class="anuka-row anuka-center">
    <span class="anuka-hanzi anuka-lg" lang="zh">你好</span>
    <span class="anuka-mute">anuka-hanzi — handwritten Chinese font</span>
  </div>
  <div class="anuka-row anuka-center">
    <span>visible</span>
    <span class="anuka-hidden">hidden</span>
    <span>visible</span>
    <span class="anuka-mute">anuka-hidden — keeps space, hides content</span>
  </div>
</Island>
