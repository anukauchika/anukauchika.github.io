import { writable, type Writable } from 'svelte/store'
import type { DatasetMeta, Dataset, Group } from '@dom/dataset'
import { GroupViewMode } from '@dom/dataset'

export const datasetsMeta: Writable<DatasetMeta[]> = writable([])
export const datasetId: Writable<string> = writable('')
export const currentDataset: Writable<Dataset | null> = writable(null)
export const groups: Writable<Group[]> = writable([])
export const filteredGroups: Writable<Group[]> = writable([])
export const search: Writable<string> = writable('')
export const tags: Writable<string[]> = writable([])
export const selectedGroups: Writable<number[]> = writable([])
export const viewMode: Writable<GroupViewMode> = writable(GroupViewMode.Full)
