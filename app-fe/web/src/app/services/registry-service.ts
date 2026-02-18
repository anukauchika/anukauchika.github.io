import type { RegistryService } from '@app/api/services/registry-service'
import type { DatasetMeta } from '@app/api/data/registry'
import { prefsRepo } from '@app/data/idb-prefs-repo'
import { jsonDatasetRepo } from '@app/data/json-dataset-repo'
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
