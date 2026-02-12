<script>
  let {
    items,
    selected,
    formatSelected = (id) => id,
    placeholder = 'Filter...',
    onadd,
    onremove,
    onclear,
  } = $props()

  let query = $state('')
  let showSuggestions = $state(false)
  let highlightedIndex = $state(0)

  const filtered = $derived.by(() => {
    const q = query.trim().toLowerCase()
    return items.filter((item) =>
      (!q || item.label.toLowerCase().includes(q)) && !selected.includes(item.id)
    )
  })

  $effect(() => {
    filtered
    highlightedIndex = 0
  })

  const add = (id) => {
    onadd(id)
    query = ''
    showSuggestions = false
    highlightedIndex = 0
  }

  const handleKeydown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      highlightedIndex = Math.min(highlightedIndex + 1, filtered.length - 1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      highlightedIndex = Math.max(highlightedIndex - 1, 0)
    } else if (e.key === 'Enter' && filtered.length > 0) {
      e.preventDefault()
      add(filtered[highlightedIndex].id)
    } else if (e.key === 'Backspace' && query === '' && selected.length > 0) {
      onremove(selected[selected.length - 1])
    } else if (e.key === 'Escape') {
      showSuggestions = false
    }
  }
</script>

<div class="anuka-autocomplete">
  <div class="anuka-autocomplete-field">
    {#each selected as id (id)}
      <span class="anuka-autocomplete-chip">
        {formatSelected(id)}
        <button type="button" onmousedown={(e) => { e.preventDefault(); e.stopPropagation(); onremove(id) }}>&times;</button>
      </span>
    {/each}
    <input
      class="anuka-autocomplete-input"
      type="text"
      {placeholder}
      bind:value={query}
      onfocus={() => showSuggestions = true}
      onblur={() => setTimeout(() => showSuggestions = false, 150)}
      oninput={() => showSuggestions = true}
      onkeydown={handleKeydown}
    />
    {#if selected.length > 0}
      <button type="button" class="anuka-autocomplete-clear" onmousedown={(e) => { e.preventDefault(); e.stopPropagation(); onclear() }}>&times;</button>
    {/if}
  </div>
  {#if showSuggestions && filtered.length > 0}
    <ul class="anuka-autocomplete-dropdown">
      {#each filtered as item, i}
        <li><button type="button" class:active={i === highlightedIndex} onmousedown={() => add(item.id)}>{item.label}</button></li>
      {/each}
    </ul>
  {/if}
</div>
