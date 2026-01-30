import { createIdbPrefsRepo } from '../data/idb-prefs-repo.js'

const repo = createIdbPrefsRepo()

const KEYS = {
  groupsTags: (datasetId) => `groups:tags:${datasetId}`,
}

export const filtersApi = {
  async getGroupsTags(datasetId) {
    const tags = await repo.get(KEYS.groupsTags(datasetId))
    return tags ?? []
  },

  async setGroupsTags(datasetId, tags) {
    await repo.set(KEYS.groupsTags(datasetId), tags)
  },
}
