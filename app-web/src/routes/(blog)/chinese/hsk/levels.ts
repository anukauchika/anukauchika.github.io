import elementary from '@data/chinese/hskv3elementary.json'
import intermediate from '@data/chinese/hskv3intermediate.json'
import advanced from '@data/chinese/hskv3advanced.json'
import { hskLevelDefs, collect } from '@blog/chinese/hsk/levels-data.js'
import type { HskWord } from '@blog/chinese/hsk/levels-data.js'

export type { HskWord }

export interface HskLevel {
  slug: string
  name: string
  blurb: string
  datasetId: string
  words: HskWord[]
}

const sources: Record<string, unknown> = {
  'hskv3elementary.json': elementary,
  'hskv3intermediate.json': intermediate,
  'hskv3advanced.json': advanced,
}

export const hskLevels: HskLevel[] = hskLevelDefs.map((def) => ({
  slug: def.slug,
  name: def.name,
  blurb: def.blurb,
  datasetId: def.datasetId,
  words: collect(sources[def.source] as Parameters<typeof collect>[0], def.levelTag),
}))

export const getLevel = (slug: string): HskLevel | undefined => hskLevels.find((l) => l.slug === slug)
