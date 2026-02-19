# Anuka Uchika langauage learning app

## Architecture requirements

- app-fe: frontend, svelte, vite.
- docs: reqs, rfcs, plans.

`anuka` framework is easy to use css toolkit tailored specifically for this project.
Do not edit it freely, any changes discuss with a user. All the additions & changes should be
reflected in the Design Book: app-fe/web/src/app/DesignBook.svelte which is a showroom for those tools.

Core components tend to be generic, do not carry any domain semantics. They are pure, stateless & parametric.
App components pure & stateless as well, no state & service imports allowed. But they carry domain semantics.

This affects naming patterns, e.g.:
  - core: ActivityHeatmap, app: DailyActivityHeatmap
  - core: fillStrong, app: mastery in ProgressLine

Only entry points are allowed to import state & services, so all the assembly happens there.
App should only use anuka framework for css, no custom css is allowed in components both core & app.

## Project Layers & Structure

- routes & pages: reads (reactive on) state, calls services
- state: svelte state, pure reactive state no other deps allowed (no services, no apis)
- service: sets state, calls repo layer
- repo: abstraction over all external & internal access to data (json loaders, localdb, supabase, backend)
- low api: lower level apis to supabase, backend & localdb

src/routes - routes, layouts, pages very specific components
src/0_dom - pure datatypes & functions - domain layer
src/1_uic - domain & app specific ui svelte components
src/2_svc - service layer
src/3_stt - states
src/4_dat - repositories : abstractions over external apis
src/5_low - external & local apis (json loaders, idb, localstorage, supabase etc.)
src/6_std - core library that has no app specifics but still tailored specifically for the project

allowed imports & deps

deny: all <- all
allow: svc <- svc, stt, dat
allow: dat <- low

no relative imports allowed. all the folders above should have aliases in vite and imports need to be absolute e.g.:

import '@stt/dataset'
import '@svc/dataset'

On top of these layers the verticals are built. Verticals (by shape these are more like pyramids) are domain grouped functionality.
E.g. Dataset Vertical goes: Dataset, DatasetService, DatasetState, DatasetRepo, DatasetApi. Each lower layer may use other different horizontals.

## Code style

Use Svelte runes for states e.g.
```typescript
class DatasetState {
  meta: DatasetMeta[] = $state([])
  id: string = $state('')
  current: Dataset | null = $state(null)
  groups: Group[] = $state([])
  filtered: Group[] = $state([])
  prefSearch: string = $state('')
  prefTags: string[] = $state([])
  prefGroups: number[] = $state([])
  prefViewMode: GroupViewMode = $state(GroupViewMode.Full)
}

export const sttDataset = new DatasetState()
```

strictly use this naming pattern for all singleton objects:

```
svcDataset: DatasetService
sttDataset: DatasetState
datDataset: DatasetRepo
lowDataset: DatasetApi
...
```

and files (no postfixes)

```
src/2_svc/dataset.ts
src/5_low/dataset.ts
```

## Design Book

All the core components are show cased in the Design Book. The new UI implementation process is as follows:

- Try to implement using existing components
- Do not modify core components just to fit some narrow case needs, they need to stay app generic
- Main purpose is to avoid turning anuka.css to some project-specific messy css with exceptions and hacks, have clean architecture for the design instead.
- If existing tools in anuka are not suitable to create smooth and exceptional UX, propose additions to the core & Design Book, according to the principle above

## Usual work flow docs

- @docs/xxxx-req-topic.md: feature requiremments
- @docs/xxxx-rfc-topic.md: tech side of the feature reqs, libs, infra, external deps, key points
- @docs/xxxx-pln-topic.md: exact ready to implement tech plan for the feature

### RFC

- Defines libs, structure and architecture
- Used to create a follow up plan
- No big chunks of code, instead explain what approach to use, only use small code examples if needed
- Not very detailed, only key tech points, details are to be in a tech plan

### Tech plan

- Uses concise tech language
- Sufficiently detailed action list with enough context
- Phased, each phase == one commit == small pack of changes (commit is made by user after review/fix iterations)
- Each phase contains multiple steps, key points higlighted
- Each phase is denoted with exact scope: where to do changes
- Does not contain exact code patches, but rather small code example showing style, arch key points, etc
- Contains full list of phases/actions to implement a feature, including manual ones that needs to be exectuted by a user e.g.: create user account, setup secrets etc.
- When implementing if the action | phase needs users actions - guide them with concise and full instructions

