<script>
  import { timeAgo } from '@std/format.js'
  import Island from '@std/ui/Island.svelte'
  import IslandTitle from '@std/ui/IslandTitle.svelte'
  import BtnIcon from '@std/ui/BtnIcon.svelte'

  let {
    chars,
    practicedCount,
    uniqueChars,
    onclose,
  } = $props()
</script>

<Island sticky>
  <div class="anuka-row anuka-justify">
    <IslandTitle level={3}>Chars Practiced <span class="anuka-main">{practicedCount}</span> | {uniqueChars}</IslandTitle>
    <BtnIcon icon="close" label="Close" onclick={onclose} />
  </div>
</Island>
<section class="anuka-stack">
  <div class="anuka-grid anuka-sm">
    {#each chars as c (c.char)}
      <div class="anuka-card anuka-stack anuka-center anuka-compact" class:anuka-mute={!c.practiced}>
        <span class="anuka-lg" lang="zh" translate="no">{c.char}</span>
        {#if c.practiced}
          {#if c.stroke.successCount > 0}
            <span class="anuka-sm anuka-main">{c.stroke.successCount}{#if c.stroke.errorCount > 0}<span class="anuka-fail">| {c.stroke.errorCount}</span>{/if}</span>
          {/if}
          {#if c.pinyin.successCount > 0}
            <span class="anuka-sm anuka-main">{c.pinyin.successCount}{#if c.pinyin.errorCount > 0}<span class="anuka-fail">| {c.pinyin.errorCount}</span>{/if}</span>
          {/if}
          <span class="anuka-sm anuka-mute">{timeAgo(c.lastPracticedAt)}</span>
        {/if}
      </div>
    {/each}
  </div>
</section>
