<script>
  let { value, label, onclick } = $props()
</script>

{#if onclick}
  <button type="button" class="anuka-stat" {onclick}>
    <span class="anuka-stat-value">{value}</span>
    <span class="anuka-stat-label">{label}</span>
  </button>
{:else}
  <div class="anuka-stat">
    <span class="anuka-stat-value">{value}</span>
    <span class="anuka-stat-label">{label}</span>
  </div>
{/if}
