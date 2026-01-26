import { writable, derived } from 'svelte/store'
import registry from '../../../data/registry.json'
import sherzod from '../../../data/chinese/sherzod.json'
import familyAndFriends from '../../../data/english/family-and-friends-2nd-4.json'
import solutions from '../../../data/english/solutions-2-2.json'

const dataByPath = {
  'data/chinese/sherzod.json': sherzod,
  'data/english/family-and-friends-2nd-4.json': familyAndFriends,
  'data/english/solutions-2-2.json': solutions,
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
