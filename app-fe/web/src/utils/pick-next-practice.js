/**
 * Picks the next group + practice type for spaced repetition.
 *
 * @param {Array<{group: number}>} groups - filtered group list
 * @param {Map<number, {full: number, lastPracticedAt: string}>} groupSessions - merged session summaries
 * @param {Map<number, {full: number}>} strokeSessions - stroke-only session summaries
 * @param {Map<number, {full: number}>} pinyinSessions - pinyin-only session summaries
 * @returns {{ groupId: number, type: 'stroke' | 'pinyin' } | null}
 */
export function pickNextPractice(groups, groupSessions, strokeSessions, pinyinSessions) {
  // Step 1: filter to groups with at least 1 completed session
  const eligible = groups.filter((g) => {
    const gs = groupSessions.get(g.group)
    return gs && gs.full >= 1
  })

  if (eligible.length === 0) return null

  // Step 2: sort by lastPracticedAt ascending (least recent first)
  eligible.sort((a, b) => {
    const aTime = groupSessions.get(a.group).lastPracticedAt || ''
    const bTime = groupSessions.get(b.group).lastPracticedAt || ''
    return aTime < bTime ? -1 : aTime > bTime ? 1 : 0
  })

  const groupId = eligible[0].group

  // Step 3: pick practice type with fewer full sessions (tie-break: stroke)
  const strokeFull = strokeSessions.get(groupId)?.full ?? 0
  const pinyinFull = pinyinSessions.get(groupId)?.full ?? 0
  const type = pinyinFull < strokeFull ? 'pinyin' : 'stroke'

  return { groupId, type }
}
