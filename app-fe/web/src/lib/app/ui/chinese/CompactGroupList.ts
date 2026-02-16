import { formatGroup, timeAgo } from '@std/format'
import { calcGroupProgress, calcGroupMastery } from '@app/std/kind/chinese/stats'
import type { StatsMap, SessionsMap } from '@app/api/services/kind/chinese/types'

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

export function buildProps(group: any, ctx: Context, from?: string) {
  const fromParam = from ? `&from=${from}` : ''
  const gsStroke = ctx.groupSessionsStroke.get(group.group)
  const gsPinyin = ctx.groupSessionsPinyin.get(group.group)
  return {
    groupId: formatGroup(group.group),
    lastPracticed: ctx.isAuthenticated ? timeAgo(ctx.groupSessions.get(group.group)?.lastPracticedAt) : undefined,
    tags: group.tags,
    strokeHref: `${ctx.basePath}/practice/hanzi?group=${group.group}&dataset=${ctx.datasetId}${fromParam}`,
    pinyinHref: `${ctx.basePath}/practice/pinyin?group=${group.group}&dataset=${ctx.datasetId}${fromParam}`,
    strokeSessions: gsStroke?.full ?? 0,
    pinyinSessions: gsPinyin?.full ?? 0,
    strokeProgress: ctx.isAuthenticated ? calcGroupProgress(group, ctx.statsStroke) : 0,
    strokeMastery: ctx.isAuthenticated ? calcGroupMastery(group, ctx.groupSessionsStroke) : 0,
    pinyinProgress: ctx.isAuthenticated ? calcGroupProgress(group, ctx.statsPinyin) : 0,
    pinyinMastery: ctx.isAuthenticated ? calcGroupMastery(group, ctx.groupSessionsPinyin) : 0,
  }
}
