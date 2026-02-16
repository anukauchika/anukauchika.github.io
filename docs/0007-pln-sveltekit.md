# Plan: SvelteKit Migration

Migrate from plain Svelte 5 + Vite MPA to SvelteKit with file-based routing.

**Goal:** Replace manual SPA routing (popstate, pushState, link interception) with SvelteKit's built-in router. Keep everything client-side (SPA mode, no SSR).

---

## Phase 1 — SvelteKit scaffold

**Scope:** `package.json`, `svelte.config.js`, `vite.config.js`, project root

**Steps:**
1. Install SvelteKit: `@sveltejs/kit`, `@sveltejs/adapter-static`
2. Update `svelte.config.js`:
   - Add `kit` config with `adapter-static` (for GitHub Pages)
   - Set `paths.base` if needed for GH Pages subpath
   - Keep `vitePreprocess()`
3. Update `vite.config.js`:
   - Remove manual SPA fallback plugin (SvelteKit handles routing)
   - Remove `build.rollupOptions.input` (SvelteKit manages entries)
   - Keep aliases (`@std`, `@app`) — move to `svelte.config.js` `kit.alias`
   - Keep `server.fs.allow` for data directory
   - Move PWA plugin config to SvelteKit's Vite config
4. Create `src/app.html` (SvelteKit's HTML template, replaces all `index.html` files)
5. Delete old HTML entry files: `index.html`, `chinese/index.html`, `english/index.html`, `design-book.html`
6. Move `static/` contents (icons, robots.txt, sitemap.xml, CNAME) — SvelteKit uses `static/` folder at project root

**Key points:**
- `adapter-static` with `fallback: '404.html'` or `'index.html'` for SPA mode
- Set `ssr: false` globally in root `+layout.js` — avoids all SSR/browser API issues

**Manual (user):**
- Verify GitHub Pages deployment config works with adapter-static output

---

## Phase 2 — Root layout & app init

**Scope:** `src/routes/+layout.svelte`, `src/routes/+layout.js`

**Steps:**
1. Create `src/routes/+layout.js`:
   ```js
   export const ssr = false
   export const prerender = false
   ```
2. Create `src/routes/+layout.svelte`:
   - Import `@std/style/anuka.css`
   - Call `initAnalytics()`
   - Call `maintenanceService.runStartupTasks()`
   - `await initAuth()` in `onMount` or top-level `await` (since `ssr: false`, safe to use browser APIs)
   - Render `<slot />` only after auth init completes (use a `ready` flag)

**Key point:** This replaces all three `main.ts` entry files (`kind/chinese/main.ts`, `kind/english/main.ts`, `design-book.ts`). The init sequence happens once in the layout, shared by all routes.

---

## Phase 3 — Route structure

**Scope:** `src/routes/`

Create the route tree:

```
src/routes/
  +layout.js              ← ssr: false
  +layout.svelte          ← app init (auth, analytics, CSS)
  +page.svelte            ← redirect to /chinese/
  chinese/
    +page.svelte           ← browse view (current App.svelte)
    practice/
      hanzi/+page.svelte   ← stroke practice
      pinyin/+page.svelte  ← pinyin practice
    workbook/+page.svelte  ← workbook
    words/+page.svelte     ← practiced words list
    groups/+page.svelte    ← practiced groups list
    chars/+page.svelte     ← practiced chars list
    how-it-works/+page.svelte
  english/
    +page.svelte           ← browse view
    workbook/+page.svelte
  design-book/
    +page.svelte           ← design book
```

**Steps:**
1. `src/routes/+page.svelte` — redirect: `goto('/chinese/')`
2. Start with empty placeholder `+page.svelte` files that just render the existing components
3. Navigation uses `<a href="/chinese/practice/hanzi?group=1&dataset=abc">` — SvelteKit handles it natively

**Key point:** Page views that were toggle states (`showPracticedList`, `showPracticedGroups`, `showPracticedChars`, `showHowItWorks`) become real routes. This eliminates 4 `$state` variables and the `from` param restoration logic from the browse view.

---

## Phase 4 — Migrate browse view

**Scope:** `src/routes/chinese/+page.svelte`, `src/routes/english/+page.svelte`

**Steps:**
1. Move `src/pages/App.svelte` content to `src/routes/chinese/+page.svelte`
2. Remove page view toggle states and their template blocks (`showPracticedList`, etc.) — these are now separate routes
3. Remove `from` param restoration — not needed when views are routes
4. Update all internal links:
   - Practice: `href="/chinese/practice/hanzi?group=X&dataset=Y"` (already correct)
   - Workbook: `href="/chinese/workbook?group=X&dataset=Y"` (already correct)
   - Practiced words: `href="/chinese/words"` (was `showPracticedList = true`)
   - Practiced groups: `href="/chinese/groups"` (was `showPracticedGroups = true`)
   - Practiced chars: `href="/chinese/chars"` (was `showPracticedChars = true`)
   - How it works: `href="/chinese/how-it-works"` (was `showHowItWorks = true`)
5. English browse: same pattern, subset of routes (no practice, no stats views)

**Key point:** Hero component callbacks (`onShowPracticedGroups`, `onShowPracticedList`, etc.) become `href` links instead of state toggles.

---

## Phase 5 — Migrate practice pages

**Scope:** `src/routes/chinese/practice/hanzi/+page.svelte`, `src/routes/chinese/practice/pinyin/+page.svelte`

**Steps:**
1. Move practice wiring from `src/pages/kind/chinese/main.svelte` into the respective `+page.svelte` files
2. Each practice page:
   - Reads `$page.url.searchParams` for `dataset`, `group`, `from` (SvelteKit's `$app/stores`)
   - Loads group sessions, group stats
   - Renders practice component + info island
   - Back URL uses `goto()` or `<a>` with `from` param for return navigation
3. Move `src/pages/kind/chinese/practice-stroke.svelte` and `practice-pinyin.svelte` to `src/lib/` (they're pure components, no state)

**Key point:** `$page.url.searchParams` replaces manual `window.location.search` parsing.

---

## Phase 6 — Migrate workbook

**Scope:** `src/routes/chinese/workbook/+page.svelte`, `src/routes/english/workbook/+page.svelte`

**Steps:**
1. Move `src/pages/workbook.svelte` logic into the `+page.svelte` files
2. Import `workbook.css` in the page
3. Read `group`, `dataset`, `autoprint` from `$page.url.searchParams`
4. Keep print functionality as-is

---

## Phase 7 — Migrate page views to routes

**Scope:** `src/routes/chinese/words/`, `groups/`, `chars/`, `how-it-works/`

**Steps:**
1. Each `+page.svelte` loads its data the same way the browse view did:
   - Import stores, compute filtered groups, derive stats
   - Render the existing component (`PracticedWords`, `PracticedGroups`, `PracticedChars`, `HowItWorks`)
2. Close button navigates back: `goto('/chinese/')` or `history.back()`
3. The `from` param in practice links becomes the route path: `from=groups` → practice back URL returns to `/chinese/groups`

**Key point:** Shared data (filteredGroups, stats) is computed in each page independently since stores are global singletons anyway. Alternatively, a `chinese/+layout.svelte` could compute shared derivations and pass via context — decide based on duplication level.

---

## Phase 8 — Migrate design book

**Scope:** `src/routes/design-book/+page.svelte`

**Steps:**
1. Move `src/pages/design-book.svelte` to `src/routes/design-book/+page.svelte`
2. No auth, no stores — simplest page

---

## Phase 9 — Auth modal extraction

**Scope:** `src/lib/app/ui/auth-modal.svelte` (or keep inline)

**Steps:**
1. Extract auth modal to a component with props: `user`, `onSignIn*`, `onSignOut`, `onClose`
2. Owns its own `emailInput`, `emailSent`, `emailError` state
3. Used from browse view (and potentially from a shared layout if auth should be accessible everywhere)

---

## Phase 10 — Cleanup

**Scope:** `src/pages/` (entire directory), old HTML files, old routing code

**Steps:**
1. Delete `src/pages/` directory entirely:
   - `kind/chinese/main.svelte`, `main.ts` (SPA router — replaced by SvelteKit)
   - `kind/english/main.svelte`, `main.ts`
   - `App.svelte`, `workbook.svelte`, `workbook.css`, `how-it-works.svelte`, `design-book.svelte`, `design-book.ts`
2. Delete `chinese/`, `english/` HTML directories
3. Delete root `index.html`, `design-book.html`
4. Update `README.md` — new project structure, dev commands
5. Verify build: `npm run build` produces correct static output
6. Verify all routes work in dev and preview

---

## Summary

| Phase | Scope | Removes |
|-------|-------|---------|
| 1 | Scaffold | vite.config manual routing, old HTML entries |
| 2 | Root layout | 3 x main.ts entry files |
| 3 | Route tree | — |
| 4 | Browse view | 4 page-view toggle states, from-param logic |
| 5 | Practice | Manual URL parsing, SPA router wiring |
| 6 | Workbook | Separate workbook entry points |
| 7 | Page views → routes | State-based page switching |
| 8 | Design book | Separate entry point |
| 9 | Auth modal | 3 state vars from browse |
| 10 | Cleanup | All of src/pages/, old HTMLs |

## Dependencies

- Phase 1 must be first
- Phase 2 must follow Phase 1
- Phases 3–9 are sequential (each builds on previous route structure)
- Phase 10 is last

## Risk

- **Low risk**: Everything is client-side, `ssr: false` avoids all SSR pitfalls
- **Medium risk**: `import.meta.glob` for datasets — verify it works the same in SvelteKit's Vite setup (paths may differ since project root changes)
- **Rollback**: Keep old code on a branch until migration is verified
