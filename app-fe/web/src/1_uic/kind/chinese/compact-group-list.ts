import { timeAgo } from '@std/format'
import { calcGroupProgress, calcGroupMastery } from '@std/kind/chinese/stats'
import type { ChineseGroup } from '@dat/kind/chinese/dataset'
import type { StatsMap, SessionsMap } from '@svc/kind/chinese/types'

interface Context {
  basePath: string
  datasetId: string
  isAuthenticated: boolean
  groupSessions: SessionsMap
  groupSessionsStroke: SessionsMap
  groupSessionsPinyin: SessionsMap
  statsStroke: StatsMap
  statsPinyin: StatsMap
}

export function buildProps(group: ChineseGroup, ctx: Context, from?: string) {
  const fromParam = from ? `&from=${from}` : ''
  const gsStroke = ctx.groupSessionsStroke.get(group.id)
  const gsPinyin = ctx.groupSessionsPinyin.get(group.id)
  return {
    groupId: group.displayId,
    lastPracticed: ctx.isAuthenticated ? timeAgo(ctx.groupSessions.get(group.id)?.lastPracticedAt) : undefined,
    tags: group.tags,
    strokeHref: `${ctx.basePath}/practice/hanzi?group=${group.id}&dataset=${ctx.datasetId}${fromParam}`,
    pinyinHref: `${ctx.basePath}/practice/pinyin?group=${group.id}&dataset=${ctx.datasetId}${fromParam}`,
    strokeSessions: gsStroke?.full ?? 0,
    pinyinSessions: gsPinyin?.full ?? 0,
    strokeProgress: ctx.isAuthenticated ? calcGroupProgress(group, ctx.statsStroke) : 0,
    strokeMastery: ctx.isAuthenticated ? calcGroupMastery(group, ctx.groupSessionsStroke) : 0,
    pinyinProgress: ctx.isAuthenticated ? calcGroupProgress(group, ctx.statsPinyin) : 0,
    pinyinMastery: ctx.isAuthenticated ? calcGroupMastery(group, ctx.groupSessionsPinyin) : 0,
  }
}
