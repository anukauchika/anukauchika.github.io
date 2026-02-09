import { writable, derived } from 'svelte/store'
import registry from '../../../data/registry.json'
import { prefsRepo as prefs } from '../data/idb-prefs-repo.js'
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

const defaultDatasetId = datasets[0]?.id ?? ''

export const datasetId = writable(defaultDatasetId)

// Load saved preference from IDB on startup
prefs.get(PREF_DATASET).then((saved) => {
  if (saved && datasets.some((d) => d.id === saved)) {
    datasetId.set(saved)
  }
})

/** Re-read saved dataset from (switched) prefs DB */
export async function reloadDatasetPref() {
  const saved = await prefs.get(PREF_DATASET)
  if (saved && datasets.some((d) => d.id === saved)) {
    datasetId.set(saved)
  } else {
    datasetId.set(defaultDatasetId)
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
