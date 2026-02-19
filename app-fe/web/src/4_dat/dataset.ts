import type { DatasetMeta, Dataset, DatasetPrefs, GroupViewMode } from '@dom/dataset'
import { lowDataset } from '@low/dataset'

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
  const allMeta = await lowDataset.loadRegistry()
  const byId = new Map(allMeta.map((m) => [m.id, m]))

  return {
    getAllMeta: () => allMeta,
    getMetaById: (id) => byId.get(id) ?? null,

    async loadData(id) {
      const meta = byId.get(id)
      if (!meta) return null
      return lowDataset.loadData(meta)
    },

    getPrefs: (dsId) => lowDataset.getPrefs(dsId),
    setPrefId: (id) => lowDataset.setPrefId(id),
    setPrefSearch: (dsId, v) => lowDataset.setPrefSearch(dsId, v),
    setPrefTags: (dsId, v) => lowDataset.setPrefTags(dsId, v),
    setPrefGroups: (dsId, v) => lowDataset.setPrefGroups(dsId, v),
    setPrefViewMode: (dsId, v) => lowDataset.setPrefViewMode(dsId, v),
    switchDatabase: (userId) => lowDataset.switchDatabase(userId),
  }
}

export const datDataset: Promise<DatasetRepo> = create()
