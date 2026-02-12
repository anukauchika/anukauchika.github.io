
# Plan: Design Book → Svelte + Core Components

Migrate `design/index.html` to `app/DesignBook.svelte`, creating core components along the way. Each phase = one commit.

Layout primitives (`anuka-stack`, `anuka-row`, `anuka-grid-*`, `anuka-center`, `anuka-grow`) stay as raw CSS classes — no Svelte wrappers.

## Phase 1: Entry point + Island + AppTitle + IslandTitle

**Scope**: `src/app/`, `src/components/core/`, vite config, new HTML entry

- Create `design.html` entry point (like existing `index.html` pattern)
- Create `src/app/design-book.ts` entry script (imports `anuka.css`, mounts component)
- Add `design` entry to `vite.config.js` `rollupOptions.input`
- Create core components:
  - `Island.svelte` — props: `sticky?: boolean`. Renders `<section class="anuka-island">` (+ `anuka-island-sticky` when sticky)
  - `AppTitle.svelte` — props: `parts: string[]`. Renders `<h2 class="anuka-app-title">` with auto-delimited `<span>`s
  - `IslandTitle.svelte` — props: `level?: 1|2|3|4`, `parts?: string[]`. Renders `<hN class="anuka-island-title">`, supports either slot content or `parts` spans
- Create `src/app/DesignBook.svelte` — convert intro + structure/islands sections using the new components, leave remaining sections as raw HTML for now

## Phase 2: Quick + Tags + Card

**Scope**: `src/components/core/`

- `Quick.svelte` — props: `label: string, icon: string`. Renders `<button class="anuka-quick">` with `anuka-icon anuka-icon-{icon}`
- `Tags.svelte` — props: `tags: string[]`. Renders `<div class="anuka-tags">` with `anuka-tag` spans
- `Card.svelte` — no props, slot only. Renders `<div class="anuka-card">`
- Convert islands showcase section (island with quick + tags) and grid sections in DesignBook

## Phase 3: ActivityHeatmap

**Scope**: `src/components/core/`

- `ActivityHeatmap.svelte` — props: `levels: number[]`. Renders `anuka-activity-heatmap` with cells, each cell gets `data-level` from array value
- Convert heatmap sections in DesignBook, including heatmap-inside-card example

## Phase 4: Btn + Input

**Scope**: `src/components/core/`

- `Btn.svelte` — props: `variant?: 'outline'|'ghost'|'toggle'|'icon'`, `active?: boolean`, `label?: string`, `icon?: string`. Renders `<button class="anuka-btn anuka-btn-{variant}">` with slot content or icon
- `Input.svelte` — props: `type?: string`, `placeholder?: string`. Renders `<input class="anuka-input">`
- Convert controls section in DesignBook
- DesignBook migration complete

## Phase 5: Cleanup

- Remove old `design/design.js` (empty)
- Keep `design/index.html` for side-by-side comparison with new DesignBook.svelte
- Verify build
