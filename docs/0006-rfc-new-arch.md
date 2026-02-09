
Bring code structure to order & make it architecturally nice and easy to fix & enhance.

## General Requirements

- Remove code duplication
- Make components and functions purely functional (functions - pure, components soft req, but mostly parametric)
- Components small and focused
- Consistent code patterns across the codebase
- Clear folder structure
- Update READMEs everywhere

## Steps

- 006-01: introduce typescript, linter formatter: done
- 006-02: IDB low level service: done
- 006-03: Core data types: done
- 006-04: Repo layer: `StatsRepo`, `PrefsRepo` typed interfaces
- 006-05: Services layer: `StatsService`, `SyncService`, `SessionService`, `MaintenanceService`
- Component decomposition: App.svelte split, practice component dedup
