import { calcGroupProgress, calcGroupMastery } from '@std/kind/chinese/stats'
import { compositeKey } from '@dom/dataset'
import type { ChineseGroup } from '@dom/kind/chinese/dataset'
import type { StatsMap, SessionsMap } from '@svc/kind/chinese/types'

interface Context {
  basePath: string
  datasetId: string
  isAuthenticated: boolean
  groupSessionsStroke: SessionsMap
  groupSessionsPinyin: SessionsMap
  statsStroke: StatsMap
  statsPinyin: StatsMap
}

export function buildProps(group: ChineseGroup, ctx: Context) {
  const gsStroke = ctx.groupSessionsStroke.get(group.id)
  const gsPinyin = ctx.groupSessionsPinyin.get(group.id)
  return {
    groupId: group.displayId,
    tags: group.tags,
    kind: 'chinese',
    strokeHref: `${ctx.basePath}/practice/hanzi?group=${group.id}&dataset=${ctx.datasetId}`,
    pinyinHref: `${ctx.basePath}/practice/pinyin?group=${group.id}&dataset=${ctx.datasetId}`,
    workbookHref: `${ctx.basePath}/workbook?group=${group.id}&dataset=${ctx.datasetId}`,
    printHref: `${ctx.basePath}/workbook?group=${group.id}&dataset=${ctx.datasetId}&autoprint=1`,
    strokeSessions: gsStroke?.full ?? 0,
    pinyinSessions: gsPinyin?.full ?? 0,
    strokeProgress: ctx.isAuthenticated ? calcGroupProgress(group, ctx.statsStroke) : 0,
    strokeMastery: ctx.isAuthenticated ? calcGroupMastery(group, ctx.groupSessionsStroke) : 0,
    pinyinProgress: ctx.isAuthenticated ? calcGroupProgress(group, ctx.statsPinyin) : 0,
    pinyinMastery: ctx.isAuthenticated ? calcGroupMastery(group, ctx.groupSessionsPinyin) : 0,
    showProgress: ctx.isAuthenticated,
    items: group.items.map((item) => ({
      item,
      strokeStat: ctx.isAuthenticated ? ctx.statsStroke.get(compositeKey(group.id, item.id)) : null,
      pinyinStat: ctx.isAuthenticated ? ctx.statsPinyin.get(compositeKey(group.id, item.id)) : null,
    })),
  }
}
