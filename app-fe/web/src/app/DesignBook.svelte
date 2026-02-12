<script lang="ts">
  import Island from '../components/core/Island.svelte'
  import AppTitle from '../components/core/AppTitle.svelte'
  import IslandTitle from '../components/core/IslandTitle.svelte'
  import ProgressLine from '../components/core/ProgressLine.svelte'
  import Quick from '../components/core/Quick.svelte'
  import Tags from '../components/core/Tags.svelte'
  import Card from '../components/core/Card.svelte'
  import ActivityHeatmap from '../components/core/ActivityHeatmap.svelte'
  import Btn from '../components/core/Btn.svelte'
  import Input from '../components/core/Input.svelte'

  function toggleTheme() {
    const current = document.documentElement.dataset.theme
      ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    document.documentElement.dataset.theme = current === 'dark' ? 'light' : 'dark'
  }
</script>

<div class="anuka-page">

  <Island sticky>
    <AppTitle parts={['Anuka Uchika', 'Design Book']} />
    <Quick label="Toggle theme" icon="moon" onclick={toggleTheme} />
  </Island>

  <Island>
    <IslandTitle level={1}>Design Book</IslandTitle>
    <p>Visual reference for all design tokens and UI elements used in Anuka Uchika. Every component on this page is built from the same reusable classes it documents. Absolute minimum CSS — only what the app actually uses.</p>
  </Island>

  <!-- Structure: Islands -->

  <AppTitle parts={['Anuka', 'Structure', 'Islands']} />

  <Island>
    Minimal island — just text content, no title, no extras. The basic content container for everything.
  </Island>

  <Island>
    <AppTitle parts={['App Title', 'Inside Island']} />
    App title works both standalone between islands (as section headers above) and inside islands. Multiple <code>&lt;span&gt;</code> children are auto-separated with a dot.
  </Island>

  <Island>
    <IslandTitle>HSK 1 Vocabulary</IslandTitle>
    <Quick label="Quick action" icon="dots" />
    <Tags tags={['hsk1', 'beginner', 'greetings']} />
    <p>Island title — content heading for islands. Size follows the HTML tag: h1 is largest, h4 is smallest. Supports multiple <code>&lt;span&gt;</code> children with auto dot delimiter, same as app title.</p>
    <p>Quick button — action button for islands. Shown here with a dots icon.</p>
    <p>Tags — category labels for content. Spacing adjusts automatically when placed after an island title.</p>
  </Island>

  <!-- Structure: Grid -->

  <AppTitle parts={['Anuka', 'Structure', 'Grid']} />

  <Island>
    <IslandTitle>Small Grid</IslandTitle>
    <p>Dense grid for compact items like character tiles.</p>
    <div class="anuka-grid-sm">
      {#each Array(16) as _}<Card>&nbsp;</Card>{/each}
    </div>
  </Island>

  <Island>
    <IslandTitle>Medium Grid</IslandTitle>
    <p>Standard grid for word cards and similar content.</p>
    <div class="anuka-grid-md">
      {#each Array(16) as _}<Card>&nbsp;</Card>{/each}
    </div>
  </Island>

  <Island>
    <IslandTitle>Large Grid</IslandTitle>
    <p>Wide grid for side-by-side content blocks.</p>
    <div class="anuka-grid-lg">
      {#each Array(16) as _}<Card>&nbsp;</Card>{/each}
    </div>
  </Island>

  <!-- Structure: Stack -->

  <AppTitle parts={['Anuka', 'Structure', 'Stack']} />

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
  </Island>

  <!-- Structure: Progress -->

  <AppTitle parts={['Anuka', 'Structure', 'Progress']} />

  <Island>
    <IslandTitle level={3}>Progress Line</IslandTitle>
    <p>Track with one or two overlapping fills. Strong fill shows mastery, regular fill shows progress.</p>
    <div class="anuka-stack">
      <ProgressLine fill={70} fillStrong={35} />
      <ProgressLine fill={45} fillStrong={20} />
      <ProgressLine fill={100} fillStrong={100} />
    </div>

    <IslandTitle level={3}>Progress inside cards</IslandTitle>
    <div class="anuka-grid-md">
      <Card>
        <div class="anuka-stack">
          <div>Title</div>
          <div>Subtitle</div>
          <ProgressLine fill={60} />
        </div>
      </Card>
      <Card>
        <div class="anuka-stack">
          <div>Title</div>
          <div>Subtitle</div>
          <ProgressLine fill={90} fillStrong={45} />
        </div>
      </Card>
      <Card>
        <div class="anuka-stack">
          <div class="anuka-row anuka-justify">
            <div>Label</div>
            <div>Value</div>
          </div>
          <ProgressLine fill={75} fillStrong={40} />
        </div>
      </Card>
      <Card>
        <div class="anuka-stack">
          <div class="anuka-row anuka-justify">
            <div>Label</div>
            <div>Value</div>
          </div>
          <ProgressLine fill={30} />
        </div>
      </Card>
    </div>
  </Island>

  <!-- Structure: Heatmap -->

  <AppTitle parts={['Anuka', 'Structure', 'Heatmap']} />

  <Island>
    <IslandTitle level={3}>Activity Heatmap</IslandTitle>
    <p>Row of intensity cells showing activity over time. Each cell uses a <code>data-level</code> attribute (0–4) to indicate intensity.</p>
    <ActivityHeatmap levels={[0,0,1,0,2,1,0,3,2,4,3,1,2,4,4,3,2,1,0,1,2,3,4,2,1,0,0,1]} />

    <IslandTitle level={3}>Heatmap inside card</IslandTitle>
    <div class="anuka-grid-md">
      <Card>
        <div class="anuka-stack">
          <div class="anuka-row anuka-justify">
            <div>Last 14 days</div>
            <div>8 active</div>
          </div>
          <ActivityHeatmap levels={[0,1,2,0,3,4,2,0,1,0,2,3,0,1]} />
        </div>
      </Card>
    </div>
  </Island>

  <!-- Controls -->

  <AppTitle parts={['Anuka', 'Controls']} />

  <Island>
    <IslandTitle level={3}>Buttons</IslandTitle>
    <p>Primary is the filled default for main actions. Outline for secondary actions. Ghost for inline text links. Toggle for switchable options (with <code>.active</code> class). Icon for compact icon-only actions.</p>
    <div class="anuka-stack">
      <div class="anuka-row">
        <Btn>Practice</Btn>
        <Btn variant="outline">Groups</Btn>
        <Btn variant="ghost">Show all</Btn>
      </div>
      <div class="anuka-row">
        <Btn variant="toggle" active>Pinyin</Btn>
        <Btn variant="toggle">Hint</Btn>
        <Btn variant="toggle">English</Btn>
      </div>
      <div class="anuka-row">
        <Btn variant="icon" label="Menu" icon="dots" />
        <Btn variant="icon" label="Close" icon="close" />
        <Btn variant="icon" label="Theme" icon="moon" />
      </div>
    </div>

    <IslandTitle level={3}>Input</IslandTitle>
    <p>Standard text field with focus ring. Composes with buttons in rows using grow.</p>
    <div class="anuka-stack">
      <Input placeholder="Search words, pinyin, tags..." />
      <div class="anuka-row">
        <Input type="email" placeholder="Email" class="anuka-grow" />
        <Btn>Send</Btn>
      </div>
    </div>

    <IslandTitle level={3}>Controls in context</IslandTitle>
    <div class="anuka-grid-md">
      <Card>
        <div class="anuka-stack">
          <div>HSK 1 · Greetings</div>
          <ProgressLine fill={60} />
          <div class="anuka-row anuka-center">
            <Btn>Practice</Btn>
          </div>
        </div>
      </Card>
      <Card>
        <div class="anuka-stack">
          <div>Session Complete</div>
          <div class="anuka-row anuka-center">
            <Btn>Restart</Btn>
            <Btn variant="outline">Groups</Btn>
          </div>
        </div>
      </Card>
    </div>
  </Island>

</div>
