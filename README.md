# General info

- app-fe: frontend, svelte, vite.
- docs: reqs, rfcs, plans.

# Usual work flow docs

- @docs/xxxx-req-topic.md: feature requiremments
- @docs/xxxx-rfc-topic.md: tech side of the feature reqs, libs, infra, external deps, key points
- @docs/xxxx-pln-topic.md: exact ready to implement tech plan for the feature

## RFC

- Defines libs, structure and architecture
- Used to create a follow up plan
- No big chunks of code, instead explain what approach to use, only use small code examples if needed
- Not very detailed, only key tech points, details are to be in a tech plan

## Tech plan

- Uses concise tech language
- Sufficiently detailed action list with enough context
- Phased, each phase == one commit == small pack of changes (commit is made by user after review/fix iterations)
- Each phase contains multiple steps, key points higlighted
- Each phase is denoted with exact scope: where to do changes
- Does not contain exact code patches, but rather small code example showing style, arch key points, etc
- Contains full list of phases/actions to implement a feature, including manual ones that needs to be exectuted by a user e.g.: create user account, setup secrets etc.
- When implementing if the action | phase needs users actions - guide them with concise and full instructions

