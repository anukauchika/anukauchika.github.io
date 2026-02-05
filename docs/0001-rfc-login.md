# RFC: Login

Based on: `0001-req-login.md`

## Scope

Authentication only. Data sync addressed in separate RFC.

## Overview

Add user authentication via Supabase Auth. Google and Apple OAuth. Stats remain in IndexedDB for now.

## Tech Stack

| Component | Choice | Rationale |
|-----------|--------|-----------|
| Auth | Supabase Auth | Built-in Google/Apple OAuth, handles tokens |
| Client SDK | `@supabase/supabase-js` | Official JS client |

## Layering

```
Components   →  state/auth.js  →  api.js  →  api/supabase-auth.js
   (UI)          (stores)        (entry)      (implementation)
```

- **api.js**: Single entry point for all external interactions (auth now, data sync later)
- **api/supabase-auth.js**: Supabase client init, all Supabase calls isolated here
- **state/auth.js**: Svelte stores (`session`, `user`, `isAuthenticated`), init function, re-exports actions
- **Components**: Import only from `state/auth.js`

Example: `api.js` exposes `api.auth.signInWithGoogle()`, `api.auth.signOut()`, etc. Future data sync adds `api.stats.*`, `api.prefs.*`.

## API Functions

`api.auth.*`:
- `getSession()` — get current session
- `onAuthStateChange(callback)` — subscribe to auth changes, returns unsubscribe
- `signInWithGoogle()` — OAuth redirect
- `signInWithApple()` — OAuth redirect
- `signOut()` — clear session

## Auth Flow

1. App start → `initAuth()` fetches session, subscribes to changes
2. User clicks provider button → OAuth redirect
3. Callback → session established, store updated
4. Sign out → session cleared

## UI

Header integration in `App.svelte`:
- Logged out: "Sign in" button with Google/Apple options
- Logged in: User avatar + "Sign out"

## Config

Environment variables via Vite:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## OAuth Setup (Supabase Dashboard)

**Google**: Create OAuth credentials in Google Cloud Console, add redirect URI, enable in Supabase.

**Apple**: Create App ID + Service ID in Apple Developer Console, generate key, enable in Supabase.

Redirect URI pattern: `https://<project>.supabase.co/auth/v1/callback`

## Security

**Keys**:
- Anon key safe to expose — only permits Supabase Auth operations (no database access until data sync RFC)
- Service key never in frontend — has full database access

**OAuth flow (PKCE)**:
1. App generates random `code_verifier`, hashes it to `code_challenge`
2. Redirect to provider with `code_challenge`
3. Provider authenticates user, redirects back with `code`
4. App exchanges `code` + `code_verifier` for tokens
5. Supabase SDK handles all of this automatically

**Tokens**:
- Access token (JWT) — short-lived, used for API calls
- Refresh token — long-lived, stored in localStorage by Supabase SDK
- SDK auto-refreshes access token before expiry

**Session persistence**:
- Supabase stores session in localStorage
- `getSession()` restores session on page reload
- `onAuthStateChange()` fires on login, logout, token refresh

## Dependencies

- `@supabase/supabase-js` ^2.x

## Future Work

- Data sync to Supabase PostgreSQL
- Cross-device access
