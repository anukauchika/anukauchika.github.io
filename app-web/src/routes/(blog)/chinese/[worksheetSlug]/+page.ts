import { error } from '@sveltejs/kit'
import { worksheetDatasets, getWorksheetDataset } from '../worksheet-datasets'

export const entries = () => worksheetDatasets.map((d) => ({ worksheetSlug: d.slug }))

export const load = ({ params }) => {
  const dataset = getWorksheetDataset(params.worksheetSlug)
  if (!dataset) throw error(404, 'Worksheet collection not found')

  return {
    dataset,
    group: dataset.groups[0],
    groups: dataset.groups,
    variant: 'collection',
  }
}
