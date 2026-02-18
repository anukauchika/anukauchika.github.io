import type { DatasetMeta } from '@app/api/data/registry'

export interface RegistryService {
  getDatasets(): DatasetMeta[]
  getDatasetById(id: string): DatasetMeta | null
  getDatasetByKind(kind: string): DatasetMeta | null
  getDatasetCode(id: string): string | null
  getDatasetDefaultId(): string

  // Dataset data loading (wraps datasetRepo — keeps state layer clean)
  loadDatasetData(meta: DatasetMeta): Record<string, unknown> | null

  // Dataset preference (wraps prefsRepo — keeps state layer clean)
  loadPreferredId(): Promise<string>
  savePreferredId(id: string): Promise<void>
}
