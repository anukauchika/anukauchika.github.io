import { datDataset } from '@dat/dataset'
import type { DatasetMeta, Dataset, Group, GroupViewMode } from '@dom/dataset'
import { sttDataset } from '@stt/dataset.svelte.js'
import { sttAuth } from '@stt/auth.svelte.js'

// --- Filter logic (moved from @std/dataset.ts) ---

interface Taggable {
  tags?: string[]
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

function filterGroups(
  groups: Group[],
  query: string,
  tags: string[],
  selectedGroups: number[],
): Group[] {
  return groups
    .filter((g) => matchesGroup(g.id, selectedGroups))
    .map((g) => {
      const groupMatches = matchesGroupTags(g, tags)
      const items = g.items.filter(
        (item) => matchesQuery(item as unknown as Record<string, unknown>, query) && (groupMatches || matchesTags(item, tags)),
      )
      return { ...g, items, _groupMatches: groupMatches }
    })
    .filter((g) => {
      const hasSearch = query.trim().length > 0
      if (hasSearch) return g.items.length > 0
      return (g as { _groupMatches?: boolean })._groupMatches || g.items.length > 0
    })
}

// --- Service internals ---

let initialized = false
const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {}

function debounce(key: string, fn: () => void, ms = 300) {
  clearTimeout(debounceTimers[key])
  debounceTimers[key] = setTimeout(fn, ms)
}

function recomputeFiltered() {
  const sg = sttDataset.prefGroups
  // Clean up invalid group selections
  if (sg.length > 0) {
    const validIds = new Set(sttDataset.groups.map((g) => g.id))
    const cleaned = sg.filter((id) => validIds.has(id))
    if (cleaned.length !== sg.length) {
      sttDataset.prefGroups = cleaned
    }
  }
  sttDataset.filtered = filterGroups(sttDataset.groups, sttDataset.prefSearch, sttDataset.prefTags, sttDataset.prefGroups)
}

function applyDataset(dataset: Dataset) {
  sttDataset.current = dataset
  sttDataset.groups = dataset.groups
}

async function applyPrefs(repo: Awaited<typeof datDataset>, dsId: string) {
  const prefs = await repo.getPrefs(dsId)
  sttDataset.prefSearch = prefs.search
  sttDataset.prefTags = prefs.tags
  sttDataset.prefGroups = prefs.groups
  sttDataset.prefViewMode = prefs.viewMode
}

// --- Public service ---

export interface DatasetService {
  init(): Promise<void>
  selectDataset(id: string): Promise<void>
  reloadPrefs(): Promise<void>
  setSearch(v: string): void
  setTags(v: string[]): void
  setGroups(v: number[]): void
  setViewMode(v: GroupViewMode): void
}

export const svcDataset: DatasetService = {
  async init() {
    const repo = await datDataset
    const allMeta = repo.getAllMeta()
    sttDataset.meta = allMeta

    const defaultId = allMeta[0]?.id ?? ''
    const prefs = await repo.getPrefs(defaultId)
    const preferredId = allMeta.some((m) => m.id === prefs.datasetId) ? prefs.datasetId : defaultId

    sttDataset.id = preferredId
    const dataset = await repo.loadData(preferredId)
    if (dataset) applyDataset(dataset)

    await applyPrefs(repo, preferredId)
    recomputeFiltered()
    initialized = true
  },

  async selectDataset(dsId) {
    const repo = await datDataset
    const m = repo.getMetaById(dsId)
    if (!m) return

    initialized = false
    sttDataset.id = dsId
    const dataset = await repo.loadData(dsId)
    if (dataset) applyDataset(dataset)

    await applyPrefs(repo, dsId)
    recomputeFiltered()
    initialized = true

    repo.setPrefId(dsId)
  },

  async reloadPrefs() {
    const repo = await datDataset
    await repo.switchDatabase(sttAuth.user?.id ?? null)

    if (!sttDataset.id) return

    initialized = false
    await applyPrefs(repo, sttDataset.id)
    recomputeFiltered()
    initialized = true
  },

  setSearch(v) {
    sttDataset.prefSearch = v
    recomputeFiltered()
    if (initialized) {
      debounce('search', async () => {
        const repo = await datDataset
        repo.setPrefSearch(sttDataset.id, v)
      })
    }
  },

  setTags(v) {
    sttDataset.prefTags = v
    recomputeFiltered()
    if (initialized) {
      debounce('tags', async () => {
        const repo = await datDataset
        repo.setPrefTags(sttDataset.id, v)
      })
    }
  },

  setGroups(v) {
    sttDataset.prefGroups = v
    recomputeFiltered()
    if (initialized) {
      debounce('groups', async () => {
        const repo = await datDataset
        repo.setPrefGroups(sttDataset.id, v)
      })
    }
  },

  setViewMode(v) {
    sttDataset.prefViewMode = v
    if (initialized) {
      debounce('viewMode', async () => {
        const repo = await datDataset
        repo.setPrefViewMode(sttDataset.id, v)
      })
    }
  },
}
