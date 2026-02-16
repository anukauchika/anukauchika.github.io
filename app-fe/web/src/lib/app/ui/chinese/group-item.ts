import { formatGroup } from '@std/format'
import { calcGroupProgress, calcGroupMastery } from '@app/std/kind/chinese/stats'
import type { StatsMap, SessionsMap } from '@app/api/services/kind/chinese/types'

interface Context {
  basePath: string
  datasetId: string
  isAuthenticated: boolean
  groupSessionsStroke: SessionsMap
  groupSessionsPinyin: SessionsMap
  statsStroke: StatsMap
  statsPinyin: StatsMap
}

export function buildProps(group: any, ctx: Context) {
  const gsStroke = ctx.groupSessionsStroke.get(group.group)
  const gsPinyin = ctx.groupSessionsPinyin.get(group.group)
  return {
    groupId: formatGroup(group.group),
    tags: group.tags,
    kind: 'chinese',
    strokeHref: `${ctx.basePath}/practice/hanzi?group=${group.group}&dataset=${ctx.datasetId}`,
    pinyinHref: `${ctx.basePath}/practice/pinyin?group=${group.group}&dataset=${ctx.datasetId}`,
    workbookHref: `${ctx.basePath}/workbook?group=${group.group}&dataset=${ctx.datasetId}`,
    printHref: `${ctx.basePath}/workbook?group=${group.group}&dataset=${ctx.datasetId}&autoprint=1`,
    strokeSessions: gsStroke?.full ?? 0,
    pinyinSessions: gsPinyin?.full ?? 0,
    strokeProgress: ctx.isAuthenticated ? calcGroupProgress(group, ctx.statsStroke) : 0,
    strokeMastery: ctx.isAuthenticated ? calcGroupMastery(group, ctx.groupSessionsStroke) : 0,
    pinyinProgress: ctx.isAuthenticated ? calcGroupProgress(group, ctx.statsPinyin) : 0,
    pinyinMastery: ctx.isAuthenticated ? calcGroupMastery(group, ctx.groupSessionsPinyin) : 0,
    showProgress: ctx.isAuthenticated,
    items: group.items.map((item: any) => ({
      item,
      strokeStat: ctx.isAuthenticated ? ctx.statsStroke.get(`${group.group}::${item.id}`) : null,
      pinyinStat: ctx.isAuthenticated ? ctx.statsPinyin.get(`${group.group}::${item.id}`) : null,
    })),
  }
}
