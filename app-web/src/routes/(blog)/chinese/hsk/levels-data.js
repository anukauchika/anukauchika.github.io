// Single source of truth for HSK level definitions.
// Plain JS so both the svelte pages (via vite) and scripts/gen-seo.mjs (via node)
// can import it — node cannot resolve the @data alias, so `source` carries the
// dataset JSON filename and each consumer loads it its own way.

/**
 * @typedef {object} HskLevelDef
 * @property {string} slug
 * @property {string} name
 * @property {string} blurb
 * @property {string} datasetId
 * @property {string} source dataset JSON filename under data/chinese/
 * @property {string | null} levelTag
 * @property {string} lastmod
 */

/** @type {HskLevelDef[]} */
export const hskLevelDefs = [
  {
    slug: 'level-1',
    name: 'HSK 1',
    blurb: 'The first words every learner needs — greetings, numbers, family, and daily basics.',
    datasetId: 'chinese-hskv3-elementary',
    source: 'hskv3elementary.json',
    levelTag: 'L1',
    lastmod: '2026-06-11',
  },
  {
    slug: 'level-2',
    name: 'HSK 2',
    blurb: 'Everyday vocabulary for simple conversations about routine topics.',
    datasetId: 'chinese-hskv3-elementary',
    source: 'hskv3elementary.json',
    levelTag: 'L2',
    lastmod: '2026-06-11',
  },
  {
    slug: 'level-3',
    name: 'HSK 3',
    blurb: 'Completes the elementary band — enough to handle most daily situations.',
    datasetId: 'chinese-hskv3-elementary',
    source: 'hskv3elementary.json',
    levelTag: 'L3',
    lastmod: '2026-06-11',
  },
  {
    slug: 'level-4',
    name: 'HSK 4',
    blurb: 'The first intermediate level — wider topics, abstract words, formal registers.',
    datasetId: 'chinese-hskv3-intermediate',
    source: 'hskv3intermediate.json',
    levelTag: 'L4',
    lastmod: '2026-06-11',
  },
  {
    slug: 'level-5',
    name: 'HSK 5',
    blurb: 'Intermediate vocabulary for work, study, and media.',
    datasetId: 'chinese-hskv3-intermediate',
    source: 'hskv3intermediate.json',
    levelTag: 'L5',
    lastmod: '2026-06-11',
  },
  {
    slug: 'level-6',
    name: 'HSK 6',
    blurb: 'Completes the intermediate band — fluent everyday and professional usage.',
    datasetId: 'chinese-hskv3-intermediate',
    source: 'hskv3intermediate.json',
    levelTag: 'L6',
    lastmod: '2026-06-11',
  },
  {
    slug: 'level-7-9',
    name: 'HSK 7–9',
    blurb: 'The combined advanced band — near-native vocabulary for academic and professional contexts.',
    datasetId: 'chinese-hskv3-advanced',
    source: 'hskv3advanced.json',
    levelTag: null,
    lastmod: '2026-06-11',
  },
]

/**
 * @typedef {{ word: string, pinyin: string, english: string }} HskWord
 */

// Words may repeat across groups (spaced review) — public lists show each word once
/**
 * @param {{ groups: { items: Array<{ word: string, pinyin: string, english: string, tags?: string[] }> }[] }} data
 * @param {string | null} levelTag
 * @returns {HskWord[]}
 */
export function collect(data, levelTag) {
  const seen = new Set()
  /** @type {HskWord[]} */
  const out = []
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
