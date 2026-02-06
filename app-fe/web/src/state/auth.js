import { writable, derived } from 'svelte/store'
import { api } from '../api.js'
import { syncPending, restoreFromServer } from './sync.js'
import * as idb from '../data/idb-stats.js'

export const session = writable(null)

export const user = derived(session, ($session) => $session?.user ?? null)

export const isAuthenticated = derived(user, ($user) => $user !== null)

async function syncOrRestore() {
  const empty = await idb.isEmpty()
  if (empty) {
    await restoreFromServer()
  }
  await syncPending()
}

export async function initAuth() {
  const initialSession = await api.auth.getSession()
  session.set(initialSession)

  if (initialSession) {
    syncOrRestore().catch((e) => console.error('sync failed', e))
  }

  api.auth.onAuthStateChange((newSession) => {
    session.set(newSession)
    if (newSession) {
      syncOrRestore().catch((e) => console.error('sync failed', e))
    }
  })
}

export const signInWithGoogle = api.auth.signInWithGoogle
export const signInWithApple = api.auth.signInWithApple
export const signOut = api.auth.signOut
