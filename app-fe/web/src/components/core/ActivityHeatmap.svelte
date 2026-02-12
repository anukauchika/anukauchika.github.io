<script lang="ts">
  interface Props {
    levels: number[]
  }

  let { levels }: Props = $props()
</script>

<div class="anuka-activity-heatmap">
  {#each levels as level}
    <div class="anuka-activity-heatmap-cell" data-level={level || undefined}></div>
  {/each}
</div>
