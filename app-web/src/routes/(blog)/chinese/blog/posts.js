// Single source of truth for blog post metadata: consumed by the post pages
// (via post-head.svelte), the blog index, and scripts/gen-seo.mjs
// (sitemap.xml + llms.txt). Teaser prose stays in the index page.

/**
 * @typedef {object} BlogPost
 * @property {string} slug
 * @property {string} title headline, no brand suffix (head adds "| Anuka Uchika")
 * @property {string} description meta/og description
 * @property {string} datePublished
 * @property {string} dateModified
 * @property {string[]} tags
 * @property {number} readMinutes
 * @property {string} llms one-line summary for llms.txt
 */

/** @type {BlogPost[]} newest first */
export const blogPosts = [
  {
    slug: 'when-to-add-words',
    title: 'When to add new words to the pack?',
    description:
      'How I built a decision rule for spaced repetition: an overdue score that tells me when to add new words and when to catch up first.',
    datePublished: '2026-02-26',
    dateModified: '2026-02-26',
    tags: ['chinese/system'],
    readMinutes: 5,
    llms: 'how to pace new material against spaced repetition load',
  },
  {
    slug: 'hsk-elementary',
    title: 'HSK Elementary: The Numbers',
    description:
      'What the HSK 3.0 (2026) exam is, how its levels are structured, and the numbers behind the Elementary band: 1,000 words, 655 characters.',
    datePublished: '2026-02-23',
    dateModified: '2026-02-23',
    tags: ['chinese/hsk'],
    readMinutes: 10,
    llms: 'what the HSK 3.0 exam is and how its levels are structured',
  },
  {
    slug: 'nihao',
    title: '"A lesson a day!" is the wrong focus',
    description:
      'Why long streaks in gamified language apps are a comforting illusion — and the system I am building for real progress in Chinese.',
    datePublished: '2026-02-23',
    dateModified: '2026-02-23',
    tags: ['chinese/system'],
    readMinutes: 10,
    llms: 'why long streaks in gamified language apps are a comforting illusion, and the system built to replace them',
  },
]

/** @param {string} slug @returns {BlogPost | undefined} */
export const getPost = (slug) => blogPosts.find((p) => p.slug === slug)
