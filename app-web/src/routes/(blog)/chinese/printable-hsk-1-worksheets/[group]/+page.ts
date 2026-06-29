import { error } from '@sveltejs/kit'
import { hsk1WorksheetGroups, getHsk1WorksheetGroup } from '../worksheet-data'

export const entries = () => hsk1WorksheetGroups.map((group) => ({ group: `group-${group.group}` }))

export const load = ({ params }) => {
  const match = /^group-(\d+)$/.exec(params.group)
  const groupNumber = match ? Number(match[1]) : 0
  const group = getHsk1WorksheetGroup(groupNumber)
  if (!group) throw error(404, 'Worksheet group not found')

  return {
    group,
    groups: hsk1WorksheetGroups,
    variant: 'group',
  }
}
