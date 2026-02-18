<script>
  import Island from '@std/ui/island.svelte'
  import AppTitle from '@std/ui/app-title.svelte'
  import IslandTitle from '@std/ui/island-title.svelte'
  import Quick from '@std/ui/quick.svelte'

  import S0101Layout from '@uic/design/s01-01-layout.svelte'
  import S0201Structure from '@uic/design/s02-01-structure.svelte'
  import S0301ControlsButtons from '@uic/design/s03-01-controls-buttons.svelte'
  import S0302ControlsLabels from '@uic/design/s03-02-controls-labels.svelte'
  import S0303ControlsInputs from '@uic/design/s03-03-controls-inputs.svelte'
  import S0304ControlsData from '@uic/design/s03-04-controls-data.svelte'
  import S0305ControlsIcons from '@uic/design/s03-05-controls-icons.svelte'
  import S0401Composition from '@uic/design/s04-01-composition.svelte'

  function toggleTheme() {
    const current = document.documentElement.dataset.theme
      ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    document.documentElement.dataset.theme = current === 'dark' ? 'light' : 'dark'
  }
</script>

<svelte:head>
  <title>Design Book - Anuka Uchika</title>
</svelte:head>

<div class="anuka-page">
  <Island sticky>
    <AppTitle parts={['Anuka Uchika', 'Design Book']} />
    <Quick label="Toggle theme" icon="moon" onclick={toggleTheme} />
  </Island>

  <Island>
    <IslandTitle level={1}>Design Book</IslandTitle>
    <p>Visual reference for all design tokens and UI elements used in Anuka Uchika. Every component on this page is built from the same reusable classes it documents. Absolute minimum CSS — only what the app actually uses.</p>
    <p><strong>Principles:</strong> All core components support semantic modifiers (<code>anuka-main</code>, <code>anuka-succ</code>, <code>anuka-fail</code>, <code>anuka-warn</code>, <code>anuka-mute</code>) and size modifiers (<code>anuka-sm</code>, <code>anuka-lg</code>). This ensures consistent theming and sizing across the entire UI without custom CSS.</p>
  </Island>

  <S0101Layout />
  <S0201Structure />

  <AppTitle parts={['Anuka', 'Controls']} />
  <S0301ControlsButtons />
  <S0302ControlsLabels />
  <S0303ControlsInputs />
  <S0304ControlsData />
  <S0305ControlsIcons />

  <S0401Composition />
</div>
