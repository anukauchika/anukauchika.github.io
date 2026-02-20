import type { DatasetMeta, Dataset, DatasetPrefs, Group, Word } from '@dom/dataset'
import { GroupViewMode } from '@dom/dataset'
import { prefsGet, prefsSet, prefsSwitchUser } from '@low/prefs-db'
import { parseChineseDataset, type RawChineseDataset } from '@low/kind/chinese/parse-dataset'
import { formatGroup } from '@std/format'
import registry from '@data/registry.json'

// --- JSON loading ---

const dataModules = import.meta.glob('@data/**/*.json', { eager: true, import: 'default' }) as Record<string, unknown>

const dataByPath: Record<string, unknown> = {}
for (const [key, value] of Object.entries(dataModules)) {
  const normalizedPath = key.replace(/^(\.\.\/|\.\/|\/)+/, '')
  dataByPath[normalizedPath] = value
}

// Generic group normalization — adds idx/id/displayId from raw `group` field
interface RawGroup { group: number; tags?: string[]; items: RawItem[] }
interface RawItem { id: number; word: string; tags?: string[]; [key: string]: unknown }

function normalizeGroups(raw: { groups?: RawGroup[] }): Group[] {
  return (raw.groups ?? []).map((g): Group => ({
    ...g,
    idx: g.group,
    id: g.group,
    displayId: formatGroup(g.group),
    items: g.items.map((item): Word => ({
      ...item,
      idx: item.id,
      id: item.id,
      displayId: String(item.id),
      word: item.word,
    })),
  }))
}

function parse(raw: unknown, meta: DatasetMeta): Dataset | null {
  if (!raw) return null
  if (meta.kind === 'chinese') {
    const content = parseChineseDataset(raw as RawChineseDataset)
    return { ...meta, ...content } as unknown as Dataset
  }
  // Generic: normalize groups to add idx/id/displayId
  const groups = normalizeGroups(raw as { groups?: RawGroup[] })
  return { ...meta, ...(raw as Record<string, unknown>), groups } as unknown as Dataset
}

const get = prefsGet
const set = prefsSet

// --- DatasetApi ---

export interface DatasetApi {
  loadRegistry(): Promise<DatasetMeta[]>
  loadData(meta: DatasetMeta): Promise<Dataset | null>
  getPrefs(datasetId: string): Promise<DatasetPrefs>
  setPrefSearch(datasetId: string, v: string): Promise<void>
  setPrefTags(datasetId: string, v: string[]): Promise<void>
  setPrefGroups(datasetId: string, v: number[]): Promise<void>
  setPrefViewMode(datasetId: string, v: GroupViewMode): Promise<void>
  switchDatabase(userId: string | null): Promise<void>
}

export const lowDataset: DatasetApi = {
  async loadRegistry() {
    return registry as DatasetMeta[]
  },

  async loadData(meta) {
    return parse(dataByPath[meta.path], meta)
  },

  async getPrefs(datasetId) {
    const [search, tags, groups, viewMode] = await Promise.all([
      get(`main:search:${datasetId}`),
      get(`main:tags:${datasetId}`),
      get(`main:group:${datasetId}`),
      get(`main:compact:${datasetId}`),
    ])
    return {
      search: (search as string) ?? '',
      tags: (tags as string[]) ?? [],
      groups: Array.isArray(groups) ? groups : [],
      viewMode: viewMode === true || viewMode === 'compact' ? GroupViewMode.Compact : GroupViewMode.Full,
    }
  },

  async setPrefSearch(datasetId, v) {
    return set(`main:search:${datasetId}`, v)
  },

  async setPrefTags(datasetId, v) {
    return set(`main:tags:${datasetId}`, v)
  },

  async setPrefGroups(datasetId, v) {
    return set(`main:group:${datasetId}`, v)
  },

  async setPrefViewMode(datasetId, v) {
    return set(`main:compact:${datasetId}`, v)
  },

  async switchDatabase(userId) {
    await prefsSwitchUser(userId)
  },
}
