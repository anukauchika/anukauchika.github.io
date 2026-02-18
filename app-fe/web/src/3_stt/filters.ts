import { writable, derived, get, type Writable, type Readable } from 'svelte/store'
import { prefsRepo } from '@low/idb-prefs-repo'
import { datasetId, currentDataset } from '@stt/registry'
import { dbVersion } from '@stt/auth'
import { filterGroups, type GroupWithItems } from '@std/dataset'
import type { ListViewStyle } from '@dat/prefs-repo'

export const mainSearch: Writable<string> = writable('')
export const mainTags: Writable<string[]> = writable([])
export const mainGroups: Writable<number[]> = writable([])
export const mainListViewStyle: Writable<ListViewStyle> = writable('full' as ListViewStyle)

function getGroups(data: Record<string, unknown> | null): GroupWithItems[] {
  return (data as { groups?: GroupWithItems[] } | null)?.groups ?? []
}

export const groups: Readable<GroupWithItems[]> = derived(currentDataset, ($cd) => getGroups($cd?.data))
export const filteredGroups: Readable<GroupWithItems[]> = derived(
  [groups, mainSearch, mainTags, mainGroups],
  ([$groups, $search, $tags, $selectedGroups]) =>
    filterGroups($groups, $search, $tags, $selectedGroups)
)

let mainDatasetId: string | null = null
let initialized = false

export async function loadMainFilters(datasetId: string): Promise<void> {
  mainDatasetId = datasetId
  initialized = false
  const filters = await prefsRepo.getMainFilters(datasetId)
  mainSearch.set(filters.search)
  mainTags.set(filters.tags)
  mainGroups.set(filters.groups)
  mainListViewStyle.set(filters.listViewStyle)
  initialized = true
}

// Auto-load filters when dataset or db version changes
derived([datasetId, dbVersion], ([$id, $ver]) => ({ id: $id, ver: $ver }))
  .subscribe(({ id }) => { if (id) loadMainFilters(id) })

// Clean up invalid group selections when dataset groups change
groups.subscribe(($groups) => {
  if (!initialized) return
  const current = get(mainGroups)
  if (current.length > 0) {
    const validIds = new Set($groups.map((g) => g.id))
    const filtered = current.filter((id) => validIds.has(id))
    if (filtered.length !== current.length) mainGroups.set(filtered)
  }
})

// Auto-persist on changes
mainSearch.subscribe((value) => {
  if (initialized && mainDatasetId) {
    prefsRepo.setMainSearch(mainDatasetId, value)
  }
})

mainTags.subscribe((value) => {
  if (initialized && mainDatasetId) {
    prefsRepo.setMainTags(mainDatasetId, value)
  }
})

mainGroups.subscribe((value) => {
  if (initialized && mainDatasetId) {
    prefsRepo.setMainGroups(mainDatasetId, value)
  }
})

mainListViewStyle.subscribe((value) => {
  if (initialized && mainDatasetId) {
    prefsRepo.setMainListViewStyle(mainDatasetId, value)
  }
})
