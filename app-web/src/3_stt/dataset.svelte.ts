import type { DatasetMeta, Dataset, Group } from '@dom/dataset'
import { GroupViewMode } from '@dom/dataset'

class DatasetState {
  meta: DatasetMeta[] = $state([])
  id: string = $state('')
  current: Dataset | null = $state(null)
  groups: Group[] = $state([])
  filtered: Group[] = $state([])
  prefSearch: string = $state('')
  prefTags: string[] = $state([])
  prefGroups: number[] = $state([])
  prefViewMode: GroupViewMode = $state(GroupViewMode.Full)
  ready: boolean = $state(false)
  urlFilters: { search?: string, tags?: string[], groups?: number[] } | null = $state(null)
}

export const sttDataset = new DatasetState()
