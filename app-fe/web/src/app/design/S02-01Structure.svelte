<script>
  import AppTitle from '../../components/core/AppTitle.svelte'
  import Island from '../../components/core/Island.svelte'
  import IslandTitle from '../../components/core/IslandTitle.svelte'
  import Card from '../../components/core/Card.svelte'
  import ProgressLine from '../../components/core/ProgressLine.svelte'
  import Quick from '../../components/core/Quick.svelte'
  import Btn from '../../components/core/Btn.svelte'
  import Modal from '../../components/core/Modal.svelte'

  let showModal = $state(false)
</script>

<AppTitle parts={['Anuka', 'Structure']} />

<Island>
  Minimal island — just text content, no title, no extras. The basic content container for everything.
</Island>

<Island>
  <AppTitle parts={['App Title', 'Inside Island']} />
  App title works both standalone between islands (as section headers above) and inside islands. Multiple <code>&lt;span&gt;</code> children are auto-separated with a dot.
</Island>

<Island>
  <IslandTitle>Island Title</IslandTitle>
  <p>Content heading for islands. Size follows the HTML tag: h1 is largest, h4 is smallest. Supports multiple <code>&lt;span&gt;</code> children with auto dot delimiter, same as app title.</p>
</Island>

<Island>
  <IslandTitle level={3}>Static Card</IslandTitle>
  <p>Content block with surface background and rounded corners. Use for grouping related content.</p>
  <div class="anuka-grid">
    <Card>
      <div class="anuka-stack anuka-compact">
        <div>Title</div>
        <div>Subtitle</div>
        <div>Detail text</div>
      </div>
    </Card>
    <Card>
      <div class="anuka-stack anuka-compact">
        <div>Card with progress</div>
        <ProgressLine fill={60} />
      </div>
    </Card>
  </div>

  <IslandTitle level={3}>Clickable Card</IslandTitle>
  <p>When <code>anuka-card</code> is on a <code>&lt;button&gt;</code>, it becomes interactive: cursor, hover lift, focus ring. No extra classes needed.</p>
  <div class="anuka-grid">
    <button class="anuka-card" type="button">
      <div class="anuka-stack anuka-compact">
        <div class="anuka-row anuka-justify">
          <span>Title</span>
          <span>Label</span>
        </div>
        <div>Subtitle</div>
        <div>Detail text</div>
      </div>
    </button>
    <button class="anuka-card" type="button">
      <div class="anuka-stack anuka-compact">
        <div>Another card</div>
        <ProgressLine fill={60} />
      </div>
    </button>
  </div>
</Island>

<Island>
  <IslandTitle level={3}>Frame</IslandTitle>
  <p>Bordered container for images, canvases, and media. Centers content, supports overlays via <code>position: relative</code>. Add <code>data-no-touch</code> for drawing surfaces.</p>
  <div class="anuka-row anuka-center">
    <div class="anuka-frame anuka-sm">SM</div>
    <div class="anuka-frame">Default</div>
    <div class="anuka-frame anuka-lg">LG</div>
  </div>
  <div class="anuka-row anuka-center">
    <div class="anuka-frame anuka-sm anuka-main">main</div>
    <div class="anuka-frame anuka-sm anuka-succ">succ</div>
    <div class="anuka-frame anuka-sm anuka-fail">fail</div>
    <div class="anuka-frame anuka-sm anuka-warn">warn</div>
    <div class="anuka-frame anuka-sm anuka-mute">mute</div>
  </div>
</Island>

<Island>
  <IslandTitle level={3}>Tile</IslandTitle>
  <p>Compact square cell for labels, characters, and icons. Centers content automatically.</p>
  <div class="anuka-row anuka-center">
    <span class="anuka-tile anuka-sm">SM</span>
    <span class="anuka-tile">Def</span>
    <span class="anuka-tile anuka-lg">LG</span>
  </div>
  <div class="anuka-row anuka-center">
    <span class="anuka-tile anuka-main">main</span>
    <span class="anuka-tile anuka-succ">succ</span>
    <span class="anuka-tile anuka-fail">fail</span>
    <span class="anuka-tile anuka-warn">warn</span>
    <span class="anuka-tile anuka-mute">mute</span>
  </div>
</Island>

<Island>
  <IslandTitle level={3}>Modal</IslandTitle>
  <p>Full-screen backdrop with centered content. Click overlay or close button to dismiss. Content is auto-elevated above the overlay via <code>z-index</code>.</p>
  <div class="anuka-row">
    <Btn main onclick={() => showModal = true}>Open Modal</Btn>
  </div>
</Island>

{#if showModal}
  <Modal onclose={() => showModal = false}>
    <Island>
      <Quick label="Close" icon="close" onclick={() => showModal = false} />
      <IslandTitle level={3}>Modal Content</IslandTitle>
      <p>This is a modal using the core Modal component. Click the overlay or the close button to dismiss.</p>
    </Island>
  </Modal>
{/if}
