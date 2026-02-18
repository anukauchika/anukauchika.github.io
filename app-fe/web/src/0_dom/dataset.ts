export interface DatasetMeta {
  readonly id: string
  readonly code: string
  readonly kind: string
  readonly name: string
  readonly appTitle: string
  readonly path: string
  readonly description: string
  readonly tags: string[]
  readonly search: string[]
}

export interface Dataset extends DatasetMeta {
  readonly groups: Group[]
}

export interface Group {
  readonly idx: number
  readonly id: number
  readonly displayId: string
  readonly tags?: string[]
  readonly items: Word[]
}

export interface Word {
  readonly idx: number
  readonly id: number
  readonly displayId: string
  readonly word: string
  readonly tags?: string[]
}

export function compositeKey(groupId: number, wordId: number): string {
  return `${groupId}::${wordId}`
}

export enum GroupViewMode {
  Compact = 'compact',
  Full = 'full',
}

export interface DatasetPrefs {
  datasetId: string
  search: string
  tags: string[]
  groups: number[]
  viewMode: GroupViewMode
}
