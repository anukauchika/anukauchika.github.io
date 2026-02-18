import type { DatasetMeta } from '@dat/registry'
import { prefsRepo } from '@low/idb-prefs-repo'

export interface RegistryService {
  getDatasets(): DatasetMeta[]
  getDatasetById(id: string): DatasetMeta | null
  getDatasetByKind(kind: string): DatasetMeta | null
  getDatasetCode(id: string): string | null
  getDatasetDefaultId(): string
  loadDatasetData(meta: DatasetMeta): Record<string, unknown> | null
  loadPreferredId(): Promise<string>
  savePreferredId(id: string): Promise<void>
}
import { jsonDatasetRepo } from '@low/json-dataset-repo'
import registry from '@data/registry.json'

const datasets: DatasetMeta[] = registry as DatasetMeta[]
const defaultId = datasets[0]?.id ?? ''
const codeById: Record<string, string> = Object.fromEntries(datasets.map((d) => [d.id, d.code]))

export const registryService: RegistryService = {
  getDatasets: () => datasets,
  getDatasetById: (id) => datasets.find((d) => d.id === id) ?? null,
  getDatasetByKind: (kind) => datasets.find((d) => d.kind === kind) ?? null,
  getDatasetCode: (id) => codeById[id] ?? null,
  getDatasetDefaultId: () => defaultId,
  loadDatasetData: (meta) => jsonDatasetRepo.load(meta.path, meta.kind),
  loadPreferredId: () => prefsRepo.getDatasetId().then((id) => id ?? defaultId),
  savePreferredId: (id) => prefsRepo.setDatasetId(id),
}
