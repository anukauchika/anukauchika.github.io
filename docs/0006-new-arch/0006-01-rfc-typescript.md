
# RFC: Introduce TypeScript

## Goal

Enable `.ts` files alongside existing `.js` and `.svelte` files. New code written in TS, existing JS migrated gradually (not part of this RFC).

## Current State

- `jsconfig.json` with `checkJs: true`
- Vite 7 + `@sveltejs/vite-plugin-svelte` — already supports TS out of the box
- All source files are `.js`
- No type declarations

## Approach

**Replace `jsconfig.json` with `tsconfig.json`** — same options, adds TS file inclusion. Vite uses tsconfig for path resolution automatically.

**`strict: false` initially** — allows gradual migration. Existing JS files keep working as-is. New `.ts` files get type checking. Can tighten later.

**`allowJs: true`** — TS and JS coexist, imports work both directions.

**Svelte components** — add `lang="ts"` to `<script>` blocks when ready, not required upfront. The Svelte plugin handles both.

## No New Dependencies

Vite and the Svelte plugin already resolve `.ts` imports and strip types during build. No need for `typescript` as a project dependency unless we want `tsc --noEmit` as a check script — optional, can add later.

## Build Scripts

No changes to `vite build` or `vite dev` — they work with `.ts` files already.

Optional later: add `"check": "tsc --noEmit"` script for CI type checking (requires `typescript` devDependency).

## Migration Path

Not in scope for this RFC. Future arch layers will write new modules as `.ts` directly. Existing `.js` files are migrated when touched during refactoring.
