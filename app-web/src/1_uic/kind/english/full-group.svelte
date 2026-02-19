<script lang="ts">
  import Island from '@std/ui/island.svelte'
  import IslandTitle from '@std/ui/island-title.svelte'
  import Tags from '@std/ui/tags.svelte'
  import GroupItem from '@uic/kind/english/group-item.svelte'

  interface Props {
    groupId: string
    tags?: string[]
    workbookHref: string
    printHref: string
    items: Array<{ item: any }>
    onItemClick: (item: any) => void
  }

  let { groupId, tags, workbookHref, printHref, items, onItemClick }: Props = $props()
</script>

<Island>
  <div class="anuka-stack">
    <div class="anuka-row anuka-justify">
      <IslandTitle level={3}>{groupId}</IslandTitle>
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
    </div>
    <div class="anuka-grid">
      {#each items as { item } (item.id)}
        <GroupItem {item} onclick={() => onItemClick(item)} />
      {/each}
    </div>
  </div>
</Island>
