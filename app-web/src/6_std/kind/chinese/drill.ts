import type { Group, GroupId } from '@dom/dataset'
import type { GroupProgress } from '@dom/stats'

interface NextDrill {
  groupId: number
  type: 'stroke' | 'pinyin'
}

export function pickNextDrill(
  groups: Group[],
  groupSessions: Map<GroupId, GroupProgress>,
  strokeSessions: Map<GroupId, GroupProgress>,
  pinyinSessions: Map<GroupId, GroupProgress>,
): NextDrill | null {
  // Step 1: filter to groups with at least 1 completed session
  const eligible = groups.filter((g) => {
    const gs = groupSessions.get(g.id)
    return gs && gs.full >= 1
  })

  if (eligible.length === 0) return null

  // Step 2: sort by lastDrilledAt ascending (least recent first)
  eligible.sort((a, b) => {
    const aTime = groupSessions.get(a.id)!.lastDrilledAt || ''
    const bTime = groupSessions.get(b.id)!.lastDrilledAt || ''
    return aTime < bTime ? -1 : aTime > bTime ? 1 : 0
  })

  const groupId = eligible[0].id

  // Step 3: pick drill type with fewer full sessions (tie-break: stroke)
  const strokeFull = strokeSessions.get(groupId)?.full ?? 0
  const pinyinFull = pinyinSessions.get(groupId)?.full ?? 0
  const type = pinyinFull < strokeFull ? 'pinyin' : 'stroke'

  return { groupId, type }
}
