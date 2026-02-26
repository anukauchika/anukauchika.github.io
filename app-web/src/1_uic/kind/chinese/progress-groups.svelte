<script lang="ts">
  import Island from '@std/ui/island.svelte'
  import BtnIcon from '@std/ui/btn-icon.svelte'
  import CompactGroup from '@uic/kind/chinese/compact-group.svelte'

  interface GroupProps {
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
  }

  interface Props {
    groups: GroupProps[]
    drilledCount: number
    totalCount: number
    overdueCount: number
    onclose: () => void
  }

  let { groups, drilledCount, totalCount, overdueCount, onclose }: Props = $props()
</script>

<Island sticky>
  <div class="anuka-row anuka-justify">
    <h3>Groups {totalCount} | <span class="anuka-main">{drilledCount}</span> drill | <span class={overdueCount > 0 ? 'anuka-warn' : ''}>{overdueCount}</span> overdue</h3>
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
