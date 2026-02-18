import type { Group } from '@dat/dataset'

interface Taggable {
  tags?: string[]
}

export interface GroupWithItems extends Group {
  items: Taggable[]
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function collectStrings(item: Record<string, unknown>): string[] {
  const values: string[] = []
  for (const v of Object.values(item)) {
    if (typeof v === 'string') values.push(v)
    if (Array.isArray(v)) for (const el of v) { if (typeof el === 'string') values.push(el) }
  }
  return values
}

function matchesQuery(item: Record<string, unknown>, query: string): boolean {
  if (!query) return true
  const raw = collectStrings(item).join(' ')
  const hayLower = raw.toLowerCase()
  const hayNorm = normalize(raw)
  const qLower = query.toLowerCase()
  const qNorm = normalize(query)
  return hayLower.includes(qLower) || (!!qNorm && hayNorm.includes(qNorm))
}

function matchesTags(item: Taggable, tags: string[]): boolean {
  if (tags.length === 0) return true
  const itemTags = item.tags || []
  return tags.every((t) => itemTags.includes(t))
}

function matchesGroupTags(group: Taggable, tags: string[]): boolean {
  if (tags.length === 0) return true
  const groupTags = group.tags || []
  return tags.every((t) => groupTags.includes(t))
}

function matchesGroup(groupId: number, selectedGroups: number[]): boolean {
  if (selectedGroups.length === 0) return true
  return selectedGroups.includes(groupId)
}

export function filterGroups(
  groups: GroupWithItems[],
  query: string,
  tags: string[],
  selectedGroups: number[],
): GroupWithItems[] {
  return groups
    .filter((g) => matchesGroup(g.id, selectedGroups))
    .map((g) => {
      const groupMatches = matchesGroupTags(g, tags)
      const items = g.items.filter(
        (item) => matchesQuery(item as Record<string, unknown>, query) && (groupMatches || matchesTags(item, tags))
      )
      return { ...g, items, _groupMatches: groupMatches }
    })
    .filter((g) => {
      const hasSearch = query.trim().length > 0
      if (hasSearch) return g.items.length > 0
      return g._groupMatches || g.items.length > 0
    })
}
