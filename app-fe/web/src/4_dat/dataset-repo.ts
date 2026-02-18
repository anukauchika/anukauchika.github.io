import type { DatasetMeta, Dataset, DatasetPrefs, GroupViewMode } from '@dom/dataset'
import { datasetApi } from '@low/dataset-api'

export interface DatasetRepo {
  getAllMeta(): DatasetMeta[]
  getMetaById(id: string): DatasetMeta | null
  loadData(id: string): Promise<Dataset | null>
  getPrefs(datasetId: string): Promise<DatasetPrefs>
  setPrefId(id: string): Promise<void>
  setPrefSearch(datasetId: string, v: string): Promise<void>
  setPrefTags(datasetId: string, v: string[]): Promise<void>
  setPrefGroups(datasetId: string, v: number[]): Promise<void>
  setPrefViewMode(datasetId: string, v: GroupViewMode): Promise<void>
  switchDatabase(userId: string | null): Promise<void>
}

async function create(): Promise<DatasetRepo> {
  const allMeta = await datasetApi.loadRegistry()
  const byId = new Map(allMeta.map((m) => [m.id, m]))

  return {
    getAllMeta: () => allMeta,
    getMetaById: (id) => byId.get(id) ?? null,

    async loadData(id) {
      const meta = byId.get(id)
      if (!meta) return null
      return datasetApi.loadData(meta)
    },

    getPrefs: (dsId) => datasetApi.getPrefs(dsId),
    setPrefId: (id) => datasetApi.setPrefId(id),
    setPrefSearch: (dsId, v) => datasetApi.setPrefSearch(dsId, v),
    setPrefTags: (dsId, v) => datasetApi.setPrefTags(dsId, v),
    setPrefGroups: (dsId, v) => datasetApi.setPrefGroups(dsId, v),
    setPrefViewMode: (dsId, v) => datasetApi.setPrefViewMode(dsId, v),
    switchDatabase: (userId) => datasetApi.switchDatabase(userId),
  }
}

export const datasetRepo: Promise<DatasetRepo> = create()
