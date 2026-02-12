<script lang="ts">
  import ProgressLine from '../../../core/ProgressLine.svelte'

  interface Props {
    groupId: string
    lastPracticed?: string
    tags?: string[]
    strokeHref?: string
    pinyinHref?: string
    strokeSessions?: number
    pinyinSessions?: number
    strokeProgress?: number
    strokeMastery?: number
    pinyinProgress?: number
    pinyinMastery?: number
  }

  let {
    groupId,
    lastPracticed,
    tags,
    strokeHref,
    pinyinHref,
    strokeSessions = 0,
    pinyinSessions = 0,
    strokeProgress = 0,
    strokeMastery = 0,
    pinyinProgress = 0,
    pinyinMastery = 0,
  }: Props = $props()

  const hasProgress = $derived(strokeProgress > 0 || strokeMastery > 0 || pinyinProgress > 0 || pinyinMastery > 0)
</script>

<article class="anuka-stack anuka-compact">
  <div class="anuka-row anuka-justify">
    <span>{groupId}</span>
    <span>{lastPracticed ?? ''}</span>
    <span class="anuka-row">
      {#if strokeHref}
        {#if strokeSessions}<span>{strokeSessions}</span>{/if}
        <a class="anuka-btn anuka-btn-icon" href={strokeHref} title="Stroke practice">
          <span class="anuka-icon anuka-icon-stroke"></span>
        </a>
      {/if}
      {#if pinyinHref}
        {#if pinyinSessions}<span>{pinyinSessions}</span>{/if}
        <a class="anuka-btn anuka-btn-icon" href={pinyinHref} title="Pinyin practice">
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
</article>
