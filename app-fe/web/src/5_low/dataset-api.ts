import type { DatasetMeta, Dataset, DatasetPrefs, Group, Word } from '@dom/dataset'
import { GroupViewMode } from '@dom/dataset'
import { req, createDatabase } from '@low/idb'
import { parseChineseDataset, type RawChineseDataset } from '@low/kind/chinese/parse-dataset'
import { formatGroup } from '@std/format'
import registry from '@data/registry.json'

// --- JSON loading ---

const dataModules = import.meta.glob('@data/**/*.json', { eager: true, import: 'default' }) as Record<string, unknown>

const dataByPath: Record<string, unknown> = {}
for (const [key, value] of Object.entries(dataModules)) {
  const normalizedPath = key.replace(/^(\.\.\/)+/, '')
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

// --- IDB prefs ---

const PREFS_STORE = 'prefs'

const prefsDb = createDatabase('uch-prefs', 1, (db) => {
  if (!db.objectStoreNames.contains(PREFS_STORE)) {
    db.createObjectStore(PREFS_STORE, { keyPath: 'key' })
  }
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function get(key: string): Promise<any> {
  const db = await prefsDb.db()
  const store = db.transaction(PREFS_STORE, 'readonly').objectStore(PREFS_STORE)
  const result = await req(store.get(key))
  return result?.value ?? null
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function set(key: string, value: any): Promise<void> {
  const db = await prefsDb.db()
  const store = db.transaction(PREFS_STORE, 'readwrite').objectStore(PREFS_STORE)
  await req(store.put({ key, value }))
}

// --- DatasetApi ---

export interface DatasetApi {
  loadRegistry(): Promise<DatasetMeta[]>
  loadData(meta: DatasetMeta): Promise<Dataset | null>
  getPrefs(datasetId: string): Promise<DatasetPrefs>
  setPrefId(id: string): Promise<void>
  setPrefSearch(datasetId: string, v: string): Promise<void>
  setPrefTags(datasetId: string, v: string[]): Promise<void>
  setPrefGroups(datasetId: string, v: number[]): Promise<void>
  setPrefViewMode(datasetId: string, v: GroupViewMode): Promise<void>
  switchDatabase(userId: string | null): Promise<void>
}

export const datasetApi: DatasetApi = {
  async loadRegistry() {
    return registry as DatasetMeta[]
  },

  async loadData(meta) {
    return parse(dataByPath[meta.path], meta)
  },

  async getPrefs(datasetId) {
    const [id, search, tags, groups, viewMode] = await Promise.all([
      get('datasetId'),
      get(`main:search:${datasetId}`),
      get(`main:tags:${datasetId}`),
      get(`main:group:${datasetId}`),
      get(`main:compact:${datasetId}`),
    ])
    return {
      datasetId: id ?? datasetId,
      search: search ?? '',
      tags: tags ?? [],
      groups: Array.isArray(groups) ? groups : [],
      viewMode: viewMode === true || viewMode === 'compact' ? GroupViewMode.Compact : GroupViewMode.Full,
    }
  },

  async setPrefId(id) {
    return set('datasetId', id)
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
    await prefsDb.switchUser(userId)
  },
}
