import type { DatasetMeta, Dataset, Group, Word } from '@dom/dataset'

export interface ChineseWord extends Word {
  readonly pinyin: string
  readonly tr: string
}

export interface ChineseGroup extends Group {
  readonly items: ChineseWord[]
}

export interface ChineseDatasetMeta extends DatasetMeta {
  readonly kind: 'chinese'
  readonly from: string
  readonly to: string
}

export interface ChineseDataset extends ChineseDatasetMeta {
  readonly groups: ChineseGroup[]
}

export interface ChineseDatasetStats {
  groups: number
  words: number
  chars: number
}

export function asChineseDataset(ds: Dataset | null): ChineseDataset | null {
  if (!ds || ds.kind !== 'chinese') return null
  return ds as unknown as ChineseDataset
}
