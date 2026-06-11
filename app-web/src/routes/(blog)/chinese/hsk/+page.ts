import { hskLevels } from '@blog/chinese/hsk/levels'

export const prerender = true
export const csr = false

export function load() {
  return {
    levels: hskLevels.map(({ slug, name, blurb, words }) => ({ slug, name, blurb, count: words.length })),
  }
}
