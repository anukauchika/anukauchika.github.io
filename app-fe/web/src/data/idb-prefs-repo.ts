import { req, createDatabase } from './idb'
import type { PrefsRepo } from '../api/prefs-repo'
import type { ListViewStyle, MainFilters } from '../api/types'

const PREFS_STORE = 'prefs'

const prefsDb = createDatabase('uch-prefs', 1, (db) => {
  if (!db.objectStoreNames.contains(PREFS_STORE)) {
    db.createObjectStore(PREFS_STORE, { keyPath: 'key' })
  }
})

// --- Internal helpers ---

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

// --- Interface methods ---

async function switchDatabase(userId: string | null): Promise<void> {
  await prefsDb.switchUser(userId)
}

async function getDatasetId(): Promise<string | null> {
  return get('datasetId')
}

async function setDatasetId(value: string): Promise<void> {
  return set('datasetId', value)
}

async function getMainFilters(datasetId: string): Promise<MainFilters> {
  const [search, tags, groups, listViewStyle] = await Promise.all([
    get(`main:search:${datasetId}`),
    get(`main:tags:${datasetId}`),
    get(`main:group:${datasetId}`),
    get(`main:compact:${datasetId}`),
  ])
  return {
    search: search ?? '',
    tags: tags ?? [],
    groups: Array.isArray(groups) ? groups : [],
    listViewStyle: listViewStyle === true || listViewStyle === 'compact' ? 'compact' : 'full',
  }
}

async function setMainSearch(datasetId: string, value: string): Promise<void> {
  return set(`main:search:${datasetId}`, value)
}

async function setMainTags(datasetId: string, value: string[]): Promise<void> {
  return set(`main:tags:${datasetId}`, value)
}

async function setMainGroups(datasetId: string, value: string[]): Promise<void> {
  return set(`main:group:${datasetId}`, value)
}

async function setMainListViewStyle(datasetId: string, value: ListViewStyle): Promise<void> {
  return set(`main:compact:${datasetId}`, value)
}

// --- PrefsRepo object ---

export const prefsRepo: PrefsRepo = {
  getDatasetId,
  setDatasetId,
  getMainFilters,
  setMainSearch,
  setMainTags,
  setMainGroups,
  setMainListViewStyle,
  switchDatabase,
}
