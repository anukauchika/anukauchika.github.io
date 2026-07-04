import { error } from '@sveltejs/kit'
import { worksheetDatasets, getWorksheetDataset } from '../../worksheet-datasets'

export const entries = () =>
  worksheetDatasets.flatMap((d) => d.groups.map((g) => ({ worksheetSlug: d.slug, group: `group-${g.group}` })))

export const load = ({ params }) => {
  const dataset = getWorksheetDataset(params.worksheetSlug)
  if (!dataset) throw error(404, 'Worksheet collection not found')

  const match = /^group-(\d+)$/.exec(params.group)
  const groupNumber = match ? Number(match[1]) : 0
  const group = dataset.groups.find((g) => g.group === groupNumber)
  if (!group) throw error(404, 'Worksheet group not found')

  return {
    dataset,
    group,
    groups: dataset.groups,
    variant: 'group',
  }
}
