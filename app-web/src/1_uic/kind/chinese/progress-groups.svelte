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
    dueCount: number
    onclose: () => void
  }

  let { groups, drilledCount, totalCount, dueCount, onclose }: Props = $props()
</script>

<Island sticky>
  <div class="anuka-row anuka-justify">
    <h3>Groups {totalCount} | <span class="anuka-main">{drilledCount}</span> drill | <span class={dueCount > 0 ? 'anuka-warn' : ''}>{dueCount}</span> due</h3>
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
