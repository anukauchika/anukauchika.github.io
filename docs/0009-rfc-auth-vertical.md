# RFC: Auth Vertical

## Problem

Auth code violates layer boundaries and doesn't follow the vertical pattern:

- **`@stt/auth.ts`** imports `@low/supabase` (state -> low), `@svc/sync-service` (state -> service), `@low/kind/chinese/idb-stats-repo` (state -> low)
- **`@stt/auth.ts`** contains business logic: `initAuth()`, `onUserChanged()`, `setDatasetReloadHook()` — all service concerns
- **`@stt/auth.ts`** uses old `writable`/`derived` stores, not `$state` runes
- **`@low/supabase/index.ts`** aggregator pattern doesn't follow `lowAuth` naming
- Sign-in/sign-out functions re-exported from state layer — should be service

## Scope

Auth vertical: `@low/auth` -> `@dat/auth` -> `@svc/auth` -> `@stt/auth`. Route import updates. Does not touch stats vertical, sync-service internals, or practice-stats migration.

## Auth Vertical

### `@dom/auth.ts`

Pure domain types. Decouples the app from Supabase types — only `@low` sees `@supabase/supabase-js`.

```ts
interface AuthUser {
  id: string
  email: string
  name: string
}
```

Routes, components, state, dat — all work with `AuthUser`. Mapping from Supabase `Session` → `AuthUser` happens inside `@low/auth.ts`.

### `@low/auth.ts`

Extracted from `@low/supabase/supabase-auth.ts`. Follows `lowAuth` naming. Supabase client (`supabase-client.ts`) stays as shared infra in `@low/supabase/`.

Owns Session → `AuthUser` mapping. Supabase types are confined here — nothing above `@low` sees them.

```ts
import type { AuthUser } from '@dom/auth'

interface AuthApi {
  getUser(): Promise<AuthUser | null>
  refreshSession(): Promise<void>
  onAuthChange(cb: (user: AuthUser | null) => void): () => void
  signInWithGoogle(): Promise<void>
  signInWithApple(): Promise<void>
  signInWithEmail(email: string): Promise<void>
  signOut(): Promise<void>
}

export const lowAuth: AuthApi = { ... }
```

`getUser()` calls `supabase.auth.getSession()`, maps `Session` → `AuthUser` (extracts `id`, `email`, `user_metadata.full_name`). `onAuthChange()` wraps `supabase.auth.onAuthStateChange()` with the same mapping. `refreshSession()` is fire-and-forget (token refresh for tab visibility).

### `@stt/auth.svelte.ts`

Pure reactive state. `$state` runes. Only imports `@dom/auth` for types.

```ts
import type { AuthUser } from '@dom/auth'

class AuthState {
  user: AuthUser | null = $state(null)
  dbVersion: number = $state(0)

  get isAuthenticated(): boolean { return this.user !== null }
}

export const sttAuth = new AuthState()
```

No `session` — that's a Supabase concept. State holds `AuthUser | null`, set by the service. `isAuthenticated` is a getter derived from `user`.

### `@dat/auth.ts`

Repo layer. Abstracts `@low/auth` for the service. Also owns user-scoped database switching (stats IDB) — pragmatic placement since stats vertical doesn't exist yet; moves to `datStats` when it's built.

```ts
import type { AuthUser } from '@dom/auth'

interface AuthRepo {
  getUser(): Promise<AuthUser | null>
  refreshSession(): Promise<void>
  onAuthChange(cb: (user: AuthUser | null) => void): () => void
  signInWithGoogle(): Promise<void>
  signInWithApple(): Promise<void>
  signInWithEmail(email: string): Promise<void>
  signOut(): Promise<void>

  // user-scoped DB switching (delegates to statsRepo.switchDatabase)
  switchStatsDatabase(userId: string | null): Promise<void>
}

export const datAuth: AuthRepo = { ... }
```

Pass-through to `lowAuth` for auth methods — types are already domain types at this boundary. `switchStatsDatabase` wraps `statsRepo.switchDatabase()` from `@low/kind/chinese/idb-stats-repo`.

### `@svc/auth.ts`

New. Orchestration layer. Calls `datAuth`, writes `sttAuth`, coordinates cross-vertical side effects.

```ts
interface AuthService {
  init(): Promise<void>
  signInWithGoogle(): Promise<void>
  signInWithApple(): Promise<void>
  signInWithEmail(email: string): Promise<void>
  signOut(): Promise<void>
}

export const svcAuth: AuthService = { init, signInWithGoogle, ... }
```

**`init()`** — moved from `@stt/auth.initAuth()`:
1. Fetches initial user via `datAuth.getUser()`
2. Sets `sttAuth.user`
3. If user, triggers `onUserChanged(user.id)`
4. Subscribes to `datAuth.onAuthChange()`
5. Registers tab visibility listener for token refresh via `datAuth.refreshSession()`

**`onUserChanged(userId)`** — moved from `@stt/auth.onUserChanged()`:
1. `datAuth.switchStatsDatabase(userId)`
2. `svcDataset.reloadPrefs()` — direct call, no hook indirection
3. If userId: `syncService.syncPending()` + `syncService.restoreFromServer()`
4. `sttAuth.dbVersion++`

**Key change**: `setDatasetReloadHook()` eliminated. `svcAuth` imports `svcDataset` directly — service-to-service imports are allowed per architecture rules (`svc <- svc`). The hook was a workaround for state-layer limitations.

### `@1_uic/auth-modal.svelte`

Receives `AuthUser` instead of Supabase `User`. Uses `user.name` and `user.email` (currently `user.user_metadata?.full_name` and `user.email`). Otherwise no structural changes — still pure and parametric.

## Deleted

| File | Replaced by |
|------|-------------|
| `@low/supabase/supabase-auth.ts` | `@low/auth.ts` |
| `@stt/auth.ts` | `@stt/auth.svelte.ts` (state) + `@svc/auth.ts` (logic) |

## Changes to `@low/supabase/index.ts`

Auth functions removed from the `api` aggregator. Stats part remains for now (stats vertical will clean this up separately). `sync-service.ts` switches to direct import from `@low/supabase/kind/chinese/stats.js`.

## Side Effects

- **`+layout.svelte`** — `initAuth()` -> `svcAuth.init()`, `setDatasetReloadHook()` removed, import from `@svc/auth`
- **Routes** (browse-hero, english/+page, chinese/+page, practice pages, groups):
  - State reads: `from '@stt/auth.js'` -> `from '@stt/auth.svelte.js'` (`sttAuth.user`, `sttAuth.isAuthenticated`, `sttAuth.dbVersion`)
  - Actions: `from '@stt/auth.js'` -> `from '@svc/auth'` (`svcAuth.signInWithGoogle`, etc.)
  - Store `$` syntax removed — `$isAuthenticated` -> `sttAuth.isAuthenticated`
- **`@stt/practice-stats.ts`** — `user` import: `from '@stt/auth.js'` -> `from '@stt/auth.svelte.js'`, `get(user)` -> `sttAuth.user`
- **`@svc/sync-service.ts`** — `api` import: `from '@low/supabase/index.js'` -> `from '@low/supabase/kind/chinese/stats.js'`

## Import Graph

```
@dom/auth          <- (no deps)
@low/auth          <- @low/supabase/supabase-client
@dat/auth          <- @dom/auth, @low/auth, @low/kind/chinese/idb-stats-repo
@stt/auth.svelte   <- @dom/auth (types only)
@svc/auth          <- @dom/auth, @dat/auth, @stt/auth.svelte, @svc/dataset, @svc/sync-service
routes             <- @dom/auth (types), @stt/auth.svelte (read), @svc/auth (actions)
```

All layers respect boundaries. Supabase types confined to `@low`. State is pure. Service only imports dom/dat/stt/svc.
