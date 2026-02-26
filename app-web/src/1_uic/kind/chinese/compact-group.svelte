<script lang="ts">
  import ProgressLine from '@std/ui/progress-line.svelte'
  import type { DueInfo, DueStatus } from '@std/format'

  interface Props {
    groupId: string
    tags?: string[]
    strokeHref?: string
    pinyinHref?: string
    strokeSessions?: number
    pinyinSessions?: number
    strokeProgress?: number
    strokeMastery?: number
    pinyinProgress?: number
    pinyinMastery?: number
    strokeDue?: DueInfo
    pinyinDue?: DueInfo
    strokeLastDrilled?: string
    pinyinLastDrilled?: string
  }

  let {
    groupId,
    tags,
    strokeHref,
    pinyinHref,
    strokeSessions = 0,
    pinyinSessions = 0,
    strokeProgress = 0,
    strokeMastery = 0,
    pinyinProgress = 0,
    pinyinMastery = 0,
    strokeDue,
    pinyinDue,
    strokeLastDrilled,
    pinyinLastDrilled,
  }: Props = $props()

  const badgeMod = (status: DueStatus) =>
    status === 'overdue' ? 'anuka-fail' : status === 'due-now' ? 'anuka-warn' : 'anuka-mute'

  const hasProgress = $derived(strokeProgress > 0 || strokeMastery > 0 || pinyinProgress > 0 || pinyinMastery > 0)
</script>

<article class="anuka-stack anuka-compact">
  <div class="anuka-row anuka-justify">
    <span>{groupId}</span>
    <div class="anuka-tags">
      {#each tags ?? [] as tag}<span class="anuka-tag anuka-sm">#{tag}</span>{/each}
    </div>
    <span class="anuka-row anuka-compact">
      {#if strokeHref}
        <a class="anuka-btn anuka-btn-icon" href={strokeHref} title="Stroke drill">
          <span class="anuka-icon anuka-icon-stroke"></span>
        </a>
      {/if}
      {#if pinyinHref}
        <a class="anuka-btn anuka-btn-icon" href={pinyinHref} title="Pinyin drill">
          <span class="anuka-icon anuka-icon-pinyin"></span>
        </a>
      {/if}
    </span>
  </div>

  {#if hasProgress}
    <div class="anuka-stack anuka-compact">
      <ProgressLine fill={strokeProgress} fillStrong={strokeMastery} />
      <ProgressLine fill={pinyinProgress} fillStrong={pinyinMastery} />
    </div>
  {/if}

  {#if strokeLastDrilled || strokeDue || pinyinLastDrilled || pinyinDue}
    <div class="anuka-row anuka-compact anuka-center">
      {#if strokeLastDrilled}<span class="anuka-mute anuka-sm">{strokeLastDrilled}</span>{/if}
      {#if strokeDue}<span class="anuka-badge {badgeMod(strokeDue.status)} anuka-sm">{strokeDue.label}</span>{/if}
      {#if strokeSessions > 0}<span class="anuka-mute anuka-sm">{strokeSessions}W</span>{/if}
      <span class="anuka-mute anuka-sm">|</span>
      {#if pinyinSessions > 0}<span class="anuka-mute anuka-sm">P{pinyinSessions}</span>{/if}
      {#if pinyinDue}<span class="anuka-badge {badgeMod(pinyinDue.status)} anuka-sm">{pinyinDue.label}</span>{/if}
      {#if pinyinLastDrilled}<span class="anuka-mute anuka-sm">{pinyinLastDrilled}</span>{/if}
    </div>
  {/if}
</article>
