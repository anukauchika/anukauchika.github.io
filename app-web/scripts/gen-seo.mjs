// Generates static/sitemap.xml, static/llms.txt, static/robots.txt and the
// markdown twins of the HSK word-list pages from the shared manifests:
//   src/routes/(blog)/chinese/hsk/levels-data.js
//   src/routes/(blog)/chinese/blog/posts.js
//   data/registry.json (chinese datasets with seo.worksheets: true)
// Run manually after content changes: npm run gen:seo (diffs reviewed in git).
// IMPORTANT: this is a manual step, NOT part of `npm run build` — see app-web/README.md.

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { hskLevelDefs, collect } from '../src/routes/(blog)/chinese/hsk/levels-data.js'
import { blogPosts } from '../src/routes/(blog)/chinese/blog/posts.js'

const SITE = 'https://anukauchika.com'
const staticDir = path.resolve('static')
const dataDir = path.resolve('data/chinese')
const registry = JSON.parse(fs.readFileSync(path.resolve('data/registry.json'), 'utf8'))

// File mtime is meaningless after a fresh clone/checkout (git doesn't preserve it) —
// use the last commit that touched the file instead.
const lastCommitDate = (relPath) => {
  try {
    return execSync(`git log -1 --format=%cs -- '${relPath}'`, { encoding: 'utf8' }).trim() || undefined
  } catch {
    return undefined
  }
}

// Pages not derived from the level/post/registry manifests
const pages = [
  { loc: '/', lastmod: '2026-07-05', priority: '1.0' },
  { loc: '/chinese/', lastmod: '2026-06-12', priority: '0.9' },
  { loc: '/chinese/hsk/', lastmod: '2026-06-11', priority: '0.8' },
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

// Any chinese dataset with seo.worksheets: true gets a collection + per-group
// worksheet page — see src/routes/(blog)/chinese/worksheet-datasets.ts for the
// Svelte-side counterpart of this filter.
// lastmod must reflect whichever changed more recently: the dataset's own content,
// or the shared template/config that renders every worksheet page.
const worksheetTemplatePaths = [
  'src/routes/(blog)/chinese/[worksheetSlug]/worksheet-page.svelte',
  'src/routes/(blog)/chinese/worksheet-datasets.ts',
]
const worksheetTemplateDate = worksheetTemplatePaths
  .map(lastCommitDate)
  .filter(Boolean)
  .sort()
  .at(-1)

const worksheetDatasets = registry
  .filter((d) => d.kind === 'chinese' && d.seo?.worksheets && d.seo.slug)
  .map((d) => {
    const filename = path.basename(d.path)
    const groups = loadDataset(filename).groups
    const datasetDate = lastCommitDate(d.path) ?? new Date().toISOString().slice(0, 10)
    const lastmod = [datasetDate, worksheetTemplateDate].filter(Boolean).sort().at(-1)
    return { slug: d.seo.slug, label: d.seo.label ?? d.name, groups, lastmod }
  })

// --- sitemap.xml ------------------------------------------------------------

const urlEntries = [
  ...pages,
  ...worksheetDatasets.flatMap((d) => [
    { loc: `/chinese/${d.slug}/`, lastmod: d.lastmod, priority: '0.9' },
    ...d.groups.map((g) => ({
      loc: `/chinese/${d.slug}/group-${g.group}/`,
      lastmod: d.lastmod,
      priority: '0.6',
    })),
  ]),
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
- Worksheets print on A4 for writing Chinese words on paper from memory.
- Free to use; signing in (Google or email) enables progress tracking and sync.

## Pages

- [Home](${SITE}/): what the app does and how the method works
${worksheetDatasets
  .map(
    (d) =>
      `- [${d.label} Printable Chinese Worksheets](${SITE}/chinese/${d.slug}/):\n` +
      `  print ${d.label} memorization worksheet groups and practice the same words online`,
  )
  .join('\n')}
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
