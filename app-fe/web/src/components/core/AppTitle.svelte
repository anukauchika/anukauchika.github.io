<script lang="ts">
  interface Props {
    parts: string[]
  }

  let { parts }: Props = $props()
</script>

<h2 class="anuka-app-title">
  {#each parts as part}<span>{part}</span>{/each}
</h2>
