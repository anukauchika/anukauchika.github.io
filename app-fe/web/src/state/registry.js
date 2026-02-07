import { writable, derived } from 'svelte/store'
import registry from '../../../data/registry.json'
import { localPrefs as prefs } from '../data/local-prefs-repo.js'
const PREF_DATASET = 'datasetId'

// Dynamically import all JSON files from data directory
const dataModules = import.meta.glob('../../../data/**/*.json', { eager: true, import: 'default' })

// Build path mapping from glob results
// Glob paths are relative: '../../../data/chinese/sherzod.json'
// Registry paths are absolute: 'data/chinese/sherzod.json'
const dataByPath = {}
for (const [key, value] of Object.entries(dataModules)) {
  const normalizedPath = key.replace(/^\.\.\/\.\.\/\.\.\//, '')
  dataByPath[normalizedPath] = value
}

export const datasets = registry.map((entry) => ({
  ...entry,
  data: dataByPath[entry.path] ?? null,
}))

function resolveInitialDataset() {
  const saved = prefs.get(PREF_DATASET)
  if (saved && datasets.some((d) => d.id === saved)) return saved
  return datasets[0]?.id ?? ''
}

export const datasetId = writable(resolveInitialDataset())

/** Re-read saved dataset from (switched) localStorage */
export function reloadDatasetPref() {
  const saved = prefs.get(PREF_DATASET)
  if (saved && datasets.some((d) => d.id === saved)) {
    datasetId.set(saved)
  } else {
    datasetId.set(datasets[0]?.id ?? '')
  }
}

// Persist whenever datasetId changes
datasetId.subscribe((id) => {
  if (id) prefs.set(PREF_DATASET, id)
})

export const currentDataset = derived(datasetId, ($datasetId) => {
  return datasets.find((d) => d.id === $datasetId) ?? datasets[0] ?? null
})

export const setDatasetById = (id) => {
  datasetId.set(id)
}

export const setDatasetByKind = (kind) => {
  const match = datasets.find((d) => d.kind === kind) ?? datasets[0]
  if (match?.id) datasetId.set(match.id)
}

const codeById = Object.fromEntries(datasets.map((d) => [d.id, d.code]))

export const getDatasetCode = (id) => codeById[id] ?? null

export const PRACTICE_TYPE_STROKE = 's'
