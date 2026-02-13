<script>
  import { datasetId, currentDataset } from '../../../state/registry.js'
  import { datasetGroupSessionsStroke, datasetGroupSessionsPinyin, datasetStatsStroke, datasetStatsPinyin } from '../../../state/practice-stats.js'
  import { mainListViewStyle, mainSearch } from '../../../state/filters.js'
  import { isAuthenticated } from '../../../state/auth.js'
  import { formatGroup } from '../../../utils/format.js'
  import Island from '../../core/Island.svelte'
  import IslandTitle from '../../core/IslandTitle.svelte'
  import Tags from '../../core/Tags.svelte'
  import Btn from '../../core/Btn.svelte'
  import ProgressLine from '../../core/ProgressLine.svelte'
  import GroupItemChinese from '../../../kind/chinese/GroupItem.svelte'
  import GroupItemEnglish from '../../../kind/english/GroupItem.svelte'

  let {
    filteredGroups,
    compact,
    onOpenWord,
  } = $props()

  const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, '') || ''
  const basePath = $derived.by(() => `${baseUrl}/${$currentDataset.kind}`)

  let showAllGroups = $state(false)

  $effect(() => { $datasetId; showAllGroups = false })

  const MAX_MAIN_GROUPS = 10
  const hasActiveSearch = $derived.by(() => $mainSearch.trim().length > 0)
  const isLimited = $derived.by(() => !hasActiveSearch && !showAllGroups && filteredGroups.length > MAX_MAIN_GROUPS)
  const fullViewGroups = $derived.by(() =>
    hasActiveSearch || showAllGroups ? filteredGroups : filteredGroups.slice(0, MAX_MAIN_GROUPS)
  )

  const getGroupProgress = (group, statsMap) => {
    const practiced = group.items.filter(item =>
      statsMap.has(`${group.group}::${item.id}`)
    ).length
    return group.items.length > 0 ? Math.round((practiced / group.items.length) * 100) : 0
  }

  const getGroupMastery = (group, sessionsMap) => {
    const fullSessions = sessionsMap.get(group.group)?.full ?? 0
    return Math.min(Math.round((fullSessions / 10) * 100), 100)
  }
</script>

<div class="anuka-stack">
  {#if filteredGroups.length === 0}
    <Island>
      <p>No matches. Try clearing filters or searching a different term.</p>
    </Island>
  {:else if $mainListViewStyle === 'compact'}
    {@render compact()}
  {:else}
    {#each fullViewGroups as group (group.group)}
      {@const gsStroke = $datasetGroupSessionsStroke.get(group.group)}
      {@const gsPinyin = $datasetGroupSessionsPinyin.get(group.group)}
      <Island>
        <div class="anuka-stack">
          <div class="anuka-row anuka-justify">
            <div>
              <IslandTitle level={3}>{formatGroup(group.group)}</IslandTitle>
              {#if group.tags?.length}
                <Tags tags={group.tags} />
              {/if}
            </div>
            <div class="anuka-row">
              {#if $currentDataset?.kind === 'chinese'}
                {#if gsStroke?.full}<span>{gsStroke.full}</span>{/if}
                <a class="anuka-btn anuka-btn-icon" href={`${basePath}/practice.html?group=${group.group}&dataset=${$datasetId}&type=stroke`} title="Stroke practice">
                  <span class="anuka-icon anuka-icon-stroke"></span>
                </a>
                {#if gsPinyin?.full}<span>{gsPinyin.full}</span>{/if}
                <a class="anuka-btn anuka-btn-icon" href={`${basePath}/practice.html?group=${group.group}&dataset=${$datasetId}&type=pinyin`} title="Pinyin practice">
                  <span class="anuka-icon anuka-icon-pinyin"></span>
                </a>
              {/if}
              <a class="anuka-btn anuka-btn-icon" href={`${basePath}/workbook.html?group=${group.group}&dataset=${$datasetId}`} target="_blank" rel="noreferrer" title="Open workbook">
                <span class="anuka-icon anuka-icon-book"></span>
              </a>
              <a class="anuka-btn anuka-btn-icon" href={`${basePath}/workbook.html?group=${group.group}&dataset=${$datasetId}&autoprint=1`} target="_blank" rel="noreferrer" title="Print workbook">
                <span class="anuka-icon anuka-icon-print"></span>
              </a>
            </div>
          </div>
          {#if $isAuthenticated}
            <div class="anuka-stack anuka-compact anuka-grow">
              <ProgressLine fill={getGroupProgress(group, $datasetStatsStroke)} fillStrong={getGroupMastery(group, $datasetGroupSessionsStroke)} />
              <ProgressLine fill={getGroupProgress(group, $datasetStatsPinyin)} fillStrong={getGroupMastery(group, $datasetGroupSessionsPinyin)} />
            </div>
          {/if}
          <div class="anuka-grid-md">
            {#each group.items as item (`${group.group}-${item.id}`)}
              {#if $currentDataset?.kind === 'chinese'}
                <GroupItemChinese {item} strokeStat={$isAuthenticated ? $datasetStatsStroke.get(`${group.group}::${item.id}`) : null} pinyinStat={$isAuthenticated ? $datasetStatsPinyin.get(`${group.group}::${item.id}`) : null} onclick={() => onOpenWord(item)} />
              {:else if $currentDataset?.kind === 'english'}
                <GroupItemEnglish {item} onclick={() => onOpenWord(item)} />
              {/if}
            {/each}
          </div>
        </div>
      </Island>
    {/each}
    {#if isLimited}
      <div class="anuka-row anuka-center">
        <Btn variant="ghost" onclick={() => showAllGroups = true}>Show all {filteredGroups.length} groups</Btn>
      </div>
    {/if}
  {/if}
</div>
