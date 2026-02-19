import { timeAgo } from '@std/format'
import { calcGroupProgress, calcGroupMastery } from '@std/kind/chinese/stats'
import type { GroupId, WordKey } from '@dom/dataset'
import type { ChineseGroup } from '@dom/kind/chinese/dataset'
import type { WordProgress, GroupProgress } from '@dom/stats'

interface Context {
  basePath: string
  datasetId: string
  isAuthenticated: boolean
  groupSessions: Map<GroupId, GroupProgress>
  groupSessionsStroke: Map<GroupId, GroupProgress>
  groupSessionsPinyin: Map<GroupId, GroupProgress>
  statsStroke: Map<WordKey, WordProgress>
  statsPinyin: Map<WordKey, WordProgress>
}

export function buildProps(group: ChineseGroup, ctx: Context, from?: string) {
  const fromParam = from ? `&from=${from}` : ''
  const gsStroke = ctx.groupSessionsStroke.get(group.id)
  const gsPinyin = ctx.groupSessionsPinyin.get(group.id)
  return {
    groupId: group.displayId,
    lastDrilled: ctx.isAuthenticated ? timeAgo(ctx.groupSessions.get(group.id)?.lastDrilledAt) : undefined,
    tags: group.tags,
    strokeHref: `${ctx.basePath}/drill/hanzi?group=${group.id}&dataset=${ctx.datasetId}${fromParam}`,
    pinyinHref: `${ctx.basePath}/drill/pinyin?group=${group.id}&dataset=${ctx.datasetId}${fromParam}`,
    strokeSessions: gsStroke?.full ?? 0,
    pinyinSessions: gsPinyin?.full ?? 0,
    strokeProgress: ctx.isAuthenticated ? calcGroupProgress(group, ctx.statsStroke) : 0,
    strokeMastery: ctx.isAuthenticated ? calcGroupMastery(group, ctx.groupSessionsStroke) : 0,
    pinyinProgress: ctx.isAuthenticated ? calcGroupProgress(group, ctx.statsPinyin) : 0,
    pinyinMastery: ctx.isAuthenticated ? calcGroupMastery(group, ctx.groupSessionsPinyin) : 0,
  }
}
