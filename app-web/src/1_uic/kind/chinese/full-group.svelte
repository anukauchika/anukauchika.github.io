<script lang="ts">
  import Island from '@std/ui/island.svelte'
  import IslandTitle from '@std/ui/island-title.svelte'
  import Tags from '@std/ui/tags.svelte'
  import ProgressLine from '@std/ui/progress-line.svelte'
  import GroupItem from '@uic/kind/chinese/group-item.svelte'

  interface Props {
    groupId: string
    tags?: string[]
    strokeHref: string
    pinyinHref: string
    workbookHref: string
    printHref: string
    strokeSessions: number
    pinyinSessions: number
    strokeProgress: number
    strokeMastery: number
    pinyinProgress: number
    pinyinMastery: number
    showProgress: boolean
    items: Array<{ item: any; strokeStat?: any; pinyinStat?: any }>
    onItemClick: (item: any) => void
  }

  let {
    groupId,
    tags,
    strokeHref,
    pinyinHref,
    workbookHref,
    printHref,
    strokeSessions = 0,
    pinyinSessions = 0,
    strokeProgress = 0,
    strokeMastery = 0,
    pinyinProgress = 0,
    pinyinMastery = 0,
    showProgress = false,
    items,
    onItemClick,
  }: Props = $props()
</script>

<Island>
  <div class="anuka-stack">
    <div class="anuka-row">
      <IslandTitle level={3}>{groupId}</IslandTitle>
      <span class="anuka-grow"></span>
      <a class="anuka-btn anuka-btn-icon" href={strokeHref} title="Stroke drill">
        <span class="anuka-icon anuka-icon-stroke"></span>
      </a>
      <a class="anuka-btn anuka-btn-icon" href={pinyinHref} title="Pinyin drill">
        <span class="anuka-icon anuka-icon-pinyin"></span>
      </a>
      <a class="anuka-btn anuka-btn-icon" href={workbookHref} target="_blank" rel="noreferrer" title="Open workbook">
        <span class="anuka-icon anuka-icon-book"></span>
      </a>
      <a class="anuka-btn anuka-btn-icon" href={printHref} target="_blank" rel="noreferrer" title="Print workbook">
        <span class="anuka-icon anuka-icon-print"></span>
      </a>
    </div>
    <div class="anuka-row">
      {#if tags?.length}
        <Tags {tags} />
      {/if}
      <span class="anuka-grow"></span>
      {#if strokeSessions}<span>W: {strokeSessions}</span>{/if}
      {#if pinyinSessions}<span>P: {pinyinSessions}</span>{/if}
    </div>
    {#if showProgress}
      <div class="anuka-stack anuka-compact anuka-grow">
        <ProgressLine fill={strokeProgress} fillStrong={strokeMastery} />
        <ProgressLine fill={pinyinProgress} fillStrong={pinyinMastery} />
      </div>
    {/if}
    <div class="anuka-grid">
      {#each items as { item, strokeStat, pinyinStat } (item.id)}
        <GroupItem {item} {strokeStat} {pinyinStat} onclick={() => onItemClick(item)} />
      {/each}
    </div>
  </div>
</Island>
