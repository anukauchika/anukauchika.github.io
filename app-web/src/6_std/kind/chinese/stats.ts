import type { ChineseGroup } from '@dom/kind/chinese/dataset'
import { ChineseDrillType } from '@dom/kind/chinese/dataset'
import type { ChineseNextDrill } from '@dom/kind/chinese/stats'
import type { GroupId } from '@dom/dataset'
import type { WordProgress, GroupProgress } from '@dom/stats'

// --- Drill sorting ---

// Stroke errors count less — they are expected during character learning.
// Pinyin errors are a stronger signal of not knowing the word.
const DRILL_ERROR_WEIGHT: Record<ChineseDrillType, number> = {
  [ChineseDrillType.Stroke]: 0.2,
  [ChineseDrillType.Pinyin]: 0.4,
}
// Difficulty can reduce effective success count by at most 50%.
const DIFFICULTY_SORT_IMPACT = 0.5

export function calcWordSortScore(wp: WordProgress | undefined, drillType: ChineseDrillType): number {
  const errorWeight = DRILL_ERROR_WEIGHT[drillType]
  const resolved = wp ?? { successCount: 0, errorCount: 0, hintCount: 0, lastDrilledAt: null }
  const errorRate = resolved.errorCount / Math.max(1, resolved.successCount + resolved.errorCount)
  const hintRate = (resolved.hintCount ?? 0) / Math.max(1, resolved.successCount + (resolved.hintCount ?? 0))
  const difficulty = Math.min(1, errorWeight * errorRate + 0.7 * hintRate)
  return resolved.successCount * (1 - difficulty * DIFFICULTY_SORT_IMPACT)
}

// --- Spaced Repetition ---

export type ReviewState = 'new' | 'repeat' | 'due' | 'upcoming'

export interface TypeReview {
  state: ReviewState
  dueAt: number
  queuedAt: number
  intervalDays: number | null
}

function ts(value: string | null | undefined, fallback: number): number {
  if (!value) return fallback
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : fallback
}

export function calcReviewInterval(cleanCount: number): number | null {
  if (cleanCount <= 0) return null
  return Math.pow(2, cleanCount - 1)
}

export function calcTypeReview(gp: GroupProgress | undefined): TypeReview {
  if (!gp || gp.full === 0) {
    return { state: 'new', dueAt: Infinity, queuedAt: Infinity, intervalDays: null }
  }

  const queuedAt = ts(gp.firstDrilledAt, Infinity)
  if (gp.reviewState) {
    return {
      state: gp.reviewState,
      dueAt: gp.dueAt ? ts(gp.dueAt, Infinity) : ts(gp.lastFullDrillAt, 0),
      queuedAt,
      intervalDays: gp.intervalDays ?? null,
    }
  }

  if ((gp.lastSessionHintCount ?? 0) > 0) {
    return { state: 'repeat', dueAt: ts(gp.lastFullDrillAt, 0), queuedAt, intervalDays: null }
  }

  const intervalDays = calcReviewInterval(gp.clean)
  if (!intervalDays || !gp.lastCleanDrillAt) {
    return { state: 'repeat', dueAt: ts(gp.lastFullDrillAt, 0), queuedAt, intervalDays: null }
  }

  const dueAt = new Date(gp.lastCleanDrillAt).getTime() + intervalDays * 24 * 60 * 60 * 1000
  // Date-granular like the server: anything due any time today is due now.
  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)
  return { state: dueAt <= endOfToday.getTime() ? 'due' : 'upcoming', dueAt, queuedAt, intervalDays }
}

export function countDueDrills(
  groups: ChineseGroup[],
  strokeProgress: Map<GroupId, GroupProgress>,
  pinyinProgress: Map<GroupId, GroupProgress>,
): number {
  return groups.reduce((sum, g) => {
    const stroke = calcTypeReview(strokeProgress.get(g.id))
    const pinyin = calcTypeReview(pinyinProgress.get(g.id))
    return sum
      + (stroke.state === 'repeat' || stroke.state === 'due' ? 1 : 0)
      + (pinyin.state === 'repeat' || pinyin.state === 'due' ? 1 : 0)
  }, 0)
}

export function calcNextDrill(
  groups: ChineseGroup[],
  strokeProgress: Map<GroupId, GroupProgress>,
  pinyinProgress: Map<GroupId, GroupProgress>,
): ChineseNextDrill | null {
  const rank = (review: TypeReview): number => {
    if (review.state === 'repeat') return 0
    if (review.state === 'due') return 1
    if (review.state === 'upcoming') return 2
    return 3
  }

  let best: { groupId: number; type: 'stroke' | 'pinyin'; rank: number; dueAt: number } | null = null
  for (const group of groups) {
    const candidates: Array<{ groupId: number; type: 'stroke' | 'pinyin'; review: TypeReview }> = [
      { groupId: group.id, type: 'stroke', review: calcTypeReview(strokeProgress.get(group.id)) },
      { groupId: group.id, type: 'pinyin', review: calcTypeReview(pinyinProgress.get(group.id)) },
    ]

    for (const candidate of candidates) {
      const candidateRank = rank(candidate.review)
      const dueAt = candidate.review.dueAt
      if (
        !best ||
        candidateRank < best.rank ||
        (candidateRank === best.rank && dueAt < best.dueAt) ||
        (candidateRank === best.rank && dueAt === best.dueAt && candidate.groupId < best.groupId)
      ) {
        best = { groupId: candidate.groupId, type: candidate.type, rank: candidateRank, dueAt }
      }
    }
  }

  return best ? { groupId: best.groupId, type: best.type } : null
}
