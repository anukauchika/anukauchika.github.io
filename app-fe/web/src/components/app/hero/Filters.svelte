<script>
  import { formatGroup } from '../../../utils/format.js'
  import BtnIcon from '../../core/BtnIcon.svelte'
  import Autocomplete from '../../core/Autocomplete.svelte'

  let {
    groups,
    search,
    tags,
    selectedGroups,
    listViewStyle,
    onSearchChange,
    onTagAdd,
    onTagRemove,
    onTagsClear,
    onGroupAdd,
    onGroupRemove,
    onGroupsClear,
    onToggleView,
  } = $props()

  const viewIcon = $derived(listViewStyle === 'full' ? 'grid' : 'list')

  const toggleTheme = () => {
    const current = document.documentElement.dataset.theme
      ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    document.documentElement.dataset.theme = current === 'dark' ? 'light' : 'dark'
  }

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
      value={search}
      oninput={(e) => onSearchChange(e.target.value)}
    />
    <BtnIcon onclick={onToggleView} label="Toggle view" icon={viewIcon} />
    <BtnIcon onclick={toggleTheme} label="Toggle theme" icon="moon" />
  </div>

  {#if allTags.length > 0}
    <Autocomplete
      items={tagItems}
      selected={tags}
      formatSelected={(id) => '#' + id}
      placeholder="Tags..."
      onadd={onTagAdd}
      onremove={onTagRemove}
      onclear={onTagsClear}
    />
  {/if}

  <Autocomplete
    items={groupItems}
    selected={selectedGroups}
    formatSelected={formatGroup}
    placeholder="Groups..."
    onadd={onGroupAdd}
    onremove={onGroupRemove}
    onclear={onGroupsClear}
  />
</div>
