import elementary from '@data/chinese/hskv3elementary.json'

export const hsk1WorksheetDatasetId = 'chinese-hskv3-elementary'
export const hsk1WorksheetLevel = 1
export const worksheetBasePath = '/chinese/printable-hsk-1-worksheets'

interface RawWord {
  id: number
  word: string
  pinyin: string
  english: string
  tags?: string[]
}

interface RawGroup {
  group: number
  tags?: string[]
  items: RawWord[]
}

interface RawDataset {
  groups: RawGroup[]
}

export interface WorksheetWord extends RawWord {
  idx: number
  displayId: string
  tr: string
}

export interface WorksheetGroup {
  group: number
  idx: number
  id: number
  displayId: string
  tags?: string[]
  items: WorksheetWord[]
}

const rawDataset = elementary as RawDataset

export const hsk1WorksheetGroups: WorksheetGroup[] = rawDataset.groups.map((group) => ({
  ...group,
  idx: group.group,
  id: group.group,
  displayId: `Group ${group.group}`,
  items: group.items.map((item) => ({
    ...item,
    idx: item.id,
    displayId: String(item.id),
    tr: item.english,
  })),
}))

export function getHsk1WorksheetGroup(groupNumber: number): WorksheetGroup | undefined {
  return hsk1WorksheetGroups.find((group) => group.group === groupNumber)
}

export function getWorksheetGroupUrl(groupNumber: number): string {
  return `${worksheetBasePath}/group-${groupNumber}/`
}

export function getWorksheetGroupDrillUrl(groupNumber: number): string {
  return `/chinese/drill/hanzi/?dataset=${hsk1WorksheetDatasetId}&group=${groupNumber}&from=printable-hsk-1-worksheets`
}

export function getChineseAppUrl(): string {
  return `/chinese/?dataset=${hsk1WorksheetDatasetId}`
}

export function getChineseLevelAppUrl(datasetId: string, tag?: string): string {
  const params = new URLSearchParams({ dataset: datasetId })
  if (tag) params.set('tags', tag)
  return `/chinese/?${params.toString()}`
}

export function getWordGroupId(groupNumber: number): string {
  return `${hsk1WorksheetDatasetId}:group-${groupNumber}`
}
