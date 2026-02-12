
# RFC: Component Layer

## Goal

Replace current ad-hoc components with a layered component architecture where **all components are fully parametric and stateless**. State and service wiring happens exclusively in entry points.

## Principles

- **Fully parametric** — all data via props, no internal state/service imports, no side effects
- **Stateless** — pure `props → markup` at both component tiers
- **Typed** — all props typed via `interface Props` in `<script lang="ts">`
- **No CSS duplication** — core components use design book classes (zero `<style>` blocks), app components may have domain-specific styles
- **Composable** — small, single-purpose, nest freely
- **Grow on demand** — only create folders/files needed for the current implementation step

## Folder structure

```
web/
  src/
    components/
      core/
        style/
          anuka.css              # design book tokens + anuka-* classes
          icons.css
        ProgressLine.svelte      # generic wrappers around anuka-* classes
        Tags.svelte
        ...

      app/
        style/
          app.css                # domain-specific CSS extensions
        SearchBar.svelte         # shared app components (not kind-specific)
        chinese/
          group/
            GroupProgress.svelte
            GroupRow.svelte
          practice/
            StrokePlayer.svelte
            ...

    app/                         # entry points — ONLY place that imports state/ & services/
      App.svelte
      Practice.svelte
      Workbook.svelte
      DesignBook.svelte          # design book page (published)

    api/                         # interfaces (existing)
    services/                    # business logic (existing)
    data/                        # IDB implementations (existing)
    state/                       # svelte stores (existing, shrinks over time)
```

## Three tiers

### Core (`components/core/`) — generic, parametric

Thin wrappers around `anuka-*` classes. No `<style>` blocks. No app-domain knowledge.

### App components (`components/app/`) — domain-specific, parametric

Compose core components with domain-specific props. Still pure `props → markup` — no state/service imports. Organized by kind and feature area. Shared (non-kind-specific) components live directly under `components/app/`.

### Entry points (`app/`) — stateful wiring

The only layer that imports `state/` and `services/`. Derives data, calls utility functions, wires props into the component tree.

## Migration approach

- Migrate leaf-first, one component at a time
- Each migration = one small commit
- Only create folders needed for the current step
- Existing entry points updated incrementally to use new components

## Starting point: `ProgressLine`

Simplest leaf — wraps `anuka-progress-line` from design book. Currently duplicated across `ProgressBars.svelte` and `GroupProgressBars.svelte` with identical hardcoded CSS.
