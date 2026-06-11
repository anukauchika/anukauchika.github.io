import elementary from '@data/chinese/hskv3elementary.json'
import intermediate from '@data/chinese/hskv3intermediate.json'
import advanced from '@data/chinese/hskv3advanced.json'

export interface HskWord {
  word: string
  pinyin: string
  english: string
}

export interface HskLevel {
  slug: string
  name: string
  blurb: string
  datasetId: string
  words: HskWord[]
}

interface RawItem { word: string; pinyin: string; english: string; tags?: string[] }
interface RawDataset { groups: { items: RawItem[] }[] }

// Words may repeat across groups (spaced review) — public lists show each word once
function collect(data: RawDataset, levelTag: string | null): HskWord[] {
  const seen = new Set<string>()
  const out: HskWord[] = []
  for (const g of data.groups) {
    for (const it of g.items) {
      if (levelTag && !(it.tags ?? []).includes(levelTag)) continue
      const key = `${it.word}|${it.pinyin}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ word: it.word, pinyin: it.pinyin, english: it.english })
    }
  }
  return out
}

export const hskLevels: HskLevel[] = [
  {
    slug: 'level-1',
    name: 'HSK 1',
    blurb: 'The first words every learner needs — greetings, numbers, family, and daily basics.',
    datasetId: 'chinese-hskv3-elementary',
    words: collect(elementary as RawDataset, 'L1'),
  },
  {
    slug: 'level-2',
    name: 'HSK 2',
    blurb: 'Everyday vocabulary for simple conversations about routine topics.',
    datasetId: 'chinese-hskv3-elementary',
    words: collect(elementary as RawDataset, 'L2'),
  },
  {
    slug: 'level-3',
    name: 'HSK 3',
    blurb: 'Completes the elementary band — enough to handle most daily situations.',
    datasetId: 'chinese-hskv3-elementary',
    words: collect(elementary as RawDataset, 'L3'),
  },
  {
    slug: 'level-4',
    name: 'HSK 4',
    blurb: 'The first intermediate level — wider topics, abstract words, formal registers.',
    datasetId: 'chinese-hskv3-intermediate',
    words: collect(intermediate as RawDataset, 'L4'),
  },
  {
    slug: 'level-5',
    name: 'HSK 5',
    blurb: 'Intermediate vocabulary for work, study, and media.',
    datasetId: 'chinese-hskv3-intermediate',
    words: collect(intermediate as RawDataset, 'L5'),
  },
  {
    slug: 'level-6',
    name: 'HSK 6',
    blurb: 'Completes the intermediate band — fluent everyday and professional usage.',
    datasetId: 'chinese-hskv3-intermediate',
    words: collect(intermediate as RawDataset, 'L6'),
  },
  {
    slug: 'level-7-9',
    name: 'HSK 7–9',
    blurb: 'The combined advanced band — near-native vocabulary for academic and professional contexts.',
    datasetId: 'chinese-hskv3-advanced',
    words: collect(advanced as RawDataset, null),
  },
]

export const getLevel = (slug: string): HskLevel | undefined => hskLevels.find((l) => l.slug === slug)
