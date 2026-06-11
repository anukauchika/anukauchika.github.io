import { datAuth } from '@dat/auth'
import { datAnalytics } from '@dat/analytics'
import { datDrillSync } from '@dat/kind/chinese/drill'
import { sttAuth } from '@stt/auth.svelte.js'
import { svcDataset } from '@svc/dataset'
import { svcUserPrefs } from '@svc/user-prefs'
import { svcSync } from '@svc/sync'

// Sign-in completes after a redirect (OAuth) or on a later load (magic link),
// where it is indistinguishable from a session restore. A pending flag set at
// initiation marks the next signed-in load as a real login.
const LOGIN_PENDING_KEY = 'uch-login-pending'
const LOGIN_PENDING_TTL_MS = 60 * 60 * 1000

function markLoginPending(method: string): void {
  try {
    localStorage.setItem(LOGIN_PENDING_KEY, JSON.stringify({ method, at: Date.now() }))
  } catch { /* storage unavailable — skip tracking */ }
}

function trackLoginIfPending(): void {
  try {
    const raw = localStorage.getItem(LOGIN_PENDING_KEY)
    if (!raw) return
    localStorage.removeItem(LOGIN_PENDING_KEY)
    const { method, at } = JSON.parse(raw)
    if (Date.now() - at < LOGIN_PENDING_TTL_MS) datAnalytics.track('login', { method })
  } catch { /* storage unavailable — skip tracking */ }
}

async function switchDatabases(userId: string | null): Promise<void> {
  await datDrillSync.switchDatabase(userId)
  await svcUserPrefs.switchDatabase(userId)
  await svcDataset.reloadPrefs()
  sttAuth.dbVersion++
}

function syncInBackground(): void {
  svcSync.syncPending()
    .then(() => svcSync.restoreFromServer())
    .then(() => { sttAuth.dbVersion++ })
    .catch((e) => console.error('sync failed', e))
}

export interface AuthService {
  init(): Promise<void>
  signInWithGoogle(): Promise<void>
  signInWithApple(): Promise<void>
  signInWithEmail(email: string): Promise<void>
  signOut(): Promise<void>
}

export const svcAuth: AuthService = {
  async init() {
    const user = await datAuth.getUser()
    sttAuth.user = user

    if (user) {
      trackLoginIfPending()
      await switchDatabases(user.id)
      syncInBackground()
    }

    datAuth.onAuthChange(async (newUser) => {
      sttAuth.user = newUser
      if (newUser) trackLoginIfPending()
      await switchDatabases(newUser?.id ?? null).catch((e) => console.error('db switch failed', e))
      if (newUser) syncInBackground()
    })


  },

  signInWithGoogle: () => {
    markLoginPending('google')
    return datAuth.signInWithGoogle()
  },
  signInWithApple: () => {
    markLoginPending('apple')
    return datAuth.signInWithApple()
  },
  signInWithEmail: (email) => {
    markLoginPending('email')
    return datAuth.signInWithEmail(email)
  },
  signOut: () => datAuth.signOut(),
}
