import { writable, derived, type Writable, type Readable } from 'svelte/store'
import type { DatasetMeta } from '@dat/registry'
import type { ChineseDataset } from '@dat/kind/chinese/dataset'
import { registryService } from '@svc/registry-service'

export interface Dataset extends DatasetMeta {
  data: Record<string, unknown> | null
}

export const datasets: Dataset[] = registryService.getDatasets().map((entry) => ({
  ...entry,
  data: registryService.loadDatasetData(entry),
}))

const defaultDatasetId = registryService.getDatasetDefaultId()

export const datasetId: Writable<string> = writable(defaultDatasetId)

// Load saved preference on startup
registryService.loadPreferredId().then((saved) => {
  if (saved && datasets.some((d) => d.id === saved)) {
    datasetId.set(saved)
  }
})

/** Re-read saved dataset from (switched) prefs DB */
export async function reloadDatasetPref(): Promise<void> {
  const saved = await registryService.loadPreferredId()
  if (saved && datasets.some((d) => d.id === saved)) {
    datasetId.set(saved)
  } else {
    datasetId.set(defaultDatasetId)
  }
}

// Persist whenever datasetId changes
datasetId.subscribe((id) => {
  if (id) registryService.savePreferredId(id)
})

export const currentDataset: Readable<Dataset> = derived(datasetId, ($datasetId) => {
  return datasets.find((d) => d.id === $datasetId) ?? datasets[0] ?? null
})

export const setDatasetById = (id: string): void => {
  datasetId.set(id)
}

export const setDatasetByKind = (kind: string): void => {
  const match = datasets.find((d) => d.kind === kind) ?? datasets[0]
  if (match?.id) datasetId.set(match.id)
}

export function getChineseContent(ds: Dataset): ChineseDataset | null {
  if (ds?.kind !== 'chinese' || !ds.data) return null
  return ds.data as unknown as ChineseDataset
}
