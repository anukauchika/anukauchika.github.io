import { createIdbPrefsRepo } from '../data/idb-prefs-repo.js'

const repo = createIdbPrefsRepo()

const KEYS = {
  mainSearch: (datasetId) => `main:search:${datasetId}`,
  mainTags: (datasetId) => `main:tags:${datasetId}`,
  mainGroup: (datasetId) => `main:group:${datasetId}`,
  mainCompact: (datasetId) => `main:compact:${datasetId}`,
}

export const filtersApi = {
  async getMainFilters(datasetId) {
    const [search, tags, group, compact] = await Promise.all([
      repo.get(KEYS.mainSearch(datasetId)),
      repo.get(KEYS.mainTags(datasetId)),
      repo.get(KEYS.mainGroup(datasetId)),
      repo.get(KEYS.mainCompact(datasetId)),
    ])
    return {
      search: search ?? '',
      tags: tags ?? [],
      group: group ?? 'all',
      compact: compact ?? false,
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

  async setMainCompact(datasetId, compact) {
    await repo.set(KEYS.mainCompact(datasetId), compact)
  },
}
