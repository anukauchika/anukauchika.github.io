import { hsk1WorksheetGroups, getHsk1WorksheetGroup } from './worksheet-data'

export const load = () => ({
  group: getHsk1WorksheetGroup(1) ?? hsk1WorksheetGroups[0],
  groups: hsk1WorksheetGroups,
  variant: 'collection',
})
