import { writable } from 'svelte/store'
import { filtersApi } from '../supabase/filters.js'

export const mainSearch = writable('')
export const mainTags = writable([])
export const mainGroup = writable([])
export const mainCompact = writable(false)

let mainDatasetId = null
let initialized = false

export async function loadMainFilters(datasetId) {
  mainDatasetId = datasetId
  initialized = false
  const filters = await filtersApi.getMainFilters(datasetId)
  mainSearch.set(filters.search)
  mainTags.set(filters.tags)
  mainGroup.set(filters.group)
  mainCompact.set(filters.compact)
  initialized = true
}

// Auto-persist on changes
mainSearch.subscribe((value) => {
  if (initialized && mainDatasetId) {
    filtersApi.setMainSearch(mainDatasetId, value)
  }
})

mainTags.subscribe((value) => {
  if (initialized && mainDatasetId) {
    filtersApi.setMainTags(mainDatasetId, value)
  }
})

mainGroup.subscribe((value) => {
  if (initialized && mainDatasetId) {
    filtersApi.setMainGroup(mainDatasetId, value)
  }
})

mainCompact.subscribe((value) => {
  if (initialized && mainDatasetId) {
    filtersApi.setMainCompact(mainDatasetId, value)
  }
})
