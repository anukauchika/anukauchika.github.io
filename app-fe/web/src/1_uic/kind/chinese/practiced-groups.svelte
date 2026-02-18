<script lang="ts">
  import Island from '@std/ui/island.svelte'
  import BtnIcon from '@std/ui/btn-icon.svelte'
  import CompactGroup from '@uic/kind/chinese/compact-group.svelte'

  interface GroupProps {
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

  interface Props {
    groups: GroupProps[]
    practicedCount: number
    totalCount: number
    onclose: () => void
  }

  let { groups, practicedCount, totalCount, onclose }: Props = $props()
</script>

<Island sticky>
  <div class="anuka-row anuka-justify">
    <h3>Groups Practiced {practicedCount} | {totalCount}</h3>
    <BtnIcon icon="close" label="Close" onclick={onclose} />
  </div>
</Island>

<Island>
  <div class="anuka-stack">
    {#each groups as group (group.groupId)}
      <CompactGroup {...group} />
    {/each}
  </div>
</Island>
