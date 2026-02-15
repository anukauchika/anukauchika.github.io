<script>
  import Island from '../../components/core/Island.svelte'
  import IslandTitle from '../../components/core/IslandTitle.svelte'
  import Btn from '../../components/core/Btn.svelte'
  import BtnLink from '../../components/core/BtnLink.svelte'
  import BtnIcon from '../../components/core/BtnIcon.svelte'
  import Quick from '../../components/core/Quick.svelte'
</script>

<Island>
  <IslandTitle level={3}>Buttons</IslandTitle>
  <p>Outline by default. Add <code>main</code> for filled primary. Use <code>BtnLink</code> for inline links.</p>
  <div class="anuka-row">
    <Btn>Outline</Btn>
    <Btn main>Primary</Btn>
    <BtnLink>Link</BtnLink>
  </div>

  <IslandTitle level={3}>Semantic Modifiers</IslandTitle>
  <p>
    Semantic modifiers apply to any element including buttons: <code>anuka-main</code>, <code>anuka-succ</code>,
    <code>anuka-fail</code>, <code>anuka-warn</code>, <code>anuka-mute</code>.
  </p>
  <div class="anuka-row">
    <Btn main>main</Btn>
    <Btn><span class="anuka-succ">success</span></Btn>
    <Btn><span class="anuka-fail">fail</span></Btn>
    <Btn><span class="anuka-warn">warn</span></Btn>
    <Btn><span class="anuka-mute">mute</span></Btn>
  </div>

  <IslandTitle level={3}>Button Sizes</IslandTitle>
  <p>Size modifiers: <code>anuka-sm</code> / default / <code>anuka-lg</code>.</p>
  <div class="anuka-row">
    <Btn class="anuka-sm">Small</Btn>
    <Btn>Default</Btn>
    <Btn class="anuka-lg">Large</Btn>
  </div>
  <div class="anuka-row">
    <Btn class="anuka-sm" main>Small</Btn>
    <Btn main>Default</Btn>
    <Btn class="anuka-lg" main>Large</Btn>
  </div>

  <IslandTitle level={3}>Icon Buttons</IslandTitle>
  <p>Compact icon-only actions via <code>BtnIcon</code>. Tooltip via <code>label</code>.</p>
  <div class="anuka-row">
    <BtnIcon label="Stroke" icon="stroke" />
    <BtnIcon label="Pinyin" icon="pinyin" />
    <BtnIcon label="Workbook" icon="book" />
    <BtnIcon label="Print" icon="print" />
    <BtnIcon label="Menu" icon="dots" />
    <BtnIcon label="Close" icon="close" />
    <BtnIcon label="Theme" icon="moon" />
  </div>

  <IslandTitle level={3}>Icon Button Sizes</IslandTitle>
  <p>Size modifiers on icon buttons.</p>
  <div class="anuka-row">
    <BtnIcon class="anuka-sm" label="Small" icon="stroke" />
    <BtnIcon label="Default" icon="stroke" />
    <BtnIcon class="anuka-lg" label="Large" icon="stroke" />
  </div>

  <IslandTitle level={3}>Quick Action</IslandTitle>
  <p>Island-level action button, anchored to the top-right corner of an island.</p>
  <Quick label="Quick action" icon="dots" />
</Island>
