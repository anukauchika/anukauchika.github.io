import { writable, derived } from 'svelte/store'
import { api } from '../supabase/index.js'
import { syncService } from '../services/sync-service'
import { statsRepo } from '@app/data/idb-stats-repo'
import { prefsRepo } from '@app/data/idb-prefs-repo'
import { reloadDatasetPref } from './registry.js'

export const session = writable(null)

export const user = derived(session, ($session) => $session?.user ?? null)

export const isAuthenticated = derived(user, ($user) => $user !== null)

/** Incremented after DB switch + restore completes — triggers stats reload */
export const dbVersion = writable(0)

async function onUserChanged(userId) {
  await statsRepo.switchDatabase(userId)
  await prefsRepo.switchDatabase(userId)
  await reloadDatasetPref()
  if (userId) {
    await syncService.syncPending()
    await syncService.restoreFromServer()
  }
  dbVersion.update((n) => n + 1)
}

export async function initAuth() {
  const initialSession = await api.auth.getSession()
  session.set(initialSession)

  if (initialSession) {
    onUserChanged(initialSession.user.id).catch((e) => console.error('sync failed', e))
  }

  api.auth.onAuthStateChange((newSession) => {
    session.set(newSession)
    onUserChanged(newSession?.user?.id ?? null).catch((e) => console.error('sync failed', e))
  })

  // Refresh token when tab becomes visible (timers are throttled in background)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      api.auth.refreshSession().catch(() => {})
    }
  })
}

export const signInWithGoogle = api.auth.signInWithGoogle
export const signInWithApple = api.auth.signInWithApple
export const signInWithEmail = api.auth.signInWithEmail
export const signOut = api.auth.signOut
