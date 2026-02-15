
Bring code structure to order & make it architecturally nice and easy to fix & enhance.

## General Requirements

- Core css library, easy to use without any css knowledge - clasess & core components
- Core is stable, only changed with the user confirmation, every change should be well tested via design book
- Core is not super generic, it's tailored specifically for this project
- There are core & app svelte components. Core components should have no domain specific things & naming.
- App components do have domain knowledge, still being pure and parametric
- App components should not have any custom css styling, only core is used
- Components are small and focused
- Consistent code & naming patterns across the codebase
- Clear folder structure
- Update READMEs everywhere

## Steps

- 006-01: introduce typescript, linter formatter: done
- 006-02: IDB low level service: done
- 006-03: Core data types: done
- 006-04: Repo layer: `StatsRepo`, `PrefsRepo` typed interfaces: done
- 006-05: Services layer: `StatsService`, `SyncService`, `SessionService`, `MaintenanceService`: done
- 006-06: Design book
- 006-07: Move to components based on design book

Check for detailed docs in docs/0006-new-arch/
