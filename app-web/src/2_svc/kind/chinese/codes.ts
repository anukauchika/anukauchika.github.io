import type { DatasetId } from '@dom/dataset'
import { ChineseDrillType } from '@dom/kind/chinese/dataset'
import { sttDataset } from '@stt/dataset.svelte.js'

const DT_CODES: Record<string, string> = { stroke: 's', pinyin: 'p' }

export const ALL_DT = Object.values(ChineseDrillType)

export function dsCode(id: DatasetId): string {
  const meta = sttDataset.meta.find((m) => m.id === id)
  return meta?.code ?? id
}

export function dtCode(drillType: ChineseDrillType): string {
  return DT_CODES[drillType] || drillType
}
