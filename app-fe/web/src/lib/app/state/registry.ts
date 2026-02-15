import { writable, derived, type Writable, type Readable } from 'svelte/store'
import registry from '../../../../../data/registry.json'
import { prefsRepo } from '@app/data/idb-prefs-repo'

interface RegistryEntry {
  id: string
  code: string
  name: string
  appTitle: string
  path: string
  description: string
  tags: string[]
  kind: string
}

export interface Dataset extends RegistryEntry {
  data: Record<string, unknown> | null
}

// Dynamically import all JSON files from data directory
const dataModules = import.meta.glob('../../../../../data/**/*.json', { eager: true, import: 'default' }) as Record<string, unknown>

// Build path mapping from glob results
// Glob paths are relative: '../../../../../data/chinese/sherzod.json'
// Registry paths are absolute: 'data/chinese/sherzod.json'
const dataByPath: Record<string, unknown> = {}
for (const [key, value] of Object.entries(dataModules)) {
  const normalizedPath = key.replace(/^(\.\.\/)+/, '')
  dataByPath[normalizedPath] = value
}

export const datasets: Dataset[] = (registry as RegistryEntry[]).map((entry) => ({
  ...entry,
  data: (dataByPath[entry.path] as Record<string, unknown>) ?? null,
}))

const defaultDatasetId = datasets[0]?.id ?? ''

export const datasetId: Writable<string> = writable(defaultDatasetId)

// Load saved preference from IDB on startup
prefsRepo.getDatasetId().then((saved) => {
  if (saved && datasets.some((d) => d.id === saved)) {
    datasetId.set(saved)
  }
})

/** Re-read saved dataset from (switched) prefs DB */
export async function reloadDatasetPref(): Promise<void> {
  const saved = await prefsRepo.getDatasetId()
  if (saved && datasets.some((d) => d.id === saved)) {
    datasetId.set(saved)
  } else {
    datasetId.set(defaultDatasetId)
  }
}

// Persist whenever datasetId changes
datasetId.subscribe((id) => {
  if (id) prefsRepo.setDatasetId(id)
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

const codeById: Record<string, string> = Object.fromEntries(datasets.map((d) => [d.id, d.code]))

export const getDatasetCode = (id: string): string | null => codeById[id] ?? null
