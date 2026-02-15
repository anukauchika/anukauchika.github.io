<script>
  import Island from '../../components/core/Island.svelte'
  import AppTitle from '../../components/core/AppTitle.svelte'
  import IslandTitle from '../../components/core/IslandTitle.svelte'
  import Quick from '../../components/core/Quick.svelte'

  import S0101Layout from './S01-01Layout.svelte'
  import S0201Structure from './S02-01Structure.svelte'
  import S0301ControlsButtons from './S03-01ControlsButtons.svelte'
  import S0302ControlsLabels from './S03-02ControlsLabels.svelte'
  import S0303ControlsInputs from './S03-03ControlsInputs.svelte'
  import S0304ControlsData from './S03-04ControlsData.svelte'
  import S0305ControlsIcons from './S03-05ControlsIcons.svelte'
  import S0401Composition from './S04-01Composition.svelte'

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
