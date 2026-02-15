<script lang="ts">
  import Island from '@std/ui/Island.svelte'
  import CompactGroup from './CompactGroup.svelte'

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
  }

  let { groups }: Props = $props()
</script>

<Island>
  <div class="anuka-stack">
    {#each groups as group (group.groupId)}
      <CompactGroup {...group} />
    {/each}
  </div>
</Island>
