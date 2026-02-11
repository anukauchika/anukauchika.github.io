
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
| app-title | anuka-app-title | brand heading with two children: `anuka-app-name` + `anuka-app-kind`, separator via CSS `::before` |
| island-title | anuka-island-title | large serif heading inside island |
| tags | anuka-tags, anuka-tag | pill list container (full width, wrapping) with individual tag pills, used inside island |
| card | anuka-card | pill list container (full width, wrapping) with individual tag pills, used inside island |



