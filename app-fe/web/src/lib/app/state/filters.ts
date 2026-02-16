import { writable, type Writable } from 'svelte/store'
import { prefsRepo } from '@app/data/idb-prefs-repo'
import type { ListViewStyle } from '@app/api/data/prefs-repo'

export const mainSearch: Writable<string> = writable('')
export const mainTags: Writable<string[]> = writable([])
export const mainGroups: Writable<string[]> = writable([])
export const mainListViewStyle: Writable<ListViewStyle> = writable('full' as ListViewStyle)

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
