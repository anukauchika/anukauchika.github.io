<script lang="ts">
  interface Props {
    fill?: number
    fillStrong?: number
  }

  let { fill = 0, fillStrong = 0 }: Props = $props()
</script>

<div class="anuka-progress-line">
  {#if fill > 0}
    <div class="anuka-progress-line-fill" style="width: {fill}%"></div>
  {/if}
  {#if fillStrong > 0}
    <div class="anuka-progress-line-fill-strong" style="width: {fillStrong}%"></div>
  {/if}
</div>
