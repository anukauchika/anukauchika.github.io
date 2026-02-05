# Plan: Login

Based on: `0001-rfc-login.md`

## Phase 0: Supabase Setup (User Action)

**Scope**: Supabase Dashboard, Google Cloud Console, Apple Developer Console

**Steps**:
1. Create Supabase project (if not exists)
2. Note Project URL and anon key from Settings → API
3. Authentication → URL Configuration:
   - Site URL: production URL (e.g., `https://username.github.io/memris`)
   - Redirect URLs: add both:
     - `http://localhost:5173` (local dev)
     - Production URL (same as Site URL)

**Google OAuth**:
1. Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Add authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret
5. Supabase Dashboard → Authentication → Providers → Google → Enable
6. Paste Client ID and Client Secret

**Apple OAuth** (optional):
1. Apple Developer Console → Certificates, Identifiers & Profiles
2. Create App ID with "Sign in with Apple" capability
3. Create Services ID, configure redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
4. Create private key for Sign in with Apple
5. Supabase Dashboard → Authentication → Providers → Apple → Enable
6. Add Service ID, Team ID, Key ID, and private key

---

## Phase 1: API Layer

**Scope**: `app-fe/web/`

**Steps**:
1. `cd app-fe/web && npm install @supabase/supabase-js`
2. Create `src/api/supabase-auth.js` — Supabase client init, auth functions
3. Create `src/api.js` — single entry point, exports `api.auth.*`

**Key points**:
- Supabase client internal to `supabase-auth.js`, not exported
- Functions: `getSession`, `onAuthStateChange`, `signInWithGoogle`, `signInWithApple`, `signOut`
- `onAuthStateChange(cb)` returns unsubscribe fn
- `api.js` structure: `export const api = { auth: { ...} }`

---

## Phase 2: State Store

**Scope**: `app-fe/web/src/state/auth.js`

**Steps**:
1. Create `src/state/auth.js`
2. Import from `../api.js`
3. Create stores: `session` (writable), `user` (derived), `isAuthenticated` (derived)
4. Create `initAuth()` — calls `api.auth.getSession()`, subscribes via `api.auth.onAuthStateChange()`
5. Re-export actions: `signInWithGoogle`, `signInWithApple`, `signOut`

**Key points**:
- `user` derived: `$session?.user ?? null`
- Components import only from `state/auth.js`, never from `api.js` directly

---

## Phase 3: App Init

**Scope**: `app-fe/web/src/main.js`

**Steps**:
1. Import `initAuth` from `state/auth.js`
2. Call `initAuth()` before mounting app

---

## Phase 4: UI

**Scope**: `app-fe/web/src/App.svelte`

**Steps**:
1. Import from `./state/auth.js`: `user`, `signInWithGoogle`, `signInWithApple`, `signOut`
2. Add auth UI to header (in `hero-top` div, after dataset picker):
   - Logged out: "Sign in" button, on click shows dropdown with Google/Apple buttons
   - Logged in: avatar image + "Sign out" button
3. Add CSS for auth UI matching existing header style

**Key points**:
- Avatar URL: `$user.user_metadata?.avatar_url`
- Fallback: first letter of email or generic icon if no avatar
- Dropdown can be simple show/hide with state variable

---

## Phase 5: Config

**Scope**: `app-fe/web/`

**Steps**:
1. Create `.env.example`:
   ```
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   ```
2. Verify `.env` in `.gitignore`

---

## Phase 6: GitHub Actions (User Action)

**Scope**: `.github/workflows/pages.yml`, GitHub repo settings

**Steps**:
1. Update workflow paths from `web/` to `app-fe/web/`:
   - `cache-dependency-path: app-fe/web/package-lock.json`
   - `working-directory: app-fe/web` (install, build steps)
   - `path: app-fe/web/dist` (upload artifact)

2. Add env vars to build step:
   ```yaml
   - name: Build
     working-directory: app-fe/web
     env:
       VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
       VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
     run: npm run build
   ```

3. GitHub repo → Settings → Secrets and variables → Actions → New repository secret:
   - `VITE_SUPABASE_URL` = Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = Supabase anon key

---

## Verification

**Local** (Prerequisites: Phase 0 complete, `app-fe/web/.env` populated):

1. `cd app-fe/web && npm run dev`
2. Open `http://localhost:5173`
3. Click "Sign in" → Google button
4. Complete OAuth flow → redirected back, avatar appears in header
5. Refresh page → session persists (still logged in)
6. Click "Sign out" → returns to "Sign in" button
7. (If Apple configured) Repeat with Apple sign in

**Deployed** (Prerequisites: Phase 6 complete):

1. Push to main → GitHub Actions runs
2. Verify build succeeds (no missing env var errors)
3. Test login on deployed site (same flow as local)
