<script>
  import { datasetId, currentDataset } from './state/registry.js'
  import { isAuthenticated } from './state/auth.js'
  import { datasetGroupSessions, datasetGroupSessionsStroke, datasetGroupSessionsPinyin } from './state/practice-stats.js'
  import { formatGroup } from './utils/format.js'
  import GroupProgressBars from './GroupProgressBars.svelte'

  let { group, from = '', formatTime } = $props()

  const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '')
  const basePath = $derived(`${baseUrl}/${$currentDataset.kind}`)
  const gs = $derived($isAuthenticated ? $datasetGroupSessions.get(group.group) : null)
  const gsStroke = $derived($datasetGroupSessionsStroke.get(group.group))
  const gsPinyin = $derived($datasetGroupSessionsPinyin.get(group.group))
  const fromParam = $derived(from ? `&from=${from}` : '')
</script>

<article class="compact-row">
  <div class="compact-main">
    <span class="compact-gid">{formatGroup(group.group)}</span>
    <span class="compact-date">{#if gs}{formatTime(gs)}{/if}</span>
    <span class="compact-actions">
      {#if $currentDataset?.kind === 'chinese'}
        {#if gsStroke?.full}<span class="compact-stat">{gsStroke.full}</span>{/if}
        <a class="compact-icon" href={`${basePath}/practice.html?group=${group.group}&dataset=${$datasetId}&type=stroke${fromParam}`} title="Stroke practice">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
        </a>
        {#if gsPinyin?.full}<span class="compact-stat">{gsPinyin.full}</span>{/if}
        <a class="compact-icon" href={`${basePath}/practice.html?group=${group.group}&dataset=${$datasetId}&type=pinyin${fromParam}`} title="Pinyin practice">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h1M10 8h1M14 8h1M18 8h1M7 12h1M11 12h1M15 12h1M8 16h8"/></svg>
        </a>
      {/if}
      <a class="compact-icon compact-icon-workbook" href={`${basePath}/workbook.html?group=${group.group}&dataset=${$datasetId}`} target="_blank" rel="noreferrer" title="Workbook">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
      </a>
      <a class="compact-icon compact-icon-workbook" href={`${basePath}/workbook.html?group=${group.group}&dataset=${$datasetId}&autoprint=1`} target="_blank" rel="noreferrer" title="Print workbook">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
      </a>
    </span>
  </div>
  {#if group.tags?.length}
    <div class="compact-tags">
      {#each group.tags as tag}<span class="compact-tag">#{tag}</span>{/each}
    </div>
  {/if}
  {#if $isAuthenticated}
    <GroupProgressBars {group} variant="compact" />
  {/if}
</article>
