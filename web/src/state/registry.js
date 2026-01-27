import { writable, derived } from 'svelte/store'
import registry from '../../../data/registry.json'

// Dynamically import all JSON files from data directory
const dataModules = import.meta.glob('../../../data/**/*.json', { eager: true, import: 'default' })

// Build path mapping from glob results
// Glob paths are relative: '../../../data/chinese/sherzod.json'
// Registry paths are absolute: 'data/chinese/sherzod.json'
const dataByPath = {}
for (const [key, value] of Object.entries(dataModules)) {
  // Convert '../../../data/chinese/sherzod.json' -> 'data/chinese/sherzod.json'
  const normalizedPath = key.replace(/^\.\.\/\.\.\/\.\.\//, '')
  dataByPath[normalizedPath] = value
}

export const datasets = registry.map((entry) => ({
  ...entry,
  data: dataByPath[entry.path] ?? null,
}))

export const datasetId = writable(datasets[0]?.id ?? '')

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
