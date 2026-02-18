import type { RegistryService } from '@svc/api/registry-service'
import type { DatasetMeta } from '@dat/registry'
import { prefsRepo } from '@low/idb-prefs-repo'
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
