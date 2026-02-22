<script>
  import { formatGroup } from '@std/format.js'
  import BtnIcon from '@std/ui/btn-icon.svelte'
  import Autocomplete from '@std/ui/autocomplete.svelte'

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
    onShare,
  } = $props()

  const viewIcon = $derived(listViewStyle === 'full' ? 'grid' : 'list')

  const allTags = $derived.by(() => {
    const tagSet = new Set()
    groups.forEach((g) => {
      g.tags?.forEach((t) => tagSet.add(t))
      g.items?.forEach((item) => item.tags?.forEach((t) => tagSet.add(t)))
    })
    return Array.from(tagSet).sort()
  })

  const tagItems = $derived(allTags.map(t => ({ id: t, label: '#' + t })))
  const groupItems = $derived(groups.map(g => ({ id: g.id, label: g.displayId ?? formatGroup(g.idx) })))
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
    <BtnIcon onclick={onShare} label="Share" icon="share" />
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
