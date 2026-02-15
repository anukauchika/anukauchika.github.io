<script>
  import { currentDataset } from '../../../state/registry.js'
  import { mainSearch, mainTags, mainGroups, mainListViewStyle } from '../../../state/filters.js'
  import { formatGroup } from '../../../utils/format.js'
  import BtnIcon from '../../core/BtnIcon.svelte'
  import Autocomplete from '../../core/Autocomplete.svelte'

  const toggleView = () => {
    $mainListViewStyle = $mainListViewStyle === 'full' ? 'compact' : 'full'
  }

  const viewIcon = $derived($mainListViewStyle === 'full' ? 'grid' : 'list')

  const toggleTheme = () => {
    const current = document.documentElement.dataset.theme
      ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    document.documentElement.dataset.theme = current === 'dark' ? 'light' : 'dark'
  }

  const groups = $derived.by(() => $currentDataset?.data?.groups ?? [])

  const allTags = $derived.by(() => {
    const tagSet = new Set()
    groups.forEach((g) => {
      g.tags?.forEach((t) => tagSet.add(t))
      g.items?.forEach((item) => item.tags?.forEach((t) => tagSet.add(t)))
    })
    return Array.from(tagSet).sort()
  })

  const tagItems = $derived(allTags.map(t => ({ id: t, label: '#' + t })))
  const groupItems = $derived(groups.map(g => ({ id: g.group, label: formatGroup(g.group) })))
</script>

<div class="anuka-stack">
  <div class="anuka-row">
    <input
      class="anuka-input anuka-grow"
      type="search"
      placeholder="word, pinyin, English, tags"
      bind:value={$mainSearch}
    />
    <BtnIcon onclick={toggleView} label="Toggle view" icon={viewIcon} />
    <BtnIcon onclick={toggleTheme} label="Toggle theme" icon="moon" />
  </div>

  {#if allTags.length > 0}
    <Autocomplete
      items={tagItems}
      selected={$mainTags}
      formatSelected={(id) => '#' + id}
      placeholder="Tags..."
      onadd={(tag) => { if (!$mainTags.includes(tag)) $mainTags = [...$mainTags, tag] }}
      onremove={(tag) => $mainTags = $mainTags.filter(t => t !== tag)}
      onclear={() => $mainTags = []}
    />
  {/if}

  <Autocomplete
    items={groupItems}
    selected={$mainGroups}
    formatSelected={formatGroup}
    placeholder="Groups..."
    onadd={(id) => { if (!$mainGroups.includes(id)) $mainGroups = [...$mainGroups, id] }}
    onremove={(id) => $mainGroups = $mainGroups.filter(g => g !== id)}
    onclear={() => $mainGroups = []}
  />
</div>
