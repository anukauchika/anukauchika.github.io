<script>
  let { group, exerciseSets = 2 } = $props()

  const givenCols = 3
  const totalCols = $derived(givenCols + exerciseSets * 3)
</script>

<section class="sheet">
  <div class="grid" style={`--sets:${totalCols}`}>
    {#each group.items as item}
      <div class="cell filled english">{item.word}</div>
      <div class="cell filled phonetics">{item.phonetics}</div>
      <div class="cell filled russian">{item.russian}</div>

      {#each Array(exerciseSets) as _}
        <div class="cell blank english"></div>
        <div class="cell blank phonetics"></div>
        <div class="cell blank russian"></div>
      {/each}
    {/each}
  </div>
</section>
