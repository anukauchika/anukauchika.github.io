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

export interface AuthAnalyticsContext {
  source: 'app_main' | 'printable' | 'queue' | 'direct'
  drill_type?: string
  dataset_id?: string
  group_id?: number
}

function markLoginPending(method: string, context?: AuthAnalyticsContext): void {
  try {
    localStorage.setItem(LOGIN_PENDING_KEY, JSON.stringify({ method, at: Date.now(), ...context }))
  } catch {
    /* storage unavailable — skip tracking */
  }
}

function trackAuthIfPending(user: { createdAt: string }): void {
  try {
    const raw = localStorage.getItem(LOGIN_PENDING_KEY)
    if (!raw) return
    localStorage.removeItem(LOGIN_PENDING_KEY)
    const { method, at, source, drill_type, dataset_id, group_id } = JSON.parse(raw)
    if (Date.now() - at >= LOGIN_PENDING_TTL_MS) return

    const createdAt = new Date(user.createdAt).getTime()
    const isSignUp = Number.isFinite(createdAt) && createdAt >= at
    const afterDrill = Boolean(drill_type && dataset_id && Number.isFinite(group_id))
    const event = afterDrill
      ? isSignUp
        ? 'sign_up_after_drill'
        : 'sign_in_after_drill'
      : isSignUp
        ? 'sign_up'
        : 'sign_in'
    datAnalytics.track(event, {
      method,
      ...(source ? { source } : {}),
      ...(afterDrill ? { drill_type, dataset_id, group_id } : {}),
    })
  } catch {
    /* storage unavailable — skip tracking */
  }
}

async function switchDatabases(userId: string | null): Promise<void> {
  await datDrillSync.switchDatabase(userId)
  await svcUserPrefs.switchDatabase(userId)
  await svcDataset.reloadPrefs()
  sttAuth.dbVersion++
}

function syncInBackground(): void {
  svcSync
    .syncPending()
    .then(() => svcSync.restoreFromServer())
    .then(() => {
      sttAuth.dbVersion++
    })
    .catch((e) => console.error('sync failed', e))
}

export interface AuthService {
  init(): Promise<void>
  signInWithGoogle(context?: AuthAnalyticsContext): Promise<void>
  signInWithApple(context?: AuthAnalyticsContext): Promise<void>
  signInWithEmail(email: string, context?: AuthAnalyticsContext): Promise<void>
  signOut(): Promise<void>
}

export const svcAuth: AuthService = {
  async init() {
    const user = await datAuth.getUser()
    sttAuth.user = user

    if (user) {
      trackAuthIfPending(user)
      await switchDatabases(user.id)
      syncInBackground()
    }

    datAuth.onAuthChange(async (newUser) => {
      sttAuth.user = newUser
      if (newUser) trackAuthIfPending(newUser)
      await switchDatabases(newUser?.id ?? null).catch((e) => console.error('db switch failed', e))
      if (newUser) syncInBackground()
    })
  },

  signInWithGoogle: (context) => {
    markLoginPending('google', context)
    return datAuth.signInWithGoogle()
  },
  signInWithApple: (context) => {
    markLoginPending('apple', context)
    return datAuth.signInWithApple()
  },
  signInWithEmail: (email, context) => {
    markLoginPending('email', context)
    return datAuth.signInWithEmail(email)
  },
  signOut: () => datAuth.signOut(),
}
