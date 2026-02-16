<script>
  import { goto } from '$app/navigation'
  import { datasetId, currentDataset } from '@app/state/registry.js'
  import { datasetStatsStroke, datasetStatsPinyin, datasetGroupSessions, datasetGroupSessionsStroke, datasetGroupSessionsPinyin } from '@app/state/kind/chinese/practice-stats.js'
  import { mainSearch, mainTags, mainGroups } from '@app/state/filters.js'
  import { isAuthenticated } from '@app/state/auth.js'
  import { formatGroup, timeAgo } from '@std/format.js'
  import { calcGroupProgress, calcGroupMastery, sortGroupsByLastPracticed } from '@app/std/kind/chinese/stats'
  import { filterGroups } from '@app/std/dataset'
  import PracticedGroups from '@app/ui/chinese/PracticedGroups.svelte'

  const basePath = $derived.by(() => `/${$currentDataset?.kind ?? 'chinese'}`)
  const groups = $derived.by(() => $currentDataset?.data?.groups ?? [])
  const searchFields = $derived($currentDataset?.data?.search || [])
  const filteredGroups = $derived(filterGroups(groups, $mainSearch, $mainTags, $mainGroups, searchFields))
  const practicedGroupsSorted = $derived(sortGroupsByLastPracticed(filteredGroups, $datasetGroupSessions))

  const compactRowProps = (group) => {
    const isChinese = $currentDataset?.kind === 'chinese'
    const gsStroke = $datasetGroupSessionsStroke.get(group.group)
    const gsPinyin = $datasetGroupSessionsPinyin.get(group.group)
    return {
      groupId: formatGroup(group.group),
      lastPracticed: $isAuthenticated ? timeAgo($datasetGroupSessions.get(group.group)?.lastPracticedAt) : undefined,
      tags: group.tags,
      strokeHref: isChinese ? `${basePath}/practice/hanzi?group=${group.group}&dataset=${$datasetId}&from=groups` : undefined,
      pinyinHref: isChinese ? `${basePath}/practice/pinyin?group=${group.group}&dataset=${$datasetId}&from=groups` : undefined,
      strokeSessions: gsStroke?.full ?? 0,
      pinyinSessions: gsPinyin?.full ?? 0,
      strokeProgress: $isAuthenticated ? calcGroupProgress(group, $datasetStatsStroke) : 0,
      strokeMastery: $isAuthenticated ? calcGroupMastery(group, $datasetGroupSessionsStroke) : 0,
      pinyinProgress: $isAuthenticated ? calcGroupProgress(group, $datasetStatsPinyin) : 0,
      pinyinMastery: $isAuthenticated ? calcGroupMastery(group, $datasetGroupSessionsPinyin) : 0,
    }
  }
</script>

<svelte:head>
  <title>Practiced Groups - Anuka Uchika</title>
</svelte:head>

<main class="anuka-page">
  <PracticedGroups
    groups={practicedGroupsSorted.map(g => compactRowProps(g))}
    practicedCount={practicedGroupsSorted.filter(g => $datasetGroupSessions.has(g.group)).length}
    totalCount={practicedGroupsSorted.length}
    onclose={() => goto('/chinese/')}
  />
</main>
