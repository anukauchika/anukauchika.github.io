// Generates static/sitemap.xml, static/llms.txt, static/robots.txt and the
// markdown twins of the HSK word-list pages from the shared manifests:
//   src/routes/(blog)/chinese/hsk/levels-data.js
//   src/routes/(blog)/chinese/blog/posts.js
// Run manually after content changes: npm run gen:seo (diffs reviewed in git).

import fs from 'fs'
import path from 'path'
import { hskLevelDefs, collect } from '../src/routes/(blog)/chinese/hsk/levels-data.js'
import { blogPosts } from '../src/routes/(blog)/chinese/blog/posts.js'

const SITE = 'https://anukauchika.com'
const staticDir = path.resolve('static')
const dataDir = path.resolve('data/chinese')

// Pages not derived from the level/post manifests
const pages = [
  { loc: '/', lastmod: '2026-06-12', priority: '1.0' },
  { loc: '/chinese/', lastmod: '2026-06-12', priority: '0.9' },
  { loc: '/chinese/printable-hsk-1-worksheets/', lastmod: '2026-06-30', priority: '0.9' },
  { loc: '/chinese/hsk/', lastmod: '2026-06-11', priority: '0.8' },
  { loc: '/chinese/method/', lastmod: '2026-06-12', priority: '0.8' },
  { loc: '/chinese/blog/', lastmod: '2026-02-26', priority: '0.8' },
]

// --- load word lists -------------------------------------------------------

const datasets = new Map()
const loadDataset = (source) => {
  if (!datasets.has(source)) {
    datasets.set(source, JSON.parse(fs.readFileSync(path.join(dataDir, source), 'utf8')))
  }
  return datasets.get(source)
}

const levels = hskLevelDefs.map((def) => ({
  ...def,
  words: collect(loadDataset(def.source), def.levelTag),
}))

const hsk1WorksheetGroups = loadDataset('hskv3elementary.json').groups

// --- sitemap.xml ------------------------------------------------------------

const urlEntries = [
  ...pages,
  ...hsk1WorksheetGroups.map((g) => ({
    loc: `/chinese/printable-hsk-1-worksheets/group-${g.group}/`,
    lastmod: '2026-06-30',
    priority: '0.6',
  })),
  ...levels.map((l) => ({ loc: `/chinese/hsk/${l.slug}/`, lastmod: l.lastmod, priority: '0.7' })),
  ...blogPosts.map((p) => ({ loc: `/chinese/blog/${p.slug}/`, lastmod: p.dateModified, priority: '0.7' })),
]

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries
  .map(
    (u) => `  <url>
    <loc>${SITE}${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`

// --- robots.txt -------------------------------------------------------------

// Client-only app routes: empty shells for crawlers, not worth crawling.
// Unslashed prefixes match both /x and /x/ variants.
const disallow = [
  '/design-book',
  '/chinese/drill',
  '/chinese/workbook',
  '/chinese/words',
  '/chinese/groups',
  '/chinese/chars',
  '/english',
]

const robots = `User-agent: *
${disallow.map((d) => `Disallow: ${d}`).join('\n')}

Sitemap: ${SITE}/sitemap.xml
`

// --- llms.txt ----------------------------------------------------------------

const fmtCount = (n) => n.toLocaleString('en-US')

const llms = `# Anuka Uchika

> Free web app for learning to write Chinese characters: stroke-by-stroke writing
> drills with instant feedback, pinyin drills, smart spaced repetition, and printable
> A4 worksheets. Covers HSK 3.0 (2026) vocabulary, levels 1-9. Built for self-directed
> learners preparing for the HSK exam who want deliberate practice instead of
> gamified streaks.

Key facts:

- Vocabulary is organized into small immutable groups; one group is one study session.
- The elementary dataset (HSK levels 1-3) contains the 1,000 most-used Chinese words.
- Writing drills use stroke-order quizzes (trace each stroke, hints on mistakes).
- The repetition algorithm tracks per-word progress and schedules group reviews.
- Worksheets print on A4 and fold accordion-style for self-checking paper practice
  in three directions: characters, pinyin, and translation.
- Free to use; signing in (Google or email) enables progress tracking and sync.

## Pages

- [Home](${SITE}/): what the app does and how the method works
- [The accordion workbook method](${SITE}/chinese/method/): how printed worksheets
  fold into self-checking paper practice (static HTML)
- [Printable HSK 2026 Chinese Writing Worksheets](${SITE}/chinese/printable-hsk-1-worksheets/):
  print HSK worksheet groups and practice the same words online
- [Chinese vocabulary browser](${SITE}/chinese/): explore word groups,
  start drills, print worksheets (interactive features require JavaScript)

## HSK 3.0 word lists (static HTML, no JavaScript required)

- [All levels overview](${SITE}/chinese/hsk/): HSK 3.0 (2026) levels
  explained with word counts
${levels
  .map(
    (l) =>
      `- [${l.name}](${SITE}/chinese/hsk/${l.slug}/): ${fmtCount(l.words.length)} words with pinyin and English` +
      ` ([markdown](${SITE}/chinese/hsk/${l.slug}.md))`,
  )
  .join('\n')}

## Blog

${blogPosts.map((p) => `- [${p.title}](${SITE}/chinese/blog/${p.slug}/):\n  ${p.llms}`).join('\n')}
`

// --- markdown twins -----------------------------------------------------------

const mdEscape = (s) => s.replaceAll('|', '\\|')

const levelMd = (l) => `# ${l.name} Word List (HSK 3.0, 2026)

> ${l.blurb}
> ${fmtCount(l.words.length)} words with pinyin and English translations.
>
> Web version: ${SITE}/chinese/hsk/${l.slug}/
> Practice these words with free stroke-by-stroke writing drills: ${SITE}/chinese/

| Hanzi | Pinyin | English |
|---|---|---|
${l.words.map((w) => `| ${mdEscape(w.word)} | ${mdEscape(w.pinyin)} | ${mdEscape(w.english)} |`).join('\n')}
`

// --- write --------------------------------------------------------------------

const write = (rel, content) => {
  const full = path.join(staticDir, rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content)
  console.log(`wrote static/${rel}`)
}

write('sitemap.xml', sitemap)
write('robots.txt', robots)
write('llms.txt', llms)
for (const l of levels) write(`chinese/hsk/${l.slug}.md`, levelMd(l))
