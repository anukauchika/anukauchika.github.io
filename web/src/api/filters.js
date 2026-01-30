import { createIdbPrefsRepo } from '../data/idb-prefs-repo.js'

const repo = createIdbPrefsRepo()

const KEYS = {
  groupsTags: (datasetId) => `groups:tags:${datasetId}`,
  mainSearch: (datasetId) => `main:search:${datasetId}`,
  mainTags: (datasetId) => `main:tags:${datasetId}`,
  mainGroup: (datasetId) => `main:group:${datasetId}`,
}

export const filtersApi = {
  // Groups page
  async getGroupsTags(datasetId) {
    const tags = await repo.get(KEYS.groupsTags(datasetId))
    return tags ?? []
  },

  async setGroupsTags(datasetId, tags) {
    await repo.set(KEYS.groupsTags(datasetId), tags)
  },

  // Main page
  async getMainFilters(datasetId) {
    const [search, tags, group] = await Promise.all([
      repo.get(KEYS.mainSearch(datasetId)),
      repo.get(KEYS.mainTags(datasetId)),
      repo.get(KEYS.mainGroup(datasetId)),
    ])
    return {
      search: search ?? '',
      tags: tags ?? [],
      group: group ?? 'all',
    }
  },

  async setMainSearch(datasetId, search) {
    await repo.set(KEYS.mainSearch(datasetId), search)
  },

  async setMainTags(datasetId, tags) {
    await repo.set(KEYS.mainTags(datasetId), tags)
  },

  async setMainGroup(datasetId, group) {
    await repo.set(KEYS.mainGroup(datasetId), group)
  },
}
