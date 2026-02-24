<script lang="ts">
  import ProgressLine from '@std/ui/progress-line.svelte'

  interface Props {
    groupId: string
    lastDrilled?: string
    tags?: string[]
    strokeHref?: string
    pinyinHref?: string
    strokeSessions?: number
    pinyinSessions?: number
    strokeProgress?: number
    strokeMastery?: number
    pinyinProgress?: number
    pinyinMastery?: number
    strokeOverdue?: number
    pinyinOverdue?: number
    groupDifficulty?: number
    strokeErrors?: number
    pinyinErrors?: number
  }

  let {
    groupId,
    lastDrilled,
    tags,
    strokeHref,
    pinyinHref,
    strokeSessions = 0,
    pinyinSessions = 0,
    strokeProgress = 0,
    strokeMastery = 0,
    pinyinProgress = 0,
    pinyinMastery = 0,
    strokeOverdue,
    pinyinOverdue,
    groupDifficulty,
    strokeErrors,
    pinyinErrors,
  }: Props = $props()

  const hasProgress = $derived(strokeProgress > 0 || strokeMastery > 0 || pinyinProgress > 0 || pinyinMastery > 0)
  const hasSpacedData = $derived(strokeOverdue !== undefined || pinyinOverdue !== undefined || groupDifficulty !== undefined)
</script>

<article class="anuka-stack anuka-compact">
  <div class="anuka-row anuka-justify">
    <span>{groupId}</span>
    <span>{lastDrilled ?? ''}</span>
    <span class="anuka-row">
      {#if strokeHref}
        {#if strokeSessions}<span>{strokeSessions}</span>{/if}
        <a class="anuka-btn anuka-btn-icon" href={strokeHref} title="Stroke drill">
          <span class="anuka-icon anuka-icon-stroke"></span>
        </a>
      {/if}
      {#if pinyinHref}
        {#if pinyinSessions}<span>{pinyinSessions}</span>{/if}
        <a class="anuka-btn anuka-btn-icon" href={pinyinHref} title="Pinyin drill">
          <span class="anuka-icon anuka-icon-pinyin"></span>
        </a>
      {/if}
    </span>
  </div>
  <div class="anuka-row">
    {#if tags?.length}
      <div class="anuka-tags">
        {#each tags as tag}<span class="anuka-tag">#{tag}</span>{/each}
      </div>
    {/if}
  </div>
  <div class="anuka-row">
    {#if hasProgress}
      <div class="anuka-stack anuka-compact anuka-grow">
        <ProgressLine fill={strokeProgress} fillStrong={strokeMastery} />
        <ProgressLine fill={pinyinProgress} fillStrong={pinyinMastery} />
      </div>
    {/if}
  </div>
  {#if hasSpacedData}
    <div style="display:none" class="anuka-row anuka-mute anuka-sm">
      <span>s: {strokeOverdue !== undefined ? strokeOverdue.toFixed(2) + '×' : '—'}</span>
      <span>p: {pinyinOverdue !== undefined ? pinyinOverdue.toFixed(2) + '×' : '—'}</span>
      <span>diff: {groupDifficulty !== undefined ? groupDifficulty.toFixed(2) : '—'}</span>
      <span>err: {strokeErrors ?? 0}s / {pinyinErrors ?? 0}p</span>
    </div>
  {/if}
</article>
