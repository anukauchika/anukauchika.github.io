import type { DatasetRepo } from '@app/api/data/dataset-repo'
import { type RawChineseDataset, parseChineseDataset } from '@app/api/data/kind/chinese/dataset'

const dataModules = import.meta.glob('@data/**/*.json', { eager: true, import: 'default' }) as Record<string, unknown>

const dataByPath: Record<string, unknown> = {}
for (const [key, value] of Object.entries(dataModules)) {
  const normalizedPath = key.replace(/^(\.\.\/)+/, '')
  dataByPath[normalizedPath] = value
}

function parse(raw: unknown, kind: string): Record<string, unknown> | null {
  if (!raw) return null
  if (kind === 'chinese') return parseChineseDataset(raw as RawChineseDataset) as unknown as Record<string, unknown>
  return raw as Record<string, unknown>
}

export const jsonDatasetRepo: DatasetRepo = {
  load: (path, kind) => parse(dataByPath[path], kind),
}
