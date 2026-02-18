<script lang="ts">
  interface Props {
    tags: string[]
  }

  let { tags }: Props = $props()
</script>

<div class="anuka-tags">
  {#each tags as tag}<span class="anuka-tag">#{tag}</span>{/each}
</div>
