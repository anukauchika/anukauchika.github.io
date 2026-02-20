export type WordId = number
export type GroupId = number
export type DatasetId = string
export type WordKey = string // mkWordKey(groupId, wordId)

export interface DatasetMeta {
  readonly id: DatasetId
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
  readonly id: GroupId
  readonly displayId: string
  readonly tags?: string[]
  readonly items: Word[]
}

export interface Word {
  readonly idx: number
  readonly id: WordId
  readonly displayId: string
  readonly word: string
  readonly tags?: string[]
}

export function mkWordKey(groupId: GroupId, wordId: WordId): WordKey {
  return `${groupId}::${wordId}`
}

export enum GroupViewMode {
  Compact = 'compact',
  Full = 'full',
}

export interface DatasetPrefs {
  search: string
  tags: string[]
  groups: number[]
  viewMode: GroupViewMode
}
