import { error } from '@sveltejs/kit'
import { hskElementaryWorksheetGroups, getHskElementaryWorksheetGroup } from '../worksheet-data'

export const entries = () => hskElementaryWorksheetGroups.map((group) => ({ group: `group-${group.group}` }))

export const load = ({ params }) => {
  const match = /^group-(\d+)$/.exec(params.group)
  const groupNumber = match ? Number(match[1]) : 0
  const group = getHskElementaryWorksheetGroup(groupNumber)
  if (!group) throw error(404, 'Worksheet group not found')

  return {
    group,
    groups: hskElementaryWorksheetGroups,
    variant: 'group',
  }
}
