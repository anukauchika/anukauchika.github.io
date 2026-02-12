
# RFC: Design Book

## Goal

Create a standalone design book page (`web/design/`) — one long page showcasing all design tokens and UI elements used across the app, standardized and documented visually. The page itself is built from the same reusable classes it documents.

## Design Constraints

- **Absolute minimum CSS** — each & every item in the css should be added only if it's really used. No default fonts, not default styles, no cargo-cult resets
- **Specific** - should contain only items used by the Anuka Uchika project and absolutely nothing else
- **Easy to use** - non-fe developer should be able to construct Anuka Uchika pages effortlessly. Using classes or other css possibilities which does not require css knowledge
- **Tiny palette** — just a few CSS variables: background, surface, text, one accent
- **Grow gradually** — start with bare bones, add tokens and elements one at a time

## Workflow

Grow the framework step by step, with very focused changes, adding entity by entity in the table below.

## Entities


| Entity | Class | Description |
|---|---|---|
| theme | data-theme attr | day/night themes via semantic CSS vars, auto-detects OS preference, manual toggle via `data-theme="dark"` on `<html>` |
| page | anuka-page | turn HTML body into anuka page, subtle unintrusive gradient background, nothing more |
| island | anuka-island | visual container for content, rounded corners, nice spacing, clean surface color |
| quick | anuka-quick | top-right corner icon button, top right icon button for islands |
| app-title | anuka-app-title | small uppercase muted brand label, auto-delimited spans |
| island-title | anuka-island-title | serif heading (h1-h4 sizes), auto-delimited spans |
| tags | anuka-tags, anuka-tag | pill list container (full width, wrapping) with individual tag pills, used inside island |
| grid | anuka-grid-sm/md/lg | responsive auto-fit grids: sm (80px), md (180px), lg (300px) |
| stack | anuka-stack | vertical flex layout with consistent gap |
| row | anuka-row | horizontal flex layout with consistent gap |
| center | anuka-center | center children horizontally |
| grow | anuka-grow | fill remaining space (`flex: 1`) |
| island-sticky | anuka-island-sticky | modifier to pin an island to the top on scroll |
| progress | anuka-progress-line | thin bar track with `anuka-progress-line-fill` and `anuka-progress-line-fill-strong` for overlapping fills |
| card | anuka-card | raised surface card inside island, rounded, with border |
| activity-heatmap | anuka-activity-heatmap, anuka-activity-heatmap-cell | row of intensity cells, `data-level="1-4"` for intensity |



