<script>
  let { class: cls = '', value, label, onclick } = $props()
</script>

{#if onclick}
  <button type="button" class="anuka-stat {cls}" {onclick}>
    <span class="anuka-stat-value">{value}</span>
    <span class="anuka-stat-label">{label}</span>
  </button>
{:else}
  <div class="anuka-stat {cls}">
    <span class="anuka-stat-value">{value}</span>
    <span class="anuka-stat-label">{label}</span>
  </div>
{/if}
