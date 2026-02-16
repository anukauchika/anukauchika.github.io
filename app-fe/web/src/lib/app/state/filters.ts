import { writable, derived, get, type Writable, type Readable } from 'svelte/store'
import { prefsRepo } from '@app/data/idb-prefs-repo'
import { datasetId, currentDataset } from '@app/state/registry'
import { dbVersion } from '@app/state/auth'
import { filterGroups } from '@app/std/dataset'
import type { ListViewStyle } from '@app/api/data/prefs-repo'

export const mainSearch: Writable<string> = writable('')
export const mainTags: Writable<string[]> = writable([])
export const mainGroups: Writable<string[]> = writable([])
export const mainListViewStyle: Writable<ListViewStyle> = writable('full' as ListViewStyle)

export const groups: Readable<any[]> = derived(currentDataset, ($cd) => ($cd as any)?.data?.groups ?? [])
const searchFields: Readable<string[]> = derived(currentDataset, ($cd) => ($cd as any)?.data?.search ?? [])
export const filteredGroups: Readable<any[]> = derived(
  [groups, mainSearch, mainTags, mainGroups, searchFields],
  ([$groups, $search, $tags, $selectedGroups, $fields]) =>
    filterGroups($groups, $search, $tags, $selectedGroups, $fields)
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
    const validIds = new Set($groups.map((g: any) => g.group))
    const filtered = current.filter((id: any) => validIds.has(id))
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
