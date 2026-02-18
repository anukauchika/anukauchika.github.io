import { get } from 'svelte/store'
import { datasetRepo } from '@dat/dataset-repo'
import type { DatasetMeta, Dataset, Group, GroupViewMode } from '@dom/dataset'
import * as state from '@stt/dataset'

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
  const gs = get(state.groups)
  const s = get(state.search)
  const t = get(state.tags)
  const sg = get(state.selectedGroups)
  // Clean up invalid group selections
  if (sg.length > 0) {
    const validIds = new Set(gs.map((g) => g.id))
    const cleaned = sg.filter((id) => validIds.has(id))
    if (cleaned.length !== sg.length) {
      state.selectedGroups.set(cleaned)
    }
  }
  state.filteredGroups.set(filterGroups(gs, s, t, get(state.selectedGroups)))
}

function applyDataset(ds: Dataset) {
  state.currentDataset.set(ds)
  state.groups.set(ds.groups)
}

async function applyPrefs(repo: Awaited<typeof datasetRepo>, dsId: string) {
  const prefs = await repo.getPrefs(dsId)
  state.search.set(prefs.search)
  state.tags.set(prefs.tags)
  state.selectedGroups.set(prefs.groups)
  state.viewMode.set(prefs.viewMode)
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

export const datasetService: DatasetService = {
  async init() {
    const repo = await datasetRepo
    const allMeta = repo.getAllMeta()
    state.datasetsMeta.set(allMeta)

    const defaultId = allMeta[0]?.id ?? ''
    const prefs = await repo.getPrefs(defaultId)
    const preferredId = allMeta.some((m) => m.id === prefs.datasetId) ? prefs.datasetId : defaultId

    state.datasetId.set(preferredId)
    const ds = await repo.loadData(preferredId)
    if (ds) applyDataset(ds)

    await applyPrefs(repo, preferredId)
    recomputeFiltered()
    initialized = true
  },

  async selectDataset(id) {
    const repo = await datasetRepo
    const meta = repo.getMetaById(id)
    if (!meta) return

    initialized = false
    state.datasetId.set(id)
    const ds = await repo.loadData(id)
    if (ds) applyDataset(ds)

    await applyPrefs(repo, id)
    recomputeFiltered()
    initialized = true

    repo.setPrefId(id)
  },

  async reloadPrefs() {
    const repo = await datasetRepo
    // Switch IDB to current user
    // userId is passed in by auth via the hook — we import user from @stt/auth
    const { user } = await import('@stt/auth')
    const userId = get(user)?.id ?? null
    await repo.switchDatabase(userId)

    const id = get(state.datasetId)
    if (!id) return

    initialized = false
    await applyPrefs(repo, id)
    recomputeFiltered()
    initialized = true
  },

  setSearch(v) {
    state.search.set(v)
    recomputeFiltered()
    if (initialized) {
      debounce('search', async () => {
        const repo = await datasetRepo
        repo.setPrefSearch(get(state.datasetId), v)
      })
    }
  },

  setTags(v) {
    state.tags.set(v)
    recomputeFiltered()
    if (initialized) {
      debounce('tags', async () => {
        const repo = await datasetRepo
        repo.setPrefTags(get(state.datasetId), v)
      })
    }
  },

  setGroups(v) {
    state.selectedGroups.set(v)
    recomputeFiltered()
    if (initialized) {
      debounce('groups', async () => {
        const repo = await datasetRepo
        repo.setPrefGroups(get(state.datasetId), v)
      })
    }
  },

  setViewMode(v) {
    state.viewMode.set(v)
    if (initialized) {
      debounce('viewMode', async () => {
        const repo = await datasetRepo
        repo.setPrefViewMode(get(state.datasetId), v)
      })
    }
  },
}
