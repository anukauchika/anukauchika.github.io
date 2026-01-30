import { writable } from 'svelte/store'
import { filtersApi } from '../api/filters.js'

// ============ Groups page ============
export const groupsSelectedTags = writable([])

let groupsDatasetId = null

export async function loadGroupsTags(datasetId) {
  groupsDatasetId = datasetId
  const tags = await filtersApi.getGroupsTags(datasetId)
  groupsSelectedTags.set(tags)
}

export async function addGroupsTag(tag) {
  groupsSelectedTags.update((tags) => {
    if (tags.includes(tag)) return tags
    const next = [...tags, tag]
    if (groupsDatasetId) {
      filtersApi.setGroupsTags(groupsDatasetId, next)
    }
    return next
  })
}

export async function removeGroupsTag(tag) {
  groupsSelectedTags.update((tags) => {
    const next = tags.filter((t) => t !== tag)
    if (groupsDatasetId) {
      filtersApi.setGroupsTags(groupsDatasetId, next)
    }
    return next
  })
}

// ============ Main page ============
export const mainSearch = writable('')
export const mainTags = writable([])
export const mainGroup = writable('all')

let mainDatasetId = null
let initialized = false

export async function loadMainFilters(datasetId) {
  mainDatasetId = datasetId
  initialized = false
  const filters = await filtersApi.getMainFilters(datasetId)
  mainSearch.set(filters.search)
  mainTags.set(filters.tags)
  mainGroup.set(filters.group)
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
