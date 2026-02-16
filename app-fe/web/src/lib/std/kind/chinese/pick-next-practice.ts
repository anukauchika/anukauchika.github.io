import type { GroupSessionSummary, SessionsMap } from '@app/api/services/kind/chinese/types'

interface GroupEntry {
  group: number | string
}

interface NextPractice {
  groupId: number | string
  type: 'stroke' | 'pinyin'
}

export function pickNextPractice(
  groups: GroupEntry[],
  groupSessions: SessionsMap,
  strokeSessions: SessionsMap,
  pinyinSessions: SessionsMap,
): NextPractice | null {
  // Step 1: filter to groups with at least 1 completed session
  const eligible = groups.filter((g) => {
    const gs = groupSessions.get(String(g.group))
    return gs && gs.full >= 1
  })

  if (eligible.length === 0) return null

  // Step 2: sort by lastPracticedAt ascending (least recent first)
  eligible.sort((a, b) => {
    const aTime = groupSessions.get(String(a.group))!.lastPracticedAt || ''
    const bTime = groupSessions.get(String(b.group))!.lastPracticedAt || ''
    return aTime < bTime ? -1 : aTime > bTime ? 1 : 0
  })

  const groupId = eligible[0].group

  // Step 3: pick practice type with fewer full sessions (tie-break: stroke)
  const strokeFull = strokeSessions.get(String(groupId))?.full ?? 0
  const pinyinFull = pinyinSessions.get(String(groupId))?.full ?? 0
  const type = pinyinFull < strokeFull ? 'pinyin' : 'stroke'

  return { groupId, type }
}
