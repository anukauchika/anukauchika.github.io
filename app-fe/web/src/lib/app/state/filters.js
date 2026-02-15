import { writable } from 'svelte/store'
import { prefsRepo } from '@app/data/idb-prefs-repo'

export const mainSearch = writable('')
export const mainTags = writable([])
export const mainGroups = writable([])
export const mainListViewStyle = writable('full')

let mainDatasetId = null
let initialized = false

export async function loadMainFilters(datasetId) {
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
