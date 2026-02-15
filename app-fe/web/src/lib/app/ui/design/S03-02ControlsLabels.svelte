<script>
  import Island from '@std/ui/Island.svelte'
  import IslandTitle from '@std/ui/IslandTitle.svelte'
  import Tags from '@std/ui/Tags.svelte'
</script>

<Island>
  <IslandTitle level={3}>Tags</IslandTitle>
  <p>Category labels for content. Auto-spaced when placed after an island title. Semantic modifiers apply.</p>
  <Tags tags={['hsk1', 'beginner', 'greetings', 'food']} />
  <div class="anuka-tags">
    <span class="anuka-tag anuka-main">main</span>
    <span class="anuka-tag anuka-succ">success</span>
    <span class="anuka-tag anuka-fail">fail</span>
    <span class="anuka-tag anuka-warn">warn</span>
    <span class="anuka-tag anuka-mute">mute</span>
  </div>

  <IslandTitle level={3}>Tag Sizes</IslandTitle>
  <p>Size modifiers: <code>anuka-sm</code> / default / <code>anuka-lg</code>.</p>
  <div class="anuka-tags">
    <span class="anuka-tag anuka-sm">small</span>
    <span class="anuka-tag">default</span>
    <span class="anuka-tag anuka-lg">large</span>
  </div>

  <IslandTitle level={3}>Badge</IslandTitle>
  <p>Small muted pill for identifiers and stats. Semantic modifiers apply.</p>
  <div class="anuka-row">
    <span class="anuka-badge">01</span>
    <span class="anuka-badge">hsk1</span>
    <span class="anuka-badge">v2.1</span>
  </div>
  <div class="anuka-row">
    <span class="anuka-badge anuka-main">main</span>
    <span class="anuka-badge anuka-succ">success</span>
    <span class="anuka-badge anuka-fail">fail</span>
    <span class="anuka-badge anuka-warn">warn</span>
    <span class="anuka-badge anuka-mute">mute</span>
  </div>

  <IslandTitle level={3}>Badge Sizes</IslandTitle>
  <p>Size modifiers: <code>anuka-sm</code> / default / <code>anuka-lg</code>.</p>
  <div class="anuka-row">
    <span class="anuka-badge anuka-sm">small</span>
    <span class="anuka-badge">default</span>
    <span class="anuka-badge anuka-lg">large</span>
  </div>

  <IslandTitle level={3}>Avatar</IslandTitle>
  <p>Round image with default 28px size. Size and semantic modifiers apply (semantic adds outline).</p>
  <div class="anuka-row anuka-center">
    <img class="anuka-avatar anuka-sm" src="https://i.pravatar.cc/40?u=sm" alt="Small" />
    <img class="anuka-avatar" src="https://i.pravatar.cc/56?u=md" alt="Default" />
    <img class="anuka-avatar anuka-lg" src="https://i.pravatar.cc/80?u=lg" alt="Large" />
  </div>
  <div class="anuka-row anuka-center">
    <img class="anuka-avatar anuka-main" src="https://i.pravatar.cc/56?u=main" alt="Main" />
    <img class="anuka-avatar anuka-succ" src="https://i.pravatar.cc/56?u=succ" alt="Success" />
    <img class="anuka-avatar anuka-fail" src="https://i.pravatar.cc/56?u=fail" alt="Fail" />
    <img class="anuka-avatar anuka-warn" src="https://i.pravatar.cc/56?u=warn" alt="Warn" />
  </div>

  <IslandTitle level={3}>Divider</IslandTitle>
  <p>Horizontal line with optional text label. Use for visual separation between sections.</p>
  <div class="anuka-divider"><span>or</span></div>
  <div class="anuka-divider"><span>section</span></div>
  <div class="anuka-divider"></div>
</Island>
