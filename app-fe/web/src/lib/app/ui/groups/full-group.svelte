<script lang="ts">
  import Island from '@std/ui/island.svelte'
  import IslandTitle from '@std/ui/island-title.svelte'
  import Tags from '@std/ui/tags.svelte'
  import ProgressLine from '@std/ui/progress-line.svelte'
  import Modal from '@std/ui/modal.svelte'
  import GroupItemChinese from '../chinese/group-item.svelte'
  import GroupItemEnglish from '../english/group-item.svelte'
  import WordCardChinese from '../chinese/word-card.svelte'
  import WordCardEnglish from '../english/word-card.svelte'

  interface Props {
    groupId: string
    tags?: string[]
    kind: string
    strokeHref?: string
    pinyinHref?: string
    workbookHref?: string
    printHref?: string
    strokeSessions?: number
    pinyinSessions?: number
    strokeProgress?: number
    strokeMastery?: number
    pinyinProgress?: number
    pinyinMastery?: number
    showProgress?: boolean
    items: Array<{ item: any, strokeStat?: any, pinyinStat?: any }>
  }

  let {
    groupId,
    tags,
    kind,
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
  }: Props = $props()

  let activeWord = $state(null)
  const openWord = (item) => { activeWord = item }
  const closeWord = () => { activeWord = null }
</script>

<Island>
  <div class="anuka-stack">
    <div class="anuka-row anuka-justify">
      <div>
        <IslandTitle level={3}>{groupId}</IslandTitle>
        {#if tags?.length}
          <Tags tags={tags} />
        {/if}
      </div>
      <div class="anuka-row">
        {#if kind === 'chinese'}
          {#if strokeSessions}<span>{strokeSessions}</span>{/if}
          <a class="anuka-btn anuka-btn-icon" href={strokeHref} title="Stroke practice">
            <span class="anuka-icon anuka-icon-stroke"></span>
          </a>
          {#if pinyinSessions}<span>{pinyinSessions}</span>{/if}
          <a class="anuka-btn anuka-btn-icon" href={pinyinHref} title="Pinyin practice">
            <span class="anuka-icon anuka-icon-pinyin"></span>
          </a>
        {/if}
        {#if workbookHref}
          <a class="anuka-btn anuka-btn-icon" href={workbookHref} target="_blank" rel="noreferrer" title="Open workbook">
            <span class="anuka-icon anuka-icon-book"></span>
          </a>
        {/if}
        {#if printHref}
          <a class="anuka-btn anuka-btn-icon" href={printHref} target="_blank" rel="noreferrer" title="Print workbook">
            <span class="anuka-icon anuka-icon-print"></span>
          </a>
        {/if}
      </div>
    </div>
    {#if showProgress}
      <div class="anuka-stack anuka-compact anuka-grow">
        <ProgressLine fill={strokeProgress} fillStrong={strokeMastery} />
        <ProgressLine fill={pinyinProgress} fillStrong={pinyinMastery} />
      </div>
    {/if}
    <div class="anuka-grid">
      {#each items as { item, strokeStat, pinyinStat } (item.id)}
        {#if kind === 'chinese'}
          <GroupItemChinese {item} {strokeStat} {pinyinStat} onclick={() => openWord(item)} />
        {:else if kind === 'english'}
          <GroupItemEnglish {item} onclick={() => openWord(item)} />
        {/if}
      {/each}
    </div>
  </div>
</Island>

{#if activeWord}
  <Modal onclose={closeWord}>
    {#if kind === 'chinese'}
      <WordCardChinese item={activeWord} onClose={closeWord} />
    {:else if kind === 'english'}
      <WordCardEnglish item={activeWord} onClose={closeWord} />
    {/if}
  </Modal>
{/if}
