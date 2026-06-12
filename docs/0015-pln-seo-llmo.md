# SEO & LLMO Improvements Plan

## Context

A code-level SEO/LLMO audit of anukauchika.com (SvelteKit + adapter-static on GitHub Pages) found:

- **P0** Trailing-slash URLs (`/chinese/`, `/english/`) return HTTP 404 on GH Pages: `trailingSlash` defaults to `'never'` → build emits flat `chinese.html`, but sitemap/llms.txt/canonicals/internal links use the slashed form.
- **P0** All `(app)` routes prerender as empty shells (`ssr=false`): `dist/chinese.html` has no title/meta/content — invisible to non-JS crawlers (GPTBot, ClaudeBot, PerplexityBot), yet `/chinese/` is sitemap priority 0.9.
- **P1** Weak/mismatched blog `<title>`s (e.g. nihao: `Chinese learning system` vs h1 *«"A lesson a day!" is the wrong focus»*); blog metadata duplicated across page heads, sitemap, llms.txt, blog index.
- **P1** `/english/` in sitemap as a thin/blank page; hand-maintained sitemap/llms.txt already drifting.
- **P2** The accordion-workbook methodology (the product differentiator) has no crawlable page — exists only in README and inside the JS app.
- **P2** LLM crawlers benefit from markdown twins of the static HSK word lists.

User decisions: `trailingSlash = 'always'`; add a thin SSR intro on `/chinese`; include the methodology page; P3 scope = markdown twins only (skip favicon/OG-image/JSON-LD niceties and the level-7-9 split).

All work is in `app-web/`. Each phase = one commit, committed by the user after review. Optionally save this plan as `docs/0015-pln-seo-llmo.md` first (project convention).

---

## Phase 1 — `trailingSlash = 'always'` + URL sweep

**Scope:** `src/routes/+layout.ts`, all `(blog)`/`(home)` page heads, internal links.

1. Add `export const trailingSlash = 'always'` to `src/routes/+layout.ts` (page option, not svelte.config). Build then emits `dir/index.html` everywhere → `/chinese/`, `/chinese/hsk/` etc. work natively on GH Pages; GH Pages 301s unslashed variants.
2. Sweep all URLs to slashed form:
   - **Canonicals + og:url + JSON-LD urls:** `(blog)/chinese/blog/+page.svelte:15,22`, `nihao/+page.svelte:48,52,67`, `hsk-elementary/+page.svelte:14,18,33`, `when-to-add-words/+page.svelte:15,21,37`, `hsk/+page.svelte:17,21`, `hsk/[level]/+page.svelte:10` (single `url` derived feeds all three — fix once). Home page already OK.
   - **Internal `<a href>`:** `(home)/+page.svelte:72,159,165,166`; blog index `:51,68,86`; `nihao:141-142`; `hsk-elementary:110-112,241-242`; `when-to-add-words:415-416`; `hsk/+page.svelte:53,63,69`; `hsk/[level]/+page.svelte:45,62,64,85`.
   - **Href-builder template literals** (insert `/` before `?`): `src/1_uic/kind/chinese/group-item.ts:23-24` (+ adjacent workbook/print hrefs), `(app)/chinese/dataset.svelte:25`, `(app)/english/+page.svelte:32-33`.
   - **goto() calls:** `(app)/chinese/dataset.svelte:53-55`; blog back-buttons `nihao:75`, `hsk-elementary:41`, `when-to-add-words:45`.
3. Verify: `npm run build`; `dist/chinese/index.html` and `dist/chinese/hsk/index.html` exist (no flat `chinese.html`); grep dist heads for slashed canonicals; preview and click through home → app → blog → hsk.

## Phase 2 — Single-source manifests (fixes blog meta quality too)

**Scope:** `(blog)/chinese/hsk/levels.ts`, new shared modules, blog pages.

`package.json` has `"type": "module"` and tsconfig has `allowJs+checkJs` — shared modules are plain `.js` with JSDoc types so both vite/svelte and the node gen script (Phase 3) can import them (node can't resolve the `@data` vite alias, so data-file *names* live in the manifest and each consumer resolves them its own way).

1. **New `src/routes/(blog)/chinese/hsk/levels-data.js`:** `hskLevelDefs` array (`slug, name, blurb, datasetId, source` JSON filename, `levelTag, lastmod`) + the pure `collect()` dedupe/filter function moved verbatim from `levels.ts`. Slim `levels.ts` to: import the three JSONs via `@data`, map `source` → parsed JSON, build `hskLevels` via `collect()`. Existing `+page.ts` loaders unchanged.
2. **New `src/routes/(blog)/chinese/blog/posts.js`:** `blogPosts` manifest — `slug, title, description, datePublished, lastmod, tags, readMinutes, llms` (one-liner for llms.txt). **Write the improved titles/descriptions here** (P1 fix):
   - nihao → title `"A lesson a day!" is the wrong focus | Anuka Uchika`, description from the blog-index teaser (current `Chinese learning system` / `Building a system for Chinese learning` are generic and mismatch og:title/h1).
   - hsk-elementary → `HSK Elementary: The Numbers — 1,000 Words, 655 Characters | Anuka Uchika`.
   - when-to-add-words → keep headline, add `| Anuka Uchika`.
3. **New `src/routes/(blog)/chinese/blog/post-head.svelte`** (pure, stateless, props: `post`): renders title, meta description, canonical, og:\* (incl. `article:published_time`), twitter:\*, Article JSON-LD (with `dateModified`). Replaces the ~30 duplicated head lines in each of the 3 post pages. Use the escaped `<\/script>` JSON-LD form throughout.
4. Rewire blog index `(blog)/chinese/blog/+page.svelte` to iterate `blogPosts` for title/date/tags/read-time/href (hand-written teaser prose stays inline).
5. Verify: `npm run build`; grep dist blog post heads for new titles, `article:published_time`, `dateModified`; blog index renders identically.

## Phase 3 — Generated sitemap.xml, llms.txt, robots.txt + HSK markdown twins

**Scope:** new `scripts/gen-seo.mjs`, `package.json`, `static/`.

1. **New `scripts/gen-seo.mjs`** (plain ESM, zero deps, modeled on `scripts/inline.mjs`). Inputs: `levels-data.js`, `posts.js` (relative imports), HSK JSONs via `fs.readFileSync(path.resolve('data/chinese/<source>'))`, plus a small in-script list of non-derived pages (home, `/chinese/`, `/chinese/hsk/`, `/chinese/method/` from Phase 5). Outputs into `static/` (git-reviewable diffs; adapter copies verbatim — deliberately not a postbuild step):
   - `static/sitemap.xml` — all URLs slashed; **`/english/` removed**; lastmod from manifests.
   - `static/llms.txt` — same prose as today, slashed URLs, blog/level sections rendered from manifests, plus links to the `.md` twins.
   - `static/robots.txt` — generated from the same source. Unslashed prefixes (robots `Disallow` is prefix-matching, covers both slash variants):
     ```
     User-agent: *
     Disallow: /design-book
     Disallow: /chinese/drill
     Disallow: /chinese/workbook
     Disallow: /chinese/words
     Disallow: /chinese/groups
     Disallow: /chinese/chars
     Disallow: /english

     Sitemap: https://anukauchika.com/sitemap.xml
     ```
   - `static/chinese/hsk/level-*.md` (7 files): `# HSK n Word List (HSK 3.0, 2026)`, blockquote with blurb + word count + links to web version and the app, then a pipe table `| Hanzi | Pinyin | English |` — one row per word, **no row numbers** (stable diffs), no front matter.
2. Add `"gen:seo": "node scripts/gen-seo.mjs"` to package.json; run it; delete the hand-maintained sitemap/llms content (replaced by generated output).
3. Add `<link rel="alternate" type="text/markdown" href=".../level-X.md">` to `hsk/[level]/+page.svelte` head.
4. Verify: run `npm run gen:seo` twice — second run produces no diff (idempotent); validate sitemap XML; word counts in `.md` match the HTML pages; `npm run build` and confirm `dist/chinese/hsk/level-1.md` exists.

## Phase 4 — Thin SSR intro on `/chinese`

**Scope:** `(app)` group; page-level `ssr` override (page options override layout options — verified pattern).

1. **New `src/routes/(app)/chinese/+page.ts`:** `export const ssr = true` (prerender inherited). Scoped to `/chinese` only — drill/workbook/stats stay `ssr=false`.
2. **Neutralize the empty-shell gates for SSR** (without them the server emits nothing):
   - `(app)/+layout.svelte:9`: `{#if ready}` → `{#if ready || !browser}` (import `browser` from `$app/environment`).
   - `(app)/chinese/+layout.svelte:50`: `{#if datasetReady}` → `{#if datasetReady || !browser}`.
3. **`(app)/chinese/+page.svelte`:**
   - Wrap the interactive subtree (`<Dataset />`, `<Groups>`, modal) in `{#if browser}` — this also sidesteps the SSR render hazards at `+page.svelte:15` (`sttDataset.current.kind` non-null-asserted) and `dataset.svelte:22` (`svcDrill.pickNextDrill()`).
   - Add a static intro island, **always rendered** (server + client, so static HTML matches hydrated DOM — no cloaking): `<Island prose>` + `<IslandTitle level={1}>`, 1–2 paragraphs on the HSK browser/stroke drills, links to `/chinese/hsk/` (per-level via `hskLevels`), `/chinese/blog/`, `/chinese/method/`, `/`. Reuse only existing components/classes (`@std/ui/island.svelte`, `anuka-stack/-mute/-row`) — pattern in `(blog)/chinese/hsk/+page.svelte:38-56`. No custom CSS, no anuka changes.
   - Expand `<svelte:head>` (lines 44-50): proper title, description, canonical `https://anukauchika.com/chinese/`, og:\*/twitter:\* — copy pattern from `(home)/+page.svelte:11-40`. No `gaHeadSnippet` (root layout `initAnalytics` covers CSR pages).
4. **Build-env hazard:** SSR now imports `src/5_low/supabase/supabase-client.ts:6` (`createClient` at module scope) during prerender — it throws if `VITE_SUPABASE_URL` is empty. Local `.env` is fine; **ask user to confirm the deploy/CI build env has `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`.**
5. Re-run `npm run gen:seo` if `/chinese/` sitemap metadata changes (lastmod).
6. Verify: build; `dist/chinese/index.html` contains title/canonical/og + intro h1/text + `/chinese/hsk/` links, and no app markup beyond the intro; `dist/chinese/words/index.html` remains a shell (override scoped correctly); preview: hard-reload `/chinese/` (no hydration errors in console), `/chinese/?dataset=...` selection, filters, auth still work.

## Phase 5 — Methodology page `/chinese/method/`

**Scope:** new prerendered route in the `(blog)` group (coexisting with `(app)/chinese/*` is proven — `/chinese/hsk` already does this).

1. **New `src/routes/(blog)/chinese/method/+page.svelte`** (+ sibling `+page.ts` if needed for `csr = false` — pure static like the HSK pages): explains the accordion-workbook method, drafted from `app-web/README.md` ("Accordion Folding Technique", practice modes, spaced repetition, group immutability). Structure: h1, intro, numbered how-to steps (print → fold → fill → unfold to self-check), the three fold directions, link to `/chinese/workbook/` (app) and `/chinese/hsk/` lists. Head: title (e.g. `The Accordion Workbook Method — Printable Chinese Writing Practice | Anuka Uchika`), description, canonical, og:\*, **HowTo JSON-LD** (steps mirroring the on-page list), `gaHeadSnippet` (csr=false page). **User reviews the copy.**
2. Cross-link: home page "How it works" section → method page; HSK level pages' outro paragraph; llms.txt key-facts section (via gen script page list); sitemap entry (gen script). Re-run `npm run gen:seo`.
3. Verify: build; `dist/chinese/method/index.html` fully static with HowTo JSON-LD; sitemap/llms.txt include it.

---

## Out of scope (deliberately)

- `/english` SSR intro (page stays client-only, robots-disallowed, out of sitemap; Phase 4 gate changes make adding it later a 2-file change).
- Favicon/apple-touch-icon, per-section OG images, Blog/BreadcrumbList JSON-LD, level-7-9 split, blog post md twins (hand-written Svelte; already fully prerendered HTML).

## Verification (end-to-end, after all phases)

1. `cd app-web && npm run build` — prerender succeeds (supabase env present).
2. dist structure: `chinese/index.html` (with real head+intro), `chinese/hsk/level-1/index.html`, `chinese/method/index.html`, `chinese/hsk/level-1.md`, `sitemap.xml`/`llms.txt`/`robots.txt` generated versions; **no** flat `chinese.html`; `/english/` absent from sitemap.
3. Grep dist for: unslashed `https://anukauchika.com/chinese/hsk"` (should be none), `article:published_time` in blog posts, `HowTo` in method page.
4. `npm run preview`: navigate home → /chinese/ → drill → blog → hsk levels; hard-reload slashed URLs; console clean.
5. `npm run check` + `npm run lint` (pre-existing `import.meta.glob/env` tsc noise expected).
6. User deploys; spot-check `curl -sI https://anukauchika.com/chinese/` returns 200 (was 404).
