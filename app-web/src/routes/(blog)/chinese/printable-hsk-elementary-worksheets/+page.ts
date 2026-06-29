import { hskElementaryWorksheetGroups, getHskElementaryWorksheetGroup } from './worksheet-data'

export const load = () => ({
  group: getHskElementaryWorksheetGroup(1) ?? hskElementaryWorksheetGroups[0],
  groups: hskElementaryWorksheetGroups,
  variant: 'collection',
})
