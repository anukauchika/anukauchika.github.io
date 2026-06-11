import { error } from '@sveltejs/kit'
import { getLevel, hskLevels } from '@blog/chinese/hsk/levels'

export const prerender = true
export const csr = false

export function entries() {
  return hskLevels.map((l) => ({ level: l.slug }))
}

export function load({ params }) {
  const level = getLevel(params.level)
  if (!level) error(404, 'Word list not found')
  return {
    level,
    others: hskLevels.filter((l) => l.slug !== level.slug).map(({ slug, name }) => ({ slug, name })),
  }
}
