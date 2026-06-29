import elementary from '@data/chinese/hskv3elementary.json'

export const hskElementaryWorksheetDatasetId = 'chinese-hskv3-elementary'
export const hskElementaryWorksheetLevel = 'elementary'
export const worksheetBasePath = '/chinese/printable-hsk-elementary-worksheets'

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

export const hskElementaryWorksheetGroups: WorksheetGroup[] = rawDataset.groups.map((group) => ({
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

export function getHskElementaryWorksheetGroup(groupNumber: number): WorksheetGroup | undefined {
  return hskElementaryWorksheetGroups.find((group) => group.group === groupNumber)
}

export function getWorksheetGroupUrl(groupNumber: number): string {
  return `${worksheetBasePath}/group-${groupNumber}/`
}

export function getWorksheetGroupDrillUrl(groupNumber: number): string {
  return `/chinese/drill/hanzi/?dataset=${hskElementaryWorksheetDatasetId}&group=${groupNumber}&from=printable-hsk-elementary-worksheets`
}

export function getChineseAppUrl(): string {
  return `/chinese/?dataset=${hskElementaryWorksheetDatasetId}`
}

export function getChineseLevelAppUrl(datasetId: string, tag?: string): string {
  const params = new URLSearchParams({ dataset: datasetId })
  if (tag) params.set('tags', tag)
  return `/chinese/?${params.toString()}`
}

export function getWordGroupId(groupNumber: number): string {
  return `${hskElementaryWorksheetDatasetId}:group-${groupNumber}`
}
