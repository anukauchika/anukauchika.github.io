
Bring code structure to order & make it architecturally nice and easy to fix & enhance.

## General Requirements

- Remove code duplication
- Make components and functions purely functional (functions - pure, components soft req, but mostly parametric)
- Components small and focused
- Consistent code patterns across the codebase
- Clear folder structure
- Update READMEs everywhere

## Decisions Made

- **TypeScript**: `tsconfig.json` with `allowJs: true`, `strict: false`. Gradual migration — new files in `.ts`, existing `.js` migrated when touched. [0006-01]
- **IDB primitives**: shared `data/idb.ts` — `req()`, `tx()`, `createDatabase()` → `DbHandle` with `db()` and `switchUser()`. Both stats and prefs DBs use it. [0006-02]
- **All client storage in IDB**: `local-prefs-repo.js` removed, everything consolidated into IDB. Two databases: stats (synced) and prefs (local only). [0006-02]
- **Folder rename**: `api/` → `supabase/` (Supabase-specific code). `api/` becomes the app's public data contract (types, interfaces). [0006-03]
- **Shared data types**: `api/types.ts` — enums (`PracticeType`, `SyncStatus`, `ListViewStyle`), storage records (`GroupSession`, `WordAttempt`, `CharLog`), derived types (`WordStat`, `GroupSessionSummary`, `DailyActivity`). [0006-03]
- **Linter + formatter**: ESLint 9 (JS + TS + Svelte), Prettier, `npm run lint/format/check`. [implemented]

## Pending RFCs

- Repo layer: `StatsRepo`, `PrefsRepo` typed interfaces
- Services layer: `StatsService`, `SyncService`, `SessionService`, `MaintenanceService`
- Component decomposition: App.svelte split, practice component dedup
