import type { Group } from '@app/api/data/dataset'
import type { SessionsMap } from '@app/api/services/kind/chinese/types'

interface NextPractice {
  groupId: string
  type: 'stroke' | 'pinyin'
}

export function pickNextPractice(
  groups: Group[],
  groupSessions: SessionsMap,
  strokeSessions: SessionsMap,
  pinyinSessions: SessionsMap,
): NextPractice | null {
  // Step 1: filter to groups with at least 1 completed session
  const eligible = groups.filter((g) => {
    const gs = groupSessions.get(g.id)
    return gs && gs.full >= 1
  })

  if (eligible.length === 0) return null

  // Step 2: sort by lastPracticedAt ascending (least recent first)
  eligible.sort((a, b) => {
    const aTime = groupSessions.get(a.id)!.lastPracticedAt || ''
    const bTime = groupSessions.get(b.id)!.lastPracticedAt || ''
    return aTime < bTime ? -1 : aTime > bTime ? 1 : 0
  })

  const groupId = eligible[0].id

  // Step 3: pick practice type with fewer full sessions (tie-break: stroke)
  const strokeFull = strokeSessions.get(groupId)?.full ?? 0
  const pinyinFull = pinyinSessions.get(groupId)?.full ?? 0
  const type = pinyinFull < strokeFull ? 'pinyin' : 'stroke'

  return { groupId, type }
}
