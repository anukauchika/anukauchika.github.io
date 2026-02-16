<script>
  let { group, exerciseSets = 2 } = $props()

  const givenCols = 3
  const totalCols = $derived(givenCols + exerciseSets * 3)
</script>

<section class="sheet">
  <div class="grid" style={`--sets:${totalCols}`}>
    {#each group.items as item}
      <div class="cell filled chinese">{item.word}</div>
      <div class="cell filled pinyin">{item.pinyin}</div>
      <div class="cell filled english">{item.english}</div>

      {#each Array(exerciseSets) as _}
        <div class="cell blank chinese"></div>
        <div class="cell blank pinyin"></div>
        <div class="cell blank english"></div>
      {/each}
    {/each}
  </div>
</section>
