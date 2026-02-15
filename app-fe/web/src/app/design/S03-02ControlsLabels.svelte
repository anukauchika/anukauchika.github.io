<script>
  import Island from '../../components/core/Island.svelte'
  import IslandTitle from '../../components/core/IslandTitle.svelte'
  import Tags from '../../components/core/Tags.svelte'
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
</Island>
