export enum ListViewStyle {
  Compact = 'compact',
  Full = 'full',
}

export interface MainFilters {
  search: string
  tags: string[]
  groups: string[]
  listViewStyle: ListViewStyle
}

export interface PrefsRepo {
  // Dataset selection
  getDatasetId(): Promise<string | null>
  setDatasetId(value: string): Promise<void>

  // Per-dataset filter state — batch read, individual writes
  getMainFilters(datasetId: string): Promise<MainFilters>
  setMainSearch(datasetId: string, value: string): Promise<void>
  setMainTags(datasetId: string, value: string[]): Promise<void>
  setMainGroups(datasetId: string, value: string[]): Promise<void>
  setMainListViewStyle(datasetId: string, value: ListViewStyle): Promise<void>

  // Lifecycle
  switchDatabase(userId: string | null): Promise<void>
}
