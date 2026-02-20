<script>
  import { timeAgo } from '@std/format.js'
  import Island from '@std/ui/island.svelte'
  import IslandTitle from '@std/ui/island-title.svelte'
  import BtnIcon from '@std/ui/btn-icon.svelte'

  let {
    chars,
    drilledCount,
    uniqueChars,
    onclose,
  } = $props()
</script>

<Island sticky>
  <div class="anuka-row anuka-justify">
    <IslandTitle level={3}>Chars Drilled <span class="anuka-main">{drilledCount}</span> | {uniqueChars}</IslandTitle>
    <BtnIcon icon="close" label="Close" onclick={onclose} />
  </div>
</Island>
<section class="anuka-stack">
  <div class="anuka-grid anuka-sm">
    {#each chars as c (c.char)}
      <div class="anuka-card anuka-stack anuka-center anuka-compact" class:anuka-mute={!c.drilled}>
        <span class="anuka-lg" lang="zh" translate="no">{c.char}</span>
        {#if c.drilled}
          {#if c.stroke.successCount > 0}
            <span class="anuka-sm anuka-main">{c.stroke.successCount}{#if c.stroke.errorCount > 0}<span class="anuka-fail">| {c.stroke.errorCount}</span>{/if}{#if c.stroke.hintCount > 0}<span class="anuka-warn">| {c.stroke.hintCount}</span>{/if}</span>
          {/if}
          {#if c.pinyin.successCount > 0}
            <span class="anuka-sm anuka-main">{c.pinyin.successCount}{#if c.pinyin.errorCount > 0}<span class="anuka-fail">| {c.pinyin.errorCount}</span>{/if}{#if c.pinyin.hintCount > 0}<span class="anuka-warn">| {c.pinyin.hintCount}</span>{/if}</span>
          {/if}
          <span class="anuka-sm anuka-mute">{timeAgo(c.lastDrilledAt)}</span>
        {/if}
      </div>
    {/each}
  </div>
</section>
