import { writable } from 'svelte/store'
import { filtersApi } from '../api/filters.js'

export const groupsSelectedTags = writable([])

let currentDatasetId = null

export async function loadGroupsTags(datasetId) {
  currentDatasetId = datasetId
  const tags = await filtersApi.getGroupsTags(datasetId)
  groupsSelectedTags.set(tags)
}

export async function setGroupsTags(tags) {
  groupsSelectedTags.set(tags)
  if (currentDatasetId) {
    await filtersApi.setGroupsTags(currentDatasetId, tags)
  }
}

export async function addGroupsTag(tag) {
  groupsSelectedTags.update((tags) => {
    if (tags.includes(tag)) return tags
    const next = [...tags, tag]
    if (currentDatasetId) {
      filtersApi.setGroupsTags(currentDatasetId, next)
    }
    return next
  })
}

export async function removeGroupsTag(tag) {
  groupsSelectedTags.update((tags) => {
    const next = tags.filter((t) => t !== tag)
    if (currentDatasetId) {
      filtersApi.setGroupsTags(currentDatasetId, next)
    }
    return next
  })
}
